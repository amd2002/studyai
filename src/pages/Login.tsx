import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [mode, setMode] = useState<'login'|'register'>('login')
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
        setInfo('Compte créé ! Vérifie ta boîte mail.')
      }
    } catch (e: any) { setError(e.message) }
    finally { setBusy(false) }
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a0a1a 0%, #080810 60%, #0a0810 100%)' }}>

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,111,255,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(240,201,106,0.05) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 0 40px rgba(124,111,255,0.4), 0 0 80px rgba(124,111,255,0.15)' }}>
            <span className="text-white text-3xl font-bold font-syne">S</span>
          </div>
          <h1 className="font-syne font-bold text-3xl mb-1">
            Study<span className="text-accent2">AI</span>
          </h1>
          <p className="text-muted text-sm">Ton cahier intelligent</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6" style={{ background: 'rgba(15,15,30,0.8)', backdropFilter: 'blur(30px)', border: '1px solid rgba(124,111,255,0.15)', boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)' }}>

          {/* Mode toggle */}
          <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.1)' }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={mode===m ? { background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', color: '#fff', boxShadow: '0 4px 12px rgba(124,111,255,0.3)' } : { color: '#6B6880' }}>
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-3 mb-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-txt placeholder:text-muted"
              style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.12)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,111,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(124,111,255,0.12)'} />
            <input type="password" placeholder="Mot de passe" value={pw} onChange={e => setPw(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-txt placeholder:text-muted"
              style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.12)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,111,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(124,111,255,0.12)'} />
          </div>

          {error && <p className="text-danger text-xs mb-3 text-center">{error}</p>}
          {info  && <p className="text-green  text-xs mb-3 text-center">{info}</p>}

          <button onClick={handleEmail} disabled={busy}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 mb-3 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 4px 20px rgba(124,111,255,0.3)' }}>
            {busy ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(124,111,255,0.1)' }} />
            <span className="text-muted text-xs">ou</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(124,111,255,0.1)' }} />
          </div>

          <button onClick={handleGoogle}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 text-txt2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuer avec Google
          </button>
        </div>
      </div>
    </div>
  )
}
