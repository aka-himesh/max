import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// GET /api/departments
router.get('/departments', async (req, res) => {
  try {
    const resDepts = await db.query(`
      SELECT department_id, department_name, department_type, contact_email
      FROM departments
      ORDER BY department_name ASC;
    `);
    return res.json({ data: resDepts.rows });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// GET /api/roads/:id
router.get('/roads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resRoad = await db.query(`
      SELECT 
        road_id, road_name, road_segment, ward, zone, tender_number, pavement_type,
        dlp_start_date::text as dlp_start_date, dlp_end_date::text as dlp_end_date, dlp_active,
        contractor_id, latitude, longitude
      FROM roads
      WHERE road_id = $1;
    `, [id]);

    if (resRoad.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Road not found.' },
      });
    }

    return res.json({ data: resRoad.rows[0] });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// GET /api/contractors/:id
router.get('/contractors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resContractor = await db.query(`
      SELECT contractor_id, contractor_name, company, license_no, email, phone, office_address
      FROM contractors
      WHERE contractor_id = $1;
    `, [id]);

    if (resContractor.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Contractor not found.' },
      });
    }

    return res.json({ data: resContractor.rows[0] });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// GET /api/notifications
router.get('/notifications', async (req, res) => {
  try {
    const resNotif = await db.query(`
      SELECT notification_id, user_id, title, message, type, channel, is_read, report_id, created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 50;
    `);

    return res.json({ data: resNotif.rows });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1', [id]);
    return res.json({ data: { notification_id: id, is_read: true } });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// POST /api/devices (Register device push token)
router.post('/devices', (req, res) => {
  return res.status(201).json({
    data: { status: 'registered' },
  });
});

export default router;
