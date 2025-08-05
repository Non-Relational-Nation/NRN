import { Router } from 'express';
import { PostController } from '../controllers/PostController.js';
import { postRepository } from '../repositories/postRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { PostService } from '../services/postService.js';
import { upload } from '../middleware/multerUpload.js';

const router = Router();
const postService = new PostService(postRepository, userRepository);
const postController = new PostController(postService);

router.post('/', upload.array('files'), (req, res) => postController.createPost(req, res));

// Debug endpoint - remove after fixing
router.get('/debug/s3-config', (req, res) => {
  res.json({
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    NODE_ENV: process.env.NODE_ENV
  });
});

router.get('/:id', (req, res, next) => postController.getPost(req, res, next));
router.put('/:id', (req, res) => postController.updatePost(req, res));
router.delete('/:id', (req, res) => postController.deletePost(req, res));
router.get('/author/:authorId', (req, res, next) => postController.getPostsByAuthor(req, res, next));
router.get('/', (req, res, next) => postController.getPublicPosts(req, res, next));
router.get('/search', (req, res) => postController.searchPosts(req, res));
router.get('/feed/:userId', (req, res) => postController.getFeed(req, res));
router.post('/:id/like', (req, res) => postController.likePost(req, res));

export { router as postRoutes };
