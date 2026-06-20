import { useEffect, useRef, useState } from 'react'
import { chatApi, type ChatMessageRow } from '@/lib/chatApi'
import { searchLocal, searchLocalInCourse } from '@/lib/localSearch'
import { getExplainLang } from '@/pages/Settings'
import type { Course } from '@/types'

interface ChatPanelProps {
  course: Course | null      // null = global chat, otherwise per-course chat
  allCourses: Course[]       // needed for global chat local search
  onClose: () => void
}

export default function ChatPanel({ course, allCourses, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingAI, setPendingAI] = useState<string | null>(null) // question waiting for "ask AI" confirmation
  const scrollRef = useRef<HTMLDivElement>(null)
  const courseId = course?.id ?? null

  useEffect(() => {
    chatApi.listMessages(courseId).then(setMessages).catch(console.error)
  }, [courseId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pendingAI])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setPendingAI(null)

    const userMsg: ChatMessageRow = {
      id: 'tmp-' + Date.now(), course_id: courseId, role: 'user', content: q, source: 'local', created_at: new Date().toISOString(),
    }
    setMessages(m => [...m, userMsg])
    await chatApi.addMessage(courseId, 'user', q, 'local')

    // Try local search first — free and instant.
    const result = course ? searchLocalInCourse(q, course) : searchLocal(q, allCourses)

    if (result.found) {
      const botMsg: ChatMessageRow = {
        id: 'tmp-' + (Date.now()+1), course_id: courseId, role: 'assistant', content: result.answer, source: 'local', created_at: new Date().toISOString(),
      }
      setMessages(m => [...m, botMsg])
      await chatApi.addMessage(courseId, 'assistant', result.answer, 'local')
    } else {
      // Nothing found locally — offer the user a choice instead of silently calling the AI.
      setPendingAI(q)
    }
  }

  const askAI = async () => {
    if (!pendingAI) return
    const q = pendingAI
    setPendingAI(null)
    setLoading(true)
    try {
      const lang = getExplainLang()
      const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }))
      const answer = await chatApi.askAI(q, history, course, allCourses, lang)
      const botMsg: ChatMessageRow = {
        id: 'tmp-' + Date.now(), course_id: courseId, role: 'assistant', content: answer, source: 'ai', created_at: new Date().toISOString(),
      }
      setMessages(m => [...m, botMsg])
      await chatApi.addMessage(courseId, 'assistant', answer, 'ai')
    } catch (e: any) {
      setMessages(m => [...m, {
        id: 'tmp-err', course_id: courseId, role: 'assistant',
        content: `Désolé, erreur lors de la demande à l'IA : ${e.message}`, source: 'ai', created_at: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const dismissAI = () => setPendingAI(null)

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(124,111,255,0.1)' }}>
        <div>
          <div className="font-syne font-bold text-base text-txt flex items-center gap-2">
            <span style={{ color: '#7C6FFF' }}>{course ? '◎' : '✦'}</span>
            {course ? course.title : 'Chat global'}
          </div>
          <div className="text-[10px] text-muted font-mono mt-0.5">
            {course ? 'Questions sur ce cours' : 'Questions sur tous tes cours'}
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted"
          style={{ background: 'rgba(124,111,255,0.08)' }}>✕</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-30">{course ? '◎' : '✦'}</div>
            <p className="text-txt2 text-sm mb-1">
              {course ? 'Pose une question sur ce cours' : 'Pose une question sur tes cours'}
            </p>
            <p className="text-muted text-xs">La recherche locale est gratuite et instantanée</p>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap"
              style={m.role === 'user'
                ? { background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', color: '#fff' }
                : { background: 'rgba(15,15,30,0.9)', border: '1px solid rgba(124,111,255,0.12)', color: '#C4C0D8' }}>
              {m.content}
              {m.role === 'assistant' && (
                <div className="text-[9px] font-mono mt-2 opacity-50">
                  {m.source === 'local' ? '🔍 Recherche locale' : '🧠 IA (Claude)'}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* "Nothing found locally" prompt with explicit AI opt-in */}
        {pendingAI && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
              <div className="mb-3">Aucune réponse trouvée localement dans {course ? 'ce cours' : 'tes cours'}.</div>
              <div className="flex gap-2">
                <button onClick={askAI} disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)' }}>
                  🧠 Demander à l'IA
                </button>
                <button onClick={dismissAI}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted"
                  style={{ background: 'rgba(124,111,255,0.08)' }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(15,15,30,0.9)', border: '1px solid rgba(124,111,255,0.12)' }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7C6FFF', animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(124,111,255,0.1)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Pose ta question..."
          className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none text-txt placeholder:text-muted"
          style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.15)' }}
        />
        <button onClick={send} disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-40 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)' }}>
          ➤
        </button>
      </div>
    </div>
  )
}
