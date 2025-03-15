'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import GradientText from '@/components/GradientText'
import { useToast } from '@/components/ToastContainer'
import { 
  ClockIcon, 
  UserIcon, 
  MusicalNoteIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'

// Define Session interface
interface Session {
  id: string
  name: string
  createdAt: string
  creator: { id: string, name: string }
  participants: { id: string, name: string }[]
  genre?: string
  isActive: boolean
}

export default function RecentSessionsPage() {
  const { auth } = useSpotifyAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'active'>('all')
  const [joinLoading, setJoinLoading] = useState<string | null>(null)
  
  // Load recent sessions
  useEffect(() => {
    if (!auth.user) return
    
    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/sessions/recent')
        
        if (!response.ok) {
          throw new Error('Failed to fetch sessions')
        }
        
        const data = await response.json()
        setSessions(data)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        showToast('Failed to load recent sessions', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSessions()
  }, [auth.user, showToast])
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    }
  }
  
  // Join a session
  const handleJoinSession = async (sessionId: string) => {
    if (!auth.user) {
      showToast('You must be logged in to join a session', 'error')
      return
    }
    
    try {
      setJoinLoading(sessionId)
      
      // Join session API call
      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          sessionId,
          userId: auth.user.id,
          username: auth.user.display_name
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to join session')
      }
      
      // Show success message
      showToast('Joined session successfully!', 'success')
      
      // Redirect to the session
      router.push(`/sessions/${sessionId}`)
    } catch (err: any) {
      showToast(err.message || 'Error joining session', 'error')
    } finally {
      setJoinLoading(null)
    }
  }
  
  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (filter === 'active') {
      return session.isActive
    }
    return true
  })
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <GradientText size="lg" className="mb-2">
              Recent Sessions
            </GradientText>
            <p className="text-gray-600 dark:text-gray-300">
              Discover and join public collaborative sessions
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Public Sessions
              </h2>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'active'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Active Only
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-6 animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredSessions.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                          {session.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>Created by {session.creator.name}</span>
                          <span>•</span>
                          <span>{formatDate(session.createdAt)}</span>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center">
                        {session.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {session.participants.length} participant{session.participants.length !== 1 ? 's' : ''}
                      </div>
                      
                      {session.genre && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          {session.genre}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {session.participants.slice(0, 4).map((participant) => (
                          <div 
                            key={participant.id}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white bg-gradient-to-br from-purple-500 to-indigo-500 ring-2 ring-white dark:ring-gray-800"
                            title={participant.name}
                          >
                            {participant.name.charAt(0)}
                          </div>
                        ))}
                        
                        {session.participants.length > 4 && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white bg-gray-500 ring-2 ring-white dark:ring-gray-800">
                            +{session.participants.length - 4}
                          </div>
                        )}
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleJoinSession(session.id)}
                        disabled={joinLoading === session.id}
                        className={`px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors ${joinLoading === session.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {joinLoading === session.id ? 'Joining...' : 'Join Session'}
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sessions found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {filter === 'active' 
                    ? 'There are no active public sessions at the moment' 
                    : 'No public sessions have been created recently'}
                </p>
                <button
                  onClick={() => router.push('/sessions/new')}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Create a Session
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 