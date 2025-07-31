import { User, CreateUserData, UpdateUserData, LoginCredentials, AuthTokens } from '../types/user';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async createUser(data: CreateUserData): Promise<User> {
    // Validate input data
    if (!data.username || data.username.trim().length === 0) {
      throw new Error('Username is required');
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Valid email is required');
    }
    
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user with this email or username already exists
    const existingUserByEmail = await this.userRepository.findByEmail(data.email);
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    const existingUserByUsername = await this.userRepository.findByUsername(data.username);
    if (existingUserByUsername) {
      throw new Error('User with this username already exists');
    }

    // Create the user
    const userData = {
      ...data,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.userRepository.create(userData);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User | null> {
    // Check if the user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }

    // Update the user
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    return this.userRepository.update(id, updateData);
  }

  async deleteUser(id: string): Promise<boolean> {
    // Check if the user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      return false;
    }

    return this.userRepository.delete(id);
  }

  async searchUsers(query: string, limit?: number, offset?: number): Promise<User[]> {
    return this.userRepository.searchUsers(query, limit, offset);
  }

  async authenticate(credentials: LoginCredentials): Promise<AuthTokens | null> {
    // In a real implementation, you would:
    // 1. Find the user by email
    // 2. Verify the password (hash comparison)
    // 3. Generate JWT tokens
    // For now, we'll return mock tokens if user exists
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      return null;
    }

    // In a real implementation, you would verify the password here
    // For now, we'll just check if the user exists
    // TODO: Add password verification when implementing proper authentication

    // Mock token generation
    const accessToken = 'mock-access-token';
    const refreshToken = 'mock-refresh-token';

    return {
      accessToken,
      refreshToken
    };
  }
}
