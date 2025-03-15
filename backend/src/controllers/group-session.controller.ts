import { Controller, Post, Get, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { GroupSessionService } from '../services/group-session.service';
import { AuthRequest } from '../types/auth';
import { AuthGuard } from '../guards/auth.guard';

@Controller('api/sessions')
@UseGuards(AuthGuard)
export class GroupSessionController {
  private static instance: GroupSessionController;

  // Static method for backward compatibility with express routes
  public static getInstance(): GroupSessionController {
    if (!GroupSessionController.instance) {
      throw new Error('GroupSessionController not instantiated yet. Use dependency injection instead.');
    }
    return GroupSessionController.instance;
  }

  constructor(private readonly groupSessionService: GroupSessionService) {
    // Save instance for backward compatibility
    GroupSessionController.instance = this;
  }

  @Post()
  async createSession(@Body() body: { name: string }, @Req() req: AuthRequest) {
    try {
      const { name } = body;
      const userId = req.user.id;

      const session = await this.groupSessionService.createSession(userId, { name });
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  @Post(':sessionId/join')
  async joinSession(@Param('sessionId') sessionId: string, @Req() req: AuthRequest) {
    try {
      const userId = req.user.id;

      const session = await this.groupSessionService.joinSession(sessionId, userId);
      return session;
    } catch (error) {
      console.error('Error joining session:', error);
      throw new Error('Failed to join session');
    }
  }

  @Delete(':sessionId/leave')
  async leaveSession(@Param('sessionId') sessionId: string, @Req() req: AuthRequest) {
    try {
      const userId = req.user.id;

      await this.groupSessionService.leaveSession(sessionId, userId);
      return { message: 'Successfully left the session' };
    } catch (error) {
      console.error('Error leaving session:', error);
      throw new Error('Failed to leave session');
    }
  }

  @Put(':sessionId/playlist')
  async updatePlaylist(
    @Param('sessionId') sessionId: string, 
    @Body() body: { tracks: Array<{ spotifyId: string; name: string; artists: string[]; album: string; features: any }> },
    @Req() req: AuthRequest
  ) {
    try {
      const userId = req.user.id;
      const { tracks } = body;
      
      // Extract track IDs from the tracks array
      const trackIds = tracks.map(track => track.spotifyId);

      const playlist = await this.groupSessionService.updatePlaylist(sessionId, userId, trackIds);
      return playlist;
    } catch (error) {
      console.error('Error updating playlist:', error);
      throw new Error('Failed to update playlist');
    }
  }

  @Get(':sessionId/recommendations')
  async getRecommendations(@Param('sessionId') sessionId: string, @Req() req: AuthRequest) {
    try {
      const userId = req.user.id;
      const recommendations = await this.groupSessionService.getRecommendations(sessionId, userId);
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }
}
