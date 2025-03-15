'use client'

import React, { useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface AnimatedBackgroundProps {
  intensity?: number; // 0 to 1, where 1 is full intensity
  musicVisualization?: boolean; // Whether to show music visualization effects
}

export default function AnimatedBackground({ 
  intensity = 0.6, 
  musicVisualization = false 
}: AnimatedBackgroundProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const svgRef = useRef<SVGSVGElement>(null)
  const linesRef = useRef<SVGLineElement[]>([])
  const orbsRef = useRef<SVGCircleElement[]>([])
  const animationRef = useRef<number | null>(null)

  // Store persistent line properties
  const linesData = useRef<Array<{
    x: number,
    startY: number,
    speed: number,
    delay: number,
    length: number,
    opacity: number,
    color: string
  }>>([])

  // Store persistent orb properties
  const orbsData = useRef<Array<{
    x: number,
    y: number,
    radius: number,
    speed: number,
    direction: number,
    opacity: number,
    color: string,
    glowIntensity: number
  }>>([])

  useEffect(() => {
    if (!svgRef.current) return

    // Clear previous elements
    if (svgRef.current) {
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild)
      }
    }

    // Set up the lines data
    const setupLines = () => {
      // Adjust number of lines based on intensity
      const numberOfLines = Math.floor(25 + (intensity * 25))
      linesData.current = []
      
      // Get the base opacity for the theme, adjusted by intensity
      const baseOpacity = (isDark ? 0.2 : 0.3) * intensity
      
      // Light mode colors with better visibility
      const lightModeColors = [
        `rgba(30, 58, 138, ${baseOpacity})`, // blue-900
        `rgba(67, 56, 202, ${baseOpacity})`, // indigo-700
        `rgba(55, 48, 163, ${baseOpacity})`, // indigo-800
        `rgba(49, 46, 129, ${baseOpacity})`, // indigo-900
        `rgba(40, 53, 147, ${baseOpacity})`, // deep blue
      ]

      // Dark mode colors (enhanced)
      const darkModeColors = [
        `rgba(59, 130, 246, ${baseOpacity})`, // blue-500
        `rgba(99, 102, 241, ${baseOpacity})`, // indigo-500
        `rgba(139, 92, 246, ${baseOpacity})`, // violet-500
        `rgba(147, 51, 234, ${baseOpacity})`, // purple-600
        `rgba(168, 85, 247, ${baseOpacity})`, // purple-500
        `rgba(192, 132, 252, ${baseOpacity})`, // purple-400
      ]

      const colors = isDark ? darkModeColors : lightModeColors
      
      // Create lines
      for (let i = 0; i < numberOfLines; i++) {
        linesData.current.push({
          x: i * (window.innerWidth / numberOfLines) + Math.random() * 20,
          startY: Math.random() * -1000,
          speed: (0.2 + Math.random() * 0.4) * intensity, // Adjust speed based on intensity
          delay: Math.random() * 2000,
          length: (50 + Math.random() * 150) * intensity, // Adjust length based on intensity
          opacity: 0,  // Start with zero opacity
          color: colors[i % colors.length]
        });
      }
      
      // Create SVG line elements
      if (svgRef.current) {
        linesRef.current = linesData.current.map((line, i) => {
          const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          lineElement.setAttribute('x1', line.x.toString());
          lineElement.setAttribute('x2', line.x.toString());
          lineElement.setAttribute('y1', line.startY.toString());
          lineElement.setAttribute('y2', (line.startY + line.length).toString());
          lineElement.setAttribute('stroke', line.color);
          lineElement.setAttribute('stroke-width', '1');
          lineElement.setAttribute('opacity', '0');
          svgRef.current?.appendChild(lineElement);
          return lineElement;
        });
      }
    };
    
    // Set up floating orbs
    const setupOrbs = () => {
      // Adjust number of orbs based on intensity
      const numberOfOrbs = Math.floor(5 + (intensity * 10))
      orbsData.current = []
      
      // Get the base opacity for the theme, adjusted by intensity
      const baseOpacity = (isDark ? 0.5 : 0.3) * intensity
      
      // Light mode colors
      const lightModeColors = [
        `rgba(67, 56, 202, ${baseOpacity})`, // indigo-700
        `rgba(55, 48, 163, ${baseOpacity})`, // indigo-800
        `rgba(79, 70, 229, ${baseOpacity})`, // indigo-600
        `rgba(124, 58, 237, ${baseOpacity})`, // violet-600
        `rgba(109, 40, 217, ${baseOpacity})`, // purple-700
      ]

      // Dark mode colors
      const darkModeColors = [
        `rgba(93, 149, 242, ${baseOpacity})`, // blue-400
        `rgba(129, 140, 248, ${baseOpacity})`, // indigo-400
        `rgba(167, 139, 250, ${baseOpacity})`, // violet-400
        `rgba(192, 132, 252, ${baseOpacity})`, // purple-400
        `rgba(216, 180, 254, ${baseOpacity})`, // purple-300
      ]

      const colors = isDark ? darkModeColors : lightModeColors
      
      // Create orbs
      for (let i = 0; i < numberOfOrbs; i++) {
        orbsData.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          radius: (5 + Math.random() * 15) * intensity,
          speed: (0.2 + Math.random() * 0.3) * intensity,
          direction: Math.random() * Math.PI * 2,
          opacity: 0.1 + Math.random() * 0.3 * intensity,
          color: colors[i % colors.length],
          glowIntensity: 0.5 + Math.random() * 0.5
        });
      }
      
      // Create SVG orb elements
      if (svgRef.current) {
        // Add defs for filters
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Create glow filter
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'glow');
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');
        
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '3');
        feGaussianBlur.setAttribute('result', 'blur');
        
        const feComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
        feComposite.setAttribute('in', 'blur');
        feComposite.setAttribute('operator', 'over');
        
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feComposite);
        defs.appendChild(filter);
        svgRef.current.appendChild(defs);
        
        // Create orbs
        orbsRef.current = orbsData.current.map((orb, i) => {
          const orbElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          orbElement.setAttribute('cx', orb.x.toString());
          orbElement.setAttribute('cy', orb.y.toString());
          orbElement.setAttribute('r', orb.radius.toString());
          orbElement.setAttribute('fill', orb.color);
          orbElement.setAttribute('opacity', orb.opacity.toString());
          orbElement.setAttribute('filter', 'url(#glow)');
          svgRef.current?.appendChild(orbElement);
          return orbElement;
        });
      }
    };
    
    // Animation function
    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      // Animate lines
      linesData.current.forEach((line, i) => {
        const lineElement = linesRef.current[i];
        if (!lineElement) return;
        
        // Only start animating after delay
        if (elapsed < line.delay) {
          return;
        }
        
        // Calculate position
        const timeWithDelay = elapsed - line.delay;
        const y = ((timeWithDelay * line.speed) % 2000) - 1000;
        
        // Update line position
        lineElement.setAttribute('y1', y.toString());
        lineElement.setAttribute('y2', (y + line.length).toString());
        
        // Calculate opacity based on position, scaled by intensity
        const opacity = Math.min(intensity, Math.max(0.1 * intensity, intensity * (1 - Math.abs(y) / 1000)));
        lineElement.setAttribute('opacity', opacity.toString());
        
        // Update stored opacity
        line.opacity = opacity;
      });
      
      // Animate orbs
      orbsData.current.forEach((orb, i) => {
        const orbElement = orbsRef.current[i];
        if (!orbElement) return;
        
        // Move orbs in their direction
        orb.x += Math.cos(orb.direction) * orb.speed;
        orb.y += Math.sin(orb.direction) * orb.speed;
        
        // Bounce off edges
        if (orb.x < 0 || orb.x > window.innerWidth) {
          orb.direction = Math.PI - orb.direction;
        }
        if (orb.y < 0 || orb.y > window.innerHeight) {
          orb.direction = -orb.direction;
        }
        
        // Subtle pulsing effect
        const pulseAmount = 0.2 * Math.sin(elapsed * 0.001 + i);
        const adjustedRadius = orb.radius * (1 + pulseAmount * 0.1);
        const adjustedOpacity = orb.opacity * (1 + pulseAmount * 0.1);
        
        // Update orb position and attributes
        orbElement.setAttribute('cx', orb.x.toString());
        orbElement.setAttribute('cy', orb.y.toString());
        orbElement.setAttribute('r', adjustedRadius.toString());
        orbElement.setAttribute('opacity', adjustedOpacity.toString());
        
        // Music visualization effect (if enabled)
        if (musicVisualization) {
          const musicPulse = 0.5 * Math.sin(elapsed * 0.005 + i * 0.2);
          orbElement.setAttribute('r', (adjustedRadius * (1 + musicPulse * 0.2)).toString());
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Initial setup
    setupLines();
    setupOrbs();
    animate();
    
    // Clean up
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, isDark, intensity, musicVisualization]);

  // Background color based on theme
  const backgroundColor = isDark 
    ? 'hsl(224 71.4% 4.1%)' // dark background
    : '#ffffff' // light background

  return (
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden z-0 transition-all duration-500 ease-in-out"
      style={{ background: backgroundColor }}
    >
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity: 0.5 * intensity,
          background: isDark
            ? 'radial-gradient(circle at 30% 10%, rgba(79, 70, 229, 0.12), transparent 40%), radial-gradient(circle at 70% 90%, rgba(124, 58, 237, 0.12), transparent 40%)'
            : 'radial-gradient(circle at 30% 10%, rgba(255, 255, 255, 1), rgba(245, 245, 255, 0.8) 40%), radial-gradient(circle at 70% 90%, rgba(240, 240, 255, 1), transparent 40%)'
        }}
      />
      
      {/* SVG for animations */}
      <svg 
        ref={svgRef} 
        className="absolute inset-0 w-full h-full z-0 transform-none"
        style={{ overflow: 'hidden' }}
      />
    </div>
  )
}
