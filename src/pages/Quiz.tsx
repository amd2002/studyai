import { useState } from 'react'
import type { QuizItem, WordItem } from '@/types'

type Mode = 'menu' | 'quiz' | 'flash'

export default function Quiz({ quiz, words }: { quiz: QuizItem[]; words: WordItem[] }) {
  const [mode, setMode]       = useState<Mode>('menu')
  const [qi, setQi]           = useState(0)
  const [score, setScore]     = useState(0)
  const [answered, setAnswered] = useState<any>(null)
  const [fi, setFi]           = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [fillVal, setFillVal] = useState('')
  const [done, setDone]       = useState(false)

  // ── MENU ──
  if (mode === 'menu') return (
    <div className="h-full flex flex-col items-center justify-center px-6 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,111,255,0.06), transparent 70%)', filter: 'blur(40px)' }} />
      <div className="relative text-center mb-8">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl"
          style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.2)', boxShadow: '0 0 30px rgba(124,111,255,0.15)' }}>◈</div>
        <h2 className="font-syne font-bold text-xl text-txt mb-1">Réviser</h2>
        <p className="text-muted text-xs">Choisis ton mode d'entraînement</p>
      </div>

      {quiz.length === 0 && words.length === 0 && (
        <div className="rounded-3xl p-6 text-center w-full"
          style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.1)' }}>
          <p className="text-txt2 text-sm mb-1">Aucun contenu disponible</p>
          <p className="text-muted text-xs">Analyse un cours d'abord</p>
        </div>
      )}

      <div className="w-full space-y-3">
        {quiz.length > 0 && (
          <button onClick={() => { setMode('quiz'); setQi(0); setScore(0); setAnswered(null); setDone(false) }}
            className="w-full rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden transition-all active:scale-98"
            style={{ background: 'linear-gradient(135deg, rgba(124,111,255,0.15), rgba(124,111,255,0.05))', border: '1px solid rgba(124,111,255,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(124,111,255,0.2), transparent)', filter: 'blur(15px)' }} />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 4px 12px rgba(124,111,255,0.3)' }}>◈</div>
            <div className="text-left">
              <div className="font-syne font-bold text-txt">Quiz</div>
              <div className="text-xs text-muted mt-0.5">{quiz.length} questions · QCM, Vrai/Faux, Compléter</div>
            </div>
          </button>
        )}

        {words.length > 0 && (
          <button onClick={() => { setMode('flash'); setFi(0); setFlipped(false) }}
            className="w-full rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden transition-all active:scale-98"
            style={{ background: 'linear-gradient(135deg, rgba(240,201,106,0.1), rgba(240,201,106,0.03))', border: '1px solid rgba(240,201,106,0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F0C96A, #FDE68A)', boxShadow: '0 4px 12px rgba(240,201,106,0.3)' }}>✦</div>
            <div className="text-left">
              <div className="font-syne font-bold text-txt">Flashcards</div>
              <div className="text-xs text-muted mt-0.5">{words.length} mots · Répétition espacée</div>
            </div>
          </button>
        )}
      </div>
    </div>
  )

  // ── QUIZ ──
  if (mode === 'quiz') {
    if (done) {
      const pct = Math.round((score / quiz.length) * 100)
      const stars = pct >= 80 ? '⭐⭐⭐' : pct >= 60 ? '⭐⭐' : '⭐'
      return (
        <div className="h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="text-4xl mb-3">{stars}</div>
          <div className="font-syne text-6xl font-bold mb-1" style={{ color: pct >= 80 ? '#10b981' : pct >= 60 ? '#F0C96A' : '#ef4444' }}>{pct}%</div>
          <div className="text-muted text-sm mb-8">{score}/{quiz.length} bonnes réponses</div>
          <div className="w-full space-y-3">
            <button onClick={() => { setQi(0); setScore(0); setAnswered(null); setDone(false) }}
              className="w-full py-4 rounded-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 4px 20px rgba(124,111,255,0.3)' }}>
              ↻ Recommencer
            </button>
            <button onClick={() => { setMode('menu'); setDone(false) }}
              className="w-full py-4 rounded-2xl font-bold text-muted"
              style={{ background: 'rgba(124,111,255,0.05)', border: '1px solid rgba(124,111,255,0.1)' }}>
              ← Retour
            </button>
          </div>
        </div>
      )
    }

    const q = quiz[qi]
    const pct = Math.round((qi / quiz.length) * 100)

    const next = () => {
      if (qi + 1 >= quiz.length) setDone(true)
      else { setQi(qi + 1); setAnswered(null); setFillVal('') }
    }

    const answerQCM = (i: number) => {
      if (answered !== null) return
      setAnswered(i)
      if (i === q.answer) setScore(s => s + 1)
    }

    const answerVF = (v: boolean) => {
      if (answered !== null) return
      setAnswered(v)
      if (v === q.answer) setScore(s => s + 1)
    }

    const answerFill = () => {
      if (answered !== null) return
      const correct = fillVal.trim().toLowerCase() === String(q.answer).toLowerCase()
      setAnswered(fillVal)
      if (correct) setScore(s => s + 1)
    }

    const isCorrect = answered !== null && (
      (q.type === 'qcm' && answered === q.answer) ||
      (q.type === 'vrai_faux' && answered === q.answer) ||
      (q.type === 'fill' && fillVal.trim().toLowerCase() === String(q.answer).toLowerCase())
    )

    return (
      <div className="h-full overflow-y-auto scrollbar-none px-5 pt-5 pb-28">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setMode('menu')} className="text-muted text-sm">←</button>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(124,111,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7C6FFF, #A78BFA)' }} />
          </div>
          <span className="font-mono text-xs text-muted">{qi+1}/{quiz.length}</span>
        </div>

        {/* Question */}
        <div className="rounded-3xl p-5 mb-4 relative overflow-hidden"
          style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <div className="text-[10px] font-mono tracking-widest uppercase mb-3 font-semibold"
            style={{ color: q.type === 'qcm' ? '#7C6FFF' : q.type === 'vrai_faux' ? '#F0C96A' : '#10b981' }}>
            {q.type === 'qcm' ? '◉ QCM' : q.type === 'vrai_faux' ? '◐ VRAI / FAUX' : '◌ COMPLÉTER'}
          </div>
          <p className="font-semibold text-base text-txt leading-relaxed">{q.question}</p>
        </div>

        {/* QCM options */}
        {q.type === 'qcm' && (
          <div className="space-y-2.5">
            {q.options?.map((opt, i) => {
              const isRight = answered !== null && i === q.answer
              const isWrong = answered !== null && i === answered && i !== q.answer
              return (
                <button key={i} onClick={() => answerQCM(i)} disabled={answered !== null}
                  className="w-full text-left px-4 py-3.5 rounded-2xl text-sm font-medium transition-all"
                  style={isRight ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' }
                    : isWrong ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }
                    : { background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.12)', color: '#C4C0D8' }}>
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* VF options */}
        {q.type === 'vrai_faux' && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map(v => {
              const isRight = answered !== null && v === q.answer
              const isWrong = answered !== null && v === answered && v !== q.answer
              return (
                <button key={String(v)} onClick={() => answerVF(v)} disabled={answered !== null}
                  className="py-5 rounded-2xl font-bold text-sm transition-all"
                  style={isRight ? { background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', color: '#10b981' }
                    : isWrong ? { background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)', color: '#ef4444' }
                    : { background: 'rgba(124,111,255,0.06)', border: '2px solid rgba(124,111,255,0.12)', color: '#C4C0D8' }}>
                  {v ? '✓ Vrai' : '✗ Faux'}
                </button>
              )
            })}
          </div>
        )}

        {/* Fill option */}
        {q.type === 'fill' && (
          <div>
            <input value={fillVal} onChange={e => setFillVal(e.target.value)}
              placeholder="Ta réponse..." disabled={answered !== null}
              className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none text-txt placeholder:text-muted mb-3 disabled:opacity-60"
              style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.15)' }} />
            {answered === null && (
              <button onClick={answerFill}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)' }}>
                Valider
              </button>
            )}
          </div>
        )}

        {/* Feedback */}
        {answered !== null && (
          <>
            <div className="mt-4 p-4 rounded-2xl text-sm"
              style={isCorrect
                ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }
                : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <div className="font-bold mb-1">{isCorrect ? '✓ Correct !' : '✗ Incorrect'}</div>
              <div className="text-xs opacity-80">{q.explanation}</div>
              {q.type === 'fill' && !isCorrect && <div className="text-xs mt-1 font-semibold">Réponse : {String(q.answer)}</div>}
            </div>
            <button onClick={next}
              className="w-full mt-3 py-4 rounded-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 4px 20px rgba(124,111,255,0.3)' }}>
              {qi + 1 >= quiz.length ? '🏁 Voir le score' : 'Suivant →'}
            </button>
          </>
        )}
      </div>
    )
  }

  // ── FLASHCARDS ──
  if (mode === 'flash') {
    if (!words.length) return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted">Aucun mot disponible</p>
      </div>
    )

    const finished = fi >= words.length
    if (finished) return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <div className="font-syne font-bold text-xl text-txt mb-2">Tour complet !</div>
        <div className="text-muted text-sm mb-8">{words.length} mots révisés</div>
        <button onClick={() => { setFi(0); setFlipped(false) }}
          className="w-full py-4 rounded-2xl font-bold text-white mb-3"
          style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)' }}>
          ↻ Recommencer
        </button>
        <button onClick={() => setMode('menu')}
          className="w-full py-4 rounded-2xl font-bold text-muted"
          style={{ background: 'rgba(124,111,255,0.05)', border: '1px solid rgba(124,111,255,0.1)' }}>
          ← Retour
        </button>
      </div>
    )

    const card = words[fi % words.length]
    const rate = (r: 'hard'|'ok'|'easy') => { setFlipped(false); if (r !== 'hard') setFi(fi + 1) }

    return (
      <div className="h-full flex flex-col px-5 pt-5 pb-6">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setMode('menu')} className="text-muted text-sm">←</button>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(240,201,106,0.1)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.round((fi/words.length)*100)}%`, background: 'linear-gradient(90deg, #F0C96A, #FDE68A)' }} />
          </div>
          <span className="font-mono text-xs text-muted">{fi+1}/{words.length}</span>
        </div>

        {/* Card */}
        <div onClick={() => setFlipped(!flipped)}
          className="flex-1 rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all duration-300 relative overflow-hidden"
          style={flipped
            ? { background: 'rgba(240,201,106,0.06)', border: '1px solid rgba(240,201,106,0.25)', boxShadow: '0 0 40px rgba(240,201,106,0.1)' }
            : { background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.15)', boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>

          <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: flipped ? 'radial-gradient(circle, rgba(240,201,106,0.15), transparent)' : 'radial-gradient(circle, rgba(124,111,255,0.1), transparent)', filter: 'blur(20px)' }} />

          {!flipped ? (
            <>
              <div className="font-ser text-7xl mb-4" style={{ color: '#F0C96A' }}>{card.zh}</div>
              <div className="text-[10px] font-mono text-muted tracking-widest">TAP POUR RÉVÉLER</div>
            </>
          ) : (
            <>
              <div className="font-ser text-5xl mb-3" style={{ color: '#F0C96A' }}>{card.zh}</div>
              <div className="font-mono text-lg mb-2" style={{ color: '#22d3ee' }}>{card.py}</div>
              <div className="font-syne font-bold text-xl text-txt mb-4">{card.fr}</div>
              {card.example && <div className="text-xs text-muted text-center italic leading-relaxed max-w-xs">{card.example}</div>}
              <div className="mt-4 px-3 py-1.5 rounded-full text-xs font-mono"
                style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.15)', color: '#7C6FFF' }}>
                {card.category}
              </div>
            </>
          )}
        </div>

        {/* Rate buttons */}
        {flipped ? (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { r: 'hard' as const, label: 'Difficile', emoji: '😓', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
              { r: 'ok'   as const, label: 'Moyen',     emoji: '🤔', color: '#F0C96A', bg: 'rgba(240,201,106,0.1)', border: 'rgba(240,201,106,0.25)' },
              { r: 'easy' as const, label: 'Facile',    emoji: '😊', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
            ].map(b => (
              <button key={b.r} onClick={() => rate(b.r)}
                className="py-4 rounded-2xl font-bold text-xs transition-all active:scale-95"
                style={{ background: b.bg, border: `1px solid ${b.border}`, color: b.color }}>
                <div className="text-2xl mb-1">{b.emoji}</div>
                {b.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center mt-4 text-xs text-muted">Tape la carte pour voir la réponse</div>
        )}
      </div>
    )
  }

  return null
}
