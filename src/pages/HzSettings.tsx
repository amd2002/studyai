import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { pendingCount } from '@/lib/data'
import { Back, Btn, Label, Page } from '@/components/ui'

const KEY = 'hz_new_per_day'
export const getNewPerDay = () => { try { return Number(localStorage.getItem(KEY)) || 10 } catch { return 10 } }

export default function HzSettings({ onClose }: { onClose: () => void }) {
  const [n, setN] = useState(getNewPerDay())
  const [email, setEmail] = useState('')
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || '')) }, [])
  const set = (v: number) => { setN(v); try { localStorage.setItem(KEY, String(v)) } catch {} }
  return (
    <Page>
      <Back onClick={onClose}>Retour</Back>
      <h2 className="text-[26px] font-bold text-txt">Réglages</h2>
      <p className="text-muted text-[13px] mb-6">Connecté avec {email}</p>
      <Label>Nouveaux caractères par jour</Label>
      <div className="flex gap-2 mb-2">
        {[5, 10, 15, 20, 30].map(v => (
          <button key={v} onClick={() => set(v)} className={`flex-1 py-3 rounded-2xl text-[15px] font-semibold border tabular-nums ${n === v ? 'bg-txt text-bg border-txt' : 'bg-s1 border-border text-txt2'}`}>{v}</button>
        ))}
      </div>
      <p className="text-[13px] text-muted mb-6">Pour la lecture et pour l'écriture. Les caractères à revoir s'ajoutent toujours en plus.</p>
      {pendingCount() > 0 && <p className="text-[13px] text-gold mb-6">{pendingCount()} réponses attendent le réseau pour être envoyées.</p>}
      <Btn kind="ghost" className="w-full" onClick={() => supabase.auth.signOut()}>Se déconnecter</Btn>
    </Page>
  )
}
