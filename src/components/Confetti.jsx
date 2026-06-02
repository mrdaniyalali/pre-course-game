import { useEffect, useRef } from 'react'

// Fires a confetti burst each time `burst` increments. Cheap canvas particles,
// auto-stops when they settle, and respects reduced-motion.
const COLORS = ['#a78bff', '#2dd4bf', '#f6a93b', '#ff5d73', '#f3eeff']

export default function Confetti({ burst }) {
  const canvasRef = useRef(null)
  const raf = useRef(0)
  const particles = useRef([])

  useEffect(() => {
    if (!burst) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.scale(dpr, dpr)
    const W = window.innerWidth
    const H = window.innerHeight

    for (let i = 0; i < 140; i++) {
      particles.current.push({
        x: W / 2 + (Math.random() - 0.5) * 120,
        y: H * 0.32,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * -11 - 4,
        size: Math.random() * 7 + 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1,
      })
    }

    cancelAnimationFrame(raf.current)
    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      let alive = false
      for (const p of particles.current) {
        if (p.life <= 0) continue
        alive = true
        p.vy += 0.32
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        if (p.y > H * 0.9) p.life -= 0.04
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      if (alive) {
        raf.current = requestAnimationFrame(tick)
      } else {
        particles.current = []
        ctx.clearRect(0, 0, W, H)
      }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [burst])

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
}
