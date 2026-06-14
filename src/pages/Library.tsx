import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Course } from '@/types'

const SUBJECT_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  'Chinois':       { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: '🇨🇳' },
  'Mathématiques': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '📐' },
  'Sciences':      { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '🔬' },
  'Histoire':      { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  icon: '📜' },
  'Autre':         { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '📚' },
}
const SC = (s: string) => SUBJECT_COLORS[s] || SUBJECT_COLORS['Autre']

export default function Library({ onGoQuiz }: { onGoQuiz: (q: any[], w: any[]) => void }) {
  const [courses, setCourses]   = useState<Course[]>([])
  const [search, setSearch]     = useState('')
  const [view, setView]         = useState<'subject'|'date'>('subject')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [detail, setDetail]     = useState<Course | null>(null)

  useEffect(() => { load() }, [])

  const load = () => api.listCourses().then(setCourses).catch(console.error)

  const remove = async (id: string) => {
    await api.deleteCourse(id)
    setDetail(null)
    load()
  }

  const filtered = courses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    (c.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  )

  // Group by subject
  const bySubject = filtered.reduce((acc, c) => {
    if (!acc[c.subject]) acc[c.subject] = []
    acc[c.subject].push(c)
    return acc
  }, {} as Record<string, Course[]>)

  // Group by date
  const byDate = filtered.reduce((acc, c) => {
    const d = c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sans date'
    if (!acc[d]) acc[d] = []
    acc[d].push(c)
    return acc
  }, {} as Record<string, Course[]>)

  // Detail view
  if (detail) {
    const sc = SC(detail.subject)
    return (
      <div className="h-full overflow-y-auto pb-24">
        <div className="px-4 pt-4">
          <button onClick={() => setDetail(null)} className="text-muted text-sm mb-4 flex items-center gap-1">← Retour</button>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {detail.subject}</span>
              <h2 className="font-extrabold text-lg leading-tight">{detail.title}</h2>
              <p className="text-xs text-muted mt-1">{detail.created_at ? new Date(detail.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
            </div>
          </div>

          {/* Tags */}
          {detail.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {detail.tags.map((t: string) => <span key={t} className="text-xs bg-s3 border border-border px-2 py-0.5 rounded-full text-muted">#{t}</span>)}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { n: detail.words?.length || 0,   l: 'Mots'    },
              { n: detail.quiz?.length  || 0,   l: 'Quiz'    },
              { n: detail.grammar?.length || 0, l: 'Règles'  },
            ].map(s => (
              <div key={s.l} className="bg-s2 border border-border rounded-xl p-3 text-center">
                <div className="text-xl font-extrabold text-accent2 font-mono">{s.n}</div>
                <div className="text-[10px] text-muted tracking-widest uppercase">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {detail.quiz?.length > 0 && (
              <button onClick={() => { setDetail(null); onGoQuiz(detail.quiz, detail.words || []) }}
                className="bg-accent/10 border border-accent/30 text-accent2 rounded-xl p-3 text-sm font-bold">
                🎯 Quiz ({detail.quiz.length})
              </button>
            )}
            {detail.words?.length > 0 && (
              <button onClick={() => { setDetail(null); onGoQuiz([], detail.words || []) }}
                className="bg-s2 border border-border rounded-xl p-3 text-sm font-bold">
                🃏 Flashcards
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="bg-s2 border border-border rounded-2xl p-4 mb-3">
            <p className="text-sm leading-relaxed text-muted">{detail.summary}</p>
          </div>

          {/* Explanation */}
          <div className="bg-s2 border border-border rounded-2xl p-4 mb-3 prose-sm text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: detail.explanation }} />

          {/* Words */}
          {detail.words?.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-mono text-muted tracking-widest uppercase mb-2">Vocabulaire</p>
              <div className="grid grid-cols-2 gap-2">
                {detail.words.map((w: any, i: number) => (
                  <div key={i} className="bg-s2 border border-border rounded-xl p-3">
                    <div className="font-ser text-2xl text-gold">{w.zh}</div>
                    <div className="font-mono text-xs text-cyan">{w.py}</div>
                    <div className="text-xs font-bold mt-1">{w.fr}</div>
                    <div className="text-[10px] text-muted mt-1">{w.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          <button onClick={() => remove(detail.id)}
            className="w-full mt-2 border border-danger/30 text-danger rounded-xl py-3 text-sm font-bold bg-danger/5">
            🗑 Supprimer ce cours
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="px-4 pt-4">
        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un cours, matière, tag..."
          className="w-full bg-s2 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent mb-3" />

        {/* View toggle */}
        <div className="flex gap-1 bg-s2 border border-border rounded-xl p-1 mb-4">
          <button onClick={() => setView('subject')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition ${view==='subject' ? 'bg-accent text-white' : 'text-muted'}`}>
            📚 Par matière
          </button>
          <button onClick={() => setView('date')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition ${view==='date' ? 'bg-accent text-white' : 'text-muted'}`}>
            📅 Par date
          </button>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-muted text-sm">{search ? 'Aucun résultat' : 'Aucun cours encore'}</p>
          </div>
        )}

        {/* By subject view */}
        {view === 'subject' && Object.entries(bySubject).map(([subj, list]) => {
          const sc = SC(subj)
          const isOpen = expanded === subj
          return (
            <div key={subj} className="mb-3">
              <button onClick={() => setExpanded(isOpen ? null : subj)}
                className="w-full flex items-center justify-between bg-s2 border border-border rounded-xl px-4 py-3 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sc.icon}</span>
                  <span className="font-bold text-sm">{subj}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{list.length}</span>
                </div>
                <span className="text-muted text-sm">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && list.map(c => (
                <button key={c.id} onClick={() => setDetail(c)}
                  className="w-full text-left bg-s2 border border-border rounded-xl p-3 mb-1.5 ml-2"
                  style={{ borderLeft: `3px solid ${sc.color}` }}>
                  <div className="font-bold text-sm">{c.title}</div>
                  <div className="text-xs text-muted mt-0.5 line-clamp-1">{c.summary}</div>
                  <div className="flex gap-2 mt-1.5">
                    {c.words?.length > 0 && <span className="text-[10px] bg-s3 px-2 py-0.5 rounded-full text-muted">📝 {c.words.length} mots</span>}
                    {c.quiz?.length  > 0 && <span className="text-[10px] bg-s3 px-2 py-0.5 rounded-full text-muted">🎯 {c.quiz.length} quiz</span>}
                  </div>
                </button>
              ))}
            </div>
          )
        })}

        {/* By date view */}
        {view === 'date' && Object.entries(byDate).map(([date, list]) => (
          <div key={date} className="mb-4">
            <p className="text-[10px] font-mono text-muted tracking-widest uppercase mb-2">📅 {date}</p>
            {list.map(c => {
              const sc = SC(c.subject)
              return (
                <button key={c.id} onClick={() => setDetail(c)}
                  className="w-full text-left bg-s2 border border-border rounded-xl p-3 mb-2"
                  style={{ borderLeft: `3px solid ${sc.color}` }}>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm">{sc.icon} {c.title}</div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{c.subject}</span>
                  </div>
                  <div className="text-xs text-muted mt-1 line-clamp-1">{c.summary}</div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
