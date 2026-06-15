import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import Scanner from '@/pages/Scanner'
import Library from '@/pages/Library'
import Quiz from '@/pages/Quiz'
import Slate from '@/pages/Slate'

const TABS = [
  { id: 'home',    icon: '⌂',  label: 'Accueil' },
  { id: 'scanner', icon: '◎',  label: 'Scanner' },
  { id: 'slate',   icon: '✦',  label: 'Ardoise' },
  { id: 'quiz',    icon: '◈',  label: 'Quiz'    },
  { id: 'library', icon: '▤',  label: 'Cours'   },
]

function AppInner() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('home')
  const [quizData, setQuizData] = useState<any[]>([])
  const [flashData, setFlashData] = useState<any[]>([])
  const [prevTab, setPrevTab] = useState('home')

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-s3 border-t-accent animate-spin" />
      <p className="text-muted text-sm font-mono tracking-widest">CHARGEMENT</p>
    </div>
  )

  if (!user) return <Login />

  const goQuiz = (quiz: any[], words: any[]) => {
    setQuizData(quiz); setFlashData(words); setTab('quiz')
  }

  const changeTab = (t: string) => {
    setPrevTab(tab)
    setTab(t)
  }

  const initials = user.email?.slice(0,2).toUpperCase() || 'ME'

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-bg overflow-hidden" style={{ background: 'linear-gradient(160deg, #0a0a1a 0%, #080810 60%, #0a0810 100%)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(124,111,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 0 16px rgba(124,111,255,0.4)' }}>
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <span className="font-syne font-bold text-base text-txt">Study</span>
            <span className="font-syne font-bold text-base text-accent2">AI</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-accent2 border border-accent/30" style={{ background: 'rgba(124,111,255,0.1)' }}>
            {initials}
          </div>
          <button onClick={() => supabase.auth.signOut()}
            className="text-xs px-3 py-1.5 rounded-lg text-muted border transition hover:text-txt"
            style={{ borderColor: 'rgba(124,111,255,0.15)', background: 'rgba(124,111,255,0.05)' }}>
            Sortir
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className={tab === 'home'    ? 'h-full anim-up' : 'hidden'}><Home    onGoQuiz={goQuiz} onTab={changeTab} /></div>
        <div className={tab === 'scanner' ? 'h-full anim-up' : 'hidden'}><Scanner onGoQuiz={goQuiz} /></div>
        <div className={tab === 'slate'   ? 'h-full anim-up' : 'hidden'}><Slate /></div>
        <div className={tab === 'quiz'    ? 'h-full anim-up' : 'hidden'}><Quiz quiz={quizData} words={flashData} /></div>
        <div className={tab === 'library' ? 'h-full anim-up' : 'hidden'}><Library onGoQuiz={goQuiz} /></div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="flex-shrink-0 safe-bottom" style={{ background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(124,111,255,0.1)' }}>
        <div className="flex px-2 py-1">
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => changeTab(t.id)}
                className="flex-1 flex flex-col items-center py-2 gap-1 relative transition-all duration-200">
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #7C6FFF, transparent)' }} />
                )}
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`}
                  style={active ? { background: 'rgba(124,111,255,0.15)', boxShadow: '0 0 16px rgba(124,111,255,0.2)' } : {}}>
                  <span className={`text-lg font-bold transition-all ${active ? 'text-accent2' : 'text-muted'}`}
                    style={{ fontFamily: 'Inter' }}>{t.icon}</span>
                </div>
                <span className={`text-[9px] font-mono tracking-wider transition-all ${active ? 'text-accent2' : 'text-muted'}`}>
                  {t.label.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
