import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'eco_track_access_secret_key_987654321';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: 'USER' | 'ADMIN';
    email: string;
  };
}

/**
 * Middleware to parse and verify JSON Web Tokens (JWT)
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid format.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any;
    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired access token.' });
  }
}

/**
 * Role-Based Access Control Guard
 */
export function roleGuard(allowedRoles: ('USER' | 'ADMIN')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
    }
    next();
  };
}

/**
 * Global rate limiter configuration to mitigate brute-force and scraping
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

/**
 * Global Error Interceptor Middleware
 */
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Global Error Catch]:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(status).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
