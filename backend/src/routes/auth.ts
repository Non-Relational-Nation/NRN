import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.ts';

const router = Router();
const authController = new AuthController();

router.post('/login', (req, res) => authController.login(req, res));

export { router as authRoutes };
