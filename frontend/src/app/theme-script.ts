// This script runs before React hydration to prevent theme flash
export function themeScript() {
  return `
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
        document.documentElement.classList.add(theme);
      } catch (e) {
        // Do nothing if there's an error
      }
    })()
  `;
}
