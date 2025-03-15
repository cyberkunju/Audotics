'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or user preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = storedTheme || (prefersDarkMode ? 'dark' : 'light')
    
    setTheme(initialTheme)
    setMounted(true)
    
    console.log('[ThemeContext] Initialized theme:', initialTheme)
  }, [])

  // Apply theme class to HTML element whenever theme changes
  useEffect(() => {
    if (!mounted) return
    
    console.log('[ThemeContext] Applying theme:', theme)
    
    // Remove both classes first to ensure clean state
    document.documentElement.classList.remove('light', 'dark')
    
    // Add the current theme class
    document.documentElement.classList.add(theme)
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    console.log('[ThemeContext] Toggling theme from', theme)
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  // Don't render until mounted to prevent flash
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
