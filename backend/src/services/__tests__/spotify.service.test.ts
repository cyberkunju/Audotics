import { SpotifyService } from '../spotify.service';
import axios from 'axios';
import { config } from '../../config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SpotifyService', () => {
  let spotifyService: SpotifyService;

  beforeEach(() => {
    spotifyService = SpotifyService.getInstance();
    jest.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should generate correct authorization URL', () => {
      const authUrl = spotifyService.getAuthUrl();
      
      expect(authUrl).toContain('https://accounts.spotify.com/authorize');
      expect(authUrl).toContain(`client_id=${config.spotify.clientId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(config.spotify.redirectUri)}`);
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=');
    });
  });

  describe('getTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await spotifyService.getTokens('mock_code');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.any(String),
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('search', () => {
    it('should search for tracks with given query', async () => {
      const mockTracks = {
        data: {
          tracks: {
            items: [
              {
                id: 'track1',
                name: 'Test Track',
                artists: [{ name: 'Test Artist' }],
                album: { name: 'Test Album' },
                uri: 'spotify:track:track1'
              }
            ]
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockTracks);

      const result = await spotifyService.search('mock_token', 'test query');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/search?'),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer mock_token'
          }
        })
      );

      expect(result).toEqual(mockTracks.data.tracks.items);
    });
  });

  describe('getAudioFeatures', () => {
    it('should fetch audio features for tracks', async () => {
      const mockFeatures = {
        data: {
          audio_features: [{
            danceability: 0.8,
            energy: 0.7,
            key: 5,
            tempo: 120
          }]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockFeatures);

      const result = await spotifyService.getAudioFeatures('mock_token', ['track1']);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/audio-features?ids=track1',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer mock_token'
          }
        })
      );

      expect(result).toEqual(mockFeatures.data.audio_features);
    });
  });

  describe('getRecommendations', () => {
    it('should get track recommendations based on seeds', async () => {
      const mockRecommendations = {
        data: {
          tracks: [
            {
              id: 'rec1',
              name: 'Recommended Track',
              artists: [{ name: 'Artist' }],
              album: { name: 'Album' },
              uri: 'spotify:track:rec1'
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockRecommendations);

      const result = await spotifyService.getRecommendations('mock_token', {
        seed_artists: ['artist1'],
        seed_tracks: ['track1'],
        seed_genres: ['rock'],
        target_danceability: 0.8
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/recommendations?'),
        expect.any(Object)
      );

      expect(result).toEqual(mockRecommendations.data.tracks);
    });
  });
});
