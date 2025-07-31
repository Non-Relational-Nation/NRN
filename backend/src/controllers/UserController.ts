import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CreateUserData, UpdateUserData, LoginCredentials } from '../types/user';

export class UserController {
  constructor(private userService: UserService) {}

  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await this.userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }

  async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateUserData = req.body;

      const user = await this.userService.updateUser(id, updateData);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'User profile updated successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
        return;
      }

      const users = await this.userService.searchUsers(query);
      
      res.json({
        success: true,
        data: {
          query,
          users
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'User search failed'
      });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserData = req.body;

      const user = await this.userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginCredentials = req.body;

      const tokens = await this.userService.authenticate(credentials);
      
      if (!tokens) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Login successful',
        data: tokens
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, you would:
      // 1. Invalidate the refresh token in the database
      // 2. Clear any session data
      // For now, we'll just send a success response
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }
}
