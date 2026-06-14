import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Course } from '@/types'

const SUBJECT_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  'Chinois':        { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    icon: '🇨🇳' },
  'Mathématiques':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   icon: '📐' },
  'Sciences':       { color: '#10b981', bg: 'rgba(16,185,129,0.1)',   icon: '🔬' },
  'Histoire':       { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',    icon: '📜' },
  'Autre':          { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   icon: '📚' },
}

const SC = (s: string) => SUBJECT_COLORS[s] || SUBJECT_COLORS['Autre']

export default function Home({ onGoQuiz, onTab }: { onGoQuiz: (q: any[], w: any[]) => void; onTab: (t: string) => void }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [filter, setFilter] = useState('Tous')

  useEffect(() => { api.listCourses().then(setCourses).catch(console.error) }, [])

  const subjects = ['Tous', ...Array.from(new Set(courses.map(c => c.subject)))]
  const filtered = filter === 'Tous' ? courses : courses.filter(c => c.subject === filter)

  const totalWords = courses.reduce((a, c) => a + (c.words?.length || 0), 0)
  const totalQuiz  = courses.reduce((a, c) => a + (c.quiz?.length  || 0), 0)

  return (
    <div className="h-full overflow-y-auto">
      {/* Stats */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-muted font-mono mb-3">
          {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { n: courses.length, l: 'Leçons' },
            { n: totalWords,     l: 'Mots'   },
            { n: totalQuiz,      l: 'Quiz'   },
          ].map(s => (
            <div key={s.l} className="bg-s2 border border-border rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-accent2 font-mono">{s.n}</div>
              <div className="text-[10px] text-muted mt-0.5 tracking-widest uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mb-4 grid grid-cols-2 gap-2">
        <button onClick={() => onTab('scanner')}
          className="bg-accent text-white rounded-xl p-3 flex items-center gap-2 font-bold text-sm">
          <span className="text-xl">📸</span> Scanner un cours
        </button>
        <button onClick={() => onTab('slate')}
          className="bg-s2 border border-border rounded-xl p-3 flex items-center gap-2 font-bold text-sm">
          <span className="text-xl">✍️</span> Ardoise
        </button>
      </div>

      {/* Subject filter chips */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
        {subjects.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              filter === s
                ? 'bg-accent border-accent text-white'
                : 'bg-s2 border-border text-muted'
            }`}>
            {s !== 'Tous' ? SC(s).icon + ' ' : ''}{s}
          </button>
        ))}
      </div>

      {/* Recent courses */}
      <div className="px-4 pt-2 pb-24">
        <p className="text-[10px] font-mono text-muted tracking-widest uppercase mb-2">Cours récents</p>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📖</div>
            <p className="text-muted text-sm">Aucun cours encore</p>
            <p className="text-muted text-xs mt-1">Scanne ta première leçon !</p>
          </div>
        ) : filtered.map(c => {
          const sc = SC(c.subject)
          return (
            <div key={c.id} className="bg-s2 border border-border rounded-xl p-3 mb-2"
              style={{ borderLeft: `3px solid ${sc.color}` }}>
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-sm flex-1 mr-2">{sc.icon} {c.title}</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: sc.bg, color: sc.color }}>{c.subject}</span>
              </div>
              <p className="text-xs text-muted mb-2 line-clamp-2">{c.summary}</p>
              <div className="flex gap-2">
                {c.quiz?.length > 0 && (
                  <button onClick={() => onGoQuiz(c.quiz, c.words || [])}
                    className="text-xs bg-accent/10 text-accent2 border border-accent/20 px-2 py-1 rounded-lg">
                    🎯 Quiz ({c.quiz.length})
                  </button>
                )}
                {c.words?.length > 0 && (
                  <button onClick={() => onGoQuiz([], c.words || [])}
                    className="text-xs bg-s3 border border-border px-2 py-1 rounded-lg text-muted">
                    🃏 {c.words.length} mots
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
