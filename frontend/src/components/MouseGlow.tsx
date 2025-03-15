'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface DotProps {
  index: number
  parent: HTMLDivElement | null
  width: number
}

class Dot {
  index: number
  anglespeed: number
  x: number
  y: number
  scale: number
  range: number
  limit: number
  element: HTMLSpanElement
  lockX?: number
  lockY?: number
  angleX?: number
  angleY?: number

  constructor({ index, parent, width }: DotProps) {
    this.index = index
    this.anglespeed = 0.05
    this.x = 0
    this.y = 0
    this.scale = 1 - 0.05 * index
    this.range = width / 2 - (width / 2) * this.scale + 2
    this.limit = width * 0.75 * this.scale
    this.element = document.createElement('span')
    
    // Style the dot
    this.element.style.display = 'block'
    this.element.style.width = '6px'
    this.element.style.height = '6px'
    this.element.style.backgroundColor = 'var(--cursor-color)'
    this.element.style.borderRadius = '50%'
    this.element.style.position = 'absolute'
    this.element.style.opacity = Math.max(0.2, 1 - index * 0.04).toString()
    
    gsap.set(this.element, { scale: this.scale })
    parent?.appendChild(this.element)

    // Initial color update
    this.updateColor()
  }

  updateColor() {
    const isDark = document.documentElement.classList.contains('dark')
    this.element.style.backgroundColor = isDark ? '#ffffff' : '#000000'
  }

  lock() {
    this.lockX = this.x
    this.lockY = this.y
    this.angleX = Math.PI * 2 * Math.random()
    this.angleY = Math.PI * 2 * Math.random()
  }

  draw(delta: number, idle: boolean, sineDots: number) {
    if (!idle || this.index <= sineDots) {
      gsap.set(this.element, { x: this.x, y: this.y })
    } else {
      this.angleX = (this.angleX || 0) + this.anglespeed
      this.angleY = (this.angleY || 0) + this.anglespeed
      this.y = (this.lockY || 0) + Math.sin(this.angleY) * this.range
      this.x = (this.lockX || 0) + Math.sin(this.angleX) * this.range
      gsap.set(this.element, { x: this.x, y: this.y })
    }
  }

  destroy() {
    this.element.remove()
  }
}

export default function MouseGlow() {
  const [isMobile, setIsMobile] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mousePosition = useRef({ x: 0, y: 0 })
  const lastFrame = useRef(Date.now())
  const idleTimeout = useRef<NodeJS.Timeout>()
  const isIdle = useRef(false)
  const requestRef = useRef<number>()

  const AMOUNT = 20
  const SINE_DOTS = Math.floor(AMOUNT * 0.3)
  const WIDTH = 26
  const IDLE_TIMEOUT = 150

  // Theme change observer
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof HTMLElement) {
          // Update all dots when theme changes
          dotsRef.current.forEach(dot => dot.updateColor())
        }
      })
    })

    const htmlElement = document.documentElement
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const startIdleTimer = () => {
    idleTimeout.current = setTimeout(() => {
      isIdle.current = true
      dotsRef.current.forEach(dot => dot.lock())
    }, IDLE_TIMEOUT)
    isIdle.current = false
  }

  const resetIdleTimer = () => {
    if (idleTimeout.current) {
      clearTimeout(idleTimeout.current)
    }
    startIdleTimer()
  }

  const buildDots = () => {
    if (cursorRef.current) {
      for (let i = 0; i < AMOUNT; i++) {
        const dot = new Dot({
          index: i,
          parent: cursorRef.current,
          width: WIDTH
        })
        dotsRef.current.push(dot)
      }
    }
  }

  const positionCursor = (delta: number) => {
    let x = mousePosition.current.x
    let y = mousePosition.current.y

    dotsRef.current.forEach((dot, index, dots) => {
      const nextDot = dots[index + 1] || dots[0]
      dot.x = x
      dot.y = y
      dot.draw(delta, isIdle.current, SINE_DOTS)
      
      if (!isIdle.current || index <= SINE_DOTS) {
        const dx = (nextDot.x - dot.x) * 0.35
        const dy = (nextDot.y - dot.y) * 0.35
        x += dx
        y += dy
      }
    })
  }

  const render = (timestamp: number) => {
    const delta = timestamp - lastFrame.current
    positionCursor(delta)
    lastFrame.current = timestamp
    requestRef.current = requestAnimationFrame(render)
  }

  useEffect(() => {
    if (!isMobile) {
      const onMouseMove = (event: MouseEvent) => {
        mousePosition.current = {
          x: event.clientX - WIDTH / 2,
          y: event.clientY - WIDTH / 2
        }
        resetIdleTimer()
      }

      const onTouchMove = (event: TouchEvent) => {
        mousePosition.current = {
          x: event.touches[0].clientX - WIDTH / 2,
          y: event.touches[0].clientY - WIDTH / 2
        }
        resetIdleTimer()
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('touchmove', onTouchMove)
      
      buildDots()
      startIdleTimer()
      requestRef.current = requestAnimationFrame(render)

      return () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('touchmove', onTouchMove)
        if (idleTimeout.current) clearTimeout(idleTimeout.current)
        if (requestRef.current) cancelAnimationFrame(requestRef.current)
        dotsRef.current.forEach(dot => dot.destroy())
        dotsRef.current = []
      }
    }
  }, [isMobile])

  if (isMobile) return null

  return (
    <div 
      ref={cursorRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ 
        width: '100%',
        height: '100%'
      }}
    />
  )
}
