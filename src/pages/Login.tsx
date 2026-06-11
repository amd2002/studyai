// Login / Register with Supabase Auth (email + Google).

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const handleEmail = async () => {
    setError(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw })
        if (error) throw error
        setInfo('Compte créé ! Vérifie ta boîte mail pour confirmer.')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-2xl font-extrabold">Study<span className="text-accent2">AI</span></h1>
          <p className="text-muted text-sm mt-1">Ton cahier intelligent</p>
        </div>

        <div className="bg-s2 border border-border rounded-2xl p-6">
          <div className="flex gap-2 mb-5">
            <button onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'login' ? 'bg-accent text-white' : 'bg-s3 text-muted'}`}>
              Connexion
            </button>
            <button onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'register' ? 'bg-accent text-white' : 'bg-s3 text-muted'}`}>
              Inscription
            </button>
          </div>

          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-s3 border border-border rounded-lg px-4 py-3 text-sm mb-3 outline-none focus:border-accent" />
          <input type="password" placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)}
            className="w-full bg-s3 border border-border rounded-lg px-4 py-3 text-sm mb-3 outline-none focus:border-accent" />

          {error && <p className="text-danger text-xs mb-3">{error}</p>}
          {info && <p className="text-green text-xs mb-3">{info}</p>}

          <button onClick={handleEmail} disabled={busy}
            className="w-full bg-accent text-white py-3 rounded-lg font-bold text-sm mb-3 disabled:opacity-50">
            {busy ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" /><span className="text-muted text-xs">ou</span><div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={handleGoogle}
            className="w-full bg-s3 border border-border py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:border-accent transition">
            <span>🔵</span> Continuer avec Google
          </button>
        </div>
      </div>
    </div>
  )
}
