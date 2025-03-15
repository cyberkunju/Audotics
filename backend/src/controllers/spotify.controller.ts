import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SpotifyService } from '../services/spotify.service';
import { AuthGuard } from '../guards/auth.guard';
import { UserService } from '../services/user.service';

@Controller('spotify')
@UseGuards(AuthGuard)
export class SpotifyController {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly userService: UserService,
  ) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getCurrentUser(token);
  }

  @Get('top-tracks')
  async getTopTracks(@Req() req: any, @Query('timeRange') timeRange = 'medium_term') {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getUserTopTracks(token, timeRange);
  }

  @Get('top-artists')
  async getTopArtists(@Req() req: any, @Query('timeRange') timeRange = 'medium_term') {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getUserTopArtists(token, timeRange);
  }

  @Get('saved-tracks')
  async getSavedTracks(
    @Req() req: any, 
    @Query('limit') limit = '20', 
    @Query('offset') offset = '0'
  ) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getUserSavedTracks(token, parseInt(limit), parseInt(offset));
  }

  @Get('search')
  async search(
    @Req() req: any, 
    @Query('q') query: string,
    @Query('type') type = 'track',
    @Query('limit') limit = '20'
  ) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.search(token, query, type, parseInt(limit));
  }

  @Get('recommendations')
  async getRecommendations(
    @Req() req: any,
    @Query('seed_tracks') seedTracks?: string,
    @Query('seed_artists') seedArtists?: string,
    @Query('seed_genres') seedGenres?: string,
    @Query('limit') limit = '20',
    @Query('target_energy') targetEnergy?: string,
    @Query('target_danceability') targetDanceability?: string,
    @Query('target_valence') targetValence?: string,
    @Query('target_acousticness') targetAcousticness?: string,
    @Query('target_popularity') targetPopularity?: string,
  ) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    const options: any = {
      limit: parseInt(limit),
    };
    
    if (seedTracks) options.seed_tracks = seedTracks.split(',');
    if (seedArtists) options.seed_artists = seedArtists.split(',');
    if (seedGenres) options.seed_genres = seedGenres.split(',');
    if (targetEnergy) options.target_energy = parseFloat(targetEnergy);
    if (targetDanceability) options.target_danceability = parseFloat(targetDanceability);
    if (targetValence) options.target_valence = parseFloat(targetValence);
    if (targetAcousticness) options.target_acousticness = parseFloat(targetAcousticness);
    if (targetPopularity) options.target_popularity = parseInt(targetPopularity);
    
    return this.spotifyService.getRecommendations(token, options);
  }

  @Get('audio-features')
  async getAudioFeatures(@Req() req: any, @Query('ids') trackIds: string) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getAudioFeatures(token, trackIds.split(','));
  }

  @Post('create-playlist')
  async createPlaylist(
    @Req() req: any,
    @Body() body: { name: string; description?: string }
  ) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    const spotifyUser = await this.spotifyService.getCurrentUser(token);
    
    return this.spotifyService.createPlaylist(
      token,
      spotifyUser.id,
      body.name,
      body.description || ''
    );
  }

  @Post('add-to-playlist')
  async addToPlaylist(
    @Req() req: any,
    @Body() body: { playlistId: string; trackUris: string[] }
  ) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.addTracksToPlaylist(token, body.playlistId, body.trackUris);
  }

  @Get('genres')
  async getGenres(@Req() req: any) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getAvailableGenreSeeds(token);
  }

  @Get('track')
  async getTrack(@Req() req: any, @Query('id') trackId: string) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getTrack(token, trackId);
  }

  @Get('tracks')
  async getTracks(@Req() req: any, @Query('ids') trackIds: string) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getTracks(token, trackIds.split(','));
  }

  @Get('group-recommendations')
  async getGroupRecommendations(@Req() req: any, @Body() body: {
    userPreferences: {
      topArtistIds: string[];
      topTrackIds: string[];
      favoriteGenres: string[];
      audioFeatures: {
        energy: number;
        danceability: number;
        valence: number;
        acousticness: number;
      };
    }[]
  }) {
    const user = req.user;
    const token = await this.userService.getSpotifyToken(user.id);
    
    if (!token) {
      return { error: 'Spotify token not available', needsAuth: true };
    }
    
    return this.spotifyService.getGroupRecommendations(token, body.userPreferences);
  }
} 