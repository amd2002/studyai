import { useEffect, useRef, useState } from 'react'
import { examplesFor, useStore } from '@/context/StoreContext'
import { isDue, isHard, isNew, today } from '@/lib/srs'
import { speak, stopSpeech, ttsAvailable } from '@/lib/tts'
import { Btn, Label, Page, Tian } from '@/components/ui'

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function HzListen() {
  const { store } = useStore()
  const [sel, setSel] = useState('today')
  const [withFr, setWithFr] = useState(true)
  const [slow, setSlow] = useState(true)
  const [pause, setPause] = useState(2)
  const [playing, setPlaying] = useState(false)
  const [cur, setCur] = useState<string | null>(null)
  const run = useRef(0)
  const lock = useRef<any>(null)

  const pick = () => {
    const all = Object.values(store.chars)
    if (sel === 'today') { const t = today(); const d = all.filter(c => isDue(c, 'read', t) || isNew(c, 'read')); return d.length ? d : all }
    if (sel === 'hard') return all.filter(isHard)
    if (sel === 'all') return all
    return all.filter(c => (store.links[c.char] ?? []).includes(sel))
  }

  const start = async () => {
    const list = pick(); if (!list.length) return
    const id = ++run.current; setPlaying(true)
    try { lock.current = await (navigator as any).wakeLock?.request('screen') } catch {}
    const rate = slow ? 0.7 : 0.95
    for (let i = 0; run.current === id; i = (i + 1) % list.length) {
      const c = list[i]; setCur(c.char)
      await speak(c.char, { rate }); await wait(pause * 500)
      if (run.current !== id) break
      const ex = examplesFor(store, c.char, 1)[0]
      if (ex) { await speak(ex.zh, { rate }); await wait(pause * 1000) }
      if (run.current !== id) break
      if (withFr) { await speak(c.meaning_fr, { lang: 'fr' }); await wait(pause * 500) }
    }
  }
  const stop = () => { run.current++; stopSpeech(); setPlaying(false); setCur(null); try { lock.current?.release() } catch {} }
  useEffect(() => () => stop(), [])

  const c = cur ? store.chars[cur] : null
  const ex = cur ? examplesFor(store, cur, 1)[0] : undefined

  return (
    <Page>
      <h2 className="text-[26px] font-bold text-txt">Écouter</h2>
      <p className="text-[14px] text-muted mb-5">Le caractère, puis une phrase de ton cours, puis le sens en français, en boucle. Tu peux ranger le téléphone.</p>
      {!ttsAvailable() && <p className="text-danger text-xs mb-4">La voix n'est pas disponible sur cet appareil.</p>}

      {c ? (
        <div className="text-center mb-6">
          <Tian size={200} className="mx-auto"><span className="font-ser text-[130px] leading-none text-txt">{c.char}</span></Tian>
          <div className="text-[24px] text-accent3 italic mt-4">{c.pinyin}</div>
          <div className="text-[15px] text-txt">{c.meaning_fr}</div>
          {ex && <div className="mt-5 px-2"><div className="font-ser text-[19px] text-txt">{ex.zh}</div><div className="text-[13px] text-accent3 italic">{ex.py}</div><div className="text-[13px] text-txt2">{ex.fr}</div></div>}
        </div>
      ) : (
        <>
          <Label>Quoi écouter</Label>
          <select value={sel} onChange={e => setSel(e.target.value)} className="w-full rounded-2xl bg-s1 border border-border px-3 py-3 text-[15px] mb-5">
            <option value="today">Les caractères du jour</option>
            <option value="hard">Les caractères difficiles</option>
            <option value="all">Tous mes caractères</option>
            {store.courses.map(x => <option key={x.id} value={x.id}>Cours : {x.title}</option>)}
          </select>
          <div className="flex flex-col gap-4 mb-6 text-[15px] rounded-[22px] bg-s1 border border-border p-4">
            <label className="flex justify-between items-center"><span>Dire le sens en français</span><input type="checkbox" checked={withFr} onChange={e => setWithFr(e.target.checked)} /></label>
            <label className="flex justify-between items-center"><span>Voix lente</span><input type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)} /></label>
            <label className="flex justify-between items-center gap-4"><span>Pause pour répéter</span>
              <input type="range" min={1} max={5} value={pause} onChange={e => setPause(+e.target.value)} /><span className="tabular-nums w-8">{pause} s</span></label>
          </div>
        </>
      )}
      {!playing ? <Btn className="w-full" onClick={start}>Lancer la boucle</Btn> : <Btn kind="ghost" className="w-full" onClick={stop}>Arrêter</Btn>}
    </Page>
  )
}
