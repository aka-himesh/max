import { db } from '../db/index.js';

export interface RoadMatchResult {
  road_id: string | null;
  road_name: string | null;
  road_segment: string | null;
  dlp_start_date: string | null;
  dlp_end_date: string | null;
  dlp_active: boolean;
  contractor_id: string | null;
  contractor_name: string | null;
  contractor_company: string | null;
  contractor_email: string | null;
  contractor_phone: string | null;
  distance_meters?: number;
}

export async function matchRoadByGps(lat: number, lng: number): Promise<RoadMatchResult> {
  // Query closest road from Supabase database with PostGIS geodesic distance in meters
  const res = await db.query(`
    SELECT 
      r.road_id,
      r.road_name,
      r.road_segment,
      r.dlp_start_date::text as dlp_start_date,
      r.dlp_end_date::text as dlp_end_date,
      r.dlp_active,
      c.contractor_id,
      c.contractor_name,
      c.company as contractor_company,
      c.email as contractor_email,
      c.phone as contractor_phone,
      ST_DistanceSphere(
        ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326),
        ST_SetSRID(ST_MakePoint($2, $1), 4326)
      ) as distance_meters
    FROM roads r
    LEFT JOIN contractors c ON r.contractor_id = c.contractor_id
    ORDER BY distance_meters ASC
    LIMIT 1;
  `, [lat, lng]);

  if (res.rows.length === 0) {
    return {
      road_id: null,
      road_name: null,
      road_segment: null,
      dlp_start_date: null,
      dlp_end_date: null,
      dlp_active: false,
      contractor_id: null,
      contractor_name: null,
      contractor_company: null,
      contractor_email: null,
      contractor_phone: null,
    };
  }

  const row = res.rows[0];
  return {
    road_id: row.road_id,
    road_name: row.road_name,
    road_segment: row.road_segment,
    dlp_start_date: row.dlp_start_date,
    dlp_end_date: row.dlp_end_date,
    dlp_active: Boolean(row.dlp_active),
    contractor_id: row.contractor_id,
    contractor_name: row.contractor_name,
    contractor_company: row.contractor_company,
    contractor_email: row.contractor_email,
    contractor_phone: row.contractor_phone,
    distance_meters: row.distance_meters !== null && row.distance_meters !== undefined ? Math.round(parseFloat(row.distance_meters)) : undefined,
  };
}

export function computePriorityScore(params: {
  severity: number;
  category: string;
  source: string;
  dlpActive: boolean;
  duplicateCount?: number;
}): number {
  const { severity, category, source, dlpActive, duplicateCount = 1 } = params;

  // Base score from severity (1-5 -> 20-100)
  let score = severity * 18.0;

  // Category weight
  if (category === 'electric_hazard') score += 15.0;
  if (category === 'pothole') score += 10.0;
  if (category === 'fallen_tree') score += 8.0;

  // Source weight
  if (source === 'vehicle_ai') score += 5.0;

  // DLP urgency bonus
  if (dlpActive) score += 5.0;

  // Duplicate accumulation bonus
  if (duplicateCount > 1) {
    score += Math.min(10.0, (duplicateCount - 1) * 2.5);
  }

  return Math.min(100.0, Math.max(0.0, parseFloat(score.toFixed(1))));
}

export function calculateSlaDueDate(dlpActive: boolean): Date {
  const isDemo = process.env.SLA_DEMO_MODE === 'true';
  const now = new Date();

  if (isDemo) {
    // 5 minutes for demo
    return new Date(now.getTime() + 5 * 60 * 1000);
  }

  // 24 hours for active contractor DLP, 72 hours for municipal maintenance
  const hours = dlpActive ? 24 : 72;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Calculates Haversine distance in meters between two GPS coordinates.
 * Used for 30m pothole deduplication clustering inspired by coding-parrot/pothole-reporter.
 */
export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Searches for an existing open/pending pothole report within a 30-meter radius
 */
export async function findNearbyDuplicatePothole(
  lat: number,
  lng: number,
  radiusMeters = 30
): Promise<{ report_id: string; distance: number } | null> {
  try {
    const res = await db.query(
      `
      SELECT report_id, latitude, longitude
      FROM reports
      WHERE category = 'pothole'
        AND status NOT IN ('resolved', 'rejected')
        AND latitude BETWEEN $1 - 0.001 AND $1 + 0.001
        AND longitude BETWEEN $2 - 0.001 AND $2 + 0.001
      ORDER BY created_at DESC
      LIMIT 15;
    `,
      [lat, lng]
    );

    for (const row of res.rows) {
      const dist = haversineDistanceMeters(
        lat,
        lng,
        parseFloat(row.latitude),
        parseFloat(row.longitude)
      );
      if (dist <= radiusMeters) {
        return { report_id: row.report_id, distance: Math.round(dist * 10) / 10 };
      }
    }
  } catch (e) {
    console.warn('Duplicate check warning:', e);
  }

  return null;
}

