import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // TODO: Implement JWT token verification
  // 1. Extract token from Authorization header
  // 2. Verify JWT token
  // 3. Extract userId from token payload
  // 4. Add userId to request object
  // 5. Call next() if valid, return 401 if invalid
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }
};