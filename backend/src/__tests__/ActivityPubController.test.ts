import { ActivityPubController } from '../controllers/ActivityPubController';
import { Request, Response } from 'express';

// Mock Express Request and Response objects
const mockRequest = (): Request => {
  return {
    query: {},
    params: {},
    body: {},
  } as unknown as Request;
};

const mockResponse = (): Response => {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.setHeader = jest.fn(() => res);
  res.writeHead = jest.fn(() => res);
  res.end = jest.fn(() => res);
  res.redirect = jest.fn(() => res);
  res.render = jest.fn(() => res);
  res.sendFile = jest.fn(() => res);
  res.download = jest.fn(() => res);
  res.links = jest.fn(() => res);
  res.location = jest.fn(() => res);
  res.type = jest.fn(() => res);
  res.vary = jest.fn(() => res);
  res.append = jest.fn(() => res);
  res.format = jest.fn(() => res);
  res.attachment = jest.fn(() => res);
  res.cookie = jest.fn(() => res);
  res.clearCookie = jest.fn(() => res);
  res.get = jest.fn(() => res);
  res.set = jest.fn(() => res);
  res.header = jest.fn(() => res);
  res.removeHeader = jest.fn(() => res);
  res.headersSent = false;
  res.locals = {};
  res.finished = false;
  res.statusCode = 200;
  res.statusMessage = 'OK';
  return res as Response;
};

describe('ActivityPubController', () => {
  let controller: ActivityPubController;
  let req: Request;
  let res: Response;

  beforeEach(() => {
    controller = new ActivityPubController();
    req = mockRequest();
    res = mockResponse();
  });

  describe('webfinger', () => {
    it('should return 400 if resource parameter is missing', () => {
      controller.webfinger(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing resource parameter' });
    });

    it('should return 400 if resource parameter is invalid', () => {
      req.query.resource = 'invalid';
      controller.webfinger(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid resource format' });
    });

    it('should return 404 if domain does not match', () => {
      req.query.resource = 'acct:testuser@example.com';
      controller.webfinger(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return WebFinger response for valid request', () => {
      req.query.resource = 'acct:testuser@localhost:3001';
      controller.webfinger(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        subject: 'acct:testuser@localhost:3001',
        aliases: [
          'https://localhost:3001/users/testuser'
        ],
        links: [
          {
            rel: 'self',
            type: 'application/activity+json',
            href: 'https://localhost:3001/users/testuser'
          },
          {
            rel: 'http://webfinger.net/rel/profile-page',
            type: 'text/html',
            href: 'https://localhost:3001/@testuser'
          }
        ]
      });
    });
  });

  describe('getActor', () => {
    it('should return actor profile', () => {
      req.params.username = 'testuser';
      controller.getActor(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      // Verify that the response contains expected fields
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('@context');
      expect(response).toHaveProperty('type', 'Person');
      expect(response).toHaveProperty('preferredUsername', 'testuser');
      expect(response).toHaveProperty('inbox');
      expect(response).toHaveProperty('outbox');
      expect(response).toHaveProperty('followers');
      expect(response).toHaveProperty('following');
      expect(response).toHaveProperty('publicKey');
    });
  });

  describe('inbox', () => {
    it('should accept incoming activities', () => {
      req.params.username = 'testuser';
      req.body = {
        id: 'https://example.com/activity/1',
        type: 'Create',
        actor: 'https://example.com/users/testuser',
        object: 'https://example.com/note/1'
      };
      
      controller.inbox(req, res);
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Activity received and will be processed',
        activityId: 'https://example.com/activity/1'
      });
    });
  });

  describe('outbox', () => {
    it('should return outbox collection', () => {
      req.params.username = 'testuser';
      controller.outbox(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      // Verify that the response contains expected fields
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('@context', 'https://www.w3.org/ns/activitystreams');
      expect(response).toHaveProperty('id', 'https://localhost:3001/users/testuser/outbox');
      expect(response).toHaveProperty('type', 'OrderedCollection');
      expect(response).toHaveProperty('totalItems', 0);
      expect(response).toHaveProperty('orderedItems');
    });
  });

  describe('followers', () => {
    it('should return followers collection', () => {
      req.params.username = 'testuser';
      controller.followers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      // Verify that the response contains expected fields
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('@context', 'https://www.w3.org/ns/activitystreams');
      expect(response).toHaveProperty('id', 'https://localhost:3001/users/testuser/followers');
      expect(response).toHaveProperty('type', 'OrderedCollection');
      expect(response).toHaveProperty('totalItems', 0);
      expect(response).toHaveProperty('orderedItems');
    });
  });

  describe('following', () => {
    it('should return following collection', () => {
      req.params.username = 'testuser';
      controller.following(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      // Verify that the response contains expected fields
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('@context', 'https://www.w3.org/ns/activitystreams');
      expect(response).toHaveProperty('id', 'https://localhost:3001/users/testuser/following');
      expect(response).toHaveProperty('type', 'OrderedCollection');
      expect(response).toHaveProperty('totalItems', 0);
      expect(response).toHaveProperty('orderedItems');
    });
  });

  describe('sharedInbox', () => {
    it('should accept incoming activities for shared inbox', () => {
      req.body = {
        id: 'https://example.com/activity/1',
        type: 'Create',
        actor: 'https://example.com/users/testuser',
        object: 'https://example.com/note/1'
      };
      
      controller.sharedInbox(req, res);
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Activity received and will be processed',
        activityId: 'https://example.com/activity/1'
      });
    });
  });
});