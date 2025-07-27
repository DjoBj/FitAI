import { Request, Response, NextFunction } from 'express';

export class ErrorHandler {
  public static notFound(req: Request, res: Response): void {
    res.status(404).json({ success: false, message: 'Route not found' });
  }

  public static handle(err: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('❌ Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
  }
}