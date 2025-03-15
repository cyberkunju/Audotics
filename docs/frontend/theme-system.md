# Theme System

This document describes the theme system implemented in the Audotics frontend application.

## Overview

Audotics features a comprehensive theme system that supports both light and dark modes, with smooth transitions between them. The theme system is built using Tailwind CSS and custom CSS variables.

## Theme Implementation

### CSS Variables

The theme system uses CSS variables to define colors, shadows, and other visual properties that change between themes:

```css
:root {
  /* Light theme (default) */
  --background: #fcfbfe;
  --color: #323133;
  --card-background: #ffffff;
  --border-color: #e9e9e9;
  --text-primary: #323133;
  --text-secondary: #3C3B3D;
  --shadow: rgba(0, 0, 0, 0.1);
  --accent-color: #0fce3d;
}

.dark {
  /* Dark theme */
  --background: #1C1B20;
  --color: #F5F7FA;
  --card-background: #222126;
  --border-color: #252429;
  --text-primary: #F5F7FA;
  --text-secondary: #E6E9ED;
  --shadow: rgba(0, 0, 0, 0.1);
  --accent-color: #05c534;
}
```

### Tailwind CSS Configuration

The theme system is integrated with Tailwind CSS through the `tailwind.config.js` file:

```js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        accent: 'var(--accent-color)',
      },
      backgroundColor: {
        card: 'var(--card-background)',
      },
      borderColor: {
        default: 'var(--border-color)',
      },
      boxShadow: {
        card: '0 0 1rem -0.25rem var(--shadow)',
      },
    },
  },
};
```

## Theme Context

The theme system uses React Context to manage the current theme and provide theme-switching functionality:

```tsx
import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  // Update document class and localStorage when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

## Theme Toggle Component

The theme toggle button provides a visual way for users to switch between light and dark modes:

```tsx
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon className="w-6 h-6" />
      ) : (
        <SunIcon className="w-6 h-6" />
      )}
    </button>
  );
};
```

## Theme Transition Animation

The theme system includes a smooth transition animation when switching between themes:

```css
/* Base transition for all theme variables */
:root {
  --background: #fcfbfe;
  --color: #323133;
  /* Other variables... */
  
  transition: 
    background-color 0.5s ease,
    color 0.5s ease,
    border-color 0.5s ease,
    box-shadow 0.5s ease;
}

/* Clip path animation for theme transition */
.theme-transition-clip {
  z-index: 9999;
  position: fixed;
  bottom: 3rem;
  right: 3rem;
  width: 0;
  height: 0;
  border-radius: 100%;
  background-color: var(--background);
  pointer-events: none;
}

.theme-transition-clip.animate {
  animation: theme-transition 1s ease-in forwards;
}

@keyframes theme-transition {
  0% {
    width: 0;
    height: 0;
    clip-path: circle(0% at center);
  }
  100% {
    width: 500vmax;
    height: 500vmax;
    bottom: calc(-250vmax + 3rem);
    right: calc(-250vmax + 3rem);
    clip-path: circle(100% at center);
  }
}
```

## System Preference Detection

The theme system detects and respects the user's system preference for light or dark mode:

```tsx
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}, []);
```

## Component Theming

Components can be styled based on the current theme using Tailwind CSS classes:

```tsx
<div className="bg-background text-primary">
  <div className="bg-card border border-default shadow-card p-4">
    <h2 className="text-primary">Card Title</h2>
    <p className="text-secondary">Card content</p>
    <button className="bg-accent text-white">Action</button>
  </div>
</div>
```

## Usage

To use the theme system in the application:

1. Wrap the application with the `ThemeProvider`:

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

const App = () => {
  return (
    <ThemeProvider>
      {/* Application components */}
    </ThemeProvider>
  );
};
```

2. Use the `useTheme` hook to access the current theme and toggle function:

```tsx
import { useTheme } from '@/contexts/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};
```

3. Use Tailwind CSS classes for theme-aware styling:

```tsx
<div className="bg-background dark:bg-gray-900">
  <h1 className="text-primary dark:text-white">Heading</h1>
  <p className="text-secondary dark:text-gray-300">Content</p>
</div>
``` 