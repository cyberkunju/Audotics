'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import { useTheme } from '@/contexts/ThemeContext'
import { FiMusic } from 'react-icons/fi'
import AnimatedBackground from '@/components/AnimatedBackground'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const { auth, login } = useSpotifyAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Animation variants for staggered appearance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (auth.isAuthenticated) {
      router.push('/dashboard')
    }
  }, [auth.isAuthenticated, router])

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`backdrop-blur-lg rounded-xl p-8 w-full max-w-md ${
            isDark
              ? 'bg-primary/[0.07] border border-primary/[0.15]'
              : 'bg-primary/[0.03] border border-primary/[0.1]'
          }`}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to Audotics</h1>
            <p className="text-muted-foreground">
              Connect with Spotify to access your personalized music experience
            </p>
          </div>

          <motion.button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-3 py-3 px-6 rounded-lg bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiMusic className="w-5 h-5" />
            <span>Login with Spotify</span>
          </motion.button>

          {/* Music Services Section */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mt-8 text-center"
          >
            <div className="music-services-heading">
              <span className="relative inline-block mb-3">
                Connect with your favorite music platforms
                <span className="coming-soon-badge">More Coming Soon</span>
              </span>
            </div>
            
            <div className="music-services-container">
              {/* Spotify - Active */}
              <motion.div 
                variants={itemVariants}
                className="music-service-item active"
                whileHover={{ y: -3 }}
              >
                <Image 
                  src="/images/music-services/spotify.svg" 
                  alt="Spotify" 
                  width={40} 
                  height={40} 
                  className="music-service-icon" 
                />
                <span className="music-service-name">Spotify</span>
              </motion.div>
              
              {/* Apple Music - Coming Soon */}
              <motion.div 
                variants={itemVariants}
                className="music-service-item coming-soon"
              >
                <div className="coming-soon-overlay">
                  <span>Coming Soon</span>
                </div>
                <Image 
                  src="/images/music-services/apple-music.svg" 
                  alt="Apple Music" 
                  width={40} 
                  height={40} 
                  className="music-service-icon" 
                />
                <span className="music-service-name">Apple Music</span>
              </motion.div>
              
              {/* YouTube Music - Coming Soon */}
              <motion.div 
                variants={itemVariants}
                className="music-service-item coming-soon"
              >
                <div className="coming-soon-overlay">
                  <span>Coming Soon</span>
                </div>
                <Image 
                  src="/images/music-services/youtube-music.svg" 
                  alt="YouTube Music" 
                  width={40} 
                  height={40} 
                  className="music-service-icon" 
                />
                <span className="music-service-name">YouTube Music</span>
              </motion.div>
              
              {/* Tidal - Coming Soon */}
              <motion.div 
                variants={itemVariants}
                className="music-service-item coming-soon"
              >
                <div className="coming-soon-overlay">
                  <span>Coming Soon</span>
                </div>
                <Image 
                  src="/images/music-services/tidal.svg" 
                  alt="Tidal" 
                  width={40} 
                  height={40} 
                  className="music-service-icon" 
                />
                <span className="music-service-name">Tidal</span>
              </motion.div>
              
              {/* Amazon Music - Coming Soon */}
              <motion.div 
                variants={itemVariants}
                className="music-service-item coming-soon"
              >
                <div className="coming-soon-overlay">
                  <span>Coming Soon</span>
                </div>
                <Image 
                  src="/images/music-services/amazon-music.svg" 
                  alt="Amazon Music" 
                  width={40} 
                  height={40} 
                  className="music-service-icon" 
                />
                <span className="music-service-name">Amazon</span>
              </motion.div>
            </div>
          </motion.div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>By continuing, you agree to our</p>
            <div className="flex justify-center space-x-2 mt-1">
              <a href="/terms" className="hover:text-primary">Terms of Service</a>
              <span>&bull;</span>
              <a href="/privacy" className="hover:text-primary">Privacy Policy</a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Styles for music services */}
      <style jsx global>{`
        .music-services-heading {
          margin-bottom: 16px;
          font-size: 15px;
          font-weight: 500;
          color: ${isDark ? 'rgba(209, 213, 219, 0.9)' : 'rgba(55, 65, 81, 0.9)'};
        }
        
        .coming-soon-badge {
          position: absolute;
          top: -10px;
          right: -70px;
          background: linear-gradient(to right, #ff0080, #7928ca);
          color: white;
          font-size: 9px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .music-services-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
          margin-bottom: 16px;
        }
        
        .music-service-item {
          width: 70px;
          height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 12px;
          background: ${isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)'};
          border: 1px solid ${isDark ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.4)'};
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .music-service-item.active {
          border-color: rgba(29, 185, 84, 0.7);
          box-shadow: 0 0 15px rgba(29, 185, 84, 0.2);
        }
        
        .music-service-item.coming-soon {
          opacity: 0.75;
          filter: grayscale(0.8);
        }
        
        .coming-soon-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${isDark ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .coming-soon-overlay span {
          font-size: 10px;
          font-weight: 600;
          color: ${isDark ? 'white' : '#4f46e5'};
          background: ${isDark ? 'rgba(55, 65, 81, 0.7)' : 'rgba(244, 244, 255, 0.9)'};
          padding: 4px 8px;
          border-radius: 10px;
          border: 1px solid ${isDark ? 'rgba(79, 70, 229, 0.3)' : 'rgba(79, 70, 229, 0.2)'};
        }
        
        .music-service-item.coming-soon:hover .coming-soon-overlay {
          opacity: 1;
        }
        
        .music-service-icon {
          width: 35px;
          height: 35px;
          object-fit: contain;
        }
        
        .music-service-name {
          font-size: 10px;
          font-weight: 500;
          color: ${isDark ? 'rgba(209, 213, 219, 0.8)' : 'rgba(55, 65, 81, 0.8)'};
          text-align: center;
        }
      `}</style>
    </div>
  )
} 