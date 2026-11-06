import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { charDataLoader } from '@/lib/strokes'
import { Tian } from '@/components/ui'

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
      strokeColor: '#F0EEF8', outlineColor: 'rgba(196,181,253,0.16)', drawingColor: '#F0C96A',
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
    <Tian size={size} className="mx-auto touch-none select-none">
      <div ref={ref} className="absolute inset-0" />
      {missing && <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-[13px] text-muted">
        Pas de données de traits pour « {char} ».
      </div>}
    </Tian>
  )
}
