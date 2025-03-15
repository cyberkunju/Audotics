'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDownIcon,
  SparklesIcon,
  HeartIcon,
  MapIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import GradientText from './GradientText'

interface MusicService {
  name: string;
  color: string;
  light: string;
  logo: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  services: MusicService[];
  options: string[];
}

interface CategoryCardProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
}

const categories: Category[] = [
  {
    id: 'personalized',
    title: 'Personalized Playlists',
    description: 'AI-powered music tailored to your taste',
    icon: SparklesIcon,
    services: [
      { 
        name: 'Spotify', 
        color: '#1DB954', 
        light: '#1DB95420',
        logo: '/images/music-services/spotify.svg'
      },
      { 
        name: 'Apple Music', 
        color: '#FC3C44', 
        light: '#FC3C4420',
        logo: '/images/music-services/apple-music.svg'
      },
      { 
        name: 'Amazon Music', 
        color: '#00A8E1', 
        light: '#00A8E120',
        logo: '/images/music-services/amazon-music.svg'
      },
      { 
        name: 'YouTube Music', 
        color: '#FF0000', 
        light: '#FF000020',
        logo: '/images/music-services/youtube-music.svg'
      },
      { 
        name: 'Deezer', 
        color: '#00C7F2', 
        light: '#00C7F220',
        logo: '/images/music-services/deezer.svg'
      }
    ],
    options: ['Daily Mix', 'Weekly Discoveries', 'For You', 'Based on History']
  },
  {
    id: 'mood',
    title: 'Mood-Based Playlists',
    description: 'Music that matches your emotions',
    icon: HeartIcon,
    services: [
      { 
        name: 'Spotify', 
        color: '#1DB954', 
        light: '#1DB95420',
        logo: '/images/music-services/spotify.svg'
      },
      { 
        name: 'Tidal', 
        color: '#000000', 
        light: '#00000020',
        logo: '/images/music-services/tidal.svg'
      },
      { 
        name: 'Pandora', 
        color: '#00A0EE', 
        light: '#00A0EE20',
        logo: '/images/music-services/pandora.svg'
      },
      { 
        name: 'SoundCloud', 
        color: '#FF5500', 
        light: '#FF550020',
        logo: '/images/music-services/soundcloud.svg'
      },
      { 
        name: 'Qobuz', 
        color: '#2AB669', 
        light: '#2AB66920',
        logo: '/images/music-services/qobuz.svg'
      }
    ],
    options: ['Energetic', 'Relaxed', 'Focus Mode', 'Party Vibes', 'Chill']
  },
  {
    id: 'trip',
    title: 'Trip-Specific Playlists',
    description: 'Perfect soundtracks for your journey',
    icon: MapIcon,
    services: [
      { 
        name: 'Spotify', 
        color: '#1DB954', 
        light: '#1DB95420',
        logo: '/images/music-services/spotify.svg'
      },
      { 
        name: 'Apple Music', 
        color: '#FC3C44', 
        light: '#FC3C4420',
        logo: '/images/music-services/apple-music.svg'
      },
      { 
        name: 'YouTube Music', 
        color: '#FF0000', 
        light: '#FF000020',
        logo: '/images/music-services/youtube-music.svg'
      },
      { 
        name: 'Amazon Music', 
        color: '#00A8E1', 
        light: '#00A8E120',
        logo: '/images/music-services/amazon-music.svg'
      },
      { 
        name: 'Deezer', 
        color: '#00C7F2', 
        light: '#00C7F220',
        logo: '/images/music-services/deezer.svg'
      }
    ],
    options: ['Road Trip', 'Workout', 'Travel', 'Adventure', 'Commute']
  },
  {
    id: 'geo',
    title: 'Geolocation Playlists',
    description: 'Discover local and global music trends',
    icon: GlobeAltIcon,
    services: [
      { 
        name: 'Spotify', 
        color: '#1DB954', 
        light: '#1DB95420',
        logo: '/images/music-services/spotify.svg'
      },
      { 
        name: 'SoundCloud', 
        color: '#FF5500', 
        light: '#FF550020',
        logo: '/images/music-services/soundcloud.svg'
      },
      { 
        name: 'Deezer', 
        color: '#00C7F2', 
        light: '#00C7F220',
        logo: '/images/music-services/deezer.svg'
      },
      { 
        name: 'Tidal', 
        color: '#000000', 
        light: '#00000020',
        logo: '/images/music-services/tidal.svg'
      },
      { 
        name: 'Pandora', 
        color: '#00A0EE', 
        light: '#00A0EE20',
        logo: '/images/music-services/pandora.svg'
      }
    ],
    options: ['Local Hits', 'Global Trends', 'City Vibes', 'Regional Favorites']
  }
]

const CategoryCard = ({ category, isExpanded, onToggle }: CategoryCardProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const Icon = category.icon;

  // Variants for the main card
  const cardVariants = {
    expanded: {
      height: "auto",
      transition: {
        height: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }
      }
    },
    collapsed: {
      height: "auto",
      transition: {
        height: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }
      }
    }
  };

  // Variants for the expanded content
  const contentVariants = {
    expanded: {
      height: "auto",
      opacity: 1,
      transition: {
        height: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        },
        opacity: {
          duration: 0.25,
          ease: "easeInOut"
        }
      }
    },
    collapsed: {
      height: 0,
      opacity: 0,
      transition: {
        height: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        },
        opacity: {
          duration: 0.2,
          ease: "easeInOut"
        }
      }
    }
  };

  // Variants for options with stagger and fade
  const optionsContainerVariants = {
    hidden: { 
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren"
      }
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const optionItemVariants = {
    hidden: { 
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Variants for service items with stagger effect
  const servicesContainerVariants = {
    hidden: { 
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1,
        when: "afterChildren"
      }
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
        when: "beforeChildren"
      }
    }
  };

  const serviceItemVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="collapsed"
      animate={isExpanded ? "expanded" : "collapsed"}
      className="quick-access-card overflow-hidden backdrop-blur-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]"
    >
      <div 
        className="p-6 cursor-pointer flex items-center justify-between hover:bg-[var(--bg-hover)]"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
            <Icon className="w-6 h-6 text-[var(--text-primary)]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              {category.title}
            </h3>
            <p className="text-sm mt-1 text-[var(--text-secondary)]">
              {category.description}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
        >
          <ChevronDownIcon className="w-6 h-6 text-[var(--text-primary)]" />
        </motion.div>
      </div>

      <motion.div
        variants={contentVariants}
        initial="collapsed"
        animate={isExpanded ? "expanded" : "collapsed"}
        className="border-t border-[var(--border-color)]"
      >
        <div className="p-6 space-y-6">
          <motion.div 
            variants={optionsContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3"
          >
            {category.options.map((option) => (
              <motion.button
                key={option}
                variants={optionItemVariants}
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: "var(--bg-hover)"
                }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-xl bg-[var(--bg-hover)] text-left group"
              >
                <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-primary">
                  {option}
                </span>
              </motion.button>
            ))}
          </motion.div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-[var(--text-secondary)]">
              Connect with your favorite services:
            </h4>
            <motion.div
              variants={servicesContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-5 gap-3"
            >
              {category.services.map((service) => (
                <motion.button
                  key={service.name}
                  variants={serviceItemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 400 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 flex flex-col items-center justify-center rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-secondary)]"
                >
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center" 
                      style={{ backgroundColor: service.light }}
                    >
                      <img 
                        src={service.logo} 
                        alt={service.name} 
                        className="w-6 h-6 object-contain" 
                      />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {service.name}
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function QuickAccess() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <GradientText size="xl" className="mb-4">
            Quick Access Hub
          </GradientText>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Discover and create the perfect playlist for any moment. Connect with your favorite music services and let AI enhance your listening experience.
          </p>
        </div>

        <div className="grid gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedId === category.id}
              onToggle={() => setExpandedId(expandedId === category.id ? null : category.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
