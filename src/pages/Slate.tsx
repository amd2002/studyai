import { useEffect, useRef, useState } from 'react'

const COLORS = ['#1a1a2e','#ef4444','#6c63ff','#10b981','#f59e0b','#06b6d4','#ffffff']
type Grid = 'blank' | 'tian' | 'lines'

export default function Slate() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const wrapRef     = useRef<HTMLDivElement>(null)
  const [color, setColor]   = useState('#1a1a2e')
  const [brush, setBrush]   = useState(5)
  const [tool, setTool]     = useState<'pen'|'eraser'>('pen')
  const [grid, setGrid]     = useState<Grid>('blank')
  const [history, setHistory] = useState<ImageData[]>([])
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const gridRef = useRef<Grid>('blank')

  const ctx = () => canvasRef.current?.getContext('2d') ?? null

  const drawGrid = (g: Grid) => {
    const canvas = canvasRef.current; if (!canvas) return
    const c = ctx()!; const w = canvas.width; const h = canvas.height
    if (w === 0 || h === 0) return
    c.fillStyle = '#fefefe'; c.fillRect(0, 0, w, h)
    if (g === 'tian') {
      const cell = Math.min(w, h) * 0.55
      const cols = Math.floor(w / cell), rows = Math.floor(h / cell)
      const ox = (w - cols * cell) / 2, oy = (h - rows * cell) / 2
      for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
        const x = ox + col * cell, y = oy + r * cell
        c.strokeStyle = '#ffcccc'; c.lineWidth = 1; c.setLineDash([])
        c.strokeRect(x, y, cell, cell)
        c.strokeStyle = '#ffdddd'; c.setLineDash([4, 4])
        c.beginPath(); c.moveTo(x + cell/2, y); c.lineTo(x + cell/2, y + cell); c.stroke()
        c.beginPath(); c.moveTo(x, y + cell/2); c.lineTo(x + cell, y + cell/2); c.stroke()
        c.setLineDash([])
      }
    } else if (g === 'lines') {
      c.strokeStyle = '#cce'; c.lineWidth = 1; c.setLineDash([])
      for (let y = 40; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke() }
    }
  }

  const resize = () => {
    const canvas = canvasRef.current; const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const rect = wrap.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    // Save current drawing before resize
    const c = ctx()
    const img = (c && canvas.width > 0 && canvas.height > 0)
      ? c.getImageData(0, 0, canvas.width, canvas.height)
      : null
    canvas.width  = Math.floor(rect.width)
    canvas.height = Math.floor(rect.height)
    drawGrid(gridRef.current)
    // Restore drawing
    if (img && c) {
      try { c.putImageData(img, 0, 0) } catch (_) {}
    }
  }

  useEffect(() => {
    // Small delay to let layout settle before measuring
    const t = setTimeout(() => { resize() }, 50)
    window.addEventListener('resize', resize)
    return () => { clearTimeout(t); window.removeEventListener('resize', resize) }
  }, [])

  useEffect(() => {
    gridRef.current = grid
    drawGrid(grid)
  }, [grid])

  const getPos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width  / r.width
    const scaleY = canvasRef.current!.height / r.height
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY }
  }

  const onDown = (e: React.PointerEvent) => {
    drawing.current = true
    const c = ctx()!
    const canvas = canvasRef.current!
    setHistory(h => {
      const snap = c.getImageData(0, 0, canvas.width, canvas.height)
      return [...h.slice(-20), snap]
    })
    lastPos.current = getPos(e)
  }

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    e.preventDefault()
    const c = ctx()!; const p = getPos(e)
    c.lineCap = 'round'; c.lineJoin = 'round'
    c.strokeStyle = tool === 'eraser' ? '#fefefe' : color
    c.lineWidth   = tool === 'eraser' ? brush * 4 : brush
    c.beginPath(); c.moveTo(lastPos.current.x, lastPos.current.y); c.lineTo(p.x, p.y); c.stroke()
    lastPos.current = p
  }

  const onUp = () => { drawing.current = false }

  const undo = () => {
    if (!history.length) return
    const snap = history[history.length - 1]
    ctx()!.putImageData(snap, 0, 0)
    setHistory(h => h.slice(0, -1))
  }

  const clear = () => {
    const c = ctx()!; const canvas = canvasRef.current!
    setHistory(h => [...h, c.getImageData(0, 0, canvas.width, canvas.height)])
    drawGrid(grid)
  }

  const saveImg = () => {
    const a = document.createElement('a')
    a.href = canvasRef.current!.toDataURL('image/png')
    a.download = `ardoise-${Date.now()}.png`
    a.click()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-s1 border-b border-border flex-shrink-0 flex-wrap">
        <div className="flex gap-1">
          <button onClick={() => setTool('pen')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${tool==='pen' ? 'bg-accent text-white' : 'bg-s2 border border-border'}`}>✏️</button>
          <button onClick={() => setTool('eraser')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${tool==='eraser' ? 'bg-accent text-white' : 'bg-s2 border border-border'}`}>🧽</button>
        </div>
        <div className="flex gap-1.5">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool('pen') }}
              className={`w-6 h-6 rounded-full border-2 transition ${color===c && tool==='pen' ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ background: c }} />
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {[3, 6, 12].map(s => (
            <button key={s} onClick={() => setBrush(s)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center bg-s2 border transition ${brush===s ? 'border-accent' : 'border-border'}`}>
              <div className="rounded-full bg-txt" style={{ width: s, height: s }} />
            </button>
          ))}
        </div>
      </div>

      {/* Grid selector */}
      <div className="flex gap-2 px-3 py-1.5 bg-s1 border-b border-border flex-shrink-0">
        {(['blank','tian','lines'] as Grid[]).map(g => (
          <button key={g} onClick={() => setGrid(g)}
            className={`flex-1 py-1 rounded-lg text-xs font-mono transition ${grid===g ? 'bg-accent text-white' : 'bg-s2 border border-border text-muted'}`}>
            {g === 'blank' ? 'Blanc' : g === 'tian' ? '田字格' : 'Lignes'}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={wrapRef} className="flex-1 relative overflow-hidden" style={{ background: '#fefefe', touchAction: 'none' }}>
        <canvas ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} />
      </div>

      {/* Bottom actions */}
      <div className="flex gap-2 px-3 py-2 bg-s1 border-t border-border flex-shrink-0">
        <button onClick={undo}    className="flex-1 py-2.5 bg-s2 border border-border rounded-xl text-sm font-bold">↩ Annuler</button>
        <button onClick={clear}   className="flex-1 py-2.5 bg-s2 border border-border rounded-xl text-sm font-bold">🗑 Effacer</button>
        <button onClick={saveImg} className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-bold">💾 Garder</button>
      </div>
    </div>
  )
}