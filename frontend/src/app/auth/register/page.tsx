'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import GradientText from '@/components/GradientText'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import { useToast } from '@/components/ToastContainer'

export default function RegisterPage() {
  const { auth, login } = useSpotifyAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await login()
      showToast('Registration successful', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      showToast('Registration failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-background py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-12 h-12 mx-auto relative overflow-hidden mb-4">
              <div 
                className="w-full h-full absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x"
                style={{
                  WebkitMaskImage: `url('/Audotics_Logo.svg')`,
                  maskImage: `url('/Audotics_Logo.svg')`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  backgroundSize: '200% 100%',
                }}
              />
            </div>
          </Link>
          <GradientText size="lg" className="mb-2">Create Account</GradientText>
          <p className="text-gray-600 dark:text-gray-300">Join Audotics for personalized music recommendations</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 focus:border-primary dark:focus:border-primary-light outline-none transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 focus:border-primary dark:focus:border-primary-light outline-none transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 focus:border-primary dark:focus:border-primary-light outline-none transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 focus:border-primary dark:focus:border-primary-light outline-none transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 relative overflow-hidden group ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span className="relative z-10">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:400%_100%] animate-gradient-x"></div>
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="text-primary dark:text-primary-light font-medium hover:underline transition-all duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 