'use client'

import React, { useState, useRef, useEffect } from 'react';

// Constants for animation
const CURSOR_SIZE = 24;
const SPRING_MOVE_SPEED = 0.35;
const SPRING_ROTATION_SPEED = 0.15;
const SCALE_SPEED = 0.15;
const ROTATION_DAMPING = 0.85;

// Simplified cursor implementation to ensure it works
export default function CursorArrow() {
  // State for cursor visibility and theme
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  
  // Refs for DOM and animation values
  const cursorRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Position tracking refs
  const lastX = useRef(0);
  const lastY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const rotation = useRef(0);
  const scale = useRef(1);
  const lastMoveTime = useRef(Date.now());

  // Helper to normalize angle between -180 and 180 degrees
  const normalizeAngle = (angle: number): number => {
    angle = angle % 360;
    return angle > 180 ? angle - 360 : angle < -180 ? angle + 360 : angle;
  };

  // Calculate rotation angle based on movement direction
  const getRotation = (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 0.5) return rotation.current;
    
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    return normalizeAngle(angle);
  };

  // Animation loop function
  const animateCursor = () => {
    if (!cursorRef.current) {
      requestRef.current = requestAnimationFrame(animateCursor);
      return;
    }

    // Calculate time since last move
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTime.current;
    const isInactive = timeSinceLastMove > 800;

    // Apply spring physics to movement
    const moveSpeed = isHovering ? SPRING_MOVE_SPEED * 0.7 : SPRING_MOVE_SPEED;
    const dx = targetX.current - currentX.current;
    const dy = targetY.current - currentY.current;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Apply speed multiplier based on distance
    const speedMultiplier = Math.min(distance / 100, 2);
    currentX.current += dx * moveSpeed * speedMultiplier;
    currentY.current += dy * moveSpeed * speedMultiplier;

    // Apply rotation based on movement direction
    if (!isHovering && !isInactive && distance > 0.5) {
      const targetRotation = getRotation(lastX.current, lastY.current, currentX.current, currentY.current);
      const angleDiff = normalizeAngle(targetRotation - rotation.current);
      rotation.current += angleDiff * SPRING_ROTATION_SPEED;
    } else {
      // Dampen rotation when not moving
      rotation.current *= ROTATION_DAMPING;
    }

    // Apply scaling effect when hovering
    const targetScale = isHovering ? 1.2 : 1;
    scale.current += (targetScale - scale.current) * SCALE_SPEED;

    // Calculate final position
    const x = Math.round(currentX.current - CURSOR_SIZE / 2);
    const y = Math.round(currentY.current - CURSOR_SIZE / 2);

    // Apply transformations to the cursor
    cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation.current}deg) scale(${scale.current})`;

    // Update last position
    lastX.current = currentX.current;
    lastY.current = currentY.current;

    // Continue animation
    requestRef.current = requestAnimationFrame(animateCursor);
  };

  // Apply global cursor hiding
  const hideDefaultCursor = () => {
    // Create or update the style element
    let styleElement = document.getElementById('cursor-hide-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'cursor-hide-styles';
      document.head.appendChild(styleElement);
    }

    // Comprehensive cursor hiding styles
    styleElement.textContent = `
      html, body, * {
        cursor: none !important;
      }
    `;

    // Also set inline styles for redundancy
    document.documentElement.style.cursor = 'none';
    document.body.style.cursor = 'none';
  };

  // Remove global cursor hiding
  const restoreDefaultCursor = () => {
    const styleElement = document.getElementById('cursor-hide-styles');
    if (styleElement) {
      document.head.removeChild(styleElement);
    }
    document.documentElement.style.cursor = '';
    document.body.style.cursor = '';
  };

  // Main effect for cursor setup
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check for mobile device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    setIsMobile(isTouchDevice || isSmallScreen);
    
    // Don't proceed for mobile devices
    if (isTouchDevice || isSmallScreen) {
      return;
    }
    
    // Hide default cursor completely
    hideDefaultCursor();
    
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Initialize dark mode
    checkDarkMode();
    
    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      lastMoveTime.current = Date.now();
      targetX.current = e.clientX;
      targetY.current = e.clientY;
      setIsVisible(true);
      
      // Initialize animation if not started yet
      if (requestRef.current === null) {
        requestRef.current = requestAnimationFrame(animateCursor);
      }
    };
    
    // Mouse leave handler
    const handleMouseLeave = () => {
      setIsVisible(false);
    };
    
    // Hover handlers for interactive elements
    const handleElementMouseEnter = () => {
      setIsHovering(true);
    };
    
    const handleElementMouseLeave = () => {
      setIsHovering(false);
    };
    
    // Add hover listeners to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleElementMouseEnter);
      element.addEventListener('mouseleave', handleElementMouseLeave);
    });
    
    // Set up observer for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Add core event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    // Initialize cursor position to center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    currentX.current = centerX;
    currentY.current = centerY;
    targetX.current = centerX;
    targetY.current = centerY;
    lastX.current = centerX;
    lastY.current = centerY;
    
    // Start animation
    requestRef.current = requestAnimationFrame(animateCursor);
    
    // Clean up function
    return () => {
      // Restore default cursor
      restoreDefaultCursor();
      
      // Cancel animation
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      
      // Remove event listeners
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleElementMouseEnter);
        element.removeEventListener('mouseleave', handleElementMouseLeave);
      });
      
      observer.disconnect();
    };
  }, []);
  
  // Don't render on mobile or server
  if (isMobile || typeof window === 'undefined') {
    return null;
  }
  
  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${CURSOR_SIZE}px`,
        height: `${CURSOR_SIZE}px`,
        backgroundImage: `url(${isDarkMode ? '/cursor_light.svg' : '/cursor_dark.svg'})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 150ms ease',
        willChange: 'transform',
        transform: 'translate3d(0, 0, 0)',
      }}
    />
  );
} 