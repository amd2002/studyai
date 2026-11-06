import { useEffect, useMemo, useState } from 'react'
import { examplesFor, newestFirst, useStore, wordsFor } from '@/context/StoreContext'
import { buildSession, grade, requeue, type Card as SCard } from '@/lib/srs'
import { saveReview, updateCharInfo } from '@/lib/data'
import { say } from '@/lib/tts'
import { getNewPerDay } from '@/pages/HzSettings'
import { Writer } from '@/components/Writer'
import { Btn, Label, Page, Zh } from '@/components/ui'
import type { Track } from '@/types/hanzi'

export default function HzReview({ track, onTrack, onExit }: { track: Track; onTrack: (t: Track) => void; onExit: () => void }) {
  const { store, patchChar } = useStore()
  const [queue, setQueue] = useState<SCard[]>([])
  const [graded, setGraded] = useState<Set<string>>(new Set())
  const [total, setTotal] = useState(0)
  const [errors, setErrors] = useState(0)
  const [shown, setShown] = useState(false)
  const [writeState, setWriteState] = useState<{ mistakes: number } | null>(null)
  const [demo, setDemo] = useState(false)
  const [nonce, setNonce] = useState(0)
  const [started, setStarted] = useState(false)

  // La session est construite une fois par piste (pas à chaque mise à jour du store).
  useEffect(() => {
    const s = buildSession(Object.values(store.chars), track, getNewPerDay(), newestFirst(store))
    setQueue(s); setTotal(s.length); setGraded(new Set()); setErrors(0); setShown(false); setWriteState(null); setDemo(false)
    setStarted(true)
  }, [track])

  const card = queue[0]
  const c = card ? store.chars[card.char] : undefined
  const ex = useMemo(() => (c ? examplesFor(store, c.char) : []), [c?.char])
  const words = useMemo(() => (c ? wordsFor(store, c.char) : []), [c?.char])

  const answer = (ok: boolean, mistakes = 0) => {
    if (!c || !card) return
    if (!graded.has(c.char)) {
      const patch = grade(c, track, ok)
      patchChar(c.char, patch); saveReview(c.char, patch, track, ok, mistakes)
      setGraded(g => new Set(g).add(c.char))
    }
    if (!ok) setErrors(e => e + 1)
    const rest = queue.slice(1)
    setQueue(ok ? rest : requeue(rest, card))
    setShown(false); setWriteState(null); setDemo(false); setNonce(x => x + 1)
  }

  const left = queue.length
  const done = new Set(queue.map(q => q.char))
  const finished = total - done.size

  const Header = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-1 p-1 rounded-xl bg-s2 border border-border">
        {(['read', 'write'] as Track[]).map(t => (
          <button key={t} onClick={() => onTrack(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${t === track ? 'bg-accent text-white' : 'text-muted'}`}>
            {t === 'read' ? '读 Lire' : '写 Écrire'}
          </button>
        ))}
      </div>
      <span className="text-xs text-muted tabular-nums">{finished}/{total} · {left} restante{left > 1 ? 's' : ''}</span>
    </div>
  )

  if (!started) return null
  if (!card || !c) return (
    <Page>
      {Header}
      <div className="text-center mt-16">
        <div className="font-ser text-5xl text-gold mb-2">好！</div>
        <div className="text-sm text-accent3 italic">Hǎo!</div>
        <div className="text-sm text-txt2 mb-6">Bien joué !</div>
        <p className="text-sm text-txt2 mb-6">
          {total ? `Session terminée : ${total} caractère${total > 1 ? 's' : ''}, ${errors} erreur${errors > 1 ? 's' : ''} rattrapée${errors > 1 ? 's' : ''}.`
            : track === 'write' ? 'Rien à écrire pour l’instant. Les caractères s’ouvrent à l’écriture quand tu as réussi à les lire une première fois.'
            : 'Rien à revoir aujourd’hui. Reviens demain, ou ajoute un cours.'}
        </p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          {track === 'read' && <Btn onClick={() => onTrack('write')}>Passer à l'écriture</Btn>}
          <Btn kind="ghost" onClick={onExit}>Retour à l'accueil</Btn>
        </div>
      </div>
    </Page>
  )

  const fill = ex[0] ? ex[0].zh.split(c.char).join('＿') : ''

  return (
    <Page>
      {Header}
      <div className="h-1.5 rounded-full bg-s3 overflow-hidden mb-5">
        <div className="h-full bg-grad-accent transition-all" style={{ width: `${total ? (finished / total) * 100 : 0}%` }} />
      </div>
      {card.isNew && !graded.has(c.char) && <div className="text-center mb-2"><span className="text-[10px] font-mono tracking-widest text-gold bg-gold/10 rounded-full px-2 py-0.5">NOUVEAU</span></div>}

      {track === 'read' ? (
        <>
          <div className="text-center my-6">
            <div className="font-ser text-[120px] leading-none text-txt">{c.char}</div>
          </div>
          {!shown ? (
            <>
              <p className="text-center text-xs text-muted mb-4">Dis le pinyin et le sens dans ta tête, puis vérifie.</p>
              <Btn className="w-full" onClick={() => { setShown(true); say(c.char) }}>Voir la réponse</Btn>
            </>
          ) : (
            <Answer c={c} ex={ex} words={words}>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <Btn kind="bad" onClick={() => answer(false)}>Pas encore</Btn>
                <Btn kind="ok" onClick={() => answer(true)}>Je savais</Btn>
              </div>
            </Answer>
          )}
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="text-xl text-accent3 italic">{c.pinyin}</div>
            <div className="text-sm text-txt2">{c.meaning_fr}</div>
            {ex[0] && <div className="mt-3"><Zh zh={fill} py={ex[0].py} fr={ex[0].fr} size="sm" /></div>}
          </div>
          <Writer char={c.char} mode={demo ? 'animate' : writeState ? 'show' : 'quiz'} nonce={nonce}
            onDone={m => { setWriteState({ mistakes: m }); say(c.char) }}
            onMissing={() => { updateCharInfo(c.char, { has_strokes: false }); patchChar(c.char, { has_strokes: false }) }} />
          {!writeState ? (
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Btn kind="ghost" onClick={() => setDemo(d => !d)}>{demo ? 'Essayer' : 'Voir l’ordre des traits'}</Btn>
              <Btn kind="bad" onClick={() => { setWriteState({ mistakes: 99 }); setDemo(false) }}>Je ne sais pas</Btn>
            </div>
          ) : (
            <Answer c={c} ex={[]} words={[]}>
              <p className={`text-center text-sm font-semibold mt-3 ${writeState.mistakes <= 1 ? 'text-green' : 'text-danger'}`}>
                {writeState.mistakes <= 1 ? 'Bien écrit !' : writeState.mistakes === 99 ? 'À revoir : regarde l’ordre des traits.' : `${writeState.mistakes} erreurs : on le refait plus tard.`}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Btn kind="ghost" onClick={() => { setWriteState(null); setDemo(false); setNonce(x => x + 1) }}>Recommencer</Btn>
                <Btn kind={writeState.mistakes <= 1 ? 'ok' : 'primary'} onClick={() => answer(writeState.mistakes <= 1, Math.min(writeState.mistakes, 20))}>Suivant</Btn>
              </div>
            </Answer>
          )}
        </>
      )}
    </Page>
  )
}

function Answer({ c, ex, words, children }: { c: { char: string; pinyin: string; meaning_fr: string }; ex: { zh: string; py: string; fr: string }[]; words: { zh: string; py: string; fr: string }[]; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-5 bg-s1/90 border border-border mt-2">
      {ex.length > 0 || words.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <div><div className="text-2xl text-accent3 italic">{c.pinyin}</div><div className="text-base text-txt">{c.meaning_fr || '(sens à compléter)'}</div></div>
            <button aria-label="Écouter" onClick={() => say(c.char)} className="w-11 h-11 rounded-2xl bg-s2 border border-border text-accent2">▶</button>
          </div>
          {words.length > 0 && <div className="mt-4"><Label>Mots</Label><div className="flex flex-col gap-2">{words.map(w => <Zh key={w.zh} {...w} hl={c.char} size="sm" />)}</div></div>}
          {ex.length > 0 && <div className="mt-4"><Label>Dans tes cours</Label><div className="flex flex-col gap-3">
            {ex.map((e, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1"><Zh zh={e.zh} py={e.py} fr={e.fr} hl={c.char} size="sm" /></div>
                <button aria-label="Écouter la phrase" onClick={() => say(e.zh)} className="w-9 h-9 shrink-0 rounded-xl bg-s2 border border-border text-accent2 text-xs">▶</button>
              </div>))}
          </div></div>}
        </>
      ) : null}
      {children}
    </div>
  )
}
