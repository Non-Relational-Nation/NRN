import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/userService';
import { MockUserRepository } from '../repositories/implementations/MockUserRepository';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';

const mockUserRepository = new MockUserRepository();

const userService = new UserService(mockUserRepository);
const userController = new UserController(userService);

const router = Router();

router.get('/:id', (req, res) => userController.getUserProfile(req, res));

router.put('/:id', (req, res) => userController.updateUserProfile(req, res));

router.get('/', (req, res) => userController.searchUsers(req, res));

export { router as userRoutes, mockUserRepository };
