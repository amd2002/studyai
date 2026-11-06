import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { pendingCount } from '@/lib/data'
import { Btn, Label, Page } from '@/components/ui'

const KEY = 'hz_new_per_day'
export const getNewPerDay = () => { try { return Number(localStorage.getItem(KEY)) || 10 } catch { return 10 } }

export default function HzSettings({ onClose }: { onClose: () => void }) {
  const [n, setN] = useState(getNewPerDay())
  const [email, setEmail] = useState('')
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || '')) }, [])
  const set = (v: number) => { setN(v); try { localStorage.setItem(KEY, String(v)) } catch {} }
  return (
    <Page>
      <button onClick={onClose} className="text-muted text-sm mb-4">← Retour</button>
      <h2 className="font-syne font-bold text-xl mb-1">Réglages</h2>
      <p className="text-muted text-xs mb-6">{email}</p>
      <Label>Nouveaux caractères par jour</Label>
      <div className="flex gap-2 mb-2">
        {[5, 10, 15, 20, 30].map(v => (
          <button key={v} onClick={() => set(v)} className={`flex-1 py-3 rounded-2xl text-sm font-semibold border ${n === v ? 'bg-accent text-white border-accent' : 'border-border text-txt2'}`}>{v}</button>
        ))}
      </div>
      <p className="text-xs text-muted mb-6">Pour chaque piste (lecture et écriture). Les anciens à revoir passent toujours en plus.</p>
      <p className="text-xs text-muted mb-6">Réponses en attente d'envoi : {pendingCount()}</p>
      <Btn kind="ghost" className="w-full" onClick={() => supabase.auth.signOut()}>Se déconnecter</Btn>
    </Page>
  )
}
