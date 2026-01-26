import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors';

export const errorMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  // preserve stack in non-production
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'production' ? undefined : (err instanceof Error ? err.stack : undefined);

  console.error(err);
  return res.status(500).json({
    success: false,
    message,
    ...(stack ? { stack } : {}),
  });
};
