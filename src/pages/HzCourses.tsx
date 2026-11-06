import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { buildPrompt } from '@/lib/prompt'
import { fixMessage, parseLesson, planMerge, type ParseResult } from '@/lib/importer'
import { deleteCourse, importLesson } from '@/lib/data'
import { say } from '@/lib/tts'
import { Btn, Card, Label, Page, Zh } from '@/components/ui'
import type { CourseRow, ImportChar } from '@/types/hanzi'

async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

export default function HzCourses() {
  const { store } = useStore()
  const [view, setView] = useState<'list' | 'new' | string>('list')
  if (view === 'new') return <NewCourse onDone={() => setView('list')} />
  const open = store.courses.find(c => c.id === view)
  if (open) return <CourseView c={open} onBack={() => setView('list')} />
  return (
    <Page>
      <h2 className="font-syne font-bold text-xl mb-4">Mes cours</h2>
      <Btn className="w-full mb-5" onClick={() => setView('new')}>+ Nouveau cours</Btn>
      <div className="flex flex-col gap-2">
        {store.courses.map(c => {
          const n = Object.entries(store.links).filter(([, ids]) => ids.includes(c.id)).length
          return (
            <button key={c.id} onClick={() => setView(c.id)} className="text-left rounded-2xl bg-s1 border border-border p-4 active:scale-[0.99]">
              <div className="font-ser text-lg">{c.title}</div>
              <div className="text-xs text-accent3 italic">{c.title_py}</div>
              <div className="text-xs text-txt2">{c.title_fr}</div>
              <div className="text-[11px] text-muted mt-1">{new Date(c.created_at).toLocaleDateString('fr-FR')} · {c.sentences?.length ?? 0} phrases · {n} caractères</div>
            </button>
          )
        })}
        {!store.courses.length && <p className="text-sm text-muted">Aucun cours pour l'instant.</p>}
      </div>
    </Page>
  )
}

function NewCourse({ onDone }: { onDone: () => void }) {
  const { store, reload } = useStore()
  const [raw, setRaw] = useState('')
  const [copied, setCopied] = useState<'' | 'ok' | 'fail'>('')
  const [err, setErr] = useState('')
  const [res, setRes] = useState<ParseResult | null>(null)
  const [chars, setChars] = useState<ImportChar[]>([])
  const [busy, setBusy] = useState(false)
  const prompt = buildPrompt(Object.values(store.chars))

  const doCopy = async () => setCopied((await copy(prompt)) ? 'ok' : 'fail')
  const analyse = () => {
    setErr(''); setRes(null)
    try { const r = parseLesson(raw); setRes(r); setChars(r.lesson.characters) } catch (e: any) { setErr(e.message) }
  }
  const save = async () => {
    if (!res) return
    setBusy(true); setErr('')
    try { await importLesson({ ...res.lesson, characters: chars }, store.chars); await reload(); onDone() }
    catch (e: any) { setErr(e.message || String(e)) } finally { setBusy(false) }
  }

  if (res) {
    const plan = planMerge({ ...res.lesson, characters: chars }, store.chars)
    const setOne = (ch: string, k: 'pinyin' | 'meaning_fr', v: string) => setChars(cs => cs.map(c => (c.char === ch ? { ...c, [k]: v } : c)))
    return (
      <Page>
        <button onClick={() => setRes(null)} className="text-muted text-sm mb-4">← Modifier la réponse</button>
        <Zh zh={res.lesson.title} py={res.lesson.title_py} fr={res.lesson.title_fr} size="lg" />
        <p className="text-xs text-muted mt-2 mb-4">{res.lesson.sentences.length} phrases · {res.lesson.words.length} mots · {res.lesson.grammar.length} points de grammaire</p>
        {res.problems.length > 0 && <div className="rounded-2xl p-3 mb-4 text-xs border border-gold/30 text-gold bg-gold/5">{res.problems.map((p, i) => <div key={i}>• {p}</div>)}</div>}

        <Label>Nouveaux ({plan.fresh.length}) — tu peux corriger ou retirer</Label>
        <div className="flex flex-col gap-2 mb-5">
          {plan.fresh.map(c => (
            <div key={c.char} className="flex gap-2 items-center rounded-2xl bg-s1 border border-green/30 p-2">
              <span className="font-ser text-2xl w-10 text-center">{c.char}</span>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <input value={c.pinyin} onChange={e => setOne(c.char, 'pinyin', e.target.value)} className="bg-transparent text-sm text-accent3 italic outline-none" />
                <input value={c.meaning_fr} placeholder="sens à compléter" onChange={e => setOne(c.char, 'meaning_fr', e.target.value)} className="bg-transparent text-sm text-txt2 outline-none" />
              </div>
              <button aria-label="Retirer" onClick={() => setChars(cs => cs.filter(x => x.char !== c.char))} className="text-muted px-2">✕</button>
            </div>
          ))}
        </div>
        <Label>Déjà connus ({plan.known.length}) — gardent leur progression</Label>
        <div className="flex flex-wrap gap-1.5 mb-6">
          {plan.known.map(c => <span key={c.char} className="font-ser text-lg px-2 py-1 rounded-xl bg-s2 text-txt2">{c.char}</span>)}
        </div>
        {err && <p className="text-danger text-xs mb-3">{err}</p>}
        <Btn className="w-full" onClick={save} disabled={busy}>{busy ? 'Ajout…' : `Ajouter au programme (${plan.fresh.length} nouveaux)`}</Btn>
      </Page>
    )
  }

  return (
    <Page>
      <button onClick={onDone} className="text-muted text-sm mb-4">← Mes cours</button>
      <h2 className="font-syne font-bold text-xl mb-4">Nouveau cours</h2>
      <Card className="mb-3">
        <Label>Étape 1 · Copier le prompt</Label>
        <p className="text-xs text-txt2 mb-3">Il contient déjà tes {Object.keys(store.chars).length} caractères connus, pour que l'IA garde les mêmes sens.</p>
        <Btn className="w-full" onClick={doCopy}>{copied === 'ok' ? 'Prompt copié ✓' : 'Copier le prompt'}</Btn>
        {copied === 'fail' && <textarea readOnly value={prompt} onFocus={e => e.target.select()} className="w-full h-32 mt-3 rounded-xl bg-s2 border border-border p-2 text-[11px]" />}
      </Card>
      <Card className="mb-3">
        <Label>Étape 2 · Aller dans l'IA</Label>
        <p className="text-xs text-txt2 mb-3">Colle le prompt dans Claude, ajoute la photo ou le texte de ta leçon, envoie.</p>
        <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="block text-center rounded-2xl px-4 py-3 text-sm font-semibold bg-s2 border border-border text-txt2">Ouvrir Claude</a>
      </Card>
      <Card>
        <Label>Étape 3 · Coller la réponse</Label>
        <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder="Colle ici toute la réponse de l'IA…"
          className="w-full h-40 rounded-xl bg-s2 border border-border p-3 text-xs outline-none focus:border-accent mb-3" />
        {err && <div className="mb-3"><p className="text-danger text-xs mb-2">{err}</p>
          <Btn kind="ghost" className="w-full" onClick={() => copy(fixMessage(err))}>Copier un message de correction pour l'IA</Btn></div>}
        <Btn className="w-full" onClick={analyse} disabled={!raw.trim()}>Importer</Btn>
      </Card>
    </Page>
  )
}

function CourseView({ c, onBack }: { c: CourseRow; onBack: () => void }) {
  const { reload } = useStore()
  const [confirm, setConfirm] = useState(false)
  return (
    <Page>
      <button onClick={onBack} className="text-muted text-sm mb-4">← Mes cours</button>
      <Zh zh={c.title} py={c.title_py} fr={c.title_fr} size="lg" />
      <div className="mt-5"><Label>Texte</Label></div>
      <div className="flex flex-col gap-3 mb-5">
        {(c.sentences ?? []).map((s, i) => (
          <div key={i} className="flex gap-2"><div className="flex-1"><Zh {...s} /></div>
            <button aria-label="Écouter" onClick={() => say(s.zh)} className="w-9 h-9 shrink-0 rounded-xl bg-s2 border border-border text-accent2 text-xs">▶</button></div>
        ))}
      </div>
      {(c.words?.length ?? 0) > 0 && <><Label>Vocabulaire</Label><div className="grid grid-cols-2 gap-2 mb-5">{c.words.map(w => <Zh key={w.zh} {...w} size="sm" />)}</div></>}
      {(c.grammar?.length ?? 0) > 0 && <><Label>Grammaire</Label><div className="flex flex-col gap-3 mb-5">{c.grammar.map((g, i) => (
        <div key={i} className="rounded-2xl bg-gold/5 border border-gold/20 p-3"><Zh zh={g.pattern} py={g.py} fr={g.fr} size="sm" />{g.example && <div className="font-ser text-sm text-txt2 mt-1">例：{g.example}</div>}</div>))}</div></>}
      {!confirm ? <Btn kind="bad" className="w-full" onClick={() => setConfirm(true)}>Supprimer ce cours</Btn> : (
        <div className="rounded-2xl border border-danger/40 p-3">
          <p className="text-xs text-txt2 mb-3">Le cours sera supprimé. Les caractères appris restent, avec leur progression.</p>
          <div className="grid grid-cols-2 gap-2"><Btn kind="ghost" onClick={() => setConfirm(false)}>Annuler</Btn>
            <Btn kind="bad" onClick={async () => { await deleteCourse(c.id); await reload(); onBack() }}>Supprimer</Btn></div>
        </div>)}
    </Page>
  )
}
