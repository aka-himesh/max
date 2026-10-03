import { Router } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_civic_issue_hackathon_key_2026';

export const AUTH_COOKIE_NAME = 'auth_token';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

// POST /api/auth/register (Create User / Register Account)
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role = 'officer', department_id = null } = req.body;

  if (!name || !email || !password) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required.',
      },
    });
  }

  try {
    const existing = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email already exists.',
        },
      });
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const validRole = ['citizen', 'officer', 'admin', 'contractor'].includes(role) ? role : 'officer';
    const deptId = department_id || (validRole === 'officer' ? 'd_roads' : null);

    await db.query(`
      INSERT INTO users (user_id, name, email, phone, password_hash, role, department_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, name, email, phone || '', passwordHash, validRole, deptId]);

    // Fetch department name if applicable
    let deptName = null;
    if (deptId) {
      const deptRes = await db.query('SELECT department_name FROM departments WHERE department_id = $1', [deptId]);
      if (deptRes.rows.length > 0) {
        deptName = deptRes.rows[0].department_name;
      }
    }

    const token = jwt.sign(
      { user_id: userId, name, email, role: validRole, department_id: deptId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

    return res.status(201).json({
      data: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          user_id: userId,
          name,
          email,
          phone: phone || '',
          role: validRole,
          department_id: deptId,
          department_name: deptName,
        },
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed due to server error.',
      },
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      },
    });
  }

  try {
    const query = `
      SELECT u.user_id, u.name, u.email, u.phone, u.password_hash, u.role, u.department_id, d.department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE u.email = $1;
    `;
    const resUser = await db.query(query, [email]);

    if (resUser.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
        },
      });
    }

    const user = resUser.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
        },
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

    return res.json({
      data: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department_id: user.department_id,
          department_name: user.department_name,
        },
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed due to server error.',
      },
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT u.user_id, u.name, u.email, u.phone, u.role, u.department_id, d.department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE u.user_id = $1;
    `;
    const resUser = await db.query(query, [req.user!.user_id]);
    if (resUser.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    return res.json({ data: resUser.rows[0] });
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return res.status(204).send();
});

export default router;
