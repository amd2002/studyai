// Main dashboard — upload, AI analysis, save & list courses (via Supabase).

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { AnalyzeResult, Course } from '@/types'

const SUBJECTS = ['Chinois', 'Mathématiques', 'Sciences', 'Histoire', 'Autre']

export default function Dashboard() {
  const { user } = useAuth()
  const [subject, setSubject] = useState('Chinois')
  const [lang, setLang] = useState('français')
  const [imageData, setImageData] = useState<string | null>(null)
  const [imageType, setImageType] = useState('image/png')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState('')

  useEffect(() => { loadCourses() }, [])

  const loadCourses = async () => {
    try { setCourses(await api.listCourses()) }
    catch (e: any) { console.error(e) }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageData(ev.target?.result as string)
      setImageType(file.type)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    if (!imageData) return
    setLoading(true); setError('')
    try {
      const res = await api.analyze({
        image_base64: imageData.split(',')[1],
        image_media_type: imageType,
        subject,
        explain_language: lang,
      })
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!result) return
    try {
      await api.createCourse({ ...result, kind: 'lesson' })
      await loadCourses()
      setResult(null); setImageData(null)
    } catch (e: any) { setError(e.message) }
  }

  const remove = async (id: string) => {
    await api.deleteCourse(id)
    await loadCourses()
  }

  return (
    <div className="min-h-screen bg-bg text-txt max-w-md mx-auto">
      <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-s1 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="font-extrabold text-lg">Study<span className="text-accent2">AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{user?.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="text-xs bg-s2 border border-border px-3 py-1.5 rounded-full hover:border-accent">
            Sortir
          </button>
        </div>
      </header>

      <main className="p-5 pb-20">
        <div className="bg-s2 border border-border rounded-2xl p-5 mb-4">
          <h2 className="font-bold mb-4">📸 Analyser un cours</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-s3 border border-border rounded-lg px-3 py-2 text-sm outline-none">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-s3 border border-border rounded-lg px-3 py-2 text-sm outline-none">
              <option value="français">Français</option>
              <option value="anglais">Anglais</option>
              <option value="arabe">Arabe</option>
            </select>
          </div>

          <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent transition">
            {imageData
              ? <img src={imageData} alt="preview" className="max-h-40 mx-auto rounded-lg" />
              : <div><div className="text-4xl mb-2">📷</div><div className="text-sm text-muted">Tap pour choisir une photo</div></div>}
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          </label>

          {imageData && (
            <button onClick={analyze} disabled={loading} className="w-full mt-4 bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-50">
              {loading ? '🔍 Analyse en cours...' : '🔍 Analyser avec l’IA'}
            </button>
          )}
          {error && <p className="text-danger text-xs mt-3">{error}</p>}
        </div>

        {result && (
          <div className="bg-s2 border border-accent rounded-2xl p-5 mb-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold">{result.title}</h3>
              <button onClick={save} className="text-xs bg-accent text-white px-3 py-1.5 rounded-full">💾 Sauvegarder</button>
            </div>
            <p className="text-sm text-muted mb-3">{result.summary}</p>
            <div className="prose-sm text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: result.explanation }} />
            {result.words.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {result.words.slice(0, 8).map((w, i) => (
                  <div key={i} className="bg-s3 border border-border rounded-lg p-2">
                    <div className="font-ser text-xl text-gold">{w.zh}</div>
                    <div className="font-mono text-xs text-cyan">{w.py}</div>
                    <div className="text-xs font-semibold">{w.fr}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-4 text-xs text-muted">
              <span>📝 {result.words.length} mots</span>
              <span>🎯 {result.quiz.length} questions</span>
              <span>🗓 {result.plan.length} semaines</span>
            </div>
          </div>
        )}

        <h2 className="text-xs font-mono text-muted tracking-widest uppercase mb-3">Mes cours</h2>
        {courses.length === 0
          ? <p className="text-muted text-sm text-center py-8">Aucun cours encore. Analyse ta première leçon !</p>
          : (
            <div className="space-y-2">
              {courses.map((c) => (
                <div key={c.id} className="bg-s2 border border-border rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm">{c.title}</div>
                      <div className="text-xs text-muted mt-0.5">{c.subject} · {c.words?.length ?? 0} mots</div>
                    </div>
                    <button onClick={() => remove(c.id)} className="text-danger text-xs">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </main>
    </div>
  )
}
