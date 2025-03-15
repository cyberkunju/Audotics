'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete?: () => void
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete = () => {} 
}) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => {
            if (typeof onComplete === 'function') {
              onComplete()
            }
          }, 500) // Wait for fade out animation
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Audotics
      </motion.h1>
      <div className="w-48 h-1 bg-gray-200 rounded-full mt-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  )
}

export default SplashScreen
