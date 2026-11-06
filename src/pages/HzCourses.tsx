import { useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { buildPrompt } from '@/lib/prompt'
import { fixMessage, parseLesson, planMerge, type ParseResult } from '@/lib/importer'
import { deleteCourse, importLesson } from '@/lib/data'
import { say } from '@/lib/tts'
import { Back, Btn, Card, Label, Page, Zh } from '@/components/ui'
import type { CourseRow, ImportChar } from '@/types/hanzi'

function Step({ n, title }: { n: number; title: string }) {
  return <div className="flex items-center gap-3 mb-2"><span className="w-7 h-7 rounded-full bg-s3 text-accent2 text-[13px] font-bold flex items-center justify-center">{n}</span><span className="text-[16px] font-semibold text-txt">{title}</span></div>
}

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
      <h2 className="text-[26px] font-bold text-txt mb-4">Cours</h2>
      <Btn className="w-full mb-5" onClick={() => setView('new')}>Ajouter un cours</Btn>
      <div className="flex flex-col gap-2">
        {store.courses.map(c => {
          const n = Object.entries(store.links).filter(([, ids]) => ids.includes(c.id)).length
          return (
            <button key={c.id} onClick={() => setView(c.id)} className="text-left rounded-[22px] bg-s1 border border-border p-4 active:bg-s2">
              <Zh zh={c.title} py={c.title_py} fr={c.title_fr} />
              <div className="text-[12px] text-muted mt-2">Ajouté le {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, {c.sentences?.length ?? 0} phrases, {n} caractères</div>
            </button>
          )
        })}
        {!store.courses.length && <p className="text-[15px] text-muted">Aucun cours pour l'instant. Ajoute ta première leçon pour remplir ta collection.</p>}
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
        <Back onClick={() => setRes(null)}>Modifier la réponse</Back>
        <Zh zh={res.lesson.title} py={res.lesson.title_py} fr={res.lesson.title_fr} size="lg" />
        <p className="text-[13px] text-muted mt-2 mb-4">{res.lesson.sentences.length} phrases, {res.lesson.words.length} mots, {res.lesson.grammar.length} points de grammaire</p>
        {res.problems.length > 0 && <div className="rounded-2xl p-3 mb-4 text-xs border border-gold/30 text-gold bg-gold/5">{res.problems.map((p, i) => <div key={i}>• {p}</div>)}</div>}

        <Label>{plan.fresh.length} nouveaux caractères. Corrige ou retire si besoin.</Label>
        <div className="flex flex-col gap-2 mb-5">
          {plan.fresh.map(c => (
            <div key={c.char} className="flex gap-3 items-center rounded-2xl bg-s1 border border-border p-2.5">
              <span className="font-ser text-[28px] w-11 h-11 flex items-center justify-center rounded-xl bg-ink border border-seal/20">{c.char}</span>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <input value={c.pinyin} onChange={e => setOne(c.char, 'pinyin', e.target.value)} className="bg-transparent text-sm text-accent3 italic outline-none" />
                <input value={c.meaning_fr} placeholder="sens à compléter" onChange={e => setOne(c.char, 'meaning_fr', e.target.value)} className="bg-transparent text-sm text-txt2 outline-none" />
              </div>
              <button aria-label="Retirer" onClick={() => setChars(cs => cs.filter(x => x.char !== c.char))} className="text-muted px-2">✕</button>
            </div>
          ))}
        </div>
        <Label>{plan.known.length} déjà dans ta collection. Ils gardent leur progression.</Label>
        <div className="flex flex-wrap gap-1.5 mb-6">
          {plan.known.map(c => <span key={c.char} className="font-ser text-[19px] w-9 h-9 flex items-center justify-center rounded-lg bg-s1 border border-border text-txt2">{c.char}</span>)}
        </div>
        {err && <p className="text-danger text-xs mb-3">{err}</p>}
        <Btn className="w-full" onClick={save} disabled={busy}>{busy ? 'Ajout…' : `Ajouter au programme (${plan.fresh.length} nouveaux)`}</Btn>
      </Page>
    )
  }

  return (
    <Page>
      <Back onClick={onDone}>Cours</Back>
      <h2 className="text-[26px] font-bold text-txt mb-1">Ajouter un cours</h2>
      <p className="text-[14px] text-muted mb-5">Trois étapes, environ deux minutes.</p>
      <Card className="mb-3">
        <Step n={1} title="Copie le prompt" />
        <p className="text-[14px] text-txt2 mb-3">Il contient la liste de tes {Object.keys(store.chars).length} caractères, pour que Claude garde les mêmes sens d'un cours à l'autre.</p>
        <Btn className="w-full" onClick={doCopy}>{copied === 'ok' ? 'Prompt copié ✓' : 'Copier le prompt'}</Btn>
        {copied === 'fail' && <textarea readOnly value={prompt} onFocus={e => e.target.select()} className="w-full h-32 mt-3 rounded-xl bg-s2 border border-border p-2 text-[11px]" />}
      </Card>
      <Card className="mb-3">
        <Step n={2} title="Envoie-le à Claude avec ta leçon" />
        <p className="text-[14px] text-txt2 mb-3">Colle le prompt, ajoute la photo ou le texte de ta leçon, puis envoie.</p>
        <a href="https://claude.ai/new" target="_blank" rel="noreferrer" className="block text-center rounded-2xl px-4 py-3.5 text-[15px] font-semibold bg-s2 border border-border text-txt">Ouvrir Claude</a>
      </Card>
      <Card>
        <Step n={3} title="Colle la réponse ici" />
        <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder="Colle toute la réponse de Claude, même avec du texte autour."
          className="w-full h-40 rounded-xl bg-ink border border-border p-3 text-[13px] outline-none focus:border-accent2 mb-3" />
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
      <Back onClick={onBack}>Cours</Back>
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
