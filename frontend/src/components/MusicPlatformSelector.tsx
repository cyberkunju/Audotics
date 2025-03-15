'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { useSpotifyAuth } from '@/lib/spotify-auth/context';
import { useRouter } from 'next/navigation';

// Music platform data
const musicPlatforms = [
  { 
    id: 'spotify', 
    name: 'Spotify', 
    logo: '/images/platforms/spotify.svg',
    color: '#1DB954',
    available: true 
  },
  { 
    id: 'apple', 
    name: 'Apple Music', 
    logo: '/images/platforms/apple-music.svg',
    color: '#FA2C56',
    available: false 
  },
  { 
    id: 'youtube', 
    name: 'YouTube Music', 
    logo: '/images/platforms/youtube-music.svg',
    color: '#FF0000',
    available: false 
  },
  { 
    id: 'amazon', 
    name: 'Amazon Music', 
    logo: '/images/platforms/amazon-music.svg',
    color: '#00A8E1',
    available: false 
  },
  { 
    id: 'deezer', 
    name: 'Deezer', 
    logo: '/images/platforms/deezer.svg',
    color: '#00C7F2',
    available: false 
  },
  { 
    id: 'tidal', 
    name: 'Tidal', 
    logo: '/images/platforms/tidal.svg',
    color: '#000000',
    available: false 
  },
  { 
    id: 'pandora', 
    name: 'Pandora', 
    logo: '/images/platforms/pandora.svg',
    color: '#00A0EE',
    available: false 
  },
  { 
    id: 'soundcloud', 
    name: 'SoundCloud', 
    logo: '/images/platforms/soundcloud.svg',
    color: '#FF5500',
    available: false 
  },
  { 
    id: 'qobuz', 
    name: 'Qobuz', 
    logo: '/images/platforms/qobuz.svg',
    color: '#2C8FFF',
    available: false 
  }
];

// SVG placeholder for platforms without images
const PlaceholderLogo = ({ color }: { color: string }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none" />
    <path
      d="M20 10V20L28 24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Define component props
interface PlatformSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const MusicPlatformSelector: React.FC<PlatformSelectorProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const { login } = useSpotifyAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle selection of a platform
  const handlePlatformSelect = (platformId: string) => {
    try {
      const platform = musicPlatforms.find(p => p.id === platformId);
      
      if (!platform?.available) return;
      
      setSelectedPlatform(platformId);
      
      if (platformId === 'spotify') {
        setIsConnecting(true);
        // Slight delay for animation
        setTimeout(() => {
          login();
        }, 500);
      }
    } catch (error) {
      console.error('Error connecting to music platform:', error);
      onClose(); // Close the modal on error
    }
  };

  // Handle closing with ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Variants for animations
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };
  
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        duration: 0.4,
        type: "spring",
        stiffness: 100
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20, 
      transition: { duration: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay: 0.1 + i * 0.05,
        duration: 0.3
      } 
    })
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
      >
        {/* Backdrop with blur effect */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          onClick={onClose}
        />
        
        {/* Modal container */}
        <motion.div
          className={`relative z-10 w-full max-w-4xl p-6 md:p-8 rounded-2xl overflow-hidden ${
            isDark 
              ? 'bg-gray-900/80 text-white' 
              : 'bg-white/90 text-gray-900'
          } backdrop-filter backdrop-blur-xl shadow-2xl border ${
            isDark 
              ? 'border-indigo-500/20' 
              : 'border-indigo-200/50'
          }`}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className={`absolute inset-0 opacity-10 ${
                isDark ? 'opacity-20' : 'opacity-10'
              }`}
              style={{
                background: `
                  radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.4) 0%, transparent 40%),
                  radial-gradient(circle at 80% 30%, rgba(236, 72, 153, 0.4) 0%, transparent 40%),
                  radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 40%),
                  radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.4) 0%, transparent 40%)
                `,
                backgroundSize: '200% 200%',
                animation: 'gradientFlow 15s ease infinite'
              }}
            />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">
                Connect Your Music Platform
              </h2>
              <p className={`max-w-xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Choose your preferred music service to connect with Audotics. Currently, only Spotify is available.
              </p>
            </div>
            
            {/* Platforms grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {musicPlatforms.map((platform, index) => (
                <motion.div
                  key={platform.id}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: platform.available ? 1.03 : 1 }}
                  onClick={() => handlePlatformSelect(platform.id)}
                  className={`relative p-4 md:p-6 rounded-xl backdrop-blur-sm border transition-all ${
                    platform.id === selectedPlatform
                      ? `border-${platform.id === 'spotify' ? 'green' : 'blue'}-500 shadow-lg`
                      : isDark
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                  } ${platform.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                  style={{
                    background: platform.id === selectedPlatform
                      ? `linear-gradient(135deg, ${isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)'}, ${isDark ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.6)'})`
                      : isDark
                        ? 'rgba(17, 24, 39, 0.6)'
                        : 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                      {platform.logo ? (
                        <div 
                          className="w-16 h-16 relative flex items-center justify-center"
                          style={{ 
                            filter: platform.available ? 'none' : 'grayscale(100%)'
                          }}
                        >
                          <PlaceholderLogo color={platform.color} />
                        </div>
                      ) : (
                        <PlaceholderLogo color={platform.color} />
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{platform.name}</h3>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      platform.available
                        ? isDark 
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-green-100 text-green-800'
                        : isDark
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {platform.available ? 'Available' : 'Coming Soon'}
                    </span>
                  </div>
                  
                  {/* Connect animation for selected platform */}
                  {platform.id === selectedPlatform && isConnecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl backdrop-blur-sm">
                      <div className="loading-dots">
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Close button */}
            <div className="mt-8 text-center">
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded-lg transition-all ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      <style jsx>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        
        .loading-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }
        
        .loading-dot {
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        .loading-dot:nth-child(1) { animation-delay: 0s; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default MusicPlatformSelector; 