'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import { useTheme } from '@/contexts/ThemeContext'
import { FiUser, FiMoon, FiSun, FiGlobe, FiVolume2, FiShield, FiLogOut } from 'react-icons/fi'
import AnimatedBackground from '@/components/AnimatedBackground'

interface SettingItem {
  label: string
  description: string
  value?: string
  href?: string
  action?: () => void
}

interface SettingSection {
  title: string
  icon: React.ElementType
  items: SettingItem[]
}

export default function Settings() {
  const { auth, logout } = useSpotifyAuth()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const sections: SettingSection[] = [
    {
      title: 'Account',
      icon: FiUser,
      items: [
        {
          label: 'Profile',
          description: 'View and edit your profile information',
          value: auth.user?.display_name || 'Not set',
          href: '/dashboard/settings/profile'
        },
        {
          label: 'Email',
          description: 'Your registered email address',
          value: auth.user?.email || 'Not set',
          href: '/dashboard/settings/email'
        }
      ]
    },
    {
      title: 'Appearance',
      icon: isDark ? FiMoon : FiSun,
      items: [
        {
          label: 'Theme',
          description: 'Choose your preferred theme',
          value: theme === 'dark' ? 'Dark' : 'Light',
          action: toggleTheme
        }
      ]
    },
    {
      title: 'Preferences',
      icon: FiGlobe,
      items: [
        {
          label: 'Language',
          description: 'Select your preferred language',
          value: 'English',
          href: '/dashboard/settings/language'
        },
        {
          label: 'Audio Quality',
          description: 'Set your preferred audio quality',
          value: 'High',
          href: '/dashboard/settings/audio'
        }
      ]
    },
    {
      title: 'Privacy',
      icon: FiShield,
      items: [
        {
          label: 'Privacy Settings',
          description: 'Manage your privacy preferences',
          href: '/dashboard/settings/privacy'
        }
      ]
    }
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize your experience and manage your account
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`backdrop-blur-lg rounded-xl p-6 ${
                  isDark
                    ? 'bg-primary/[0.07] border border-primary/[0.15]'
                    : 'bg-primary/[0.03] border border-primary/[0.1]'
                }`}
              >
                <div className="flex items-center mb-4">
                  <Icon className="w-5 h-5 mr-2" />
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <motion.div
                      key={item.label}
                      className={`p-4 rounded-lg transition-all ${
                        isDark
                          ? 'hover:bg-primary/[0.15]'
                          : 'hover:bg-primary/[0.1]'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.action}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{item.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        {item.value && (
                          <span className="text-sm text-muted-foreground">
                            {item.value}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          })}

          {/* Logout Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections.length * 0.1 }}
            className={`backdrop-blur-lg rounded-xl p-6 ${
              isDark
                ? 'bg-destructive/10 border border-destructive/20'
                : 'bg-destructive/5 border border-destructive/10'
            }`}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 p-4 rounded-lg text-destructive transition-all hover:bg-destructive/10"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 