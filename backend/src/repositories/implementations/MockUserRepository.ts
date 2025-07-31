import { User, CreateUserData, UpdateUserData } from '../../types/user';
import { IUserRepository } from '../interfaces/IUserRepository';

export class MockUserRepository implements IUserRepository {
  private users: User[] = [];
  private nextId = 1;

  async create(data: CreateUserData): Promise<User> {
    const user: User = {
      id: this.nextId.toString(),
      ...data,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.push(user);
    this.nextId++;
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...data,
      updatedAt: new Date()
    };

    return this.users[userIndex];
  }

  async delete(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    return true;
  }

  async searchUsers(query: string, limit?: number, offset?: number): Promise<User[]> {
    const filteredUsers = this.users.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.displayName.toLowerCase().includes(query.toLowerCase())
    );

    const start = offset || 0;
    const end = limit ? start + limit : undefined;

    return filteredUsers.slice(start, end);
  }

  // Helper method to clear the mock data
  clear(): void {
    this.users = [];
    this.nextId = 1;
  }
} 