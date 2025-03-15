'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function GradientText({ children, className, size = 'md' }: GradientTextProps) {
  const sizeClasses = {
    sm: 'text-2xl sm:text-3xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-4xl sm:text-5xl',
    xl: 'text-5xl sm:text-6xl',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative inline-block glow-container"
    >
      <span
        className={cn(
          'font-bold relative inline-block animated-gradient-text glow-effect',
          sizeClasses[size],
          className
        )}
      >
        {children}
      </span>
    </motion.div>
  )
}
