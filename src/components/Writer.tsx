import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { charDataLoader } from '@/lib/strokes'

/** Grille 田字格 + caractère (animation ou tracé au doigt vérifié trait par trait). */
export function Writer({ char, mode, size = 260, onDone, onMissing, nonce = 0 }: {
  char: string
  mode: 'quiz' | 'animate' | 'show'
  size?: number
  nonce?: number
  onDone?: (mistakes: number) => void
  onMissing?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    el.innerHTML = ''; setMissing(false)
    let alive = true
    const w = HanziWriter.create(el, char, {
      width: size, height: size, padding: 18,
      showOutline: mode !== 'quiz', showCharacter: mode === 'show',
      strokeColor: '#F0EEF8', outlineColor: 'rgba(196,181,253,0.18)', drawingColor: '#F0C96A',
      highlightColor: '#A78BFA', radicalColor: '#F0C96A',
      strokeAnimationSpeed: 1.2, delayBetweenStrokes: 220, drawingWidth: 22,
      charDataLoader,
      onLoadCharDataError: () => { if (alive) { setMissing(true); onMissing?.() } },
    })
    if (mode === 'quiz') w.quiz({ showHintAfterMisses: 3, highlightOnComplete: true, onComplete: (s: any) => onDone?.(s.totalMistakes) })
    if (mode === 'animate') w.loopCharacterAnimation()
    return () => { alive = false; try { (w as any).cancelQuiz?.() } catch {} ; el.innerHTML = '' }
  }, [char, mode, size, nonce])

  return (
    <div className="relative mx-auto rounded-2xl bg-s2 border border-border touch-none select-none" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 pointer-events-none" width={size} height={size}>
        <g stroke="rgba(239,68,68,0.28)" strokeWidth="1">
          <rect x="0.5" y="0.5" width={size - 1} height={size - 1} fill="none" />
          <g strokeDasharray="6 6">
            <line x1={size / 2} y1="0" x2={size / 2} y2={size} />
            <line x1="0" y1={size / 2} x2={size} y2={size / 2} />
            <line x1="0" y1="0" x2={size} y2={size} />
            <line x1={size} y1="0" x2="0" y2={size} />
          </g>
        </g>
      </svg>
      <div ref={ref} className="absolute inset-0" />
      {missing && <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-xs text-muted">
        Pas de données de traits pour « {char} ».
      </div>}
    </div>
  )
}
