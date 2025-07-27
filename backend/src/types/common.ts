import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface DatabaseError extends Error {
  code?: string;
  statusCode?: number;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Generic repository interface that all database implementations must follow
export interface Repository<T, CreateData, UpdateData> {
  create(data: CreateData): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(filter?: any, pagination?: PaginationQuery): Promise<{ items: T[]; meta: PaginationMeta }>;
  update(id: string, data: UpdateData): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Database connection interface
export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealth(): Promise<{ status: string; details?: any }>;
}
