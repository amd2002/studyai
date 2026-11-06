import { useMemo, useState } from 'react'
import { useStore } from '@/context/StoreContext'
import { available, isDue, isMastered, isNew, today, addDays } from '@/lib/srs'
import { importLesson } from '@/lib/data'
import { getNewPerDay } from '@/pages/HzSettings'
import { Btn, Card, Label, Page } from '@/components/ui'
import seed from '@/data/seed-lessons.json'
import type { LessonImport, Track } from '@/types/hanzi'

export default function HzHome({ onReview, onTab }: { onReview: (t: Track) => void; onTab: (t: string) => void }) {
  const { store, loading, offline, reload } = useStore()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const chars = Object.values(store.chars)
  const n = getNewPerDay()

  const s = useMemo(() => {
    const t = today()
    const c = (f: (x: typeof chars[0]) => boolean) => chars.filter(f).length
    return {
      readDue: c(x => isDue(x, 'read', t)), writeDue: c(x => available(x, 'write') && isDue(x, 'write', t)),
      readNew: Math.min(n, c(x => isNew(x, 'read'))), writeNew: Math.min(n, c(x => available(x, 'write') && isNew(x, 'write'))),
      total: chars.length, mRead: c(x => isMastered(x, 'read')), mWrite: c(x => isMastered(x, 'write')),
    }
  }, [store, n])

  // Série de jours : un jour compte s'il y a eu au moins une révision ce jour-là.
  const streak = useMemo(() => {
    const days = new Set(chars.flatMap(c => [c.read_last, c.write_last]).filter(Boolean).map(d => today(new Date(d!))))
    let k = 0, d = today()
    if (!days.has(d)) d = addDays(d, -1)
    while (days.has(d)) { k++; d = addDays(d, -1) }
    return k
  }, [store])

  const importSeed = async () => {
    setBusy(true); setErr('')
    try {
      let known = { ...store.chars }
      for (const l of seed as LessonImport[]) {
        await importLesson(l, known)
        for (const c of l.characters) known[c.char] ??= c as any
      }
      await reload()
    } catch (e: any) { setErr(e.message || String(e)) } finally { setBusy(false) }
  }

  if (loading && !chars.length) return <Page><p className="text-muted text-sm">Chargement…</p></Page>

  return (
    <Page>
      <div className="mb-6">
        <div className="font-ser text-4xl text-gold">汉字圈</div>
        <div className="text-sm text-accent3 italic">Hànzì quān</div>
        <div className="text-sm text-txt2">Le cercle des caractères</div>
      </div>

      {offline && <div className="rounded-2xl p-3 mb-4 text-xs border border-gold/30 text-gold bg-gold/5">
        Hors ligne : tu révises avec la copie sur ton téléphone. Tout sera envoyé au retour du réseau.
      </div>}

      {!chars.length ? (
        <Card className="mb-4">
          <Label>Pour commencer</Label>
          <p className="text-sm text-txt2 mb-4">Ton programme est vide. Importe tes 4 sujets d'oral (255 caractères) ou ajoute un cours.</p>
          <div className="flex flex-col gap-2">
            <Btn onClick={importSeed} disabled={busy}>{busy ? 'Import…' : 'Importer mes 4 sujets d’oral'}</Btn>
            <Btn kind="ghost" onClick={() => onTab('courses')}>Ajouter un cours</Btn>
          </div>
          {err && <p className="text-danger text-xs mt-3">{err}</p>}
        </Card>
      ) : (
        <>
          <Label>Aujourd'hui</Label>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button onClick={() => onReview('read')} className="text-left rounded-3xl p-4 bg-s1 border border-border active:scale-[0.98] transition">
              <div className="font-ser text-3xl text-gold">读</div>
              <div className="text-xs text-accent3 italic">dú · lire</div>
              <div className="mt-3 text-2xl font-bold text-txt tabular-nums">{s.readDue + s.readNew}</div>
              <div className="text-xs text-muted">{s.readDue} à revoir · {s.readNew} nouveaux</div>
            </button>
            <button onClick={() => onReview('write')} className="text-left rounded-3xl p-4 bg-s1 border border-border active:scale-[0.98] transition">
              <div className="font-ser text-3xl text-gold">写</div>
              <div className="text-xs text-accent3 italic">xiě · écrire</div>
              <div className="mt-3 text-2xl font-bold text-txt tabular-nums">{s.writeDue + s.writeNew}</div>
              <div className="text-xs text-muted">{s.writeDue} à revoir · {s.writeNew} nouveaux</div>
            </button>
          </div>
          <Btn className="w-full mb-6" onClick={() => onReview(s.readDue + s.readNew ? 'read' : 'write')}>Commencer la session</Btn>

          <Label>Ma progression</Label>
          <Card className="mb-4">
            <div className="grid grid-cols-3 text-center">
              <div><div className="text-2xl font-bold tabular-nums">{s.total}</div><div className="text-[11px] text-muted">caractères</div></div>
              <div><div className="text-2xl font-bold tabular-nums text-green">{s.mRead}</div><div className="text-[11px] text-muted">je sais lire</div></div>
              <div><div className="text-2xl font-bold tabular-nums text-green">{s.mWrite}</div><div className="text-[11px] text-muted">je sais écrire</div></div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-s3 overflow-hidden">
              <div className="h-full bg-green" style={{ width: `${s.total ? (s.mRead / s.total) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-muted mt-3">Série : <b className="text-txt">{streak}</b> jour{streak > 1 ? 's' : ''} de suite. « Je sais » = niveau 5 ou plus (revu sans erreur sur plusieurs semaines).</p>
          </Card>
          <Btn kind="ghost" className="w-full" onClick={() => onTab('courses')}>+ Ajouter un nouveau cours</Btn>
        </>
      )}
    </Page>
  )
}
