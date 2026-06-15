import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Course } from '@/types'

const SUBJECTS: Record<string, { color: string; glow: string; icon: string; grad: string }> = {
  'Chinois':       { color: '#ef4444', glow: 'rgba(239,68,68,0.2)',   icon: '🇨🇳', grad: 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))' },
  'Mathématiques': { color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',  icon: '📐', grad: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))' },
  'Sciences':      { color: '#10b981', glow: 'rgba(16,185,129,0.2)',  icon: '🔬', grad: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))' },
  'Histoire':      { color: '#22d3ee', glow: 'rgba(34,211,238,0.2)',  icon: '📜', grad: 'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(34,211,238,0.05))' },
  'Autre':         { color: '#A78BFA', glow: 'rgba(167,139,250,0.2)', icon: '📚', grad: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(167,139,250,0.05))' },
}
const SC = (s: string) => SUBJECTS[s] || SUBJECTS['Autre']

export default function Home({ onGoQuiz, onTab }: { onGoQuiz: (q: any[], w: any[]) => void; onTab: (t: string) => void }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [filter, setFilter] = useState('Tous')

  useEffect(() => { api.listCourses().then(setCourses).catch(console.error) }, [])

  const subjects = ['Tous', ...Array.from(new Set(courses.map(c => c.subject)))]
  const filtered = filter === 'Tous' ? courses : courses.filter(c => c.subject === filter)

  const totalWords = courses.reduce((a, c) => a + (c.words?.length || 0), 0)
  const totalQuiz  = courses.reduce((a, c) => a + (c.quiz?.length  || 0), 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="h-full overflow-y-auto scrollbar-none">
      {/* Hero section */}
      <div className="px-5 pt-5 pb-4 relative">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,111,255,0.06) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        <p className="text-muted text-xs font-mono mb-1 tracking-widest">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        </p>
        <h2 className="font-syne font-bold text-xl text-txt mb-4">{greeting} 👋</h2>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { n: courses.length, l: 'Leçons',  color: '#7C6FFF' },
            { n: totalWords,     l: 'Mots',    color: '#F0C96A' },
            { n: totalQuiz,      l: 'Quiz',    color: '#10b981' },
          ].map(s => (
            <div key={s.l} className="rounded-2xl p-3 text-center relative overflow-hidden"
              style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(circle at 50% 0%, ${s.color}22, transparent 70%)` }} />
              <div className="relative">
                <div className="text-2xl font-bold font-mono mb-0.5" style={{ color: s.color }}>{s.n}</div>
                <div className="text-[10px] text-muted tracking-widest uppercase font-mono">{s.l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button onClick={() => onTab('scanner')}
            className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', boxShadow: '0 4px 20px rgba(124,111,255,0.3)' }}>
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3), transparent 60%)' }} />
            <span className="text-2xl">◎</span>
            <div className="text-left">
              <div className="font-bold text-sm text-white">Scanner</div>
              <div className="text-xs text-white/70">Analyser un cours</div>
            </div>
          </button>
          <button onClick={() => onTab('slate')}
            className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden transition-transform active:scale-95"
            style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <span className="text-2xl">✦</span>
            <div className="text-left">
              <div className="font-bold text-sm text-txt">Ardoise</div>
              <div className="text-xs text-muted">Écrire en chinois</div>
            </div>
          </button>
        </div>
      </div>

      {/* Subject filters */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-none">
        {subjects.map(s => {
          const sc = s !== 'Tous' ? SC(s) : null
          const active = filter === s
          return (
            <button key={s} onClick={() => setFilter(s)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
              style={active ? {
                background: sc ? `linear-gradient(135deg, ${sc.color}33, ${sc.color}11)` : 'linear-gradient(135deg, #7C6FFF33, #7C6FFF11)',
                border: `1px solid ${sc ? sc.color + '44' : '#7C6FFF44'}`,
                color: sc ? sc.color : '#A78BFA',
              } : {
                background: 'rgba(124,111,255,0.04)',
                border: '1px solid rgba(124,111,255,0.1)',
                color: '#6B6880',
              }}>
              {sc ? sc.icon + ' ' : ''}{s}
            </button>
          )
        })}
      </div>

      {/* Course list */}
      <div className="px-5 pb-28">
        <p className="text-[10px] font-mono text-muted tracking-widest uppercase mb-3">COURS RÉCENTS</p>
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 opacity-30">◎</div>
            <p className="text-txt2 text-sm font-medium mb-1">Aucun cours encore</p>
            <p className="text-muted text-xs">Scanne ta première leçon pour commencer</p>
          </div>
        ) : filtered.map((c, i) => {
          const sc = SC(c.subject)
          return (
            <div key={c.id} className="rounded-2xl p-4 mb-3 relative overflow-hidden transition-all active:scale-98"
              style={{ background: sc.grad, border: `1px solid ${sc.color}22`, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${sc.glow}, transparent 70%)`, filter: 'blur(15px)' }} />
              <div className="relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 mr-2">
                    <div className="font-semibold text-sm text-txt leading-tight">{c.title}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-full flex-shrink-0 font-semibold"
                    style={{ background: sc.color + '22', color: sc.color, border: `1px solid ${sc.color}33` }}>
                    {sc.icon} {c.subject}
                  </span>
                </div>
                <p className="text-xs text-muted line-clamp-1 mb-3">{c.summary}</p>
                <div className="flex gap-2">
                  {c.quiz?.length > 0 && (
                    <button onClick={() => onGoQuiz(c.quiz, c.words || [])}
                      className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all active:scale-95"
                      style={{ background: 'rgba(124,111,255,0.15)', border: '1px solid rgba(124,111,255,0.25)', color: '#A78BFA' }}>
                      ◈ Quiz ({c.quiz.length})
                    </button>
                  )}
                  {c.words?.length > 0 && (
                    <button onClick={() => onGoQuiz([], c.words || [])}
                      className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all active:scale-95"
                      style={{ background: 'rgba(240,201,106,0.1)', border: '1px solid rgba(240,201,106,0.2)', color: '#F0C96A' }}>
                      ✦ {c.words.length} mots
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
