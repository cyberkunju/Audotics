import { Router, Request, Response } from 'express';
import { GroupService } from '../services/group.service';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const groupService = GroupService.getInstance();

// Validation schemas
const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  initialUsers: z.array(z.string()).optional()
});

const addUserSchema = z.object({
  userId: z.string()
});

const updateSessionSchema = z.object({
  active: z.boolean()
});

// Create a new session
router.post(
  '/',
  authenticateUser,
  validateRequest(createSessionSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, initialUsers = [] } = req.body;
      const session = await groupService.createSession(
        name,
        req.user!.id,
        initialUsers
      );
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
);

// Get session details
router.get(
  '/:sessionId',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const session = await groupService.getSessionDetails(req.params.sessionId);
      res.json(session);
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(404).json({ error: 'Session not found' });
    }
  }
);

// Get user's sessions
router.get(
  '/user/sessions',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const sessions = await groupService.getUserSessions(req.user!.id);
      res.json(sessions);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      res.status(500).json({ error: 'Failed to get user sessions' });
    }
  }
);

// Add user to session
router.post(
  '/:sessionId/users',
  authenticateUser,
  validateRequest(addUserSchema),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const session = await groupService.addUserToSession(
        req.params.sessionId,
        userId
      );
      res.json(session);
    } catch (error) {
      console.error('Error adding user to session:', error);
      res.status(500).json({ error: 'Failed to add user to session' });
    }
  }
);

// Remove user from session
router.delete(
  '/:sessionId/users/:userId',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const session = await groupService.removeUserFromSession(
        req.params.sessionId,
        req.params.userId
      );
      res.json(session);
    } catch (error) {
      console.error('Error removing user from session:', error);
      res.status(500).json({ error: 'Failed to remove user from session' });
    }
  }
);

// Update session status
router.patch(
  '/:sessionId',
  authenticateUser,
  validateRequest(updateSessionSchema),
  async (req: Request, res: Response) => {
    try {
      const { active } = req.body;
      const session = await groupService.updateSessionStatus(
        req.params.sessionId,
        active
      );
      res.json(session);
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  }
);

// Get session recommendations
router.get(
  '/:sessionId/recommendations',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const recommendations = await groupService.getSessionRecommendations(
        req.params.sessionId,
        limit
      );
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }
);

export default router; 