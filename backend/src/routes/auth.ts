import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/userService';
import { AuthController } from '../controllers/AuthController';
import { MockUserRepository } from '../repositories/implementations/MockUserRepository';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';

// Create a shared mock repository instance for testing
const mockUserRepository = new MockUserRepository();

// Initialize service with mock repository
const userService = new UserService(mockUserRepository);
const userController = new UserController(userService);
const authController = new AuthController();

const router = Router();

// Register new user
router.post('/register', (req, res) => userController.register(req, res));

// User login
router.post('/login', (req, res) => authController.login(req, res));

// User logout
router.post('/logout', (req, res) => userController.logout(req, res));

export { router as authRoutes, mockUserRepository };
