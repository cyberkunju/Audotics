# UI Components

This document provides an overview of the UI components used in the Audotics frontend application.

## Core UI Components

### Button

The Button component is a versatile button implementation with various styles and sizes.

**Features:**
- Multiple variants: default, destructive, outline, secondary, ghost, link
- Multiple sizes: default, sm, lg, icon
- Supports all standard button attributes
- Dark mode support

**Usage:**
```tsx
import { Button } from "@/components/ui/button";

// Default button
<Button>Click me</Button>

// Variant and size
<Button variant="outline" size="lg">Large Outline Button</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Icon button
<Button variant="ghost" size="icon">
  <IconComponent />
</Button>
```

### Card

The Card component is a container for displaying content in a card format.

**Features:**
- Consistent styling with rounded corners and subtle shadow
- Composed of multiple sub-components for structured content
- Dark mode support

**Sub-components:**
- `Card`: The main container
- `CardHeader`: Container for the card title and description
- `CardTitle`: The card title
- `CardDescription`: A description or subtitle for the card
- `CardContent`: The main content area of the card
- `CardFooter`: A footer area for actions or additional information

**Usage:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description or subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Tooltip

The Tooltip component displays additional information when hovering over an element.

**Features:**
- Simple implementation for showing tooltips
- Customizable content
- Automatic positioning

**Usage:**
```tsx
import { Tooltip } from "@/components/ui/tooltip";

<Tooltip content="Additional information">
  <Button>Hover me</Button>
</Tooltip>
```

### Sidebar

The Sidebar component provides navigation and quick access to different sections of the application.

**Features:**
- Responsive design that adapts to different screen sizes
- Collapsible on mobile devices
- Navigation links with icons
- Active state indication

**Usage:**
```tsx
import { Sidebar } from "@/components/ui/sidebar";

<Sidebar />
```

## Visual Effect Components

### CursorArrow

The CursorArrow component creates a custom cursor effect that follows the mouse pointer.

**Features:**
- Animated cursor that follows mouse movement
- Customizable appearance
- Interactive effects on hover and click

**Usage:**
```tsx
import { CursorArrow } from "@/components/CursorArrow";

<CursorArrow />
```

### MouseGlow

The MouseGlow component creates a glowing effect that follows the mouse cursor.

**Features:**
- Radial gradient that follows mouse movement
- Customizable colors and size
- Smooth animation

**Usage:**
```tsx
import { MouseGlow } from "@/components/MouseGlow";

<MouseGlow />
```

### AnimatedBackground

The AnimatedBackground component creates a dynamic particle effect background.

**Features:**
- Animated particles that respond to mouse movement
- Customizable particle count, size, and colors
- Performance optimized with canvas rendering

**Usage:**
```tsx
import { AnimatedBackground } from "@/components/AnimatedBackground";

<AnimatedBackground />
```

### GradientText

The GradientText component displays text with a gradient color effect.

**Features:**
- Customizable gradient colors
- Support for different text sizes and weights
- Animated gradient option

**Usage:**
```tsx
import { GradientText } from "@/components/GradientText";

<GradientText
  text="Gradient Text"
  gradient="from-blue-500 to-purple-500"
/>
```

## Feedback Components

### ToastContainer

The ToastContainer component displays notifications to the user.

**Features:**
- Multiple toast types: success, error, info, warning
- Automatic dismissal with configurable duration
- Stacking of multiple toasts
- Smooth enter/exit animations

**Usage:**
```tsx
import { useToast } from "@/hooks/useToast";

const { showToast } = useToast();

// Show a success toast
showToast({
  type: "success",
  message: "Operation completed successfully"
});

// Show an error toast
showToast({
  type: "error",
  message: "An error occurred",
  duration: 5000 // 5 seconds
});
```

### ErrorBoundary

The ErrorBoundary component catches JavaScript errors in child components and displays a fallback UI.

**Features:**
- Prevents the entire application from crashing
- Displays user-friendly error messages
- Option to retry or reset the error state

**Usage:**
```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

<ErrorBoundary fallback={<ErrorFallbackComponent />}>
  <ChildComponent />
</ErrorBoundary>
```

## Loading Components

### LoadingScreen

The LoadingScreen component displays a loading indicator while content is being loaded.

**Features:**
- Fullscreen loading overlay
- Animated spinner or progress indicator
- Optional loading message

**Usage:**
```tsx
import { LoadingScreen } from "@/components/LoadingScreen";

<LoadingScreen message="Loading your music..." />
```

### ContentFallback

The ContentFallback component displays a placeholder while content is loading or unavailable.

**Features:**
- Skeleton loading animation
- Customizable size and shape
- Fallback content for empty states

**Usage:**
```tsx
import { ContentFallback } from "@/components/ContentFallback";

<ContentFallback type="playlist" />
```

## Authentication Components

### SpotifyLoginButton

The SpotifyLoginButton component provides a button for authenticating with Spotify.

**Features:**
- Branded Spotify styling
- Handles OAuth redirect flow
- Loading state during authentication

**Usage:**
```tsx
import { SpotifyLoginButton } from "@/components/SpotifyLoginButton";

<SpotifyLoginButton />
```

### AuthGuard

The AuthGuard component protects routes that require authentication.

**Features:**
- Redirects unauthenticated users to login
- Checks token validity
- Handles token refresh

**Usage:**
```tsx
import { AuthGuard } from "@/components/AuthGuard";

<AuthGuard>
  <ProtectedContent />
</AuthGuard>
```

## Platform Components

### MusicPlatformSelector

The MusicPlatformSelector component allows users to select their preferred music platform.

**Features:**
- Visual selection of supported music platforms
- Platform-specific authentication flows
- Remembers user's selection

**Usage:**
```tsx
import { MusicPlatformSelector } from "@/components/MusicPlatformSelector";

<MusicPlatformSelector onSelect={handlePlatformSelect} />
```

### ConnectionStatus

The ConnectionStatus component displays the current connection status to the music platform.

**Features:**
- Visual indicator of connection state
- Reconnection options
- Platform-specific status information

**Usage:**
```tsx
import { ConnectionStatus } from "@/components/ConnectionStatus";

<ConnectionStatus />
``` 