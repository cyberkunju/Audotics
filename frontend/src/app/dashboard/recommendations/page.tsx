'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import { useTheme } from '@/contexts/ThemeContext'
import { FiPlay, FiHeart, FiPlus, FiPause, FiInfo, FiRefreshCw } from 'react-icons/fi'
import AnimatedBackground from '@/components/AnimatedBackground'
import LoadingScreen from '@/components/LoadingScreen'
import ImageWithFallback from '@/components/ImageWithFallback'
import { useToast } from '@/components/ToastContainer'

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  preview_url: string | null
  ai_score?: number
  match_reasons?: string[]
}

const getValidImageUrl = (track: Track): string => {
  // Make sure the album exists and has images
  if (!track?.album?.images || !Array.isArray(track.album.images) || track.album.images.length === 0) {
    return '';
  }
  
  // Find the first image with a URL
  const image = track.album.images.find(img => img && typeof img.url === 'string');
  return image?.url || '';
};

export default function Recommendations() {
  const { auth } = useSpotifyAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isLoading, setIsLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<Track[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [audio] = useState(new Audio())
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const { showToast } = useToast()
  const [refreshing, setRefreshing] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [usingDefaultTracks, setUsingDefaultTracks] = useState(false)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  useEffect(() => {
    // Handle audio ended event
    const handleAudioEnded = () => {
      setCurrentlyPlaying(null)
    }
    
    audio.addEventListener('ended', handleAudioEnded)
    
    return () => {
      audio.removeEventListener('ended', handleAudioEnded)
      audio.pause()
    }
  }, [audio])

  const fetchRecommendations = async () => {
    try {
      setRefreshing(true)
      setErrorDetails(null)
      setUsingFallback(false)
      setUsingDefaultTracks(false)
      const response = await fetch('/api/spotify/recommendations')
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to fetch recommendations: ${response.status}`, errorText)
        setErrorDetails(`Status: ${response.status} - ${errorText || 'Unknown error'}`)
        throw new Error(`Failed to fetch recommendations: ${response.status}`)
      }

      const data = await response.json()
      console.log('Recommendations data:', data)
      
      // Check if using fallback methods
      if (data.usingFallback) {
        setUsingFallback(true)
      }
      
      if (data.usingDefaultTracks) {
        setUsingDefaultTracks(true)
      }
      
      // Handle both tracks directly or nested within a tracks property
      const tracks = data.tracks || data
      setRecommendations(tracks)
      
      if (tracks.length === 0) {
        showToast('No recommendations available. Try playing more songs first.', 'info')
      } else {
        showToast(`Found ${tracks.length} recommendations for you!`, 'success')
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      showToast('Error loading recommendations', 'error')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handlePlay = (track: Track) => {
    if (!track.preview_url) {
      showToast('No preview available for this track', 'warning')
      return
    }

    if (currentlyPlaying === track.id) {
      audio.pause()
      setCurrentlyPlaying(null)
    } else {
      audio.src = track.preview_url
      audio.play().catch(err => {
        console.error('Error playing audio:', err)
        showToast('Could not play preview', 'error')
      })
      setCurrentlyPlaying(track.id)
    }
  }

  const handleShowDetails = (track: Track) => {
    setSelectedTrack(selectedTrack?.id === track.id ? null : track)
  }

  // Add guard to ensure recommendations is always a valid array
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-4xl font-bold">Your Personalized Recommendations</h1>
            <button
              onClick={fetchRecommendations}
              disabled={refreshing}
              className={`p-2 rounded-full ${
                refreshing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-foreground/10'
              } transition-colors`}
              title="Refresh recommendations"
            >
              <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-muted-foreground">
            Powered by our hybrid AI system based on your music taste
          </p>
          
          {(usingFallback || usingDefaultTracks) && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-amber-600 dark:text-amber-400">⚠️ Limited Personalization:</span> 
                {usingDefaultTracks ? (
                  <> We're showing popular tracks while we learn your music preferences. Listen to more music on Spotify to get fully personalized recommendations.</>
                ) : (
                  <> We're showing genre-based recommendations while we learn your preferences. Play more songs on Spotify to get truly personalized recommendations based on your listening history.</>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: The more you use Spotify, the better we can personalize your recommendations.
              </p>
            </div>
          )}
        </motion.div>

        {safeRecommendations.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground mb-4">No recommendations available yet. Try playing more songs to improve your recommendations.</p>
            
            {errorDetails && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-left text-sm max-w-lg mx-auto">
                <p className="font-semibold mb-1">Error details:</p>
                <p className="font-mono text-xs overflow-auto">{errorDetails}</p>
              </div>
            )}
            
            <button 
              onClick={fetchRecommendations}
              disabled={refreshing}
              className={`mt-4 px-4 py-2 bg-primary text-white rounded-md transition-colors ${
                refreshing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-dark'
              }`}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeRecommendations.filter(track => track && track.id).map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`backdrop-blur-lg rounded-xl overflow-hidden ${
                  isDark
                    ? 'bg-primary/[0.07] border border-primary/[0.15]'
                    : 'bg-primary/[0.03] border border-primary/[0.1]'
                }`}
              >
                <div className="relative aspect-square">
                  <ImageWithFallback
                    src={getValidImageUrl(track)}
                    alt={track.album?.name || track.name || 'Album cover'}
                    className="w-full h-full object-cover"
                    width={300}
                    height={300}
                  />
                  {track.ai_score && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                      {Math.round(track.ai_score)}% match
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePlay(track)}
                      className={`p-3 rounded-full ${
                        track.preview_url
                          ? 'bg-primary text-white hover:bg-primary-light'
                          : 'bg-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!track.preview_url}
                    >
                      {currentlyPlaying === track.id ? 
                        <FiPause className="w-6 h-6" /> : 
                        <FiPlay className="w-6 h-6" />
                      }
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20"
                    >
                      <FiHeart className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20"
                    >
                      <FiPlus className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleShowDetails(track)}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20"
                    >
                      <FiInfo className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{track.name || 'Unknown Track'}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artists && Array.isArray(track.artists) && track.artists.length > 0
                      ? track.artists.map(artist => artist?.name || 'Unknown Artist').join(', ')
                      : 'Unknown Artist'}
                  </p>
                  
                  {/* Match reasons */}
                  {selectedTrack?.id === track.id && track.match_reasons && Array.isArray(track.match_reasons) && track.match_reasons.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 text-xs text-muted-foreground"
                    >
                      <h4 className="font-medium mb-1">Why we recommended this:</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {track.match_reasons.map((reason, i) => (
                          <li key={i}>{reason || 'Based on your music preferences'}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 