import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const LANGS = [
  { code: 'français', flag: '🇫🇷', label: 'Français' },
  { code: 'anglais',  flag: '🇬🇧', label: 'Anglais'  },
  { code: 'arabe',    flag: '🇸🇦', label: 'Arabe'    },
]

const STORAGE_KEY = 'studyai_explain_lang'

export function getExplainLang(): string {
  return localStorage.getItem(STORAGE_KEY) || 'français'
}

export function setExplainLang(lang: string) {
  localStorage.setItem(STORAGE_KEY, lang)
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const [lang, setLang] = useState(getExplainLang())
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''))
  }, [])

  const choose = (code: string) => {
    setLang(code)
    setExplainLang(code)
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-none pb-28">
      <div className="px-5 pt-5">
        <button onClick={onClose} className="flex items-center gap-2 text-muted text-sm mb-5">
          ← Retour
        </button>

        <h2 className="font-syne font-bold text-xl text-txt mb-1">Réglages</h2>
        <p className="text-muted text-xs mb-6">{email}</p>

        <p className="text-[10px] font-mono text-muted tracking-widest uppercase mb-3">
          LANGUE D'EXPLICATION
        </p>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          La langue utilisée par l'IA pour t'expliquer tes cours. Tu n'as plus besoin de la
          choisir à chaque scan — c'est réglé une fois ici.
        </p>

        <div className="space-y-2 mb-8">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => choose(l.code)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200"
              style={lang === l.code
                ? { background: 'linear-gradient(135deg, rgba(124,111,255,0.15), rgba(124,111,255,0.05))', border: '1px solid rgba(124,111,255,0.3)' }
                : { background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.08)' }}>
              <span className="text-2xl">{l.flag}</span>
              <span className="font-semibold text-sm flex-1 text-left" style={{ color: lang === l.code ? '#A78BFA' : '#C4C0D8' }}>
                {l.label}
              </span>
              {lang === l.code && <span style={{ color: '#7C6FFF' }}>✓</span>}
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#10b981' }}>
            ✨ La matière (chinois, maths, sciences...) est maintenant détectée automatiquement
            par l'IA en regardant ta photo — plus besoin de la sélectionner non plus !
          </p>
        </div>
      </div>
    </div>
  )
}
