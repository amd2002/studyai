import { useState } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { StoreProvider } from '@/context/StoreContext'
import Login from '@/pages/Login'
import HzHome from '@/pages/HzHome'
import HzReview from '@/pages/HzReview'
import HzListen from '@/pages/HzListen'
import HzChars from '@/pages/HzChars'
import HzCourses from '@/pages/HzCourses'
import HzSettings from '@/pages/HzSettings'
import type { Track } from '@/types/hanzi'

const TABS = [
  { id: 'home',    icon: '家', label: 'Accueil' },
  { id: 'review',  icon: '练', label: 'Réviser' },
  { id: 'listen',  icon: '听', label: 'Écouter' },
  { id: 'chars',   icon: '字', label: 'Caractères' },
  { id: 'courses', icon: '课', label: 'Cours' },
]

function AppInner() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('home')
  const [track, setTrack] = useState<Track>('read')
  const [reviewKey, setReviewKey] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-s3 border-t-accent animate-spin" />
      <p className="text-muted text-sm font-mono tracking-widest">CHARGEMENT</p>
    </div>
  )
  if (!user) return <Login />

  const startReview = (t: Track) => { setTrack(t); setReviewKey(k => k + 1); setTab('review') }

  return (
    <StoreProvider>
      <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-bg overflow-hidden" style={{ background: 'linear-gradient(160deg, #0a0a1a 0%, #080810 60%, #0a0810 100%)' }}>
        <header className="flex items-center justify-between px-5 pb-3 flex-shrink-0" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', borderBottom: '1px solid rgba(124,111,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 0 16px rgba(124,111,255,0.4)' }}>
              <span className="text-white text-base font-ser">字</span>
            </div>
            <span className="font-ser font-bold text-base text-txt">汉字圈</span>
          </div>
          <button onClick={() => setShowSettings(s => !s)} aria-label="Réglages"
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-accent2 border border-accent/30" style={{ background: 'rgba(124,111,255,0.1)' }}>
            {user.email?.slice(0, 2).toUpperCase() || 'ME'}
          </button>
        </header>

        <div className="flex-1 overflow-hidden">
          {showSettings ? <HzSettings onClose={() => setShowSettings(false)} /> : (
            <>
              {tab === 'home' && <HzHome onReview={startReview} onTab={setTab} />}
              {tab === 'review' && <HzReview key={`${track}-${reviewKey}`} track={track} onTrack={startReview} onExit={() => setTab('home')} />}
              {tab === 'listen' && <HzListen />}
              {tab === 'chars' && <HzChars />}
              {tab === 'courses' && <HzCourses />}
            </>
          )}
        </div>

        {!showSettings && (
          <nav className="flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)', background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(124,111,255,0.1)' }}>
            <div className="flex px-2 py-1">
              {TABS.map(t => {
                const active = tab === t.id
                return (
                  <button key={t.id} onClick={() => (t.id === 'review' ? startReview(track) : setTab(t.id))} className="flex-1 flex flex-col items-center py-2 gap-1">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={active ? { background: 'rgba(124,111,255,0.15)', boxShadow: '0 0 16px rgba(124,111,255,0.2)' } : {}}>
                      <span className={`font-ser text-lg ${active ? 'text-accent2' : 'text-muted'}`}>{t.icon}</span>
                    </div>
                    <span className={`text-[9px] font-mono tracking-wider ${active ? 'text-accent2' : 'text-muted'}`}>{t.label.toUpperCase()}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </StoreProvider>
  )
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
