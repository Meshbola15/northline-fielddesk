import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'

interface Props {
  onChange: (dataUrl: string | null) => void
}

export function SignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const ratio = window.devicePixelRatio || 1
      const width = parent.clientWidth
      const height = 140
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(ratio, ratio)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#172126'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    const ratio = window.devicePixelRatio || 1
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#172126'
    setHasInk(false)
    onChange(null)
  }

  return (
    <div>
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <canvas
          ref={canvasRef}
          className="touch-none w-full"
          aria-label="Signature pad"
          onPointerDown={(e) => {
            drawing.current = true
            const ctx = canvasRef.current?.getContext('2d')
            if (!ctx) return
            const p = pos(e)
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            canvasRef.current?.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = canvasRef.current?.getContext('2d')
            if (!ctx) return
            const p = pos(e)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
            setHasInk(true)
          }}
          onPointerUp={() => {
            drawing.current = false
            if (hasInk || canvasRef.current) {
              const url = canvasRef.current?.toDataURL('image/png') ?? null
              if (url) onChange(url)
            }
          }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted">Demo acknowledgement — not legal verification.</p>
        <Button type="button" size="sm" variant="outline" onClick={clear}>
          Clear
        </Button>
      </div>
    </div>
  )
}
