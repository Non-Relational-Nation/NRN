import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Register new user
router.post('/register', (req, res) => authController.register(req, res));

// User login
router.post('/login', (req, res) => authController.login(req, res));

// User logout
router.post('/logout', (req, res) => authController.logout(req, res));

// Refresh token
router.post('/refresh', (req, res) => authController.refreshToken(req, res));

export { router as authRoutes };
