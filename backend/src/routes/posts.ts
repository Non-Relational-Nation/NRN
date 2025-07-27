import { Router } from 'express';
import { PostController } from '../controllers/PostController';

const router = Router();
const postController = new PostController();

// Create new post
router.post('/', (req, res) => postController.createPost(req, res));

// Get post by ID
router.get('/:id', (req, res) => postController.getPost(req, res));

// Update post
router.put('/:id', (req, res) => postController.updatePost(req, res));

// Delete post
router.delete('/:id', (req, res) => postController.deletePost(req, res));

// Like/unlike post
router.post('/:id/like', (req, res) => postController.likePost(req, res));

// Get post comments
router.get('/:id/comments', (req, res) => postController.getPostComments(req, res));

// Add comment to post
router.post('/:id/comments', (req, res) => postController.addComment(req, res));

export { router as postRoutes };
