import { Router } from 'express';
import { ActivityPubController } from '../controllers/ActivityPubController';

const router = Router();
const activityPubController = new ActivityPubController();

// // WebFinger discovery (/.well-known/webfinger)
// router.get('/.well-known/webfinger', (req, res) => 
//   activityPubController.webfinger(req, res)
// );

// // Actor endpoints
// router.get('/users/:username', (req, res) => 
//   activityPubController.getActor(req, res)
// );

// // Activity endpoints
// router.post('/users/:username/inbox', (req, res) => 
//   activityPubController.inbox(req, res)
// );

// router.get('/users/:username/outbox', (req, res) => 
//   activityPubController.outbox(req, res)
// );

// router.get('/users/:username/followers', (req, res) => 
//   activityPubController.followers(req, res)
// );

// router.get('/users/:username/following', (req, res) => 
//   activityPubController.following(req, res)
// );

// // Shared inbox for server-wide activities
// router.post('/inbox', (req, res) => 
//   activityPubController.sharedInbox(req, res)
// );

export { router as activityPubRoutes };
