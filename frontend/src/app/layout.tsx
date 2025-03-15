import './globals.css';
import { Inter } from 'next/font/google';
import LayoutClient from './LayoutClient';
import ErrorHandler from '@/components/ErrorHandler';

export const metadata = {
  title: 'Audotics - Your AI Music Companion',
  description: 'Discover music with AI-powered recommendations'
};

const inter = Inter({ subsets: ['latin'] });

function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script 
          dangerouslySetInnerHTML={{ 
            __html: `
              (function() {
                function getTheme() {
                  try {
                    const storedTheme = localStorage.getItem('theme');
                    if (storedTheme) return storedTheme;
                    
                    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? 'dark'
                      : 'light';
                  } catch (e) {
                    // Default to light theme if localStorage is not available
                    return 'light';
                  }
                }

                try {
                  const theme = getTheme();
                  // Remove any existing theme classes first
                  document.documentElement.classList.remove('light', 'dark');
                  // Add the initial theme class
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  // Default to light theme if there's an error
                  document.documentElement.classList.add('light');
                }
              })()
            `
          }} 
        />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ErrorHandler>
          <LayoutClient>{children}</LayoutClient>
        </ErrorHandler>
      </body>
    </html>
  );
}

export default RootLayout;
