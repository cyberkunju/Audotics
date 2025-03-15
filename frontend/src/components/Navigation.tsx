'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import ConnectionStatus from '@/components/ConnectionStatus'

export default function Navigation() {
  const { theme, toggleTheme } = useTheme()
  const { auth: { user, isLoading }, logout } = useSpotifyAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const isAuthenticated = !!user

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
  }

  // Define navigation links based on authentication state
  const navLinks = isAuthenticated
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/dashboard/recommendations', label: 'For You' },
        { href: '/sessions/new', label: 'New Session' },
      ]
    : [
        { href: '/features', label: 'Features' },
        { href: '/auth/login', label: 'Sign In' },
      ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-background/80 dark:bg-background-dark/80 border-b border-foreground/10 safe-top">
      <div className="w-full px-4 h-14 flex items-center justify-between">
        <div className="flex items-center h-full">
          <Link 
            href="/" 
            className="nav-logo flex items-center gap-2 relative group"
          >
            <div className="w-8 h-8 relative overflow-hidden">
              <div 
                className="w-full h-full absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x"
                style={{
                  WebkitMaskImage: `url('/Audotics_Logo.svg')`,
                  maskImage: `url('/Audotics_Logo.svg')`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  backgroundSize: '200% 100%',
                }}
              />
            </div>
            <span 
              className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x"
              style={{
                backgroundSize: '200% 100%',
              }}
            >
              Audotics
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link relative text-sm text-foreground/80 hover:text-primary dark:hover:text-primary-light transition-all duration-200 hover:scale-105 px-2 py-1"
              onMouseEnter={() => setHoveredLink(link.href)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {hoveredLink === link.href && (
                <motion.div
                  layoutId="navHover"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary-light/10 rounded-md -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              {link.label}
            </Link>
          ))}

          {/* Connection Status */}
          <ConnectionStatus />

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="theme-toggle p-2 rounded-full text-foreground/80 hover:text-primary dark:hover:text-primary-light transition-all duration-200"
            aria-label="Toggle theme"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </motion.div>
          </motion.button>

          {/* User Profile (when authenticated) */}
          {isAuthenticated && user && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 text-sm text-foreground/80 hover:text-primary dark:hover:text-primary-light transition-all duration-200 px-2 py-1"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
                  {user.display_name?.charAt(0) || 'U'}
                </div>
                <span className="hidden lg:inline">{user.display_name || 'User'}</span>
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile Navigation Button */}
        <div className="flex items-center gap-2 md:hidden">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="theme-toggle w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] flex items-center justify-center rounded-full text-foreground/80 hover:text-primary dark:hover:text-primary-light transition-all duration-200"
            aria-label="Toggle theme"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px]" />
              ) : (
                <MoonIcon className="w-5 h-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px]" />
              )}
            </motion.div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMenu}
            className="menu-button w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] flex items-center justify-center rounded-full text-foreground/80 hover:text-primary dark:hover:text-primary-light transition-all duration-200"
            aria-label="Toggle menu"
          >
            <motion.div
              initial={false}
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-5 h-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px]" />
              ) : (
                <Bars3Icon className="w-5 h-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px]" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mobile-menu md:hidden bg-background/95 dark:bg-background-dark/95 backdrop-blur-md"
          >
            <motion.div 
              className="px-4 py-2 space-y-2"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="visible"
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <Link 
                    href={link.href} 
                    className="nav-link block py-2 text-sm text-foreground/80 hover:text-primary dark:hover:text-primary-light transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Connection Status in Mobile Menu */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                className="py-2"
              >
                <div className="flex items-center">
                  <ConnectionStatus className="mr-2" />
                  <span className="text-sm text-foreground/80">
                    {isAuthenticated ? 'Spotify Connected' : 'Spotify Not Connected'}
                  </span>
                </div>
              </motion.div>

              {/* Mobile User Profile Options */}
              {isAuthenticated && user && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2"></div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                  >
                    <div className="flex items-center py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white mr-3">
                        {user.display_name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm text-foreground/80">{user.display_name || 'User'}</span>
                    </div>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                  >
                    <Link 
                      href="/profile" 
                      className="nav-link block py-2 text-sm text-foreground/80 hover:text-primary dark:hover:text-primary-light transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                  >
                    <Link 
                      href="/settings" 
                      className="nav-link block py-2 text-sm text-foreground/80 hover:text-primary dark:hover:text-primary-light transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                  >
                    <button 
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="nav-link block w-full text-left py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
