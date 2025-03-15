import { Router, Request, Response } from 'express';
import { GroupService } from '../services/group.service';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const groupService = GroupService.getInstance();

// Validation schemas
const addTracksSchema = z.object({
  trackIds: z.array(z.string()).min(1),
  userId: z.string()
});

const removeTracksSchema = z.object({
  trackIds: z.array(z.string()).min(1),
  userId: z.string()
});

const reorderTracksSchema = z.object({
  trackIds: z.array(z.string()).min(1),
  userId: z.string()
});

const mergePlaylistsSchema = z.object({
  sourceSessionIds: z.array(z.string()).min(1),
  userId: z.string()
});

/**
 * Add tracks to session playlist
 * POST /api/playlists/:sessionId/tracks
 */
router.post(
  '/:sessionId/tracks',
  authenticateUser,
  validateRequest(addTracksSchema),
  async (req: Request, res: Response) => {
    try {
      const { trackIds } = req.body;
      const playlist = await groupService.addTracksToPlaylist(
        req.params.sessionId,
        trackIds,
        req.user!.id
      );
      res.json(playlist);
    } catch (error) {
      console.error('Error adding tracks:', error);
      res.status(400).json({ error: 'Failed to add tracks to playlist' });
    }
  }
);

/**
 * Remove tracks from session playlist
 * DELETE /api/playlists/:sessionId/tracks
 */
router.delete(
  '/:sessionId/tracks',
  authenticateUser,
  validateRequest(removeTracksSchema),
  async (req: Request, res: Response) => {
    try {
      const { trackIds } = req.body;
      const playlist = await groupService.removeTracksFromPlaylist(
        req.params.sessionId,
        trackIds,
        req.user!.id
      );
      res.json(playlist);
    } catch (error) {
      console.error('Error removing tracks:', error);
      res.status(400).json({ error: 'Failed to remove tracks from playlist' });
    }
  }
);

/**
 * Reorder tracks in session playlist
 * PUT /api/playlists/:sessionId/tracks
 */
router.put(
  '/:sessionId/tracks',
  authenticateUser,
  validateRequest(reorderTracksSchema),
  async (req: Request, res: Response) => {
    try {
      const { trackIds } = req.body;
      const playlist = await groupService.reorderPlaylistTracks(
        req.params.sessionId,
        trackIds,
        req.user!.id
      );
      res.json(playlist);
    } catch (error) {
      console.error('Error reordering tracks:', error);
      res.status(400).json({ error: 'Failed to reorder tracks' });
    }
  }
);

/**
 * Get playlist update history
 * GET /api/playlists/:sessionId/history
 */
router.get(
  '/:sessionId/history',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const history = await groupService.getPlaylistHistory(
        req.params.sessionId,
        limit
      );
      res.json(history);
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({ error: 'Failed to get playlist history' });
    }
  }
);

/**
 * Merge playlists from other sessions
 * POST /api/playlists/:sessionId/merge
 */
router.post(
  '/:sessionId/merge',
  authenticateUser,
  validateRequest(mergePlaylistsSchema),
  async (req: Request, res: Response) => {
    try {
      const { sourceSessionIds } = req.body;
      const playlist = await groupService.mergePlaylists(
        req.params.sessionId,
        sourceSessionIds,
        req.user!.id
      );
      res.json(playlist);
    } catch (error) {
      console.error('Error merging playlists:', error);
      res.status(400).json({ error: 'Failed to merge playlists' });
    }
  }
);

export default router; 