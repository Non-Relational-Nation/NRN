import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

// Get user profile
router.get('/:id', (req, res) => userController.getUserProfile(req, res));

// Update user profile
router.put('/:id', (req, res) => userController.updateUserProfile(req, res));

// Search users
router.get('/', (req, res) => userController.searchUsers(req, res));

export { router as userRoutes };
