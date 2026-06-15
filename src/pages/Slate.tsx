import { useEffect, useRef, useState } from 'react'

const COLORS = ['#1a1a2e', '#ef4444', '#7C6FFF', '#10b981', '#F0C96A', '#22d3ee', '#ffffff']
type Grid = 'blank' | 'tian' | 'lines'

export default function Slate() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<Grid>('blank')
  const drawing    = useRef(false)
  const lastPos    = useRef({ x: 0, y: 0 })

  const [color, setColor]     = useState('#1a1a2e')
  const [brush, setBrush]     = useState(6)
  const [tool, setTool]       = useState<'pen'|'eraser'>('pen')
  const [grid, setGrid]       = useState<Grid>('blank')
  const [history, setHistory] = useState<ImageData[]>([])

  const ctx = () => canvasRef.current?.getContext('2d') ?? null

  const drawGrid = (g: Grid) => {
    const canvas = canvasRef.current; if (!canvas) return
    const c = ctx()!; const w = canvas.width; const h = canvas.height
    if (w === 0 || h === 0) return
    c.fillStyle = '#fafafa'; c.fillRect(0, 0, w, h)
    if (g === 'tian') {
      const cell = Math.min(w, h) * 0.55
      const cols = Math.floor(w / cell), rows = Math.floor(h / cell)
      const ox = (w - cols * cell) / 2, oy = (h - rows * cell) / 2
      for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
        const x = ox + col * cell, y = oy + r * cell
        c.strokeStyle = '#ffc0c0'; c.lineWidth = 1; c.setLineDash([])
        c.strokeRect(x, y, cell, cell)
        c.strokeStyle = '#ffd8d8'; c.setLineDash([4, 4])
        c.beginPath(); c.moveTo(x + cell/2, y); c.lineTo(x + cell/2, y + cell); c.stroke()
        c.beginPath(); c.moveTo(x, y + cell/2); c.lineTo(x + cell, y + cell/2); c.stroke()
        c.setLineDash([])
      }
    } else if (g === 'lines') {
      c.strokeStyle = '#e0e0f8'; c.lineWidth = 1; c.setLineDash([])
      for (let y = 44; y < h; y += 44) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke() }
    }
  }

  const resize = () => {
    const canvas = canvasRef.current; const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const rect = wrap.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const c = ctx()
    const img = (c && canvas.width > 0 && canvas.height > 0)
      ? c.getImageData(0, 0, canvas.width, canvas.height) : null
    canvas.width  = Math.floor(rect.width)
    canvas.height = Math.floor(rect.height)
    drawGrid(gridRef.current)
    if (img && c) { try { c.putImageData(img, 0, 0) } catch (_) {} }
  }

  useEffect(() => {
    const t = setTimeout(() => resize(), 60)
    window.addEventListener('resize', resize)
    return () => { clearTimeout(t); window.removeEventListener('resize', resize) }
  }, [])

  useEffect(() => { gridRef.current = grid; drawGrid(grid) }, [grid])

  const getPos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    const sx = canvasRef.current!.width  / r.width
    const sy = canvasRef.current!.height / r.height
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy }
  }

  const onDown = (e: React.PointerEvent) => {
    drawing.current = true
    const c = ctx()!; const canvas = canvasRef.current!
    setHistory(h => [...h.slice(-20), c.getImageData(0, 0, canvas.width, canvas.height)])
    lastPos.current = getPos(e)
  }

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    e.preventDefault()
    const c = ctx()!; const p = getPos(e)
    c.lineCap = 'round'; c.lineJoin = 'round'
    c.strokeStyle = tool === 'eraser' ? '#fafafa' : color
    c.lineWidth   = tool === 'eraser' ? brush * 5 : brush
    c.beginPath(); c.moveTo(lastPos.current.x, lastPos.current.y); c.lineTo(p.x, p.y); c.stroke()
    lastPos.current = p
  }

  const onUp = () => { drawing.current = false }

  const undo = () => {
    if (!history.length) return
    ctx()!.putImageData(history[history.length - 1], 0, 0)
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
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 flex-wrap"
        style={{ background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,111,255,0.1)' }}>

        {/* Pen / Eraser */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(124,111,255,0.08)', border: '1px solid rgba(124,111,255,0.12)' }}>
          {[
            { t: 'pen' as const, icon: '✏️', label: 'Stylo' },
            { t: 'eraser' as const, icon: '⬜', label: 'Gomme' },
          ].map(b => (
            <button key={b.t} onClick={() => setTool(b.t)} title={b.label}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
              style={tool === b.t ? { background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 2px 8px rgba(124,111,255,0.3)' } : {}}>
              {b.icon}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex gap-2 flex-1 justify-center">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool('pen') }}
              className="w-6 h-6 rounded-full transition-all duration-200"
              style={{
                background: c,
                border: color === c && tool === 'pen' ? '2px solid #fff' : '2px solid transparent',
                boxShadow: color === c && tool === 'pen' ? `0 0 10px ${c}88` : 'none',
                transform: color === c && tool === 'pen' ? 'scale(1.2)' : 'scale(1)',
              }} />
          ))}
        </div>

        {/* Brush sizes */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(124,111,255,0.08)', border: '1px solid rgba(124,111,255,0.12)' }}>
          {[3, 6, 12].map(s => (
            <button key={s} onClick={() => setBrush(s)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={brush === s ? { background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)' } : {}}>
              <div className="rounded-full" style={{ width: s + 2, height: s + 2, background: brush === s ? '#fff' : '#6B6880' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Grid selector */}
      <div className="flex gap-2 px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(8,8,16,0.7)', borderBottom: '1px solid rgba(124,111,255,0.08)' }}>
        {(['blank', 'tian', 'lines'] as Grid[]).map(g => (
          <button key={g} onClick={() => setGrid(g)}
            className="flex-1 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-200"
            style={grid === g
              ? { background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', color: '#fff', boxShadow: '0 2px 8px rgba(124,111,255,0.3)' }
              : { background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.1)', color: '#6B6880' }}>
            {g === 'blank' ? 'Blanc' : g === 'tian' ? '田字格' : 'Lignes'}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={wrapRef} className="flex-1 relative overflow-hidden" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(124,111,255,0.1)' }}>
        <button onClick={undo}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold text-muted transition-all active:scale-95"
          style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.12)' }}>
          ↩ Annuler
        </button>
        <button onClick={clear}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}>
          ✕ Effacer
        </button>
        <button onClick={saveImg}
          className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 4px 12px rgba(124,111,255,0.3)' }}>
          ↓ Garder
        </button>
      </div>
    </div>
  )
}
