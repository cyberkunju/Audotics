'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const steps = [
  {
    title: "Meet Echo",
    description: "Your AI music companion who understands your unique taste and helps you discover new music.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )
  },
  {
    title: "Smart Recommendations",
    description: "Get personalized music suggestions based on your mood, activities, and listening history.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    title: "Create Perfect Playlists",
    description: "Let Echo help you curate the perfect playlist for any occasion or mood.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    )
  },
  {
    title: "Learn Your Taste",
    description: "The more you interact, the better Echo understands your music preferences.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  }
]

interface OnboardingGuideProps {
  onComplete: () => void
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [open, setOpen] = useState(true)

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleComplete = () => {
    setOpen(false)
    onComplete()
  }

  const handleSkip = () => {
    handleComplete()
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-all duration-300" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md h-[400px] bg-background/80 backdrop-blur-md p-8 rounded-2xl shadow-lg z-[101] border border-white/10">
          <Dialog.Title className="sr-only">
            Onboarding Guide - {steps[currentStep].title}
          </Dialog.Title>
          <div className="h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <motion.div
                  className="text-pink-500 mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  {steps[currentStep].icon}
                </motion.div>

                <motion.h2
                  className="text-3xl font-bold text-center mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {steps[currentStep].title}
                </motion.h2>
                
                <motion.div
                  className="text-center text-gray-300 max-w-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {steps[currentStep].description}
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center mt-8">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentStep ? 'w-8 bg-pink-500' : 'w-4 bg-gray-600'
                    }`}
                    initial={false}
                    animate={{
                      width: index === currentStep ? 32 : 16,
                      backgroundColor: index === currentStep ? '#ec4899' : '#4b5563'
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-4 items-center">
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white transition-colors outline-none focus:outline-none"
                >
                  Skip
                </button>
                <motion.button
                  onClick={handleNext}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <motion.svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </motion.svg>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default OnboardingGuide
