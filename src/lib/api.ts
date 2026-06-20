// Data layer — talks to Supabase directly (DB queries) and to the Edge Function (AI).
// RLS ensures every query is automatically scoped to the logged-in user.

import { supabase } from './supabase'
import type { AnalyzeResult, Course } from '@/types'

export interface AnalyzePayload {
  image_base64?: string
  image_media_type?: string
  text_content?: string
  subject: string
  explain_language: string
}

export const api = {
  // ---- AI analysis via Edge Function ----
  async analyze(payload: AnalyzePayload): Promise<AnalyzeResult> {
    const { data, error } = await supabase.functions.invoke('analyze', {
      body: payload,
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data as AnalyzeResult
  },

  // ---- Courses (RLS scopes to current user automatically) ----
  async listCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Course[]
  },

  async createCourse(course: Partial<Course>): Promise<Course> {
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr) throw userErr
    if (!userData.user) throw new Error('Utilisateur non authentifié — reconnecte-toi.')

    const { data, error } = await supabase
      .from('courses')
      .insert({ ...course, user_id: userData.user.id })
      .select()
      .single()

    if (error) throw error
    return data as Course
  },

  async deleteCourse(id: string): Promise<void> {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error
  },

  // ---- Media upload (images / audio) ----
  async uploadMedia(file: Blob, ext: string): Promise<string> {
    const { data: userData } = await supabase.auth.getUser()
    const path = `${userData.user?.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('media').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    return data.publicUrl
  },
}
