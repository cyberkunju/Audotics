'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { FiMusic } from 'react-icons/fi'
import { useTheme } from '@/contexts/ThemeContext'

interface NoPlatformScreenProps {
  onConnect: () => void
}

export default function NoPlatformScreen({ onConnect }: NoPlatformScreenProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center ${
        isDark ? 'bg-gray-900/95' : 'bg-white/95'
      } backdrop-blur-md p-4`}
    >
      <div className="max-w-md w-full text-center space-y-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative w-24 h-24 mx-auto"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <FiMusic className={`w-16 h-16 ${isDark ? 'text-indigo-400' : 'text-indigo-600'} animated-gradient-text`} />
          </div>
          <div className="absolute inset-0">
            <div className="w-full h-full rounded-full border-2 border-indigo-500/30 animate-pulse" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Connect Your Music Platform
          </h2>
          <p className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            To get started, connect your favorite music streaming platform and unlock a world of personalized music experiences.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          onClick={onConnect}
          className={`
            inline-flex items-center px-6 py-3 rounded-xl text-white font-semibold
            bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
            transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl
          `}
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          Connect Now
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        >
          Your music, your way. Safe and secure.
        </motion.div>
      </div>
    </motion.div>
  )
} 