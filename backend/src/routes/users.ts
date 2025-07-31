import { Router } from "express";
import UserController from "../controllers/UserController.ts";

const router = Router();

router.post("/setup", UserController.registerUser);

export default router;

export { router as userRoutes };
