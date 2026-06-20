import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ChatPanel from '@/components/ChatPanel'
import type { Course } from '@/types'

const SUBJECTS: Record<string, { color: string; glow: string; icon: string; grad: string }> = {
  'Chinois':       { color: '#ef4444', glow: 'rgba(239,68,68,0.15)',   icon: '🇨🇳', grad: 'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.03))' },
  'Mathématiques': { color: '#f59e0b', glow: 'rgba(245,158,11,0.15)',  icon: '📐', grad: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03))' },
  'Sciences':      { color: '#10b981', glow: 'rgba(16,185,129,0.15)',  icon: '🔬', grad: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.03))' },
  'Histoire':      { color: '#22d3ee', glow: 'rgba(34,211,238,0.15)',  icon: '📜', grad: 'linear-gradient(135deg,rgba(34,211,238,0.1),rgba(34,211,238,0.03))' },
  'Autre':         { color: '#A78BFA', glow: 'rgba(167,139,250,0.15)', icon: '📚', grad: 'linear-gradient(135deg,rgba(167,139,250,0.1),rgba(167,139,250,0.03))' },
}
const SC = (s: string) => SUBJECTS[s] || SUBJECTS['Autre']

export default function Library({ onGoQuiz }: { onGoQuiz: (q: any[], w: any[]) => void }) {
  const [courses, setCourses]   = useState<Course[]>([])
  const [search, setSearch]     = useState('')
  const [view, setView]         = useState<'subject'|'date'>('subject')
  const [expanded, setExpanded] = useState<string|null>(null)
  const [detail, setDetail]     = useState<Course|null>(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => { load() }, [])
  const load = () => api.listCourses().then(setCourses).catch(console.error)

  const remove = async (id: string) => {
    await api.deleteCourse(id); setDetail(null); load()
  }

  const filtered = courses.filter(c =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    (c.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  )

  const bySubject = filtered.reduce((acc, c) => {
    if (!acc[c.subject]) acc[c.subject] = []
    acc[c.subject].push(c); return acc
  }, {} as Record<string, Course[]>)

  const byDate = filtered.reduce((acc, c) => {
    const d = c.created_at
      ? new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Sans date'
    if (!acc[d]) acc[d] = []
    acc[d].push(c); return acc
  }, {} as Record<string, Course[]>)

  // ── DETAIL VIEW ──
  if (detail) {
    const sc = SC(detail.subject)
    return (
      <div className="h-full overflow-y-auto scrollbar-none pb-28 relative">
        <div className="px-5 pt-5">
          <button onClick={() => setDetail(null)} className="flex items-center gap-2 text-muted text-sm mb-5">
            ← Retour
          </button>

          {/* Hero */}
          <div className="rounded-3xl p-5 mb-4 relative overflow-hidden"
            style={{ background: sc.grad, border: `1px solid ${sc.color}22`, boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${sc.glow}, transparent)`, filter: 'blur(20px)' }} />
            <div className="relative">
              <div className="text-xs font-mono font-semibold px-3 py-1 rounded-full inline-block mb-3"
                style={{ background: sc.color + '22', color: sc.color, border: `1px solid ${sc.color}33` }}>
                {sc.icon} {detail.subject}
              </div>
              <h2 className="font-syne font-bold text-lg text-txt leading-tight mb-2">{detail.title}</h2>
              <p className="text-xs text-muted">
                {detail.created_at ? new Date(detail.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </p>
            </div>
          </div>

          {/* Tags */}
          {detail.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {detail.tags.map((t: string) => (
                <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(124,111,255,0.08)', border: '1px solid rgba(124,111,255,0.15)', color: '#7C6FFF' }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { n: detail.words?.length||0,   l: 'Mots',   c: '#F0C96A' },
              { n: detail.quiz?.length||0,    l: 'Quiz',   c: '#7C6FFF' },
              { n: detail.grammar?.length||0, l: 'Règles', c: '#10b981' },
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.08)' }}>
                <div className="text-xl font-bold font-mono" style={{ color: s.c }}>{s.n}</div>
                <div className="text-[10px] text-muted tracking-widest uppercase font-mono">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {detail.quiz?.length > 0 && (
              <button onClick={() => { setDetail(null); onGoQuiz(detail.quiz, detail.words||[]) }}
                className="rounded-2xl p-3.5 text-sm font-bold transition-all active:scale-95"
                style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.2)', color: '#A78BFA' }}>
                ◈ Quiz ({detail.quiz.length})
              </button>
            )}
            {detail.words?.length > 0 && (
              <button onClick={() => { setDetail(null); onGoQuiz([], detail.words||[]) }}
                className="rounded-2xl p-3.5 text-sm font-bold transition-all active:scale-95"
                style={{ background: 'rgba(240,201,106,0.08)', border: '1px solid rgba(240,201,106,0.2)', color: '#F0C96A' }}>
                ✦ Flashcards
              </button>
            )}
          </div>

          {/* Chat button for this course */}
          <button onClick={() => setShowChat(true)}
            className="w-full rounded-2xl p-3.5 text-sm font-bold mb-4 transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(124,111,255,0.15), rgba(167,139,250,0.08))', border: '1px solid rgba(124,111,255,0.25)', color: '#A78BFA' }}>
            💬 Poser une question sur ce cours
          </button>

          {/* Summary */}
          <div className="rounded-2xl p-4 mb-3"
            style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.08)' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#C4C0D8' }}>{detail.summary}</p>
          </div>

          {/* Explanation */}
          <div className="rounded-2xl p-4 mb-3 prose-ai"
            style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.08)' }}
            dangerouslySetInnerHTML={{ __html: detail.explanation }} />

          {/* Words */}
          {detail.words?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-mono text-muted tracking-widest uppercase mb-3">VOCABULAIRE</p>
              <div className="grid grid-cols-2 gap-2">
                {detail.words.map((w: any, i: number) => (
                  <div key={i} className="rounded-2xl p-3"
                    style={{ background: 'rgba(240,201,106,0.05)', border: '1px solid rgba(240,201,106,0.1)' }}>
                    <div className="font-ser text-2xl" style={{ color: '#F0C96A' }}>{w.zh}</div>
                    <div className="font-mono text-xs" style={{ color: '#22d3ee' }}>{w.py}</div>
                    <div className="text-xs font-semibold text-txt2 mt-1">{w.fr}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          <button onClick={() => remove(detail.id)}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-98"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}>
            ✕ Supprimer ce cours
          </button>
        </div>

        {showChat && (
          <ChatPanel course={detail} allCourses={courses} onClose={() => setShowChat(false)} />
        )}
      </div>
    )
  }

  // ── LIST VIEW ──
  return (
    <div className="h-full overflow-y-auto scrollbar-none pb-28">
      <div className="px-5 pt-5">

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">◎</div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un cours, matière, tag..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none text-txt placeholder:text-muted"
            style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.12)' }} />
        </div>

        {/* View toggle */}
        <div className="flex gap-1 mb-5 p-1 rounded-2xl"
          style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.1)' }}>
          {[
            { id: 'subject' as const, label: '▤ Matière' },
            { id: 'date'    as const, label: '◷ Date' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={view === v.id
                ? { background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', color: '#fff', boxShadow: '0 2px 8px rgba(124,111,255,0.3)' }
                : { color: '#6B6880' }}>
              {v.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-20">▤</div>
            <p className="text-txt2 text-sm">{search ? 'Aucun résultat' : 'Aucun cours encore'}</p>
          </div>
        )}

        {/* By subject */}
        {view === 'subject' && Object.entries(bySubject).map(([subj, list]) => {
          const sc = SC(subj)
          const isOpen = expanded === subj
          return (
            <div key={subj} className="mb-3">
              <button onClick={() => setExpanded(isOpen ? null : subj)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-1 transition-all"
                style={{ background: sc.grad, border: `1px solid ${sc.color}22` }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{sc.icon}</span>
                  <span className="font-syne font-bold text-sm text-txt">{subj}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{ background: sc.color + '22', color: sc.color }}>{list.length}</span>
                </div>
                <span className="text-muted text-xs transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>
              {isOpen && (
                <div className="pl-3 space-y-1.5">
                  {list.map(c => (
                    <button key={c.id} onClick={() => setDetail(c)}
                      className="w-full text-left px-4 py-3 rounded-2xl transition-all active:scale-98"
                      style={{ background: 'rgba(15,15,30,0.8)', borderLeft: `3px solid ${sc.color}`, border: `1px solid ${sc.color}15` }}>
                      <div className="font-semibold text-sm text-txt mb-0.5">{c.title}</div>
                      <div className="text-xs text-muted line-clamp-1">{c.summary}</div>
                      <div className="flex gap-2 mt-2">
                        {c.words?.length > 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(240,201,106,0.1)', color: '#F0C96A' }}>✦ {c.words.length}</span>}
                        {c.quiz?.length  > 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,111,255,0.1)', color: '#A78BFA' }}>◈ {c.quiz.length}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* By date */}
        {view === 'date' && Object.entries(byDate).map(([date, list]) => (
          <div key={date} className="mb-5">
            <p className="text-[10px] font-mono text-muted tracking-widest uppercase mb-2 flex items-center gap-2">
              <span style={{ color: '#7C6FFF' }}>◷</span> {date}
            </p>
            {list.map(c => {
              const sc = SC(c.subject)
              return (
                <button key={c.id} onClick={() => setDetail(c)}
                  className="w-full text-left rounded-2xl p-4 mb-2 relative overflow-hidden transition-all active:scale-98"
                  style={{ background: sc.grad, border: `1px solid ${sc.color}22`, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm text-txt">{sc.icon} {c.title}</div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: sc.color+'22', color: sc.color }}>{c.subject}</span>
                  </div>
                  <div className="text-xs text-muted line-clamp-1">{c.summary}</div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
