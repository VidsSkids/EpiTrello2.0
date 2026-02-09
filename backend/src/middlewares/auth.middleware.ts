import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthPayload {
  id: string;
  name: string;
}

interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const payload = jwt.verify(token, secret) as unknown;
    // attach payload to request with a proper type
    const reqWithUser = req as AuthRequest;
    if (typeof payload === 'object' && payload !== null && 'id' in (payload as Record<string, unknown>)) {
      reqWithUser.user = {
        id: String((payload as Record<string, unknown>)['id']),
        name: String((payload as Record<string, unknown>)['name'] ?? ''),
      };
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
