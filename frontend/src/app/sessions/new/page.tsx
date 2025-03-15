'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import GradientText from '@/components/GradientText'
import { useToast } from '@/components/ToastContainer'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'

export default function NewSessionPage() {
  const { auth } = useSpotifyAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [sessionName, setSessionName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [maxParticipants, setMaxParticipants] = useState<number>(5)

  const genres = [
    'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 
    'Jazz', 'Classical', 'Country', 'Folk', 'Metal',
    'Indie', 'Reggae', 'Blues', 'Soul', 'Funk'
  ]

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre))
    } else {
      setSelectedGenres([...selectedGenres, genre])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!auth.user) return

    const formData = new FormData(e.currentTarget)
    const sessionName = formData.get('name')?.toString()

    if (!sessionName) {
      showToast('Please enter a session name', 'error')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sessionName,
          userId: auth.user.id,
          username: auth.user.display_name
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      router.push(`/sessions/${data.id}`)
      showToast('Session created successfully', 'success')
    } catch (error) {
      console.error('Error creating session:', error)
      showToast('Failed to create session', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <GradientText size="lg" className="mb-2">
              Create a New Session
            </GradientText>
            <p className="text-gray-600 dark:text-gray-300">
              Start a collaborative music session with friends
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8"
          >
            {error && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Name
                </label>
                <input
                  id="sessionName"
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 focus:border-primary dark:focus:border-primary-light outline-none transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Weekend Party Mix"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Session Visibility
                </span>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Public</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Private</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Participants
                </label>
                <select
                  id="maxParticipants"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 focus:border-primary dark:focus:border-primary-light outline-none transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  {[2, 3, 5, 10, 15, 20].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Preferred Genres (Optional)
                </span>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        selectedGenres.includes(genre)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 relative overflow-hidden group ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span className="relative z-10">
                  {isLoading ? 'Creating Session...' : 'Create Session'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:400%_100%] animate-gradient-x"></div>
              </motion.button>
            </form>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 