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
  ArrowRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'

// Define Session interface
interface Session {
  id: string
  name: string
  createdAt: string
  participants: { id: string, name: string }[]
  tracks: number
  isActive: boolean
}

export default function MySessionsPage() {
  const { auth } = useSpotifyAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    if (!auth.user) return
    
    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/sessions/my')
        
        if (!response.ok) {
          throw new Error('Failed to fetch sessions')
        }
        
        const data = await response.json()
        setSessions(data)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        showToast('Failed to load your sessions', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSessions()
  }, [auth.user, showToast])
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
  
  // Join a session
  const handleJoinSession = async (sessionId: string) => {
    try {
      // Join session API call
      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          sessionId,
          userId: auth.user?.id,
          username: auth.user?.display_name
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
    }
  }
  
  // Delete a session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      setDeleteSessionId(sessionId)
      setIsDeleting(true)
      
      // Delete session API call
      const response = await fetch(`/api/sessions?id=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete session')
      }
      
      // Remove session from state
      setSessions(sessions.filter(session => session.id !== sessionId))
      
      // Show success message
      showToast('Session deleted successfully', 'success')
    } catch (err: any) {
      showToast(err.message || 'Error deleting session', 'error')
    } finally {
      setDeleteSessionId(null)
      setIsDeleting(false)
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
              My Sessions
            </GradientText>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your collaborative music sessions
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
                Your Sessions
              </h2>
              <button 
                onClick={() => router.push('/sessions/new')}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Create New
              </button>
            </div>
            
            {isLoading ? (
              <div className="p-6 animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((session) => (
                  <div 
                    key={session.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                          {session.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created on {formatDate(session.createdAt)}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center">
                        {session.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mr-2">
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
                      
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        {session.tracks} track{session.tracks !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                      >
                        {session.isActive ? 'Join Now' : 'View'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deleteSessionId === session.id}
                        className={`px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                          deleteSessionId === session.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {deleteSessionId === session.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sessions yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  You haven't created or joined any sessions yet
                </p>
                <button
                  onClick={() => router.push('/sessions/new')}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Create Your First Session
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