import { useState } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import Scanner from '@/pages/Scanner'
import Library from '@/pages/Library'
import Quiz from '@/pages/Quiz'
import Slate from '@/pages/Slate'

const TABS = [
  { id: 'home',    icon: '🏠', label: 'Accueil' },
  { id: 'scanner', icon: '📸', label: 'Scanner' },
  { id: 'slate',   icon: '✍️', label: 'Ardoise' },
  { id: 'quiz',    icon: '🎯', label: 'Quiz'    },
  { id: 'library', icon: '📚', label: 'Cours'   },
]

function AppInner() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('home')
  const [quizData, setQuizData] = useState<any[]>([])
  const [flashData, setFlashData] = useState<any[]>([])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-10 h-10 rounded-full border-2 border-border border-t-accent animate-spin" />
    </div>
  )
  if (!user) return <Login />

  const goQuiz = (quiz: any[], words: any[]) => {
    setQuizData(quiz); setFlashData(words); setTab('quiz')
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-bg overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-s1 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="font-extrabold text-base">Study<span className="text-accent2">AI</span></span>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-xs bg-s2 border border-border px-3 py-1.5 rounded-full text-muted hover:border-accent">
          Sortir
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className={tab === 'home'    ? 'h-full' : 'hidden'}><Home    onGoQuiz={goQuiz} onTab={setTab} /></div>
        <div className={tab === 'scanner' ? 'h-full' : 'hidden'}><Scanner onGoQuiz={goQuiz} /></div>
        <div className={tab === 'slate'   ? 'h-full' : 'hidden'}><Slate /></div>
        <div className={tab === 'quiz'    ? 'h-full' : 'hidden'}><Quiz quiz={quizData} words={flashData} /></div>
        <div className={tab === 'library' ? 'h-full' : 'hidden'}><Library onGoQuiz={goQuiz} /></div>
      </div>

      {/* Bottom Tabs */}
      <nav className="flex bg-s1 border-t border-border flex-shrink-0 safe-bottom">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-all ${
              tab === t.id ? 'text-accent2' : 'text-muted'
            }`}>
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-[9px] font-mono tracking-wide">{t.label}</span>
            {tab === t.id && <div className="w-4 h-0.5 bg-accent2 rounded-full mt-0.5" />}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
