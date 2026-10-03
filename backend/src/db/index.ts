import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

export const db = new Pool({
  user: process.env.DB_USER || 'postgres.sldwxyxyirayfxvukcgo',
  password: process.env.DB_PASSWORD || 'EPk?smrD%a2ZFFu',
  host: process.env.DB_HOST || 'aws-0-ap-southeast-2.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function initDatabase() {
  const client = await db.connect();
  try {
    console.log('⚡ Initializing Supabase PostgreSQL schema...');

    // 1. Departments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        department_id VARCHAR(50) PRIMARY KEY,
        department_name VARCHAR(100) NOT NULL,
        department_type VARCHAR(50) NOT NULL,
        contact_email VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(30) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        department_id VARCHAR(50) REFERENCES departments(department_id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Contractors Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contractors (
        contractor_id VARCHAR(50) PRIMARY KEY,
        contractor_name VARCHAR(100) NOT NULL,
        company VARCHAR(150) NOT NULL,
        license_no VARCHAR(100),
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        office_address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS license_no VARCHAR(100);
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS office_address TEXT;
    `);

    // 4. Roads Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roads (
        road_id VARCHAR(50) PRIMARY KEY,
        road_name VARCHAR(150) NOT NULL,
        road_segment VARCHAR(200) NOT NULL,
        ward VARCHAR(100),
        zone VARCHAR(100),
        tender_number VARCHAR(100),
        pavement_type VARCHAR(50),
        dlp_start_date DATE NOT NULL,
        dlp_end_date DATE NOT NULL,
        dlp_active BOOLEAN DEFAULT TRUE,
        contractor_id VARCHAR(50) REFERENCES contractors(contractor_id) ON DELETE SET NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE roads ADD COLUMN IF NOT EXISTS ward VARCHAR(100);
      ALTER TABLE roads ADD COLUMN IF NOT EXISTS zone VARCHAR(100);
      ALTER TABLE roads ADD COLUMN IF NOT EXISTS tender_number VARCHAR(100);
      ALTER TABLE roads ADD COLUMN IF NOT EXISTS pavement_type VARCHAR(50);
      ALTER TABLE roads ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
      ALTER TABLE roads ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    `);

    // 5. Reports Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        report_id VARCHAR(50) PRIMARY KEY,
        source VARCHAR(20) NOT NULL DEFAULT 'citizen',
        category VARCHAR(50) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        address TEXT,
        severity INT NOT NULL DEFAULT 3,
        priority_score DOUBLE PRECISION NOT NULL DEFAULT 50.0,
        status VARCHAR(20) NOT NULL DEFAULT 'submitted',
        department_id VARCHAR(50) REFERENCES departments(department_id),
        assigned_officer_id VARCHAR(50) REFERENCES users(user_id),
        ai_confidence DOUBLE PRECISION,
        ai_result JSONB,
        is_duplicate BOOLEAN DEFAULT FALSE,
        duplicate_of VARCHAR(50),
        report_count INT DEFAULT 1,
        road_id VARCHAR(50) REFERENCES roads(road_id),
        contractor_id VARCHAR(50) REFERENCES contractors(contractor_id),
        sla_due_at TIMESTAMPTZ,
        sla_breached BOOLEAN DEFAULT FALSE,
        resolution_note TEXT,
        resolved_at TIMESTAMPTZ,
        created_by VARCHAR(50) REFERENCES users(user_id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_result JSONB;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_confidence DOUBLE PRECISION;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS duplicate_of VARCHAR(50);
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 1;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS road_id VARCHAR(50);
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS contractor_id VARCHAR(50);
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_note TEXT;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
    `);

    // Ensure status column accepts pending_verification and geom is flexible
    try {
      await client.query(`ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'pending_verification';`);
    } catch (typeErr) {
      try {
        await client.query(`ALTER TABLE reports ALTER COLUMN status TYPE VARCHAR(50);`);
      } catch (_) {}
    }

    try {
      await client.query(`ALTER TABLE reports ALTER COLUMN geom DROP NOT NULL;`);
    } catch (_) {}

    // 6. Report History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_history (
        history_id SERIAL PRIMARY KEY,
        report_id VARCHAR(50) REFERENCES reports(report_id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        actor_name VARCHAR(100) NOT NULL,
        actor_role VARCHAR(20) NOT NULL,
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Report Escalations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_escalations (
        escalation_id SERIAL PRIMARY KEY,
        report_id VARCHAR(50) REFERENCES reports(report_id) ON DELETE CASCADE,
        previous_authority VARCHAR(100) NOT NULL,
        escalated_to VARCHAR(100) NOT NULL,
        reason TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'in_app',
        is_read BOOLEAN DEFAULT FALSE,
        report_id VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 9. Seed Default Reference Data (if not present)
    // Departments
    const depts = [
      ['d_roads', 'Roads & Infrastructure', 'Engineering', 'roads.dept@city.gov'],
      ['d_sanitation', 'Sanitation & Solid Waste', 'Public Health', 'sanitation@city.gov'],
      ['d_traffic', 'Traffic & Mobility', 'Law & Transit', 'traffic@city.gov'],
      ['d_electricity', 'Electricity & Lighting', 'Utilities', 'power@city.gov'],
      ['d_horticulture', 'Horticulture & Parks', 'Environment', 'parks@city.gov'],
      ['d_enforcement', 'Municipal Enforcement', 'Security', 'enforcement@city.gov'],
    ];

    for (const [dId, dName, dType, dEmail] of depts) {
      const exists = await client.query('SELECT 1 FROM departments WHERE department_id = $1', [dId]);
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO departments (department_id, department_name, department_type, contact_email) VALUES ($1, $2, $3, $4)',
          [dId, dName, dType, dEmail]
        );
      }
    }

    // Contractors
    const contractors = [
      ['c_901', 'Rajesh Sharma', 'Apex Infrastructure & Highway Builders Ltd.', 'MHA-PWD-CLASS1-0982', 'contact@apexinfra.com', '+91 98230 45678', 'Plot 42, MIDC Industrial Area, Hingna Road, Nagpur'],
      ['c_902', 'Vikram Mehta', 'Premier Roadways & Pavements Corp.', 'MHA-PWD-CLASS1-1144', 'support@premierroadways.in', '+91 98450 11223', 'Corridor Tower, 4th Floor, Civil Lines, Nagpur'],
      ['c_903', 'Sunil Kulkarni', 'Shree Sai Infratech Pvt. Ltd.', 'MHA-PWD-CLASS1-0671', 'grievance@shreesaiinfra.co.in', '+91 98901 77889', 'Shree Chambers, Wardha Road, Nagpur'],
    ];

    for (const [cId, cName, cComp, cLic, cEmail, cPhone, cAddr] of contractors) {
      const exists = await client.query('SELECT 1 FROM contractors WHERE contractor_id = $1', [cId]);
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO contractors (contractor_id, contractor_name, company, license_no, email, phone, office_address) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [cId, cName, cComp, cLic, cEmail, cPhone, cAddr]
        );
      }
    }

    // Roads
    const roads = [
      ['rd_401', 'Inner Ring Road Arterial Corridor', 'Segment 4A (km 12.4 - 14.8), Pratap Nagar Junction', 'Ward 12', 'Dharampeth Zone', 'NMC/PWD/2024/RND-1049', 'Bituminous Mix', '2024-06-01', '2028-05-31', true, 'c_901', 21.1458, 79.0882],
      ['rd_402', 'Central Market Expressway & Link Road', 'North Sector Link (km 3.1 - 4.5), Sitabuldi Market', 'Ward 8', 'Sitabuldi Zone', 'NMC/PWD/2018/TR-4421', 'Asphalt', '2019-01-01', '2023-12-31', false, null, 21.1610, 79.0820],
      ['rd_403', 'Industrial Heavy Freight Corridor', 'Phase II Heavy Corridor (km 8.0 - 11.2), Butibori Connector', 'Ward 24', 'East Zone', 'NMC/HWY/2023/CORR-8812', 'Concrete (Rigid)', '2023-10-01', '2027-09-30', true, 'c_902', 21.1412, 79.0995],
      ['rd_404', 'Wardha Road Smart Transit Way', 'Airport Metro Corridor (km 6.5 - 9.0)', 'Ward 16', 'Nehru Nagar Zone', 'NMC/SMART/2024/ST-302', 'Bituminous Mix', '2024-04-01', '2029-03-31', true, 'c_903', 21.1025, 79.0558],
    ];

    for (const [rId, rName, rSeg, rWard, rZone, rTend, rPav, rStart, rEnd, rActive, rCont, rLat, rLng] of roads) {
      const exists = await client.query('SELECT 1 FROM roads WHERE road_id = $1', [rId]);
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO roads (road_id, road_name, road_segment, ward, zone, tender_number, pavement_type, dlp_start_date, dlp_end_date, dlp_active, contractor_id, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
          [rId, rName, rSeg, rWard, rZone, rTend, rPav, rStart, rEnd, rActive, rCont, rLat, rLng]
        );
      }
    }

    // Seed Demo Users (RULES.md Section 13)
    const passwordHash = await bcrypt.hash('Demo@1234', 10);
    const users = [
      ['u_citizen_1', 'Demo Citizen', 'citizen@demo.com', '+91 98765 11111', passwordHash, 'citizen', null],
      ['u_officer_1', 'Er. Ramesh Kumar', 'officer@demo.com', '+91 98765 22222', passwordHash, 'officer', 'd_roads'],
      ['u_admin_1', 'Commissioner Sharma', 'admin@demo.com', '+91 98765 33333', passwordHash, 'admin', null],
    ];

    for (const [uId, uName, uEmail, uPhone, uHash, uRole, uDept] of users) {
      const exists = await client.query('SELECT 1 FROM users WHERE email = $1', [uEmail]);
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO users (user_id, name, email, phone, password_hash, role, department_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [uId, uName, uEmail, uPhone, uHash, uRole, uDept]
        );
      } else {
        await client.query(
          'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
          [uHash, uRole, uEmail]
        );
      }
    }

    console.log('✅ Supabase PostgreSQL schema and seed data ready!');
  } catch (error) {
    console.error('❌ Schema initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}
