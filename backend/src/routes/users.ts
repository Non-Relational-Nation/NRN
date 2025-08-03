import { Router } from "express";
import UserController from "../controllers/UserController.ts";

const router = Router();

router.post("/setup", UserController.registerUser);
// Add user GET endpoints for frontend integration
router.get("/:id", UserController.getUserById);
router.get("/", UserController.searchUsers);
router.post("/:username/following", UserController.sendFollowRequest)
router.get("/:username/followers", UserController.getUserFollowers)
router.get("/:username/following", UserController.getUserFollowing)

export default router;

export { router as userRoutes };
