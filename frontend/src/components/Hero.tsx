'use client'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { PlayIcon, SparklesIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useRef, useState } from 'react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

const AnimatedLine = ({ index, theme }: { 
  index: number; 
  theme: string;
}) => {
  const lineRef = useRef<SVGLineElement>(null)
  const startY = useRef(Math.random() * -1000)
  const speed = useRef(0.2 + Math.random() * 0.4)
  const delay = useRef(Math.random() * 2000)
  const length = useRef(50 + Math.random() * 150)
  const x = useRef(index * (window.innerWidth / 40) + Math.random() * 20)
  
  useEffect(() => {
    let start = Date.now()
    
    const animate = () => {
      const now = Date.now()
      const elapsed = now - start + delay.current
      
      if (lineRef.current) {
        // Simple vertical movement
        const y = ((elapsed * speed.current) % 2000) - 1000
        
        // Update line position
        lineRef.current.setAttribute('y1', y.toString())
        lineRef.current.setAttribute('y2', (y + length.current).toString())
        
        // Basic opacity based on position
        const opacity = Math.min(1, Math.max(0.1, 1 - Math.abs(y) / 1000))
        lineRef.current.setAttribute('opacity', opacity.toString())
      }
      
      requestAnimationFrame(animate)
    }
    
    const animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  // Get the base opacity for the theme
  const baseOpacity = theme === 'dark' ? 0.2 : 0.3
  
  // Light mode colors with better visibility
  const lightModeColors = [
    `rgba(30, 58, 138, ${baseOpacity})`, // blue-900
    `rgba(67, 56, 202, ${baseOpacity})`, // indigo-700
    `rgba(55, 48, 163, ${baseOpacity})`, // indigo-800
    `rgba(49, 46, 129, ${baseOpacity})`, // indigo-900
    `rgba(40, 53, 147, ${baseOpacity})`, // deep blue
  ]

  // Dark mode colors (unchanged)
  const darkModeColors = [
    `rgba(59, 130, 246, ${baseOpacity})`, // blue-500
    `rgba(99, 102, 241, ${baseOpacity})`, // indigo-500
    `rgba(139, 92, 246, ${baseOpacity})`, // violet-500
    `rgba(147, 51, 234, ${baseOpacity})`, // purple-600
    `rgba(168, 85, 247, ${baseOpacity})`, // purple-500
  ]

  const colors = theme === 'dark' ? darkModeColors : lightModeColors
  const strokeColor = colors[index % colors.length]

  return (
    <line
      ref={lineRef}
      x1={x.current}
      x2={x.current}
      y1={startY.current}
      y2={startY.current + length.current}
      stroke={strokeColor}
      strokeWidth={1}
    />
  )
}

const GeometricLines = ({ theme }: { theme: string }) => {
  return (
    <svg className="absolute inset-0 w-full h-full">
      <g>
        {Array.from({ length: 40 }).map((_, i) => (
          <AnimatedLine key={i} index={i} theme={theme} />
        ))}
      </g>
    </svg>
  )
}

export default function Hero() {
  const { theme } = useTheme()

  return (
    <div 
      className={`relative overflow-hidden min-h-screen flex items-center justify-center ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-background-dark via-background to-background/50'
          : 'bg-white'
      }`}
    >
      {/* Geometric Lines Background */}
      <div className="absolute inset-0 overflow-hidden">
        <GeometricLines theme={theme} />
      </div>

      <motion.div
        className="relative w-full px-[min(8vw,2rem)] py-[min(8vh,4rem)]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center max-w-[90vw] mx-auto glow-container">
          <motion.h1
            variants={itemVariants}
            className="glow-effect text-[min(8vw,4rem)] leading-[1.2] font-bold tracking-tight mb-[min(4vw,2rem)]"
          >
            <span className="animated-gradient-text relative z-10">
              Your Perfect Sound
              <br className="hidden sm:block" />
              Powered by AI
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-[min(4vw,2rem)] text-[min(3vw,1.25rem)] leading-[1.6] text-gray-600 dark:text-gray-300 max-w-[min(80vw,50rem)] mx-auto"
          >
            Discover music that matches your mood, curated by advanced AI that
            understands your unique taste. Get personalized recommendations and create
            the perfect playlist for any moment.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-[min(6vw,3rem)] flex flex-col sm:flex-row justify-center gap-[min(4vw,1rem)] px-[min(4vw,1rem)]"
          >
            <Link
              href="/discover"
              className="flex-center px-[min(4vw,1.5rem)] py-[min(2vw,0.75rem)] text-[min(2.5vw,1rem)] font-medium rounded-[30px] text-white bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-primary/20"
            >
              <ChatBubbleOvalLeftIcon className="w-[min(2.5vw,1.25rem)] h-[min(2.5vw,1.25rem)] mr-[min(2vw,0.5rem)]" />
              Chat with Echo
            </Link>
            <Link
              href="/features"
              className="flex-center px-[min(4vw,1.5rem)] py-[min(2vw,0.75rem)] text-[min(2.5vw,1rem)] font-medium rounded-[30px] text-primary bg-white/5 backdrop-blur-sm border border-primary/20 hover:bg-white/10 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-primary/10"
            >
              <SparklesIcon className="w-[min(2.5vw,1.25rem)] h-[min(2.5vw,1.25rem)] mr-[min(2vw,0.5rem)]" />
              Explore Features
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
