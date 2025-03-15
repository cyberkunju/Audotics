'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpIcon } from '@heroicons/react/24/outline'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  // Set the scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/20 flex items-center justify-center transition-all duration-200 hover:scale-105 z-30"
          aria-label="Scroll to top"
        >
          <ArrowUpIcon className="w-5 h-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px]" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
