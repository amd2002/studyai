import { useMemo, useState } from 'react'
import { pinyin as toPinyin } from 'pinyin-pro'
import { examplesFor, useStore, wordsFor } from '@/context/StoreContext'
import { isHard, isMastered, isNew } from '@/lib/srs'
import { updateCharInfo } from '@/lib/data'
import { say } from '@/lib/tts'
import { Writer } from '@/components/Writer'
import { Back, Btn, Label, Page, Seal, Steps, Zh, levelColor } from '@/components/ui'
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
      <h2 className="text-[26px] font-bold text-txt">Caractères</h2>
      <p className="text-[13px] text-muted mb-4">{Object.keys(store.chars).length} dans ta collection. Barre du haut : lecture, barre du bas : écriture.</p>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher : 字, zi, caractère…"
        className="w-full rounded-2xl bg-s1 border border-border px-4 py-3 text-[15px] mb-3 outline-none focus:border-accent2" />
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-3">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setF(k)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] border ${f === k ? 'bg-txt text-bg border-txt font-semibold' : 'border-border text-txt2'}`}>{l}</button>
        ))}
      </div>
      {store.courses.length > 0 && (
        <select value={course} onChange={e => setCourse(e.target.value)} className="w-full rounded-2xl bg-s1 border border-border px-3 py-2.5 text-[14px] text-txt2 mb-4">
          <option value="">Tous les cours</option>
          {store.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      )}
      <div className="grid grid-cols-5 gap-2">
        {list.map(c => (
          <button key={c.char} onClick={() => setOpen(c.char)} aria-label={`${c.char} ${c.pinyin}`}
            className="relative aspect-square rounded-[14px] bg-s1 border border-border flex flex-col items-center justify-center active:scale-95 transition overflow-hidden">
            <span className="font-ser text-[28px] leading-none text-txt">{c.char}</span>
            <span className="absolute left-2 right-2 bottom-2 flex flex-col gap-[2px]">
              <span className="h-[3px] rounded-full" style={{ background: levelColor(c.read_level, isNew(c, 'read')) }} />
              <span className="h-[3px] rounded-full" style={{ background: c.write_unlocked ? levelColor(c.write_level, isNew(c, 'write')) : '#1a1a35' }} />
            </span>
            {isMastered(c, 'read') && isMastered(c, 'write') && <span className="absolute top-1 right-1"><Seal size={14} /></span>}
          </button>
        ))}
      </div>
      {!list.length && <p className="text-sm text-muted text-center mt-8">Aucun caractère ne correspond.</p>}
      <div className="flex gap-4 text-[12px] text-muted mt-5 flex-wrap">
        {[['#3a3858', 'pas commencé'], ['#c2793a', 'en cours'], ['#F0C96A', 'presque'], ['#10b981', 'maîtrisé']].map(([col, l]) => (
          <span key={l} className="flex items-center gap-1.5"><span className="w-3 h-[3px] rounded-full" style={{ background: col }} />{l}</span>
        ))}
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
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const lvl = (l: number, due: string | null, lapses: number) => due ? `Niveau ${l} sur 7. Prochaine révision le ${fmt(due)}${lapses ? `, ${lapses} erreur${lapses > 1 ? 's' : ''} en tout` : ''}.` : 'Pas encore commencé'

  return (
    <Page>
      <Back onClick={onBack}>Caractères</Back>
      <div className="relative">
        <Writer char={c.char} mode="animate" size={220} />
        {isMastered(c, 'read') && <span className="absolute top-2 right-[calc(50%-120px)]"><Seal size={40} /></span>}
      </div>
      <div className="text-center mt-4 mb-5">
        <div className="text-[28px] text-accent3 italic leading-tight">{c.pinyin}</div>
        <div className="text-[17px] text-txt">{c.meaning_fr || 'Sens à compléter'}</div>
        <button onClick={() => say(c.char)} className="mt-3 px-4 py-2 rounded-xl bg-s1 border border-border text-accent2 text-[14px]">▶ Écouter</button>
      </div>
      {edit ? (
        <div className="rounded-2xl bg-s1 border border-border p-4 mb-4 flex flex-col gap-2">
          <input value={py} onChange={e => setPy(e.target.value)} className="rounded-xl bg-s2 border border-border px-3 py-2 text-sm" />
          <span className="text-[11px] text-muted">Suggestion : {toPinyin(c.char, { multiple: true })}</span>
          <input value={fr} onChange={e => setFr(e.target.value)} className="rounded-xl bg-s2 border border-border px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2"><Btn kind="ghost" onClick={() => setEdit(false)}>Annuler</Btn><Btn onClick={save}>Enregistrer</Btn></div>
        </div>
      ) : <div className="text-center mb-6"><button onClick={() => setEdit(true)} className="text-[13px] text-muted underline underline-offset-4">Corriger le pinyin ou le sens</button></div>}

      <Label>Progression</Label>
      <div className="rounded-[22px] bg-s1 border border-border p-4 mb-6 flex flex-col gap-3">
        <div><Steps label="读" level={c.read_level} isNew={!c.read_due} /><p className="text-[12px] text-muted mt-1 ml-7">{lvl(c.read_level, c.read_due, c.read_lapses)}</p></div>
        <div><Steps label="写" level={c.write_level} isNew={!c.write_due} /><p className="text-[12px] text-muted mt-1 ml-7">{c.write_unlocked ? lvl(c.write_level, c.write_due, c.write_lapses) : 'Se débloque après une première lecture réussie'}{!c.has_strokes && ' (pas de données de traits)'}</p></div>
      </div>
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
