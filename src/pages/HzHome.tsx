import { useMemo, useState } from 'react'
import { newestFirst, useStore } from '@/context/StoreContext'
import { available, buildSession, isDue, isMastered, isNew, today, addDays } from '@/lib/srs'
import { importLesson } from '@/lib/data'
import { getNewPerDay } from '@/pages/HzSettings'
import { Btn, Card, Label, Page, Tian, levelColor } from '@/components/ui'
import seed from '@/data/seed-lessons.json'
import type { LessonImport, Track } from '@/types/hanzi'

/** L'anneau 圈 : la part de ta collection que tu sais lire. */
function Ring({ value, total, children }: { value: number; total: number; children: React.ReactNode }) {
  const r = 86, c = 2 * Math.PI * r, p = total ? value / total : 0
  return (
    <div className="relative w-[200px] h-[200px] mx-auto">
      <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#1a1a35" strokeWidth="10" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`} className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700" />
      </svg>
      <div className="absolute inset-[26px] flex items-center justify-center">{children}</div>
    </div>
  )
}

export default function HzHome({ onReview, onTab }: { onReview: (t: Track) => void; onTab: (t: string) => void }) {
  const { store, loading, offline, reload } = useStore()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const chars = Object.values(store.chars)
  const n = getNewPerDay()

  const s = useMemo(() => {
    const t = today()
    const cnt = (f: (x: typeof chars[0]) => boolean) => chars.filter(f).length
    const next = buildSession(chars, 'read', n, newestFirst(store))[0]?.char
      ?? buildSession(chars, 'write', n, newestFirst(store))[0]?.char
    return {
      readDue: cnt(x => isDue(x, 'read', t)), writeDue: cnt(x => available(x, 'write') && isDue(x, 'write', t)),
      readNew: Math.min(n, cnt(x => isNew(x, 'read'))), writeNew: Math.min(n, cnt(x => available(x, 'write') && isNew(x, 'write'))),
      total: chars.length, mRead: cnt(x => isMastered(x, 'read')), mWrite: cnt(x => isMastered(x, 'write')), next,
    }
  }, [store, n])

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
      const known = { ...store.chars }
      for (const l of seed as LessonImport[]) {
        await importLesson(l, known)
        for (const c of l.characters) known[c.char] ??= c as any
      }
      await reload()
    } catch (e: any) { setErr(e.message || String(e)) } finally { setBusy(false) }
  }

  if (loading && !chars.length) return <Page><p className="text-muted text-sm">Chargement de tes caractères…</p></Page>

  if (!chars.length) return (
    <Page>
      <div className="flex flex-col items-center text-center pt-6">
        <Tian size={150}><span className="font-ser text-[96px] leading-none text-txt">字</span></Tian>
        <h1 className="font-ser text-[30px] text-txt mt-6">汉字圈</h1>
        <p className="text-[13px] text-accent3 italic">Hànzì quān</p>
        <p className="text-[15px] text-txt2 mt-1 max-w-[18rem]">Chaque cours ajoute ses caractères. Tu les révises en boucle jusqu'à savoir les lire et les écrire.</p>
      </div>
      <div className="flex flex-col gap-2 mt-8">
        <Btn onClick={importSeed} disabled={busy}>{busy ? 'Import en cours…' : 'Commencer avec mes 4 sujets d’oral'}</Btn>
        <Btn kind="ghost" onClick={() => onTab('courses')}>Ajouter un autre cours</Btn>
      </div>
      <p className="text-[12px] text-muted text-center mt-3">Les 4 sujets contiennent 255 caractères.</p>
      {err && <p className="text-danger text-sm mt-3">{err}</p>}
    </Page>
  )

  const todo = s.readDue + s.readNew + s.writeDue + s.writeNew
  const mosaic = [...chars].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))

  return (
    <Page>
      {offline && <div className="rounded-2xl p-3 mb-4 text-[13px] border border-gold/25 text-gold bg-gold/5">
        Pas de réseau. Tu révises avec la copie du téléphone, tout sera envoyé au retour du réseau.
      </div>}

      <div className="pt-2 pb-1">
        <Ring value={s.mRead} total={s.total}>
          {s.next ? (
            <Tian size="100%" diag={false} className="!rounded-full !border-0">
              <span className="font-ser text-[76px] leading-none text-txt">{s.next}</span>
            </Tian>
          ) : <span className="font-ser text-[56px] text-green">好</span>}
        </Ring>
        <p className="text-center text-[13px] text-muted mt-3">
          Tu sais lire <b className="text-txt">{s.mRead}</b> caractères sur {s.total}, et en écrire <b className="text-txt">{s.mWrite}</b>.
        </p>
      </div>

      <div className="mt-6 rounded-[22px] bg-s1 border border-border divide-y divide-border">
        {([['read', '读', 'dú', 'Lire', s.readDue, s.readNew], ['write', '写', 'xiě', 'Écrire', s.writeDue, s.writeNew]] as const).map(([t, zh, py, fr, due, fresh]) => (
          <button key={t} onClick={() => onReview(t)} className="w-full flex items-center gap-4 px-4 py-4 text-left active:bg-s2 first:rounded-t-[22px] last:rounded-b-[22px]">
            <span className="font-ser text-[34px] leading-none text-gold w-10 text-center">{zh}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[16px] text-txt font-semibold">{fr} <i className="text-accent3 font-normal text-[13px]">{py}</i></span>
              <span className="block text-[13px] text-muted">
                {due + fresh === 0 ? (t === 'write' && !chars.some(c => c.write_unlocked) ? 'Se débloque après tes premières lectures' : 'Rien pour aujourd’hui')
                  : `${due} à revoir, ${fresh} nouveau${fresh > 1 ? 'x' : ''}`}
              </span>
            </span>
            <span className="text-[22px] font-semibold tabular-nums text-txt">{due + fresh}</span>
          </button>
        ))}
      </div>

      <Btn className="w-full mt-4" disabled={!todo} onClick={() => onReview(s.readDue + s.readNew ? 'read' : 'write')}>
        {todo ? 'Commencer la session' : 'Tout est fait pour aujourd’hui'}
      </Btn>
      {streak > 0 && <p className="text-center text-[13px] text-muted mt-3">{streak} jour{streak > 1 ? 's' : ''} de révision de suite</p>}

      <div className="mt-8">
        <Label>Ta collection</Label>
        <Card className="!p-4">
          <div className="flex flex-wrap gap-[3px]">
            {mosaic.map(c => <span key={c.char} className="w-[9px] h-[9px] rounded-[2px]" style={{ background: levelColor(c.read_level, isNew(c, 'read')) }} />)}
          </div>
          <div className="flex gap-4 text-[12px] text-muted mt-3 flex-wrap">
            {[['#3a3858', 'pas commencé'], ['#c2793a', 'en cours'], ['#F0C96A', 'presque'], ['#10b981', 'maîtrisé']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-[2px]" style={{ background: c }} />{l}</span>
            ))}
          </div>
        </Card>
      </div>

      <Btn kind="quiet" className="w-full mt-3" onClick={() => onTab('courses')}>Ajouter un nouveau cours</Btn>
    </Page>
  )
}
