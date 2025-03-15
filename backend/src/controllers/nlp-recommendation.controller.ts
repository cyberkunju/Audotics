import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { NLPRecommendationService } from '../aiml/services/nlp-recommendation.service';
import { AuthGuard } from '../guards/auth.guard';
import { Request } from 'express';

interface NLPQueryRequest {
  query: string;
  limit?: number;
}

interface CreatePlaylistRequest {
  query: string;
  name?: string;
}

@Controller('nlp-recommendations')
export class NLPRecommendationController {
  constructor(private nlpRecommendationService: NLPRecommendationService) {}

  /**
   * Get recommendations based on a natural language query
   */
  @Post('query')
  @UseGuards(AuthGuard)
  async getRecommendationsFromText(
    @Body() body: NLPQueryRequest,
    @Req() request: Request
  ) {
    const userId = request.user?.id;
    
    const recommendations = await this.nlpRecommendationService.getRecommendationsFromText({
      query: body.query,
      userId,
      limit: body.limit || 10
    });
    
    return {
      success: true,
      query: body.query,
      recommendations: recommendations.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        spotifyId: track.spotifyId
      }))
    };
  }

  /**
   * Create a playlist based on a natural language query
   */
  @Post('create-playlist')
  @UseGuards(AuthGuard)
  async createPlaylistFromText(
    @Body() body: CreatePlaylistRequest,
    @Req() request: Request
  ) {
    const userId = request.user?.id;
    
    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }
    
    try {
      const result = await this.nlpRecommendationService.createPlaylistFromText(
        userId,
        body.query,
        body.name
      );
      
      return {
        success: true,
        playlistId: result.playlistId,
        tracks: result.tracks.map(track => ({
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: track.album,
          spotifyId: track.spotifyId
        }))
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
} 