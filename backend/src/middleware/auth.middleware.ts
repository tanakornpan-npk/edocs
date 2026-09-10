import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'staff' | 'student' | 'executive';
  auth_provider: string;
  student_id?: string;
  status_code?: string;
  citizen_id?: string;
  first_name_th?: string;
  last_name_th?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ (Token required)' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
    return;
  }
}

export function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาตให้เข้าถึง (Unauthorized)' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้ (Forbidden)' });
      return;
    }

    next();
  };
}
