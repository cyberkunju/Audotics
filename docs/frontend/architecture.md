# Frontend Architecture

This document outlines the architecture of the Audotics frontend application.

## Technology Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Material UI integration
- **State Management**: React Context API
- **Testing**: Jest and React Testing Library
- **Authentication**: OAuth with Spotify

## Directory Structure

```
frontend/
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── auth/          # Authentication utilities
│   ├── components/    # Reusable UI components
│   │   ├── ui/        # Base UI components
│   │   └── auth/      # Authentication-related components
│   ├── config/        # Configuration files
│   ├── constants/     # Application constants
│   ├── contexts/      # React Context providers
│   ├── demo/          # Demo mode components and data
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   ├── pages/         # Next.js Pages Router (legacy)
│   ├── services/      # API service clients
│   ├── tests/         # Test files
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── .env               # Environment variables
├── next.config.js     # Next.js configuration
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## Key Components

### UI Components

The application includes several key UI components:

- **Navigation.tsx**: Main navigation bar with responsive design
- **AnimatedBackground.tsx**: Dynamic background with particle effects
- **CursorArrow.tsx**: Custom cursor effects
- **MouseGlow.tsx**: Glow effect that follows the mouse cursor
- **ToastContainer.tsx**: Notification system
- **ErrorBoundary.tsx**: Error handling for React components
- **LoadingScreen.tsx**: Loading indicator for async operations
- **MusicPlatformSelector.tsx**: Interface for selecting music platforms
- **QuickAccess.tsx**: Quick access panel for frequently used features

### Authentication Components

- **SpotifyLoginButton.tsx**: Button for Spotify OAuth login
- **AuthGuard.tsx**: Route protection based on authentication status
- **ProtectedRoute.tsx**: Higher-order component for protected routes

### Visual Effects

The frontend includes several visual effects for an enhanced user experience:

- **CursorArrow.tsx**: Custom cursor with animation effects
- **MouseGlow.tsx**: Glow effect that follows the mouse cursor
- **AnimatedBackground.tsx**: Dynamic background with particle effects
- **GradientText.tsx**: Text with gradient color effects

## State Management

The application uses React Context API for state management:

- **User Context**: Manages user authentication state
- **Theme Context**: Manages application theme (light/dark)
- **Player Context**: Manages music player state
- **Toast Context**: Manages notification system

## Routing

The application uses Next.js App Router for routing, with some legacy pages using the Pages Router.

## API Integration

The frontend communicates with the backend API using service clients:

- **SpotifyService**: Handles Spotify API integration
- **UserService**: Manages user-related API calls
- **RecommendationService**: Handles music recommendation API calls
- **PlaylistService**: Manages playlist-related API calls

## Authentication Flow

1. User clicks on Spotify login button
2. User is redirected to Spotify OAuth consent screen
3. After authorization, Spotify redirects back with an authorization code
4. Frontend exchanges the code for access and refresh tokens
5. Tokens are stored in secure HTTP-only cookies
6. AuthGuard component protects routes that require authentication

## Theming

The application supports light and dark themes using Tailwind CSS and custom theme configuration.

## Error Handling

The application includes comprehensive error handling:

- **ErrorBoundary.tsx**: Catches and displays React component errors
- **ErrorHandler.jsx**: Global error handler for API errors
- **Toast notifications**: User-friendly error messages

## Testing

The application includes Jest and React Testing Library for testing:

- **Unit tests**: Test individual components and functions
- **Integration tests**: Test component interactions
- **E2E tests**: Test complete user flows

## Performance Optimization

- **Image optimization**: Using Next.js Image component with lazy loading
- **Code splitting**: Using dynamic imports for better loading performance
- **Memoization**: Using React.memo and useMemo for expensive computations
- **Server-side rendering**: Using Next.js SSR for better SEO and initial load performance 