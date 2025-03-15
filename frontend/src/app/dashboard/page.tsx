'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { 
  FiHeadphones, 
  FiMusic, 
  FiUser, 
  FiCalendar 
} from 'react-icons/fi'

// Stat Card Component
const StatCard = ({ 
  icon, 
  title, 
  value, 
  change, 
  description, 
  delay,
  href
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string, 
  change?: { value: string, isPositive: boolean }, 
  description: string,
  delay: number,
  href?: string
}) => {
  const WrapperComponent = href ? 
    (props: any) => <Link href={href} {...props} /> : 
    motion.div;

  return (
    <WrapperComponent
      className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 transition-all duration-300 hover:shadow-md group"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            {icon}
          </div>
          {change && (
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${change.isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {change.isPositive ? '+' : ''}{change.value}
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">{title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
        
        {href && (
          <div className="mt-4 flex justify-end">
            <span className="text-xs text-primary font-medium group-hover:underline">View details &rarr;</span>
          </div>
        )}
      </motion.div>
    </WrapperComponent>
  );
};

// Recently Played Track Component
const RecentTrack = ({ 
  image, 
  title, 
  artist, 
  album, 
  playedAt, 
  index 
}: { 
  image: string, 
  title: string, 
  artist: string, 
  album: string, 
  playedAt: string, 
  index: number 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-all group"
    >
      <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
        <Image
          src={image || '/placeholder-album.jpg'}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{artist} &middot; {album}</p>
      </div>
      <div className="text-xs text-neutral-400 flex-shrink-0 hidden md:block">{playedAt}</div>
    </motion.div>
  );
};

export default function Dashboard() {
  const { auth } = useSpotifyAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [recentTracks, setRecentTracks] = useState<any[]>([])
  
  useEffect(() => {
    const fetchRecentTracks = async () => {
      try {
        setIsLoading(true)
        // This is a mock fetch - in a real app you'd call your API
        // const response = await fetch('/api/spotify/recent-tracks')
        // const data = await response.json()
        
        // Using dummy data for demonstration
        const dummyData = Array(5).fill(null).map((_, i) => ({
          id: `track-${i}`,
          image: 'https://via.placeholder.com/60',
          title: `Track Title ${i + 1}`,
          artist: `Artist ${i + 1}`,
          album: `Album ${i + 1}`,
          playedAt: `${i + 1}h ago`
        }))
        
        setRecentTracks(dummyData)
      } catch (error) {
        console.error('Error fetching recent tracks:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRecentTracks()
  }, [])

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FiHeadphones className="w-6 h-6" />}
          title="Tracks Played"
          value="238"
          change={{ value: "12%", isPositive: true }}
          description="Total tracks played this month"
          delay={0.1}
          href="/dashboard/stats"
        />
        
        <StatCard
          icon={<FiMusic className="w-6 h-6" />}
          title="Top Genre"
          value="Indie Rock"
          description="Your most played genre this month"
          delay={0.2}
          href="/dashboard/genres"
        />
        
        <StatCard
          icon={<FiUser className="w-6 h-6" />}
          title="Top Artist"
          value="The National"
          description="Your most played artist this month"
          delay={0.3}
          href="/dashboard/artists"
        />
        
        <StatCard
          icon={<FiCalendar className="w-6 h-6" />}
          title="Active Days"
          value="21"
          change={{ value: "5%", isPositive: true }}
          description="Days you streamed music this month"
          delay={0.4}
        />
      </div>
      
      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently played section */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recently Played</h2>
            <Link href="/dashboard/history" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <div className="space-y-2">
            {isLoading ? (
              Array(5).fill(null).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-md"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              recentTracks.map((track, index) => (
                <RecentTrack
                  key={track.id}
                  image={track.image}
                  title={track.title}
                  artist={track.artist}
                  album={track.album}
                  playedAt={track.playedAt}
                  index={index}
                />
              ))
            )}
                </div>
              </div>
        
        {/* Recommendations preview */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recommendations</h2>
            <Link href="/dashboard/recommendations" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <div className="aspect-square relative overflow-hidden rounded-lg mb-4 group">
            <Image
              src="https://via.placeholder.com/500"
              alt="Recommendation playlist"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-4 text-white">
                <h3 className="text-xl font-bold">Your Daily Mix</h3>
                <p className="text-sm opacity-90">Personalized recommendations based on your taste</p>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="bg-primary text-white rounded-full p-4 shadow-lg transform transition-transform group-hover:scale-110">
                <Play className="w-6 h-6" />
              </button>
                </div>
              </div>
          
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Explore tracks tailored to your unique taste. Updated daily with fresh selections to discover.
          </p>
          
          <button className="w-full mt-4 bg-primary/10 text-primary py-2 rounded-lg font-medium text-sm hover:bg-primary/20 transition-colors">
            Refresh Recommendations
          </button>
        </div>
      </div>
    </div>
  )
} 