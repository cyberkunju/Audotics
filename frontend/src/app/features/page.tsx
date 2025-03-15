'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import GradientText from '@/components/GradientText'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AnimatedBackground from '@/components/AnimatedBackground'
import {
  SparklesIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  HeartIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowLeftIcon,
  BeakerIcon,
  RocketLaunchIcon,
  MusicalNoteIcon,
  SpeakerWaveIcon,
  LightBulbIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

const platformInfo = [
  {
    id: 'how-it-works',
    title: 'How It Works',
    description: 'Audotics uses advanced AI to understand your music preferences and deliver personalized recommendations.',
    content: [
      {
        icon: SparklesIcon,
        title: 'AI-Powered Analysis',
        description: 'Our AI analyzes your listening history, preferences, and behaviors to understand your unique taste profile.',
      },
      {
        icon: HeartIcon,
        title: 'Mood-Based Recommendations',
        description: 'Tell us your mood or let our AI detect it, and we\'ll create the perfect playlist for the moment.',
      },
      {
        icon: ArrowPathIcon,
        title: 'Continuous Learning',
        description: 'The more you use Audotics, the better it gets at predicting what you\'ll love next.',
      },
      {
        icon: SpeakerWaveIcon,
        title: 'Spotify Integration',
        description: 'Connect your Spotify account for a seamless experience with your existing playlists and favorites.',
      },
    ]
  },
  {
    id: 'technology',
    title: 'Our Technology',
    description: 'Built on cutting-edge technology to deliver the most personalized music experience possible.',
    content: [
      {
        icon: BoltIcon,
        title: 'Machine Learning',
        description: 'Advanced neural networks analyze audio characteristics and user behavior patterns.',
      },
      {
        icon: RocketLaunchIcon,
        title: 'Real-time Processing',
        description: 'Instant analysis and adaptation to your preferences as you listen.',
      },
      {
        icon: ShieldCheckIcon,
        title: 'Privacy-First Approach',
        description: 'All your data is processed securely, with privacy controls at your fingertips.',
      },
      {
        icon: UserGroupIcon,
        title: 'Collaborative Features',
        description: 'Our platform enables social music discovery and sharing with friends and communities.',
      },
    ]
  },
  {
    id: 'benefits',
    title: 'Key Benefits',
    description: 'Experience music in a whole new way with features designed to enhance your listening experience.',
    content: [
      {
        icon: LightBulbIcon,
        title: 'Discover New Music',
        description: 'Find artists and songs you\'ll love that you might never have discovered otherwise.',
      },
      {
        icon: HeartIcon,
        title: 'Personalized Experience',
        description: 'Every aspect of the platform adapts to your unique preferences and listening habits.',
      },
      {
        icon: UserGroupIcon,
        title: 'Social Music',
        description: 'Share your music journey with friends and discover what others are listening to.',
      },
      {
        icon: SparklesIcon,
        title: 'Smart Recommendations',
        description: 'Our AI gets smarter with every song you play, continuously improving your experience.',
      },
    ]
  }
]

const categories = [
  {
    name: 'Current Features',
    label: 'Available Now',
    features: [
      {
        name: 'AI-Powered Recommendations',
        description: 'Our advanced AI analyzes your listening habits to create perfectly tailored playlists.',
        icon: SparklesIcon,
        available: true,
      },
      {
        name: 'Spotify Integration',
        description: 'Connect your Spotify account to access your playlists and enjoy seamless music playback.',
        icon: MusicalNoteIcon,
        available: true,
      },
      {
        name: 'Personalized Profiles',
        description: 'Customized user experience that adapts to your unique preferences and habits.',
        icon: HeartIcon,
        available: true,
      },
      {
        name: 'Smart Audio Processing',
        description: 'Enhanced audio quality that adjusts to your device and environment.',
        icon: BoltIcon,
        available: true,
      },
      {
        name: 'Group Sessions',
        description: 'Create collaborative listening rooms where friends can join and influence the playlist.',
        icon: UserGroupIcon,
        available: true,
      },
      {
        name: 'Playlist Sharing',
        description: 'Share your favorite playlists with friends and on social media with a single click.',
        icon: GlobeAltIcon,
        available: true,
      },
      {
        name: 'Basic Analytics',
        description: 'Insights into your listening patterns and music preferences.',
        icon: AdjustmentsHorizontalIcon,
        available: true,
      },
      {
        name: 'Smart Categorization',
        description: 'Automatically organize your music library with intelligent tags and categories.',
        icon: ArrowPathIcon,
        available: true,
      },
    ],
  },
  {
    name: 'Future Features',
    label: 'Coming Soon',
    features: [
      {
        name: 'Advanced Mood Detection',
        description: 'Automatic playlist adjustments based on your current mood and activity.',
        icon: HeartIcon,
        available: false,
      },
      {
        name: 'Enhanced Collaborative Playlists',
        description: 'Create and manage playlists with friends, perfect for parties and events.',
        icon: UserGroupIcon,
        available: false,
      },
      {
        name: 'Global Music Community',
        description: 'Connect with music lovers worldwide and share your favorite tracks.',
        icon: GlobeAltIcon,
        available: false,
      },
      {
        name: 'Voice-Controlled Interface',
        description: 'Hands-free control of your music with natural language commands.',
        icon: MusicalNoteIcon,
        available: false,
      },
      {
        name: 'Cross-Platform Sync',
        description: 'Seamless experience across all your devices with real-time synchronization.',
        icon: DevicePhoneMobileIcon,
        available: false,
      },
      {
        name: 'Location-Based Discovery',
        description: 'Discover music trending in your area or explore global music scenes.',
        icon: MapPinIcon,
        available: false,
      },
      {
        name: 'Artist Spotlights',
        description: 'Discover emerging artists based on your taste before they hit the mainstream.',
        icon: SparklesIcon,
        available: false,
      },
      {
        name: 'Event Integration',
        description: 'Get concert and music event recommendations based on your listening history.',
        icon: ArrowDownTrayIcon,
        available: false,
      },
    ],
  },
]

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState(categories[0].name)
  const [activePlatformSection, setActivePlatformSection] = useState(platformInfo[0].id)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Position the animated background with fixed positioning */}
      <div className="fixed inset-0 z-0">
        <AnimatedBackground />
      </div>
      
      {/* Navigation stays fixed at the top with z-40 */}
      <Navigation />
      
      {/* Empty div to create space equal to navigation height */}
      <div className="h-14"></div>
      
      <div className="flex-1 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Back Button */}
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors mb-8"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animated-gradient-text glow-effect tracking-tight">
              Experience AI-Powered Music
            </h1>
            <p className={`text-lg md:text-xl max-w-3xl mx-auto ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Discover a new way to experience music with Audotics. Our intelligent platform integrates with Spotify
              to deliver personalized recommendations and collaborative features that revolutionize how you discover and share music.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary dark:text-primary-light text-sm font-medium border border-primary/30">
                AI-Powered
              </span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary dark:text-primary-light text-sm font-medium border border-primary/30">
                Spotify Integration
              </span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary dark:text-primary-light text-sm font-medium border border-primary/30">
                Collaborative Sessions
              </span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary dark:text-primary-light text-sm font-medium border border-primary/30">
                Personalized Experience
              </span>
            </div>
          </motion.div>

          {/* Platform Information */}
          <div className="mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-center mb-12"
            >
              Understanding Our Platform
            </motion.h2>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {platformInfo.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActivePlatformSection(section.id)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300
                    ${activePlatformSection === section.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'bg-white/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/60 shadow-sm backdrop-blur-sm'
                    }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
            
            <AnimatePresence mode="wait">
              {platformInfo.map((section) => (
                section.id === activePlatformSection && (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-center text-lg mb-12 max-w-3xl mx-auto">
                      {section.description}
                    </p>
                    
                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                      {section.content.map((item, index) => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`relative p-6 shadow-lg backdrop-blur-sm rounded-2xl
                            ${isDark 
                              ? 'bg-background-dark/50 border border-primary/10 hover:border-primary/20' 
                              : 'bg-white/90 border border-gray-100 hover:border-primary/20'
                            } transition-all duration-300 hover:-translate-y-1`}
                        >
                          <div className="rounded-full p-3 bg-primary/10 w-fit mb-4">
                            <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                          </div>
                          <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                          <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                            {item.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Features Tabs */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Features & Capabilities
          </motion.h2>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveTab(category.name)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300
                  ${activeTab === category.name
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-white/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/60 shadow-sm backdrop-blur-sm'
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {categories.map((category) => (
              category.name === activeTab && (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                >
                  {category.features.map((feature, index) => (
                    <motion.div
                      key={feature.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`relative p-8 shadow-xl backdrop-blur-lg rounded-2xl
                        ${isDark 
                          ? 'bg-background-dark/50 border border-primary/10 hover:border-primary/20' 
                          : 'bg-white/90 border border-gray-100 hover:border-primary/20'
                        } transition-all duration-300 hover:-translate-y-1`}
                    >
                      {!feature.available && (
                        <div className="absolute -top-3 -right-3 bg-primary px-3 py-1 rounded-full text-xs text-white font-medium">
                          Coming Soon
                        </div>
                      )}
                      <div className="rounded-xl p-3 bg-primary/10 w-fit mb-4">
                        <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{feature.name}</h3>
                      <p className={isDark ? 'text-white/70' : 'text-black/70'}>
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )
            ))}
          </AnimatePresence>
          
          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-20 p-8 rounded-2xl text-center
              ${isDark 
                ? 'bg-background-dark/70 border border-primary/10' 
                : 'bg-white/90 border border-gray-100'
              } backdrop-blur-lg shadow-xl`}
          >
            <h2 className="text-2xl font-bold mb-4 animated-gradient-text inline-block">
              Ready to Experience Audotics?
            </h2>
            <p className={`mb-8 max-w-2xl mx-auto ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              Join us today and discover a new way to experience music tailored just for you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-primary text-white rounded-full font-medium transition-all"
                >
                  Get Started Now
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
