// Chat data layer — combines local search (free) with optional AI calls.

import { supabase } from './supabase'
import type { Course } from '@/types'

export interface ChatMessageRow {
  id: string
  course_id: string | null
  role: 'user' | 'assistant'
  content: string
  source: 'local' | 'ai'
  created_at: string
}

export const chatApi = {
  async listMessages(courseId: string | null): Promise<ChatMessageRow[]> {
    let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: true })
    query = courseId ? query.eq('course_id', courseId) : query.is('course_id', null)
    const { data, error } = await query
    if (error) throw error
    return data as ChatMessageRow[]
  },

  async addMessage(courseId: string | null, role: 'user' | 'assistant', content: string, source: 'local' | 'ai') {
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('chat_messages').insert({
      user_id: userData.user?.id,
      course_id: courseId,
      role,
      content,
      source,
    })
    if (error) throw error
  },

  async clearMessages(courseId: string | null) {
    let query = supabase.from('chat_messages').delete()
    query = courseId ? query.eq('course_id', courseId) : query.is('course_id', null)
    const { error } = await query
    if (error) throw error
  },

  async askAI(question: string, history: { role: string; content: string }[], courseContext: Course | null, allCourses: Course[], lang: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        question,
        history,
        course_context: courseContext,
        courses_context: courseContext ? [] : allCourses.map(c => ({ title: c.title, subject: c.subject, summary: c.summary })),
        explain_language: lang,
      },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data.answer as string
  },
}
