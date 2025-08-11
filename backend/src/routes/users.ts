import { Router } from "express";
import UserController from "../controllers/UserController.ts";

const router = Router();

router.post("/setup", UserController.registerUser);
router.post("/batch", UserController.getUsersByHandles);

router.get("/suggestions", UserController.suggestUsers);
router.get("/recommendations", UserController.getRecommendations);
router.get("/network-stats", UserController.getNetworkStats);
router.get("/:handle", UserController.getUserByHandle);
router.post("/:handle/following", UserController.sendFollowRequest);
router.post("/:handle/unfollow", UserController.unfollow);
router.get("/:username/followers", UserController.getUserFollowers);
router.get("/:username/following", UserController.getUserFollowing);
router.get("/:username/connection/:targetUsername", UserController.findConnection);

export default router;

export { router as userRoutes };
