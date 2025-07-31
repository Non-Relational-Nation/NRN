import { Router } from 'express';
import { PostController } from '../controllers/PostController';
import { PostService } from '../services/postService';
import { MockPostRepository } from '../repositories/implementations/MockPostRepository';
import { MockUserRepository } from '../repositories/implementations/MockUserRepository';

const mockPostRepository = new MockPostRepository();
const mockUserRepository = new MockUserRepository();
const postService = new PostService(mockPostRepository, mockUserRepository);
const postController = new PostController(postService);

const router = Router();

router.post('/', (req, res) => postController.createPost(req, res));

router.get('/', (req, res) => postController.getPublicPosts(req, res));

router.get('/search', (req, res) => postController.searchPosts(req, res));

router.get('/author/:authorId', (req, res) => postController.getPostsByAuthor(req, res));

router.get('/feed', (req, res) => postController.getFeed(req, res));

router.get('/:id', (req, res) => postController.getPost(req, res));

router.put('/:id', (req, res) => postController.updatePost(req, res));

router.delete('/:id', (req, res) => postController.deletePost(req, res));

export { router as postRoutes, mockPostRepository };
