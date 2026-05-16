'use client'

import { useEffect, useRef } from 'react'

const CHARS = '01アカサタナハ{}[]<>/\\|=;.*%#@!'
const COL_WIDTH = 14

export function HeroBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let drops: number[] = []

    function init() {
      canvas!.width = canvas!.offsetWidth
      canvas!.height = canvas!.offsetHeight
      drops = Array.from(
        { length: Math.ceil(canvas!.width / COL_WIDTH) },
        () => Math.random() * -(canvas!.height / COL_WIDTH)
      )
    }

    init()
    window.addEventListener('resize', init)

    function draw() {
      const dark = document.documentElement.classList.contains('dark')

      ctx!.fillStyle = dark ? 'rgba(0,0,0,0.055)' : 'rgba(255,255,255,0.055)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      ctx!.font = `${COL_WIDTH - 1}px monospace`
      ctx!.fillStyle = dark ? 'rgba(45,212,191,0.85)' : 'rgba(13,148,136,0.5)'

      drops.forEach((y, i) => {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        ctx!.fillText(char, i * COL_WIDTH, y * COL_WIDTH)
        drops[i] += 0.35 + Math.random() * 0.15
        if (drops[i] * COL_WIDTH > canvas!.height && Math.random() > 0.975) {
          drops[i] = Math.random() * -(canvas!.height / COL_WIDTH / 2)
        }
      })

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', init)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
    />
  )
}
