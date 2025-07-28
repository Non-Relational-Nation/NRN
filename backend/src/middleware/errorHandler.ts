import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/common';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'UnauthorizedError' || error.message === 'Unauthorized') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError' || error.message === 'Forbidden') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError' || error.message === 'Not Found') {
    statusCode = 404;
    message = 'Not Found';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message || message;
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  res.status(statusCode).json(response);
};
