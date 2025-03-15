'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useAnimation, useScroll } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { FiMusic, FiHeadphones, FiZap, FiArrowRight, FiShare2, FiUsers, FiGrid, FiCalendar, FiActivity, FiStar, FiCloud, FiSettings } from 'react-icons/fi'
import { SparklesIcon } from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function LandingPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [isLoaded, setIsLoaded] = useState(false)
  const featuresScrollRef = useRef<HTMLDivElement>(null);
  const upcomingScrollRef = useRef<HTMLDivElement>(null);
  
  // Refs to measure viewport
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);

  // Control animations based on scroll position
  const featuresControls = useAnimation();
  const upcomingControls = useAnimation();

  useEffect(() => {
    // Simulate loading content
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  // Scroll-based animations
  useEffect(() => {
    // Check if sections are visible and set animation control states
    const handleScroll = () => {
      if (!featuresRef.current || !upcomingRef.current) return;
      
      const scrollY = window.scrollY;
      const featuresTop = featuresRef.current.offsetTop;
      const upcomingTop = upcomingRef.current.offsetTop;
      
      // Animate features section when scrolled into view
      if (scrollY + window.innerHeight > featuresTop) {
        featuresControls.start("visible");
      }
      
      // Animate upcoming section when scrolled into view
      if (scrollY + window.innerHeight > upcomingTop) {
        upcomingControls.start("visible");
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [featuresControls, upcomingControls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const currentFeatures = [
    {
      icon: FiMusic,
      title: "AI-Powered Discovery",
      description: "Experience personalized music recommendations based on your unique taste and preferences.",
      current: true
    },
    {
      icon: FiHeadphones,
      title: "Spotify Integration",
      description: "Connect your Spotify account to access your playlists and enjoy seamless music playback.",
      current: true
    },
    {
      icon: FiZap,
      title: "Real-time Analysis",
      description: "Get instant analysis of your music with advanced audio processing technology.",
      current: true
    },
    {
      icon: FiShare2,
      title: "Playlist Sharing",
      description: "Share your favorite playlists with friends and on social media with a single click.",
      current: true
    },
    {
      icon: FiUsers,
      title: "Group Sessions",
      description: "Create collaborative listening rooms where friends can join and influence the playlist.",
      current: true
    },
    {
      icon: FiGrid,
      title: "Smart Categorization",
      description: "Automatically organize your music library with intelligent tags and categories.",
      current: true
    },
    {
      icon: FiActivity,
      title: "Listening Insights",
      description: "Get detailed analytics about your listening habits and musical preferences.",
      current: true
    }
  ]
  
  const futureFeatures = [
    {
      icon: FiMusic,
      title: "Mood Detection",
      description: "Advanced AI that automatically detects your mood and creates playlists to match.",
      current: false
    },
    {
      icon: FiHeadphones,
      title: "Collaborative Sessions",
      description: "Create music sessions with friends in real-time, no matter where they are.",
      current: false
    },
    {
      icon: FiZap,
      title: "Voice Assistant",
      description: "Control your music with natural voice commands and conversational AI.",
      current: false
    },
    {
      icon: FiStar,
      title: "Artist Spotlights",
      description: "Discover emerging artists based on your taste before they hit the mainstream.",
      current: false
    },
    {
      icon: FiCalendar,
      title: "Event Integration",
      description: "Get concert and music event recommendations based on your listening history.",
      current: false
    },
    {
      icon: FiCloud,
      title: "Cross-platform Sync",
      description: "Seamless experience across all your devices with real-time synchronization.",
      current: false
    },
    {
      icon: FiSettings,
      title: "Advanced Customization",
      description: "Fine-tune the recommendation algorithm with detailed preference settings.",
      current: false
    }
  ]

  const FeatureCard = ({ icon: Icon, title, description, current }: { 
    icon: React.ElementType, 
    title: string, 
    description: string,
    current: boolean
  }) => (
    <div 
      className={`flex-shrink-0 w-80 backdrop-blur-lg rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
        isDark 
          ? 'bg-primary/[0.07] border border-primary/[0.15] hover:border-primary/[0.25]' 
          : 'bg-primary/[0.03] border border-primary/[0.1] hover:border-primary/[0.2]'
      } relative mt-4 mr-1`}
    >
      {!current && (
        <div className="absolute -top-3 -right-1 bg-primary px-3 py-1 rounded-full text-xs text-white font-semibold shadow-sm">
          Coming Soon
        </div>
      )}
      <div className={`mb-4 p-3 rounded-full w-fit ${
        isDark ? 'bg-primary/[0.15]' : 'bg-primary/[0.1]'
      }`}>
        <Icon className={`w-6 h-6 ${
          isDark ? 'text-primary-light' : 'text-primary'
        }`} />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className={isDark ? 'text-white/60' : 'text-black/60'}>{description}</p>
    </div>
  )

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
      
      {/* Main content with proper spacing */}
      <main className="flex-1 flex flex-col z-10 relative">
        {/* Hero Section - Only visible initially */}
        <motion.div 
          ref={heroRef}
          className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center"
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-10 md:mb-14 glow-container">
            <h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animated-gradient-text glow-effect tracking-tight"
            >
              Your Perfect Sound<br />Powered by AI
            </h1>
            <p className={`text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              Discover music that matches your mood, curated by advanced AI that understands your unique taste. Get personalized recommendations and create the perfect playlist for any moment.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/features">
              <motion.button 
                className="gradient-btn px-8 py-3 text-white rounded-full font-medium flex items-center justify-center gap-2 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SparklesIcon className="h-5 w-5" />
                <span>Explore Features</span>
                <FiArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
            <Link href="/auth/login">
              <motion.button 
                className="px-8 py-3 bg-transparent rounded-full font-medium transition-all border border-primary/30 hover:border-primary/60 text-primary dark:text-primary-light"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
            </Link>
          </motion.div>
          
          {/* Visual indicator to encourage scrolling */}
          <motion.div 
            className="absolute bottom-8 w-full flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <div className="animate-bounce flex flex-col items-center">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-primary/20 to-primary/80"></div>
              <p className="text-sm font-light mt-2 text-primary/70">Scroll to explore</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Current Features - CSS Animation Scrolling */}
        <motion.div 
          ref={featuresRef}
          className="py-16 md:py-24"
          initial="hidden"
          animate={featuresControls}
          variants={sectionVariants}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Current Features</h2>
            <p className={isDark ? 'text-white/60' : 'text-black/60'}>Experience what Audotics has to offer right now</p>
          </div>
          
          {/* CSS-based infinite scroll animation - Left to Right */}
          <div className="relative overflow-hidden mx-auto w-full">
            <div className="features-scroll-container">
              <div className="features-scroll">
                {/* First set of cards */}
                {currentFeatures.map((feature, index) => (
                  <FeatureCard 
                    key={`set1-${index}`}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    current={feature.current}
                  />
                ))}
                
                {/* Duplicated set for seamless loop */}
                {currentFeatures.map((feature, index) => (
                  <FeatureCard 
                    key={`set2-${index}`}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    current={feature.current}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Scroll indicators */}
          <div className="flex justify-center mt-6 gap-2">
            <div className="h-1 w-24 rounded-full bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10"></div>
          </div>
        </motion.div>
        
        {/* Future Features - CSS Animation Scrolling (opposite direction) */}
        <motion.div 
          ref={upcomingRef}
          className="py-16 md:py-24"
          initial="hidden"
          animate={upcomingControls}
          variants={sectionVariants}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Coming Soon</h2>
            <p className={isDark ? 'text-white/60' : 'text-black/60'}>Exciting new features in development</p>
          </div>
          
          {/* CSS-based infinite scroll animation - Right to Left */}
          <div className="relative overflow-hidden mx-auto w-full">
            <div className="upcoming-scroll-container">
              <div className="upcoming-scroll">
                {/* First set of cards */}
                {futureFeatures.map((feature, index) => (
                  <FeatureCard 
                    key={`set1-${index}`}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    current={feature.current}
                  />
                ))}
                
                {/* Duplicated set for seamless loop */}
                {futureFeatures.map((feature, index) => (
                  <FeatureCard 
                    key={`set2-${index}`}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    current={feature.current}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Scroll indicators */}
          <div className="flex justify-center mt-6 gap-2">
            <div className="h-1 w-24 rounded-full bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10"></div>
          </div>
        </motion.div>
      </main>

      {/* Footer at the bottom */}
      <Footer />
      
      {/* Add CSS for smooth scrolling animations */}
      <style jsx global>{`
        /* Container for features scrolling left to right */
        .features-scroll-container {
          width: 100%;
          overflow: hidden;
          padding: 20px 0;
        }
        
        .features-scroll {
          display: flex;
          gap: 16px;
          padding: 0 20px;
          width: fit-content;
          animation: scrollLeftToRight 60s linear infinite;
        }
        
        /* Container for upcoming scrolling right to left */
        .upcoming-scroll-container {
          width: 100%;
          overflow: hidden;
          padding: 20px 0;
        }
        
        .upcoming-scroll {
          display: flex;
          gap: 16px;
          padding: 0 20px;
          width: fit-content;
          animation: scrollRightToLeft 60s linear infinite;
        }
        
        /* Left to right animation */
        @keyframes scrollLeftToRight {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 2));
          }
        }
        
        /* Right to left animation */
        @keyframes scrollRightToLeft {
          0% {
            transform: translateX(calc(-100% / 2));
          }
          100% {
            transform: translateX(0);
          }
        }
        
        /* Music wave animation */
        .music-wave-container {
          display: flex;
          align-items: center;
          height: 100%;
          width: 100%;
          justify-content: center;
          gap: 5px;
        }
        
        .music-wave {
          background: linear-gradient(45deg, #fff, #f0f0f0);
          height: 100%;
          width: 3px;
          border-radius: 15px;
          margin: 0 1px;
          animation: wave 1.2s linear infinite;
          transform-origin: bottom;
        }
        
        .music-wave:nth-child(2) {
          animation-delay: 0.3s;
        }
        
        .music-wave:nth-child(3) {
          animation-delay: 0.6s;
        }
        
        .music-wave:nth-child(4) {
          animation-delay: 0.9s;
        }
        
        .music-wave:nth-child(5) {
          animation-delay: 0.6s;
        }
        
        @keyframes wave {
          0% {
            transform: scaleY(0.1);
          }
          50% {
            transform: scaleY(1);
          }
          100% {
            transform: scaleY(0.1);
          }
        }
        
        /* Glowing text effect */
        .glow-text {
          animation: glow 3s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
          0% {
            text-shadow: 0 0 5px rgba(255,255,255,0.5);
          }
          100% {
            text-shadow: 0 0 20px rgba(255,255,255,0.8);
          }
        }
        
        /* Sparkling animation */
        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.8);
          }
        }
        
        .animate-twinkle {
          animation: twinkle 2s infinite;
        }
        
        /* Magic button effect */
        .magic-button::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #ff00cc, #3333ff, #00ccff, #33cc33);
          z-index: -1;
          background-size: 400%;
          border-radius: 999px;
          filter: blur(10px);
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .magic-button:hover::before {
          opacity: 0.7;
          animation: magic-glow 4s linear infinite;
        }
        
        @keyframes magic-glow {
          0% {
            background-position: 0 0;
          }
          50% {
            background-position: 400% 0;
          }
          100% {
            background-position: 0 0;
          }
        }
        
        /* Sparkle icon subtle animation */
        .spark-icon {
          opacity: 0.9;
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
        }
        
        /* Simple wave animation for the button */
        .feature-btn {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .wave-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          overflow: hidden;
          opacity: 0.3;
        }
        
        .wave {
          position: absolute;
          height: 100%;
          width: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          animation: wave-animation 2s linear infinite;
          transform: translateX(-100%);
        }
        
        .delay-1 {
          animation-delay: 0.5s;
        }
        
        .delay-2 {
          animation-delay: 1s;
        }
        
        @keyframes wave-animation {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        /* Liquid wave button with transparency */
        .wave-btn-container {
          position: relative;
          display: inline-block;
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .wave-btn {
          background-color: transparent;
          position: relative;
          z-index: 1;
        }
        
        .wave-btn-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #4F46E5; /* Indigo-600, matching primary color */
          border-radius: 9999px;
        }
        
        .wave-btn-container::after {
          content: '';
          position: absolute;
          background-color: #4F46E5; /* Same color as the button */
          width: 200%;
          height: 200%;
          bottom: -150%;
          left: -50%;
          border-radius: 40%;
          animation: wave 6s infinite linear;
        }
        
        @keyframes wave {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        /* Animated gradient button */
        .gradient-btn {
          background: linear-gradient(
            to right,
            #ff0080,
            #7928ca,
            #4f46e5,
            #7928ca,
            #ff0080
          );
          background-size: 200% auto;
          animation: shine 8s linear infinite;
          transition: all 0.3s ease;
        }
        
        .gradient-btn:hover {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          animation: shine 4s linear infinite;
        }
        
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  )
}
