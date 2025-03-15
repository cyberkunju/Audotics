# Cursor Effects

This document describes the custom cursor effects implemented in the Audotics frontend application.

## Overview

Audotics features custom cursor effects that enhance the user experience by providing visual feedback and creating a more engaging interface. These effects are implemented using React components and CSS animations.

## Main Cursor Components

### CursorArrow

The `CursorArrow` component creates a custom arrow cursor that follows the mouse pointer with smooth animations.

**Features:**
- Follows mouse movement with slight lag for a smooth effect
- Rotates based on movement direction
- Changes appearance on interactive elements
- Scales on click for visual feedback

**Implementation:**
```tsx
import React, { useEffect, useRef } from 'react';

export const CursorArrow: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    
    const onMouseMove = (e: MouseEvent) => {
      // Calculate position and rotation
      const { clientX, clientY } = e;
      cursor.style.transform = `translate(${clientX}px, ${clientY}px) rotate(${angle}deg)`;
    };
    
    const onMouseDown = () => {
      cursor.classList.add('cursor-clicked');
    };
    
    const onMouseUp = () => {
      cursor.classList.remove('cursor-clicked');
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
  
  return <div ref={cursorRef} className="custom-cursor-arrow" />;
};
```

### MouseGlow

The `MouseGlow` component creates a glowing effect that follows the mouse cursor, adding depth and visual interest to the interface.

**Features:**
- Radial gradient that follows mouse movement
- Customizable colors and size
- Smooth animation with configurable lag
- Interaction with UI elements (grows on hover over interactive elements)

**Implementation:**
```tsx
import React, { useEffect, useRef } from 'react';

export const MouseGlow: React.FC = () => {
  const glowRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    
    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // Apply smooth animation with requestAnimationFrame
      requestAnimationFrame(() => {
        glow.style.background = `radial-gradient(circle at ${clientX}px ${clientY}px, rgba(var(--primary-rgb), 0.15), transparent 80%)`;
      });
    };
    
    document.addEventListener('mousemove', onMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);
  
  return <div ref={glowRef} className="mouse-glow" />;
};
```

## Cursor Effect Variants

Audotics implements several cursor effect variants that can be used throughout the application:

### 1. Arrow Pointer

A custom arrow pointer that rotates based on movement direction.

### 2. Big Circle

A large circular cursor that follows the mouse with a slight delay.

### 3. Ring Dot

A ring with a dot in the center that follows the mouse cursor.

### 4. Circle and Dot

A combination of a larger circle and a smaller dot that move at different speeds.

### 5. Glitch Effect

A cursor with a glitch effect that activates on click or hover over interactive elements.

### 6. Motion Blur

A cursor with a motion blur effect that intensifies with faster mouse movements.

## Integration with UI Components

The cursor effects are integrated with UI components to provide enhanced feedback:

### Hover States

When hovering over interactive elements:
- The cursor changes appearance (size, color, or shape)
- Additional visual effects may be triggered
- The element itself may respond with animations

### Click States

When clicking on elements:
- The cursor provides visual feedback (scaling, color change)
- Click animations are triggered
- The element responds with appropriate animations

## Performance Considerations

Custom cursor effects can impact performance, so several optimizations are implemented:

1. **Hardware Acceleration**: Using CSS transforms with `translate3d` to enable GPU acceleration
2. **Throttling**: Limiting the frequency of updates for smoother performance
3. **Conditional Rendering**: Disabling effects on low-performance devices
4. **Reduced Motion**: Respecting user preferences for reduced motion

## Usage

To use the cursor effects in the application:

```tsx
import { CursorArrow, MouseGlow } from '@/components';

const App = () => {
  return (
    <div className="app">
      <CursorArrow />
      <MouseGlow />
      {/* Rest of the application */}
    </div>
  );
};
```

## Accessibility Considerations

While custom cursors enhance the visual experience, they should not interfere with accessibility:

1. The custom cursors are implemented as overlay elements with `pointer-events: none`
2. The native cursor is still available for users who need it
3. Custom cursors are disabled when users have indicated a preference for reduced motion
4. All interactive elements maintain proper focus states and keyboard accessibility 