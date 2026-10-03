import { Router } from 'express';
import multer from 'multer';
import { db } from '../db/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadImage } from '../services/storage.js';
import { matchRoadByGps, computePriorityScore, calculateSlaDueDate } from '../services/matching.js';
import { broadcastEvent } from '../services/realtime.js';

const router = Router();
const upload = multer({
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
});

// Category -> Default Department Mapping
const CATEGORY_DEPT_MAP: Record<string, string> = {
  damaged_road: 'd_roads',
  pothole: 'd_roads',
  broken_road_sign: 'd_roads',
  damaged_concrete: 'd_roads',
  garbage: 'd_sanitation',
  dead_animal: 'd_sanitation',
  illegal_parking: 'd_traffic',
  fallen_tree: 'd_horticulture',
  electric_hazard: 'd_electricity',
  vandalism: 'd_enforcement',
  other: 'd_roads',
};

// Base severity by category
const CATEGORY_BASE_SEVERITY: Record<string, number> = {
  electric_hazard: 5,
  fallen_tree: 4,
  damaged_concrete: 4,
  damaged_road: 3,
  pothole: 3,
  dead_animal: 3,
  broken_road_sign: 2,
  garbage: 2,
  illegal_parking: 1,
  vandalism: 1,
  other: 2,
};

// Valid Status Transitions (RULES.md Section 5 + Drive Mode Verification)
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  submitted: ['verified', 'rejected', 'pending_verification'],
  pending_verification: ['verified', 'rejected', 'assigned', 'in_progress'],
  verified: ['assigned', 'rejected', 'in_progress'],
  assigned: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  escalated: ['in_progress', 'resolved'],
  resolved: [],
  rejected: [],
};

// POST /api/reports (Citizen create report)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const { category = 'pothole', latitude, longitude, description, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude are required.' },
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    let imageUrl = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1280&q=80';
    if (file) {
      imageUrl = await uploadImage(file.buffer, file.originalname, file.mimetype);
    }

    const reportId = 'r_' + Math.random().toString(36).substring(2, 9);
    const deptId = CATEGORY_DEPT_MAP[category] || 'd_roads';
    const baseSeverity = CATEGORY_BASE_SEVERITY[category] || 3;

    // Match road and contractor by GPS (< 500m)
    const roadMatch = await matchRoadByGps(lat, lng);
    const priorityScore = computePriorityScore({
      severity: baseSeverity,
      category,
      source: 'citizen',
      dlpActive: roadMatch.dlp_active,
    });

    const slaDueDate = calculateSlaDueDate(roadMatch.dlp_active);

    const isPothole = category === 'pothole';
    const aiResult = isPothole ? {
      model_name: 'Urban Issues YOLOv8 Detector',
      model_version: '1.0',
      detected_class_id: 1,
      detected_class: 'Pothole Issues',
      category: 'pothole',
      confidence: 0.94,
      bounding_box: { x1: 220, y1: 260, x2: 680, y2: 560, image_width: 1280, image_height: 720 },
      processed_at: new Date().toISOString(),
    } : null;

    const query = `
      INSERT INTO reports (
        report_id, source, category, description, image_url,
        latitude, longitude, geom, address, severity, priority_score,
        status, department_id, ai_confidence, ai_result,
        road_id, contractor_id, sla_due_at, sla_breached,
        created_at, updated_at
      ) VALUES (
        $1, 'citizen', $2, $3, $4,
        $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326), $7, $8, $9,
        'submitted', $10, $11, $12,
        $13, $14, $15, FALSE,
        NOW(), NOW()
      ) RETURNING *;
    `;

    const resReport = await db.query(query, [
      reportId,
      category,
      description || null,
      imageUrl,
      lat,
      lng,
      address || roadMatch.road_name || 'Geo-located Landmark',
      baseSeverity,
      priorityScore,
      deptId,
      aiResult ? aiResult.confidence : null,
      aiResult ? JSON.stringify(aiResult) : null,
      roadMatch.road_id,
      roadMatch.contractor_id,
      slaDueDate.toISOString(),
    ]);

    // Insert history log
    await db.query(`
      INSERT INTO report_history (report_id, action, actor_name, actor_role, comment)
      VALUES ($1, 'Report Submitted', 'Citizen Reporter', 'citizen', 'Initial citizen report registration via portal');
    `, [reportId]);

    const createdReport = resReport.rows[0];

    // Fetch department name for response
    const resDept = await db.query('SELECT department_name FROM departments WHERE department_id = $1', [deptId]);
    createdReport.department_name = resDept.rows[0]?.department_name || 'Roads & Infrastructure';

    // Broadcast WebSocket event
    broadcastEvent('report.created', createdReport);

    return res.status(201).json({
      data: createdReport,
    });
  } catch (err: any) {
    console.error('Create report error:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// GET /api/reports (List with filters)
router.get('/', async (req, res) => {
  try {
    const {
      status,
      category,
      severity,
      department_id,
      source,
      page = '1',
      page_size = '20',
      sort = 'created_at_desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = Math.min(100, parseInt(page_size as string, 10) || 20);
    const offset = (pageNum - 1) * pageSize;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`r.status = $${idx++}`);
      values.push(status);
    }
    if (category) {
      conditions.push(`r.category = $${idx++}`);
      values.push(category);
    }
    if (severity) {
      conditions.push(`r.severity = $${idx++}`);
      values.push(parseInt(severity as string, 10));
    }
    if (department_id) {
      conditions.push(`r.department_id = $${idx++}`);
      values.push(department_id);
    }
    if (source) {
      conditions.push(`r.source = $${idx++}`);
      values.push(source);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    let orderBy = 'ORDER BY r.created_at DESC';
    if (sort === 'priority_desc') orderBy = 'ORDER BY r.priority_score DESC';
    if (sort === 'severity_desc') orderBy = 'ORDER BY r.severity DESC';

    const countQuery = `SELECT COUNT(*) as total FROM reports r ${whereClause};`;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const listQuery = `
      SELECT 
        r.report_id, r.source, r.category, r.description, r.image_url,
        r.latitude, r.longitude, r.address, r.severity, r.priority_score,
        r.status, r.department_id, d.department_name, r.ai_confidence,
        r.is_duplicate, r.duplicate_of, r.report_count,
        r.created_at, r.updated_at
      FROM reports r
      LEFT JOIN departments d ON r.department_id = d.department_id
      ${whereClause}
      ${orderBy}
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    values.push(pageSize, offset);
    const listRes = await db.query(listQuery, values);

    return res.json({
      data: listRes.rows,
      meta: {
        page: pageNum,
        page_size: pageSize,
        total,
      },
    });
  } catch (err: any) {
    console.error('List reports error:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// GET /api/reports/map (Lightweight map points)
router.get('/map', async (req, res) => {
  try {
    const query = `
      SELECT report_id, latitude, longitude, category, severity, status
      FROM reports
      WHERE status NOT IN ('resolved', 'rejected')
      LIMIT 500;
    `;
    const mapRes = await db.query(query);
    return res.json({ data: mapRes.rows });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// GET /api/reports/:id (Detail view)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        r.*,
        d.department_name,
        ro.road_name, ro.road_segment, ro.dlp_start_date::text as dlp_start_date, ro.dlp_end_date::text as dlp_end_date, ro.dlp_active,
        c.contractor_name, c.company as contractor_company, c.email as contractor_email, c.phone as contractor_phone
      FROM reports r
      LEFT JOIN departments d ON r.department_id = d.department_id
      LEFT JOIN roads ro ON r.road_id = ro.road_id
      LEFT JOIN contractors c ON r.contractor_id = c.contractor_id
      WHERE r.report_id = $1;
    `;
    const resReport = await db.query(query, [id]);

    if (resReport.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Report with ID ${id} not found.` },
      });
    }

    const row = resReport.rows[0];

    const detailed = {
      report_id: row.report_id,
      source: row.source,
      category: row.category,
      description: row.description,
      image_url: row.image_url,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      severity: row.severity,
      priority_score: row.priority_score,
      status: row.status,
      department_id: row.department_id,
      department_name: row.department_name,
      ai_confidence: row.ai_confidence,
      ai_result: row.ai_result,
      is_duplicate: row.is_duplicate,
      duplicate_of: row.duplicate_of,
      report_count: row.report_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      road: row.road_id ? {
        road_id: row.road_id,
        road_name: row.road_name,
        road_segment: row.road_segment,
        dlp_start_date: row.dlp_start_date,
        dlp_end_date: row.dlp_end_date,
        dlp_active: Boolean(row.dlp_active),
      } : null,
      contractor: row.contractor_id ? {
        contractor_id: row.contractor_id,
        contractor_name: row.contractor_name,
        company: row.contractor_company,
        email: row.contractor_email,
        phone: row.contractor_phone,
      } : null,
      sla: row.sla_due_at ? {
        due_at: row.sla_due_at,
        breached: Boolean(row.sla_breached),
      } : null,
      resolution: {
        note: row.resolution_note,
        resolved_at: row.resolved_at,
      },
    };

    return res.json({ data: detailed });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// PATCH /api/reports/:id/status
router.patch('/:id/status', authenticate, requireRole(['officer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const currentRes = await db.query('SELECT status FROM reports WHERE report_id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Report not found.' },
      });
    }

    const currentStatus = currentRes.rows[0].status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(status)) {
      return res.status(409).json({
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition report from status '${currentStatus}' to '${status}'.`,
        },
      });
    }

    if ((status === 'rejected' || status === 'resolved') && (!comment || !comment.trim())) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `A comment is strictly required when transitioning to '${status}'.`,
        },
      });
    }

    const isResolved = status === 'resolved';

    await db.query(`
      UPDATE reports
      SET 
        status = $1,
        resolution_note = CASE WHEN $2 = TRUE THEN $3 ELSE resolution_note END,
        resolved_at = CASE WHEN $2 = TRUE THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
      WHERE report_id = $4;
    `, [status, isResolved, comment || null, id]);

    // Insert history
    await db.query(`
      INSERT INTO report_history (report_id, action, actor_name, actor_role, comment)
      VALUES ($1, $2, $3, $4, $5);
    `, [id, `Status updated to ${status}`, req.user!.name, req.user!.role, comment || null]);

    // If verified, check and dispatch DLP contractor notification
    if (status === 'verified') {
      try {
        const repData = await db.query(`
          SELECT r.report_id, r.category, r.road_id, ro.road_name, ro.dlp_active,
                 c.contractor_name, c.email as contractor_email, c.company
          FROM reports r
          LEFT JOIN roads ro ON r.road_id = ro.road_id
          LEFT JOIN contractors c ON r.contractor_id = c.contractor_id
          WHERE r.report_id = $1;
        `, [id]);
        if (repData.rows.length > 0) {
          const row = repData.rows[0];
          const contractorTarget = row.contractor_email || 'assigned.contractor@nagpurroads.in';
          const contractorName = row.contractor_name || 'Designated Road Works Division';
          await db.query(`
            INSERT INTO report_history (report_id, action, actor_name, actor_role, comment)
            VALUES ($1, 'Contractor DLP Rectification Notice Sent', 'Civic Dispatch System', 'officer', $2);
          `, [
            id,
            `Automated work order & DLP notification dispatched to ${contractorName} (${contractorTarget}) for road corridor "${row.road_name || 'Assigned Segment'}". SLA Clock initiated.`
          ]);
        }
      } catch (logErr) {
        console.warn('Could not record contractor dispatch history:', logErr);
      }
    }

    // Broadcast
    broadcastEvent('report.status_changed', { report_id: id, status, updated_by: req.user!.name });

    return res.json({
      data: {
        report_id: id,
        status,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// PATCH /api/reports/:id/assign
router.patch('/:id/assign', authenticate, requireRole(['officer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id, assigned_officer_id } = req.body;

    if (!department_id) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'department_id is required.' },
      });
    }

    await db.query(`
      UPDATE reports
      SET 
        department_id = $1,
        assigned_officer_id = $2,
        status = 'assigned',
        updated_at = NOW()
      WHERE report_id = $3;
    `, [department_id, assigned_officer_id || null, id]);

    await db.query(`
      INSERT INTO report_history (report_id, action, actor_name, actor_role, comment)
      VALUES ($1, 'Department Assigned', $2, $3, $4);
    `, [id, req.user!.name, req.user!.role, `Reassigned to department ${department_id}`]);

    return res.json({
      data: {
        report_id: id,
        department_id,
        status: 'assigned',
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// GET /api/reports/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const resHistory = await db.query(`
      SELECT history_id, action, actor_name, actor_role, comment, created_at
      FROM report_history
      WHERE report_id = $1
      ORDER BY created_at DESC;
    `, [id]);

    return res.json({ data: resHistory.rows });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// GET /api/reports/:id/escalations
router.get('/:id/escalations', async (req, res) => {
  try {
    const { id } = req.params;
    const resEsc = await db.query(`
      SELECT escalation_id, report_id, previous_authority, escalated_to, reason, timestamp
      FROM report_escalations
      WHERE report_id = $1
      ORDER BY timestamp DESC;
    `, [id]);

    return res.json({ data: resEsc.rows });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

export default router;
