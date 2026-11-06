import { useMemo, useState } from 'react'
import { pinyin as toPinyin } from 'pinyin-pro'
import { examplesFor, useStore, wordsFor } from '@/context/StoreContext'
import { isHard, isMastered, isNew, INTERVALS } from '@/lib/srs'
import { updateCharInfo } from '@/lib/data'
import { say } from '@/lib/tts'
import { Writer } from '@/components/Writer'
import { Btn, Label, Page, Zh, levelColor } from '@/components/ui'
import type { CharRow } from '@/types/hanzi'

type Filter = 'all' | 'new' | 'hard' | 'mastered' | 'write'
const FILTERS: [Filter, string][] = [['all', 'Tous'], ['new', 'Nouveaux'], ['hard', 'Difficiles'], ['mastered', 'Maîtrisés'], ['write', 'À écrire']]
const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function HzChars() {
  const { store } = useStore()
  const [q, setQ] = useState('')
  const [f, setF] = useState<Filter>('all')
  const [course, setCourse] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const list = useMemo(() => {
    const s = strip(q.trim())
    return Object.values(store.chars).filter(c => {
      if (course && !(store.links[c.char] ?? []).includes(course)) return false
      if (f === 'new' && !isNew(c, 'read')) return false
      if (f === 'hard' && !isHard(c)) return false
      if (f === 'mastered' && !isMastered(c, 'read')) return false
      if (f === 'write' && !(c.write_unlocked && !isMastered(c, 'write'))) return false
      if (!s) return true
      return c.char === q.trim() || strip(c.pinyin).replace(/\s/g, '').includes(s.replace(/\s/g, '')) || strip(c.meaning_fr).includes(s)
    })
  }, [store, q, f, course])

  if (open && store.chars[open]) return <Detail c={store.chars[open]} onBack={() => setOpen(null)} />

  return (
    <Page>
      <h2 className="font-syne font-bold text-xl mb-1">Mes caractères</h2>
      <p className="text-xs text-muted mb-4">{Object.keys(store.chars).length} au total · L = lecture, É = écriture</p>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher : 字, zi, caractère…"
        className="w-full rounded-2xl bg-s2 border border-border px-4 py-3 text-sm mb-3 outline-none focus:border-accent" />
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-3">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setF(k)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${f === k ? 'bg-accent text-white border-accent' : 'border-border text-txt2'}`}>{l}</button>
        ))}
      </div>
      {store.courses.length > 0 && (
        <select value={course} onChange={e => setCourse(e.target.value)} className="w-full rounded-2xl bg-s2 border border-border px-3 py-2.5 text-sm mb-4">
          <option value="">Tous les cours</option>
          {store.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      )}
      <div className="grid grid-cols-5 gap-2">
        {list.map(c => (
          <button key={c.char} onClick={() => setOpen(c.char)} className="aspect-square rounded-2xl bg-s1 border border-border flex flex-col items-center justify-center active:scale-95 transition">
            <span className="font-ser text-2xl leading-none">{c.char}</span>
            <span className="flex gap-1 mt-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: levelColor(c.read_level, isNew(c, 'read')) }} />
              <span className="w-2 h-2 rounded-full" style={{ background: c.write_unlocked ? levelColor(c.write_level, isNew(c, 'write')) : 'transparent', border: '1px solid #6B6880' }} />
            </span>
          </button>
        ))}
      </div>
      {!list.length && <p className="text-sm text-muted text-center mt-8">Aucun caractère ne correspond.</p>}
      <div className="flex gap-4 text-[11px] text-muted mt-5 flex-wrap">
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#6B6880' }} />nouveau</span>
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#f59e0b' }} />en cours</span>
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#F0C96A' }} />presque</span>
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#10b981' }} />maîtrisé</span>
      </div>
    </Page>
  )
}

function Detail({ c, onBack }: { c: CharRow; onBack: () => void }) {
  const { store, patchChar } = useStore()
  const ex = examplesFor(store, c.char, 20)
  const words = wordsFor(store, c.char, 12)
  const courses = store.courses.filter(x => (store.links[c.char] ?? []).includes(x.id))
  const [edit, setEdit] = useState(false)
  const [py, setPy] = useState(c.pinyin)
  const [fr, setFr] = useState(c.meaning_fr)
  const save = async () => { patchChar(c.char, { pinyin: py, meaning_fr: fr }); await updateCharInfo(c.char, { pinyin: py, meaning_fr: fr }); setEdit(false) }
  const lvl = (l: number, due: string | null, lapses: number) => due ? `niveau ${l}/7 · prochaine fois ${due} · ${lapses} erreur${lapses > 1 ? 's' : ''}` : 'pas encore commencé'

  return (
    <Page>
      <button onClick={onBack} className="text-muted text-sm mb-4">← Mes caractères</button>
      <div className="flex gap-5 items-center mb-5">
        <Writer char={c.char} mode="animate" size={150} />
        <div className="min-w-0">
          <div className="text-2xl text-accent3 italic">{c.pinyin}</div>
          <div className="text-base text-txt">{c.meaning_fr || '(sens à compléter)'}</div>
          <button onClick={() => say(c.char)} className="mt-2 px-3 py-1.5 rounded-xl bg-s2 border border-border text-accent2 text-xs">▶ Écouter</button>
        </div>
      </div>
      {edit ? (
        <div className="rounded-2xl bg-s1 border border-border p-4 mb-4 flex flex-col gap-2">
          <input value={py} onChange={e => setPy(e.target.value)} className="rounded-xl bg-s2 border border-border px-3 py-2 text-sm" />
          <span className="text-[11px] text-muted">Suggestion : {toPinyin(c.char, { multiple: true })}</span>
          <input value={fr} onChange={e => setFr(e.target.value)} className="rounded-xl bg-s2 border border-border px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2"><Btn kind="ghost" onClick={() => setEdit(false)}>Annuler</Btn><Btn onClick={save}>Enregistrer</Btn></div>
        </div>
      ) : <button onClick={() => setEdit(true)} className="text-xs text-accent2 mb-4">Corriger le pinyin ou le sens</button>}

      <Label>Progression</Label>
      <div className="text-xs text-txt2 mb-1">读 <i className="text-accent3">dú</i> Lecture : {lvl(c.read_level, c.read_due, c.read_lapses)}</div>
      <div className="text-xs text-txt2 mb-5">写 <i className="text-accent3">xiě</i> Écriture : {c.write_unlocked ? lvl(c.write_level, c.write_due, c.write_lapses) : 'se débloque après une première lecture réussie'}{!c.has_strokes && ' (pas de données de traits)'}</div>
      <p className="text-[11px] text-muted mb-5">Délais par niveau : {INTERVALS.slice(1).map(d => `${d} j`).join(', ')}.</p>

      {words.length > 0 && <><Label>Mots</Label><div className="flex flex-col gap-2 mb-5">{words.map(w => <Zh key={w.zh} {...w} hl={c.char} size="sm" />)}</div></>}
      {ex.length > 0 && <><Label>Phrases de tes cours</Label><div className="flex flex-col gap-3 mb-5">
        {ex.map((e, i) => <div key={i} className="flex gap-2"><div className="flex-1"><Zh zh={e.zh} py={e.py} fr={e.fr} hl={c.char} size="sm" /></div>
          <button aria-label="Écouter" onClick={() => say(e.zh)} className="w-9 h-9 shrink-0 rounded-xl bg-s2 border border-border text-accent2 text-xs">▶</button></div>)}
      </div></>}
      <Label>Cours</Label>
      <div className="flex flex-col gap-1">{courses.map(x => <div key={x.id} className="text-sm"><span className="font-ser">{x.title}</span> <span className="text-muted text-xs">{x.title_fr}</span></div>)}</div>
    </Page>
  )
}
