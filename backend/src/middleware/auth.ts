import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  user_id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'admin' | 'contractor';
  department_id: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      isService?: boolean;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_civic_issue_hackathon_key_2026';
const ML_SERVICE_KEY = process.env.ML_SERVICE_KEY || 'secret_ml_dashcam_service_key_9912';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Check HTTP-only cookie first, fallback to Authorization header
  let token = req.cookies?.auth_token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing token cookie or Authorization header.',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token is expired or invalid.',
      },
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        },
      });
    }
    next();
  };
}

export function authenticateService(req: Request, res: Response, next: NextFunction) {
  const serviceKey = req.headers['x-service-key'];
  if (!serviceKey || serviceKey !== ML_SERVICE_KEY) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing X-Service-Key header.',
      },
    });
  }
  req.isService = true;
  next();
}
