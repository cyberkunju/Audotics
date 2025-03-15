'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// Import WebSocket service
import websocketService, { WebSocketEventType, SessionData } from '@/services/websocket.service'
import { User, Track } from '@/hooks/useWebSocket'
import { useToast } from '@/components/ToastContainer'
import useErrorHandler from '@/hooks/useErrorHandler'
import { ErrorBoundary } from "@/components/ErrorBoundary"
import ContentFallback from '@/components/ContentFallback'

// Import visualization components and new UI elements
import { 
  ChartBarIcon,
  ChartPieIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline'

// Add import for Spotify service
import spotifyService, { SpotifyTrack } from '@/services/spotify.service'

// Add import for authService
import authService from '@/services/auth.service'

// Add import for SpotifyAuth
import { useSpotifyAuth } from '@/lib/spotify-auth/context'

// Add import for ImageWithFallback
import ImageWithFallback from '@/components/ImageWithFallback'

// Extended Track interface to match the UI requirements
interface UITrack extends Track {
  imageUrl?: string;
  album?: string;
}

export default function SessionPage() {
  const { id } = useParams() as { id: string }
  const { auth } = useSpotifyAuth()
  const { showToast } = useToast()
  const { 
    error: sessionError, 
    setError, 
    clearError,
    handleError,
    isLoading: errorLoading,
    setIsLoading: setErrorLoading
  } = useErrorHandler(true)
  
  const [sessionName, setSessionName] = useState('')
  const [participants, setParticipants] = useState<User[]>([])
  const [playlist, setPlaylist] = useState<UITrack[]>([])
  const [recommendations, setRecommendations] = useState<UITrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'playlist' | 'recommendations' | 'preferences'>('playlist')
  const [isConnected, setIsConnected] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<UITrack[]>([])
  const [previewTrack, setPreviewTrack] = useState<UITrack | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [aggregatedPreferences, setAggregatedPreferences] = useState<{
    genres: Array<{ name: string, weight: number }>,
    features: Record<string, number>,
    artists: Array<{ name: string, count: number }>
  } | null>(null)

  // Initialize WebSocket connection on mount
  useEffect(() => {
    if (!id || !auth.user) return
    
    console.log(`[Session] Connecting to session ${id}...`)
    clearError() // Clear any previous errors
    setIsLoading(true)
    
    try {
      // Set up WebSocket event listeners
      const handleSessionUpdate = (data: SessionData) => {
        console.log('[Session] Session update received:', data)
        setSessionName(data.name)
        setParticipants(data.participants)
        
        // Convert to UITrack type
        const uiPlaylist = data.playlist.map(track => ({
          ...track,
          imageUrl: track.albumArt,
          album: 'Unknown Album'
        }))
        
        const uiRecommendations = data.recommendations.map((track: Track) => ({
          ...track,
          imageUrl: track.albumArt,
          album: 'Unknown Album'
        }))
        
        setPlaylist(uiPlaylist)
        setRecommendations(uiRecommendations)
        setIsLoading(false)
        
        // Show successful connection message
        if (!isConnected) {
          showToast(`Connected to session: ${data.name}`, 'success')
        }
      }
      
      const handleUserJoin = (data: { user: User }) => {
        console.log('[Session] User joined:', data.user.name)
        setParticipants(prev => 
          prev.some(p => p.id === data.user.id) 
            ? prev 
            : [...prev, data.user]
        )
        
        // Show a toast notification for user join
        showToast(`${data.user.name} joined the session`, 'info')
      }
      
      const handleUserLeave = (data: { user: User }) => {
        console.log('[Session] User left:', data.user.name)
        setParticipants(prev => prev.filter(p => p.id !== data.user.id))
        
        // Show a toast notification for user leave
        showToast(`${data.user.name} left the session`, 'info')
      }
      
      const handlePlaylistUpdate = (data: { tracks: Track[] }) => {
        console.log('[Session] Playlist updated:', data.tracks)
        
        // Convert to UITrack type
        const uiTracks = data.tracks.map(track => ({
          ...track,
          imageUrl: track.albumArt,
          album: 'Unknown Album'
        }))
        
        setPlaylist(uiTracks)
        
        // Show toast notification for playlist update
        showToast('Playlist updated', 'success')
      }
      
      const handleRecommendationAdded = (data: { track: Track }) => {
        console.log('[Session] Recommendation added:', data.track)
        
        // Convert to UITrack type
        const uiTrack = {
          ...data.track,
          imageUrl: data.track.albumArt,
          album: 'Unknown Album'
        }
        
        setRecommendations(prev => 
          prev.some(t => t.id === data.track.id)
            ? prev
            : [...prev, uiTrack]
        )
        
        // Show toast notification for new recommendation
        showToast('New track recommendation available', 'info')
      }
      
      const handleError = (error: any) => {
        console.error('[Session] WebSocket error:', error);
        
        // Handle authentication errors
        if (error.code === 'AUTH_REQUIRED') {
          setError('Authentication required. Please log in again.', 'AUTH_ERROR');
          authService.clearAuthState();
          window.location.href = '/auth/login';
          return;
        }

        // Handle other errors
        setError(
          typeof error === 'string' ? error : error.message || 'An unknown error occurred',
          error.code || 'WEBSOCKET_ERROR'
        );
        setIsLoading(false);
      }
      
      // Register event listeners
      websocketService.addEventListener(WebSocketEventType.SESSION_UPDATE, handleSessionUpdate)
      websocketService.addEventListener(WebSocketEventType.USER_JOIN, handleUserJoin)
      websocketService.addEventListener(WebSocketEventType.USER_LEAVE, handleUserLeave)
      websocketService.addEventListener(WebSocketEventType.PLAYLIST_UPDATE, handlePlaylistUpdate)
      websocketService.addEventListener(WebSocketEventType.RECOMMENDATION_ADDED, handleRecommendationAdded)
      websocketService.addEventListener(WebSocketEventType.ERROR, handleError)
      
      // Connect to the session
      websocketService.connect(id)
      setIsConnected(true)
      
      // Cleanup on unmount
      return () => {
        websocketService.removeEventListener(WebSocketEventType.SESSION_UPDATE, handleSessionUpdate)
        websocketService.removeEventListener(WebSocketEventType.USER_JOIN, handleUserJoin)
        websocketService.removeEventListener(WebSocketEventType.USER_LEAVE, handleUserLeave)
        websocketService.removeEventListener(WebSocketEventType.PLAYLIST_UPDATE, handlePlaylistUpdate)
        websocketService.removeEventListener(WebSocketEventType.RECOMMENDATION_ADDED, handleRecommendationAdded)
        websocketService.removeEventListener(WebSocketEventType.ERROR, handleError)
        
        websocketService.disconnect()
        setIsConnected(false)
      }
    } catch (error) {
      handleError(error)
      setIsLoading(false)
    }
  }, [id, auth.user, clearError, setError, handleError, showToast, isConnected, retryCount])

  // Temporary mock data loading - will be replaced by WebSocket events
  useEffect(() => {
    if (!isConnected) return;
    
    // Simulate loading for demo purposes - this will be removed when the backend is ready
    const timer = setTimeout(() => {
      if (!participants.length) {
        // Mock data only if no real data has been received from WebSocket
        setSessionName('Demo Session')
        setParticipants([
          { id: '1', name: 'You', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
          { id: '2', name: 'John Doe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
          { id: '3', name: 'Alice Smith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' }
        ])
        setPlaylist([
          { 
            id: '1', 
            title: 'Bohemian Rhapsody', 
            artist: 'Queen', 
            album: 'A Night at the Opera',
            imageUrl: 'https://picsum.photos/seed/1/200/200',
            duration: 355, // 5:55 in seconds
            addedBy: { id: '2', name: 'John Doe' }
          },
          {
            id: '2',
            title: 'Blinding Lights',
            artist: 'The Weeknd',
            album: 'After Hours',
            imageUrl: 'https://picsum.photos/seed/2/200/200',
            duration: 200, // 3:20 in seconds
            addedBy: { id: '3', name: 'Alice Smith' }
          }
        ])
        setRecommendations([
          {
            id: '3',
            title: 'Don\'t Start Now',
            artist: 'Dua Lipa',
            album: 'Future Nostalgia',
            imageUrl: 'https://picsum.photos/seed/3/200/200',
            duration: 183, // 3:03 in seconds
            addedBy: { id: '1', name: 'You' }
          },
          {
            id: '4',
            title: 'Shape of You',
            artist: 'Ed Sheeran',
            album: '÷',
            imageUrl: 'https://picsum.photos/seed/4/200/200',
            duration: 233, // 3:53 in seconds
            addedBy: { id: '1', name: 'You' }
          },
          {
            id: '5',
            title: 'bad guy',
            artist: 'Billie Eilish',
            album: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
            imageUrl: 'https://picsum.photos/seed/5/200/200',
            duration: 194, // 3:14 in seconds
            addedBy: { id: '1', name: 'You' }
          }
        ])
        setIsLoading(false)
      }
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [isConnected, participants.length])

  // Update the fetchRecommendations function to use real Spotify data
  const fetchRecommendations = async (sessionId: string) => {
    try {
      // First try to get recommendations from our API
      const response = await fetch(`/api/sessions/recommendations?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations from session API');
      }
      
      const data = await response.json();
      
      // If we have aggregated preferences, use them to get real Spotify recommendations
      if (data.aggregatedPreferences) {
        try {
          // Convert the aggregated preferences to the format expected by Spotify service
          const userPreferences = [{
            topArtistIds: data.aggregatedPreferences.artists.slice(0, 5).map((artist: any) => artist.id || ''),
            topTrackIds: data.playlist?.slice(0, 5).map((track: any) => track.id) || [],
            favoriteGenres: data.aggregatedPreferences.genres.slice(0, 5).map((genre: any) => genre.name),
            audioFeatures: {
              energy: data.aggregatedPreferences.features.energy || 0.5,
              danceability: data.aggregatedPreferences.features.danceability || 0.5,
              valence: data.aggregatedPreferences.features.valence || 0.5,
              acousticness: data.aggregatedPreferences.features.acousticness || 0.5
            }
          }];
          
          // Get real recommendations from Spotify
          const spotifyRecs = await spotifyService.getGroupRecommendations(userPreferences);
          
          // Return both the aggregated preferences and the real recommendations
          return {
            recommendations: spotifyRecs.tracks.map((track: SpotifyTrack) => ({
              id: track.id,
              title: track.name,
              artist: track.artists.map((a: { name: string }) => a.name).join(', '),
              albumArt: track.album.images[0]?.url,
              uri: track.uri
            })),
            aggregatedPreferences: data.aggregatedPreferences
          };
        } catch (spotifyError) {
          console.error('Error getting Spotify recommendations:', spotifyError);
          // Fall back to mock recommendations if Spotify API fails
          return data;
        }
      }
      
      return data;
    } catch (error) {
      console.error('[Session] Error fetching recommendations:', error);
      throw error;
    }
  }

  // Update the useEffect that loads session data to also fetch recommendations
  useEffect(() => {
    if (!isConnected || !id) return
    
    const loadRecommendations = async () => {
      try {
        const data = await fetchRecommendations(id)
        
        // Convert to UITrack type
        const uiRecommendations = data.recommendations.map((track: any) => ({
          ...track,
          imageUrl: track.albumArt,
          album: track.album || 'Unknown Album'
        }))
        
        setRecommendations(uiRecommendations)
        setAggregatedPreferences(data.aggregatedPreferences)
      } catch (error) {
        console.error('[Session] Failed to load recommendations:', error)
      }
    }
    
    loadRecommendations()
  }, [id, isConnected])

  // Helper function to format duration from seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Add a track to the playlist
  const handleAddToPlaylist = (trackId: string) => {
    try {
      const track = recommendations.find(t => t.id === trackId) || 
                    searchResults.find(t => t.id === trackId);
      
      if (!track) {
        setError('Track not found', 'TRACK_NOT_FOUND');
        return;
      }
      
      // Convert UITrack back to Track for WebSocket
      const wsTrack: Track = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        albumArt: track.imageUrl,
        duration: track.duration,
        addedBy: track.addedBy
      }
      
      // Use WebSocket service to update the playlist
      const success = websocketService.addTrack(wsTrack);
      
      if (!success) {
        throw new Error('Failed to add track to playlist');
      }
      
      // Optimistically update UI
      setPlaylist(prev => [...prev, track]);
      
      if (searchResults.find(t => t.id === trackId)) {
        // If it's from search results, don't remove it
        showToast(`Added "${track.title}" to playlist`, 'success');
      } else {
        // If it's from recommendations, remove it
        setRecommendations(prev => prev.filter(t => t.id !== trackId));
        showToast(`Added "${track.title}" to playlist`, 'success');
      }
    } catch (error) {
      handleError(error);
    }
  }

  // Remove a track from the playlist
  const handleRemoveFromPlaylist = (trackId: string) => {
    try {
      // Use WebSocket service to update the playlist
      const success = websocketService.removeTrack(trackId);
      
      if (!success) {
        throw new Error('Failed to remove track from playlist');
      }
      
      // Optimistically update UI
      const track = playlist.find(t => t.id === trackId);
      
      if (track) {
        setPlaylist(prev => prev.filter(t => t.id !== trackId));
        
        // Only add back to recommendations if it wasn't added by the user
        if (track.addedBy.id !== auth.user?.id) {
          setRecommendations(prev => [...prev, track]);
        }
        
        showToast(`Removed "${track.title}" from playlist`, 'info');
      }
    } catch (error) {
      handleError(error);
    }
  }

  // Search for tracks
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      showToast('Please enter a search term', 'warning');
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Simulate API call for search results
      setTimeout(() => {
        try {
          // Mock search results - in production this would be an API call
          const results: UITrack[] = [
            {
              id: `search-1-${Date.now()}`,
              title: `${searchQuery} - Top Result`,
              artist: 'Various Artists',
              album: 'Search Results',
              imageUrl: `https://picsum.photos/seed/${searchQuery}-1/200/200`,
              duration: 210,
              addedBy: { id: auth.user?.id || '1', name: auth.user?.display_name || 'You' }
            },
            {
              id: `${searchQuery}-2`,
              title: 'Another Song',
              artist: 'Another Artist',
              album: 'Another Album',
              imageUrl: `https://picsum.photos/seed/${searchQuery}-2/200/200`,
              duration: 245,
              addedBy: { id: auth.user?.id || '1', name: auth.user?.display_name || 'You' }
            },
            {
              id: `${searchQuery}-3`,
              title: 'Yet Another Song',
              artist: 'Yet Another Artist',
              album: 'Yet Another Album',
              imageUrl: `https://picsum.photos/seed/${searchQuery}-3/200/200`,
              duration: 198,
              addedBy: { id: auth.user?.id || '1', name: auth.user?.display_name || 'You' }
            }
          ];
          
          setSearchResults(results);
          setIsSearching(false);
          showToast(`Found ${results.length} results for "${searchQuery}"`, 'success');
        } catch (innerError) {
          // Handle errors that occur during the setTimeout callback
          handleError(innerError);
          setIsSearching(false);
        }
      }, 1000);
    } catch (error) {
      handleError(error);
      setIsSearching(false);
    }
  }
  
  // Clear search results
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  }
  
  // Preview a track
  const handlePreviewTrack = (track: UITrack) => {
    try {
      setPreviewTrack(track);
      showToast(`Preview: ${track.title} by ${track.artist}`, 'info');
      
      // In a real implementation, this would play a preview of the track
      setTimeout(() => {
        setPreviewTrack(null);
      }, 30000); // 30 seconds preview
    } catch (error) {
      handleError(error);
    }
  }
  
  // Export playlist to Spotify
  const handleExportToSpotify = () => {
    try {
      if (playlist.length === 0) {
        showToast('Cannot export an empty playlist', 'warning');
        return;
      }
      
      // In production, this would call an API to export the playlist
      showToast(`Exporting ${playlist.length} tracks to Spotify...`, 'info');
      
      // Simulate API call
      setTimeout(() => {
        try {
          showToast('Playlist exported successfully!', 'success');
        } catch (innerError) {
          handleError(innerError);
        }
      }, 1500);
    } catch (error) {
      handleError(error);
    }
  }
  
  // Handle reconnection attempts
  const handleRetryConnection = () => {
    setRetryCount(prev => prev + 1);
    clearError();
    setIsLoading(true);
    showToast('Reconnecting to session...', 'info');
  }

  // Render component with error handling
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-background">
          <Navigation />
          <main className="pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ContentFallback 
                title="Session Error" 
                message="We encountered an error loading this session. Please try again later."
                retry={() => window.location.reload()}
              />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <Navigation />
        
        <main className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : sessionError.hasError ? (
              <ContentFallback
                title="Connection Error"
                message={sessionError.message || "Failed to connect to session. Please try again."}
                retry={handleRetryConnection}
              />
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8"
                >
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {sessionName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Session ID: {id}
                  </p>
                </motion.div>

                {/* Track Preview Player */}
                <AnimatePresence>
                  {previewTrack && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      <div className="p-4 flex items-center">
                        <ImageWithFallback
                          src={previewTrack.imageUrl || '/images/placeholder/default.svg'}
                          alt={previewTrack.album || 'Album Cover'}
                          width={48}
                          height={48}
                          className="object-cover rounded mr-4"
                          fallbackSrc="/images/placeholder/album.svg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {previewTrack.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {previewTrack.artist} · {previewTrack.album}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleAddToPlaylist(previewTrack.id)}
                            className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => setPreviewTrack(null)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2">
                        <div className="relative w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-primary rounded-full animate-progress"></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>0:00</span>
                          <span>{formatDuration(30)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Sidebar - Participants */}
                  <div className="lg:col-span-1">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-24"
                    >
                      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                        Participants ({participants.length})
                      </h2>
                      
                      <div className="space-y-3">
                        {participants.length > 0 ? (
                          participants.map((participant) => (
                            <div 
                              key={participant.id}
                              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white mr-3">
                                {participant.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {participant.name}
                                  </h3>
                                  {/* Assume all participants are active for now */}
                                  <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            No participants yet
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6">
                        <button 
                          onClick={() => {
                            try {
                              // In a real app, this would open an invite modal or copy link
                              navigator.clipboard.writeText(`https://audotics.com/sessions/${id}`);
                              showToast('Invite link copied to clipboard', 'success');
                            } catch (error) {
                              handleError(error);
                            }
                          }}
                          className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Invite Friends
                        </button>
                        <button 
                          onClick={() => {
                            try {
                              websocketService.leaveSession();
                              showToast('Left session successfully', 'info');
                              // In a real app, this would redirect to the sessions list
                              window.location.href = '/sessions';
                            } catch (error) {
                              handleError(error);
                            }
                          }}
                          className="w-full mt-2 py-2 text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          Leave Session
                        </button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-3 space-y-8">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                      <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setActiveTab('playlist')}
                          className={`py-3 px-6 font-medium text-sm ${
                            activeTab === 'playlist'
                              ? 'border-b-2 border-primary text-primary'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          Playlist
                        </button>
                        <button
                          onClick={() => setActiveTab('recommendations')}
                          className={`py-3 px-6 font-medium text-sm ${
                            activeTab === 'recommendations'
                              ? 'border-b-2 border-primary text-primary'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          Recommendations
                        </button>
                        <button
                          onClick={() => setActiveTab('preferences')}
                          className={`py-3 px-6 font-medium text-sm ${
                            activeTab === 'preferences'
                              ? 'border-b-2 border-primary text-primary'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          Group Preferences
                        </button>
                      </div>
                    </div>

                    {/* Playlist Tab */}
                    {activeTab === 'playlist' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                      >
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Current Playlist
                          </h2>
                          <button 
                            onClick={handleExportToSpotify}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm flex items-center"
                            disabled={playlist.length === 0}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Export to Spotify
                          </button>
                        </div>
                        
                        {playlist.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {playlist.map((track, index) => (
                              <div 
                                key={track.id}
                                className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div className="w-8 text-center text-gray-500 dark:text-gray-400 mr-4">
                                  {index + 1}
                                </div>
                                <ImageWithFallback
                                  src={track.imageUrl || '/images/placeholder/default.svg'}
                                  alt={track.album || 'Album Cover'}
                                  width={48}
                                  height={48}
                                  className="object-cover rounded mr-4"
                                  fallbackSrc="/images/placeholder/album.svg"
                                />
                                <div className="flex-1 min-w-0 mr-4">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {track.title}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {track.artist} · {track.album}
                                  </p>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                                  {formatDuration(track.duration)}
                                </div>
                                <button 
                                  onClick={() => handleRemoveFromPlaylist(track.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              Your playlist is empty
                            </p>
                            <button 
                              onClick={() => setActiveTab('recommendations')}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                              Add Recommendations
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Recommendations Tab */}
                    {activeTab === 'recommendations' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                      >
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                                Recommended Tracks
                              </h2>
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Based on the group's preferences
                              </p>
                            </div>
                            
                            <form onSubmit={handleSearch} className="w-full md:w-auto">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search for tracks..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full md:w-64 px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {searchQuery ? (
                                  <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                ) : null}
                                <button
                                  type="submit"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                        
                        {isSearching ? (
                          <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2 text-gray-500 dark:text-gray-400">Searching...</span>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700">
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Search Results for "{searchQuery}"
                              </h3>
                            </div>
                            {searchResults.map((track) => (
                              <div 
                                key={track.id}
                                className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <ImageWithFallback
                                  src={track.imageUrl || '/images/placeholder/default.svg'}
                                  alt={track.album || 'Album Cover'}
                                  width={48}
                                  height={48}
                                  className="object-cover rounded mr-4"
                                  fallbackSrc="/images/placeholder/album.svg"
                                />
                                <div className="flex-1 min-w-0 mr-4">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {track.title}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {track.artist} · {track.album}
                                  </p>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                                  {formatDuration(track.duration)}
                                </div>
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handlePreviewTrack(track)}
                                    className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleAddToPlaylist(track.id)}
                                    className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                            <div className="p-4 bg-gray-50 dark:bg-gray-700 flex justify-center">
                              <button 
                                onClick={clearSearch}
                                className="text-sm text-primary hover:text-primary-dark"
                              >
                                Back to Recommendations
                              </button>
                            </div>
                          </div>
                        ) : recommendations.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {recommendations.map((track) => (
                              <div 
                                key={track.id}
                                className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <ImageWithFallback
                                  src={track.imageUrl || '/images/placeholder/default.svg'}
                                  alt={track.album || 'Album Cover'}
                                  width={48}
                                  height={48}
                                  className="object-cover rounded mr-4"
                                  fallbackSrc="/images/placeholder/album.svg"
                                />
                                <div className="flex-1 min-w-0 mr-4">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {track.title}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {track.artist} · {track.album}
                                  </p>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                                  {formatDuration(track.duration)}
                                </div>
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handlePreviewTrack(track)}
                                    className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleAddToPlaylist(track.id)}
                                    className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400">
                              No more recommendations available
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Group Preferences Tab */}
                    {activeTab === 'preferences' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                      >
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Group Audio Preferences
                          </h2>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Aggregated audio preferences from all participants in this session
                          </p>
                        </div>

                        {!aggregatedPreferences ? (
                          <div className="p-6 animate-pulse space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          </div>
                        ) : (
                          <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Audio Features Chart */}
                              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <h3 className="font-medium mb-4 flex items-center text-gray-900 dark:text-white">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  Audio Features
                                </h3>
                                
                                <div className="space-y-4">
                                  {Object.entries(aggregatedPreferences.features).map(([feature, value]) => (
                                    <div key={feature} className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300 capitalize">{feature}</span>
                                        <span className="text-gray-700 dark:text-gray-300">{(value * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                        <div 
                                          className="bg-gradient-to-r from-pink-500 to-purple-500 h-2.5 rounded-full"
                                          style={{ width: `${value * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Top Genres Chart */}
                              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <h3 className="font-medium mb-4 flex items-center text-gray-900 dark:text-white">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                  </svg>
                                  Top Genres
                                </h3>
                                
                                <div className="space-y-4">
                                  {aggregatedPreferences.genres.map((genre) => (
                                    <div key={genre.name} className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300">{genre.name}</span>
                                        <span className="text-gray-700 dark:text-gray-300">{(genre.weight * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                        <div 
                                          className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full"
                                          style={{ width: `${genre.weight * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Top Artists */}
                            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                              <h3 className="font-medium mb-4 flex items-center text-gray-900 dark:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Top Artists
                              </h3>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {aggregatedPreferences.artists.map((artist, index) => (
                                  <div 
                                    key={artist.name} 
                                    className="flex flex-col items-center text-center"
                                  >
                                    <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-gray-300 dark:bg-gray-600">
                                      <ImageWithFallback
                                        src={`https://picsum.photos/seed/artist${index + 1}/100/100`}
                                        alt={artist.name} 
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                        fallbackSrc="/images/placeholder/artist.svg"
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{artist.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{artist.count} tracks</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </ErrorBoundary>
  )
} 