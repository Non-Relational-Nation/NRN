import { Router } from "express";
import UserController from "../controllers/UserController.ts";

const router = Router();

router.post("/setup", UserController.registerUser);

router.get("/", UserController.searchUsers);
// router.get("/:id", UserController.getUserById);
router.get("/:handle", UserController.getUserByHandle);
router.post("/:handle/following", UserController.sendFollowRequest)
router.get("/:username/followers", UserController.getUserFollowers)
router.get("/:username/following", UserController.getUserFollowing)

export default router;

export { router as userRoutes };
