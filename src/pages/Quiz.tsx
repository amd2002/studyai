import { useState } from 'react'
import type { QuizItem, WordItem } from '@/types'

type Mode = 'menu' | 'quiz' | 'flash'

export default function Quiz({ quiz, words }: { quiz: QuizItem[]; words: WordItem[] }) {
  const [mode, setMode] = useState<Mode>('menu')
  const [qi, setQi]     = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<number | boolean | string | null>(null)
  const [fi, setFi]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [fillVal, setFillVal] = useState('')
  const [done, setDone] = useState(false)

  // ── MENU ──────────────────────────────────────────
  if (mode === 'menu') return (
    <div className="h-full flex flex-col items-center justify-center px-6 gap-4">
      <div className="text-5xl mb-2">🎯</div>
      <h2 className="font-extrabold text-xl">Réviser</h2>
      {quiz.length === 0 && words.length === 0 && (
        <p className="text-muted text-sm text-center">Analyse un cours d'abord pour générer des quiz et flashcards.</p>
      )}
      {quiz.length > 0 && (
        <button onClick={() => { setMode('quiz'); setQi(0); setScore(0); setAnswered(null); setDone(false) }}
          className="w-full bg-accent text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="text-left"><div>Quiz</div><div className="text-xs font-normal opacity-80">{quiz.length} questions</div></div>
        </button>
      )}
      {words.length > 0 && (
        <button onClick={() => { setMode('flash'); setFi(0); setFlipped(false) }}
          className="w-full bg-s2 border border-border py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3">
          <span className="text-2xl">🃏</span>
          <div className="text-left"><div>Flashcards</div><div className="text-xs font-normal text-muted">{words.length} mots · répétition espacée</div></div>
        </button>
      )}
    </div>
  )

  // ── QUIZ ──────────────────────────────────────────
  if (mode === 'quiz') {
    if (done) {
      const pct = Math.round((score / quiz.length) * 100)
      const stars = pct >= 80 ? '⭐⭐⭐' : pct >= 60 ? '⭐⭐' : '⭐'
      return (
        <div className="h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="text-4xl mb-2">{stars}</div>
          <div className="text-6xl font-extrabold text-accent2 font-mono">{pct}%</div>
          <div className="text-muted text-sm mt-2">{score}/{quiz.length} bonnes réponses</div>
          <button onClick={() => { setQi(0); setScore(0); setAnswered(null); setDone(false) }}
            className="mt-6 w-full bg-accent text-white py-3 rounded-xl font-bold">🔄 Recommencer</button>
          <button onClick={() => setMode('menu')}
            className="mt-2 w-full bg-s2 border border-border py-3 rounded-xl font-bold text-sm">← Retour</button>
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

    return (
      <div className="h-full overflow-y-auto px-4 pt-4 pb-24">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setMode('menu')} className="text-muted text-sm">←</button>
          <div className="flex-1 h-1.5 bg-s3 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono text-xs text-muted">{qi+1}/{quiz.length}</span>
        </div>

        {/* Question */}
        <div className="bg-s2 border border-border rounded-2xl p-4 mb-4">
          <div className="text-[10px] font-mono text-muted tracking-widest uppercase mb-2">
            {q.type === 'qcm' ? 'QCM' : q.type === 'vrai_faux' ? 'VRAI / FAUX' : 'COMPLÉTER'}
          </div>
          <p className="font-bold text-base leading-relaxed">{q.question}</p>
        </div>

        {/* Options */}
        {q.type === 'qcm' && q.options?.map((opt, i) => {
          let cls = 'bg-s2 border-border text-txt'
          if (answered !== null) {
            if (i === q.answer) cls = 'bg-green/10 border-green text-green'
            else if (i === answered) cls = 'bg-danger/10 border-danger text-danger'
          }
          return (
            <button key={i} onClick={() => answerQCM(i)}
              className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-left mb-2 font-sans transition ${cls}`}>
              {opt}
            </button>
          )
        })}

        {q.type === 'vrai_faux' && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map(v => {
              let cls = 'bg-s2 border-border text-txt'
              if (answered !== null) {
                if (v === q.answer) cls = 'bg-green/10 border-green text-green'
                else if (v === answered) cls = 'bg-danger/10 border-danger text-danger'
              }
              return (
                <button key={String(v)} onClick={() => answerVF(v)}
                  className={`border-2 rounded-xl py-4 font-bold transition ${cls}`}>
                  {v ? '✅ Vrai' : '❌ Faux'}
                </button>
              )
            })}
          </div>
        )}

        {q.type === 'fill' && (
          <div>
            <input value={fillVal} onChange={e => setFillVal(e.target.value)}
              placeholder="Ta réponse..." disabled={answered !== null}
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent mb-3 disabled:opacity-60" />
            {answered === null && (
              <button onClick={answerFill} className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm">Valider</button>
            )}
          </div>
        )}

        {/* Feedback */}
        {answered !== null && (
          <>
            <div className={`mt-3 p-3 rounded-xl text-sm ${
              (q.type==='qcm' && answered===q.answer) || (q.type==='vrai_faux' && answered===q.answer) || (q.type==='fill' && String(fillVal).toLowerCase()===String(q.answer).toLowerCase())
                ? 'bg-green/10 border border-green text-green'
                : 'bg-danger/10 border border-danger text-danger'
            }`}>
              {q.explanation}
              {q.type === 'fill' && <div className="mt-1 font-bold">Réponse : {String(q.answer)}</div>}
            </div>
            <button onClick={next} className="w-full mt-3 bg-accent text-white py-3 rounded-xl font-bold">
              {qi + 1 >= quiz.length ? '🏁 Voir le score' : 'Suivant →'}
            </button>
          </>
        )}
      </div>
    )
  }

  // ── FLASHCARDS ────────────────────────────────────
  if (mode === 'flash') {
    if (!words.length) return <div className="h-full flex items-center justify-center"><p className="text-muted">Aucun mot disponible</p></div>
    const card = words[fi % words.length]

    const rate = (r: 'hard'|'ok'|'easy') => {
      setFlipped(false)
      if (r === 'hard') setFi(fi) // repeat
      else setFi(fi + 1)
    }

    const finished = fi >= words.length

    if (finished) return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <div className="font-extrabold text-xl mb-2">Tour complet !</div>
        <div className="text-muted text-sm mb-6">{words.length} mots révisés</div>
        <button onClick={() => { setFi(0); setFlipped(false) }} className="w-full bg-accent text-white py-3 rounded-xl font-bold">🔄 Recommencer</button>
        <button onClick={() => setMode('menu')} className="mt-2 w-full bg-s2 border border-border py-3 rounded-xl font-bold text-sm">← Retour</button>
      </div>
    )

    return (
      <div className="h-full flex flex-col px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setMode('menu')} className="text-muted text-sm">←</button>
          <div className="flex-1 h-1.5 bg-s3 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.round((fi/words.length)*100)}%` }} />
          </div>
          <span className="font-mono text-xs text-muted">{fi+1}/{words.length}</span>
        </div>

        {/* Card */}
        <div onClick={() => setFlipped(!flipped)}
          className={`flex-1 rounded-3xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${
            flipped ? 'border-accent bg-s2' : 'border-border bg-s2'
          }`}>
          {!flipped ? (
            <>
              <div className="font-ser text-6xl text-gold mb-3">{card.zh}</div>
              <div className="text-[10px] font-mono text-muted tracking-widest">TAP POUR RÉVÉLER</div>
            </>
          ) : (
            <>
              <div className="font-ser text-5xl text-gold mb-2">{card.zh}</div>
              <div className="font-mono text-base text-cyan mb-2">{card.py}</div>
              <div className="font-bold text-lg mb-3">{card.fr}</div>
              {card.example && <div className="text-xs text-muted text-center italic leading-relaxed">{card.example}</div>}
              <div className="mt-3 text-[10px] font-mono bg-s3 px-3 py-1 rounded-full text-muted">{card.category}</div>
            </>
          )}
        </div>

        {/* Rating buttons */}
        {flipped && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <button onClick={() => rate('hard')} className="py-3 rounded-xl border-2 border-danger/40 bg-danger/10 text-danger font-bold text-sm">😓<br/><span className="text-xs">Difficile</span></button>
            <button onClick={() => rate('ok')}   className="py-3 rounded-xl border-2 border-gold/40 bg-gold/10 text-gold font-bold text-sm">🤔<br/><span className="text-xs">Moyen</span></button>
            <button onClick={() => rate('easy')} className="py-3 rounded-xl border-2 border-green/40 bg-green/10 text-green font-bold text-sm">😊<br/><span className="text-xs">Facile</span></button>
          </div>
        )}
        {!flipped && <div className="text-center text-xs text-muted mt-4">Tap la carte pour voir la réponse</div>}
      </div>
    )
  }

  return null
}
