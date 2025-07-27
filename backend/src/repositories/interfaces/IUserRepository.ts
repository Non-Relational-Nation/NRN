import { User, CreateUserData, UpdateUserData } from '../../types/user';

export interface IUserRepository {
  // Core CRUD operations
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  
  // User-specific operations
  searchUsers(query: string, limit?: number, offset?: number): Promise<User[]>;
}
