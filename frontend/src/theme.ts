import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DB954', // Spotify-like green
    },
    secondary: {
      main: '#1ED760',
    },
    background: {
      default: '#121212',
      paper: '#181818',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 500,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
})

export default theme
