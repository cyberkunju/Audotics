'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/ThemeContext'

export default function LoadingScreen() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        isDark ? 'bg-gray-900/95' : 'bg-white/95'
      } backdrop-blur-md`}
    >
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative w-16 h-16 mx-auto"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <SparklesIcon className={`w-12 h-12 ${isDark ? 'text-indigo-400' : 'text-indigo-600'} animated-gradient-text`} />
          </div>
          <div className="absolute inset-0">
            <div className="w-full h-full rounded-full border-4 border-t-transparent border-indigo-500/30 animate-spin" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Loading your music dashboard...
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center space-x-2"
        >
          <div className="loading-bar"></div>
          <div className="loading-bar" style={{ animationDelay: '0.2s' }}></div>
          <div className="loading-bar" style={{ animationDelay: '0.4s' }}></div>
        </motion.div>
      </div>

      <style jsx>{`
        .loading-bar {
          width: 4px;
          height: 36px;
          background: linear-gradient(to bottom, #4F46E5, #7928CA);
          border-radius: 2px;
          animation: loading-wave 1.5s ease-in-out infinite;
          transform-origin: bottom;
        }
        
        @keyframes loading-wave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </motion.div>
  )
} 