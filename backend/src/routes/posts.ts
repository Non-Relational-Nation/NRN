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
router.get('/:id', (req, res, next) => postController.getPost(req, res, next));
router.put('/:id', (req, res) => postController.updatePost(req, res));
router.delete('/:id', (req, res) => postController.deletePost(req, res));
router.get('/author/:handle', (req, res, next) => postController.getPostsByAuthor(req, res, next));
router.get('/', (req, res, next) => postController.getPublicPosts(req, res, next));
router.get('/search', (req, res) => postController.searchPosts(req, res));
router.get('/feed/:userId', (req, res) => postController.getFeed(req, res));
router.post('/:id/like', (req, res, next) => postController.likePost(req, res, next));
router.post('/:id/unlike', (req, res, next) => postController.unlikePost(req, res, next));

export { router as postRoutes };
