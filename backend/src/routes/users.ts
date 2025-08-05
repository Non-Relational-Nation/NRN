import { Router } from "express";
import UserController from "../controllers/UserController.ts";

const router = Router();

router.post("/setup", UserController.registerUser);

router.get("/", UserController.searchUsers);
router.get("/:id", UserController.getUserById);
router.post("/:username/following", UserController.sendFollowRequest)
router.get("/:username/followers", UserController.getUserFollowers)
router.get("/:username/following", UserController.getUserFollowing)
router.post("/:username/posts", UserController.addPost) // to be merged with post creation in posts

export default router;

export { router as userRoutes };
