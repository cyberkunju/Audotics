'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import GradientText from '@/components/GradientText'
import { useToast } from '@/components/ToastContainer'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'

// Define Session type
interface Session {
  id: string
  name: string
  createdAt: string
  createdBy: string
  participants: { id: string, name: string }[]
  isPublic: boolean
  isActive?: boolean
}

export default function JoinSessionPage() {
  const { auth } = useSpotifyAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [sessionId, setSessionId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [activeSessions, setActiveSessions] = useState<Session[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Load active sessions
  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        setIsLoadingSessions(true)
        
        // Fetch active sessions from API
        const response = await fetch('/api/sessions?isPublic=true&type=recent', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch active sessions')
        }
        
        const data = await response.json()
        setActiveSessions(data.sessions || [])
      } catch (error) {
        console.error('Error fetching sessions:', error)
        // Display placeholder sessions for development
        setActiveSessions([
          {
            id: 'session-1',
            name: 'Friday Night Mix',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            createdBy: 'user1',
            participants: [
              { id: 'user1', name: 'Alex' },
              { id: 'user2', name: 'Taylor' },
              { id: 'user3', name: 'Jordan' }
            ],
            isPublic: true,
            isActive: true
          },
          {
            id: 'session-2',
            name: 'Chill Vibes Only',
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
            createdBy: 'user4',
            participants: [
              { id: 'user4', name: 'Morgan' },
              { id: 'user5', name: 'Casey' }
            ],
            isPublic: true,
            isActive: true
          },
          {
            id: 'session-3',
            name: 'Dance Party 2025',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            createdBy: 'user6',
            participants: [
              { id: 'user6', name: 'Riley' },
              { id: 'user7', name: 'Jamie' },
              { id: 'user8', name: 'Dakota' },
              { id: 'user9', name: 'Avery' }
            ],
            isPublic: true,
            isActive: true
          }
        ])
      } finally {
        setIsLoadingSessions(false)
      }
    }
    
    fetchActiveSessions()
  }, [])

  useEffect(() => {
    if (!auth.user) return
    
    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/sessions/available')
        
        if (!response.ok) {
          throw new Error('Failed to fetch sessions')
        }
        
        const data = await response.json()
        setSessions(data)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        showToast('Failed to load available sessions', 'error')
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!sessionId.trim()) {
      setError('Session ID or invite code is required')
      return
    }
    
    setIsLoading(true)
    
    try {
      await joinSession(sessionId)
    } catch (err: any) {
      setError(err.message || 'Failed to join session')
      setIsLoading(false)
    }
  }

  // Join a session
  const joinSession = async (id: string) => {
    if (!auth.user) {
      showToast('You must be logged in to join a session', 'error')
      return
    }
    
    try {
      setJoinLoading(id)
      
      // Join session API call
      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          sessionId: id,
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
      router.push(`/sessions/${id}`)
    } catch (err: any) {
      showToast(err.message || 'Error joining session', 'error')
      setError(err.message || 'Failed to join session')
      setJoinLoading(null)
      setIsLoading(false)
    }
  }

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
              Join a Session
            </GradientText>
            <p className="text-gray-600 dark:text-gray-300">
              Enter a session ID or browse active sessions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Join by ID Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                Enter Session Code
              </h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Session ID or Invite Code
                  </label>
                  <input
                    id="sessionId"
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 focus:border-primary dark:focus:border-primary-light outline-none transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Enter session code"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 relative overflow-hidden group ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <span className="relative z-10">
                    {isLoading ? 'Joining Session...' : 'Join Session'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:400%_100%] animate-gradient-x"></div>
                </motion.button>
              </form>
            </motion.div>

            {/* Active Sessions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                Active Sessions
              </h2>
              
              {isLoadingSessions ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  ))}
                </div>
              ) : activeSessions.length > 0 ? (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div 
                      key={session.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {session.name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {session.participants.length} participant{session.participants.length !== 1 ? 's' : ''}
                          </span>
                          
                          <div className="flex -space-x-2 mt-1">
                            {session.participants.slice(0, 4).map((participant, index) => (
                              <div 
                                key={participant.id}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white bg-gradient-to-br from-purple-500 to-indigo-500 ring-2 ring-white dark:ring-gray-800"
                                title={participant.name}
                              >
                                {participant.name.charAt(0)}
                              </div>
                            ))}
                            
                            {session.participants.length > 4 && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white bg-gray-500 ring-2 ring-white dark:ring-gray-800">
                                +{session.participants.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => joinSession(session.id)}
                          disabled={joinLoading === session.id}
                          className={`px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors ${joinLoading === session.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {joinLoading === session.id ? 'Joining...' : 'Join'}
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">No active sessions found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try creating a new session instead</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 