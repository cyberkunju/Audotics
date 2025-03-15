'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import { useTheme } from '@/contexts/ThemeContext'
import { FiPlay, FiMoreVertical } from 'react-icons/fi'
import AnimatedBackground from '@/components/AnimatedBackground'
import LoadingScreen from '@/components/LoadingScreen'
import ImageWithFallback from '@/components/ImageWithFallback'

interface Playlist {
  id: string
  name: string
  description: string | null
  images: { url: string }[]
  tracks: {
    total: number
  }
  owner: {
    display_name: string
  }
}

export default function Playlists() {
  const { auth } = useSpotifyAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isLoading, setIsLoading] = useState(true)
  const [playlists, setPlaylists] = useState<Playlist[]>([])

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/spotify/playlists', {
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists')
      }

      const data = await response.json()
      setPlaylists(data.items)
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
          <h1 className="text-4xl font-bold mb-2">Your Playlists</h1>
          <p className="text-muted-foreground">
            Browse and manage your Spotify playlists
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist, index) => (
            <motion.div
              key={playlist.id}
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
                  src={playlist.images[0]?.url}
                  alt={playlist.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                  <motion.a
                    href={`/dashboard/playlists/${playlist.id}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-full bg-primary text-white hover:bg-primary-light"
                  >
                    <FiPlay className="w-6 h-6" />
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20"
                  >
                    <FiMoreVertical className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {playlist.description || `By ${playlist.owner.display_name}`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {playlist.tracks.total} tracks
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 