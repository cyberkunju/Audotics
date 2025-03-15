'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import LoadingScreen from '@/components/LoadingScreen'
import { useTheme } from '@/contexts/ThemeContext'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { LayoutDashboard, Music, Settings, LogOut, LineChart, Headphones } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Define the Links interface
interface Links {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Logo component for the sidebar
const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div 
        className="h-8 w-8 relative overflow-hidden"
        style={{
          WebkitMaskImage: `url('/Audotics_Logo.svg')`,
          maskImage: `url('/Audotics_Logo.svg')`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      >
        <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Audotics
      </motion.span>
    </Link>
  );
};

// LogoIcon component for collapsed sidebar
const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div 
        className="h-8 w-8 relative overflow-hidden"
        style={{
          WebkitMaskImage: `url('/Audotics_Logo.svg')`,
          maskImage: `url('/Audotics_Logo.svg')`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      >
        <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient" />
      </div>
    </Link>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const spotifyAuth = useSpotifyAuth()
  const { auth, logout } = spotifyAuth
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sidebar navigation links
  const navLinks: Links[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Library",
      href: "/dashboard/library",
      icon: <Music className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: <LineChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "For You",
      href: "/dashboard/recommendations",
      icon: <Headphones className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    }
  ]

  // Protect dashboard routes
  if (auth.isLoading) {
    return <LoadingScreen />
  }

  if (!auth.isAuthenticated) {
    router.push('/login')
    return null
  }

  // Handle logout action
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    if (logout) {
      logout()
      router.push('/')
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="flex flex-col justify-between h-full">
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Logo based on sidebar state */}
            <div className="mb-8">
              {sidebarOpen ? <Logo /> : <LogoIcon />}
            </div>
            
            {/* Navigation Links */}
            <div className="space-y-1">
              {navLinks.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
          </div>
          
          {/* Settings and Logout */}
          <div className="mt-auto pt-4 space-y-1">
            <SidebarLink
              link={{
                label: "Settings",
                href: "/dashboard/settings",
                icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
              }}
            />
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
              }}
              onClick={handleLogout}
              className="mt-2 hover:text-red-500 dark:hover:text-red-400"
            />
          </div>
        </SidebarBody>
      </Sidebar>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="px-4 py-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Welcome, {auth.user?.display_name || 'User'}</h1>
            
            {/* Theme toggle switch */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md bg-white dark:bg-neutral-800 shadow-sm hover:shadow transition-all duration-200"
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  )
} 