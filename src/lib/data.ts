// Couche données : Supabase + copie locale (pour réviser sans réseau).
import { supabase } from './supabase'
import { addDays, today, MASTERED } from './srs'
import type { CharRow, CourseRow, LessonImport, Store } from '@/types/hanzi'

const CACHE_KEY = 'hz_store_v1'
const QUEUE_KEY = 'hz_queue_v1'

type QueueItem =
  | { t: 'char'; char: string; patch: Partial<CharRow> }
  | { t: 'log'; char: string; track: 'read' | 'write'; ok: boolean; mistakes: number; at: string }

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* plein */ } }

export const emptyStore = (): Store => ({ chars: {}, courses: [], links: {} })
export const cachedStore = (): Store => read(CACHE_KEY, emptyStore())
export const saveCache = (s: Store) => write(CACHE_KEY, s)

async function all<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const out: T[] = []; const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await build(from, from + page - 1)
    if (error) throw error
    out.push(...(data ?? []))
    if (!data || data.length < page) return out
  }
}

export async function fetchStore(): Promise<Store> {
  await flushQueue()
  const [chars, courses, links] = await Promise.all([
    all<CharRow>((a, b) => supabase.from('characters').select('*').order('created_at').range(a, b)),
    all<CourseRow>((a, b) => supabase.from('courses')
      .select('id,title,title_py,title_fr,sentences,words,grammar,created_at')
      .eq('kind', 'hanzi').order('created_at', { ascending: false }).range(a, b)),
    all<{ char: string; course_id: string }>((a, b) => supabase.from('character_courses').select('char,course_id').range(a, b)),
  ])
  const s: Store = { chars: {}, courses, links: {} }
  for (const c of chars) s.chars[c.char] = c
  for (const l of links) (s.links[l.char] ??= []).push(l.course_id)
  // Une mise à jour locale pas encore envoyée l'emporte sur le serveur.
  for (const q of read<QueueItem[]>(QUEUE_KEY, [])) if (q.t === 'char' && s.chars[q.char]) Object.assign(s.chars[q.char], q.patch)
  saveCache(s)
  return s
}

// ---------- file d'attente hors ligne ----------
function enqueue(item: QueueItem) { const q = read<QueueItem[]>(QUEUE_KEY, []); q.push(item); write(QUEUE_KEY, q) }
let flushing = false
export async function flushQueue() {
  if (flushing) return; flushing = true
  try {
    let q = read<QueueItem[]>(QUEUE_KEY, [])
    while (q.length) {
      const it = q[0]
      const { error } = it.t === 'char'
        ? await supabase.from('characters').update(it.patch).eq('char', it.char)
        : await supabase.from('review_log').insert({ char: it.char, track: it.track, ok: it.ok, mistakes: it.mistakes, at: it.at })
      if (error) break
      q = q.slice(1); write(QUEUE_KEY, q)
    }
  } finally { flushing = false }
}
export const pendingCount = () => read<QueueItem[]>(QUEUE_KEY, []).length
if (typeof window !== 'undefined') window.addEventListener('online', () => { flushQueue() })

/** Enregistre une réponse : d'abord en local (la file), puis envoi au serveur. */
export function saveReview(char: string, patch: Partial<CharRow>, track: 'read' | 'write', ok: boolean, mistakes = 0) {
  enqueue({ t: 'char', char, patch })
  enqueue({ t: 'log', char, track, ok, mistakes, at: new Date().toISOString() })
  flushQueue()
}

export async function updateCharInfo(char: string, patch: Pick<Partial<CharRow>, 'pinyin' | 'meaning_fr' | 'has_strokes'>) {
  enqueue({ t: 'char', char, patch }); await flushQueue()
}

// ---------- import d'un cours ----------
export async function importLesson(lesson: LessonImport, existing: Record<string, CharRow>): Promise<{ courseId: string; added: number; known: number }> {
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) throw new Error('Reconnecte-toi pour importer un cours.')

  const { data: course, error: e1 } = await supabase.from('courses').insert({
    user_id: u.user.id, kind: 'hanzi', subject: 'Chinois',
    title: lesson.title, title_py: lesson.title_py, title_fr: lesson.title_fr,
    sentences: lesson.sentences, words: lesson.words, grammar: lesson.grammar,
  }).select('id').single()
  if (e1) throw e1

  const fresh = lesson.characters.filter(c => !existing[c.char])
  if (fresh.length) {
    const { error } = await supabase.from('characters').upsert(
      fresh.map(c => ({ char: c.char, pinyin: c.pinyin, meaning_fr: c.meaning_fr })),
      { onConflict: 'user_id,char', ignoreDuplicates: true })
    if (error) throw error
  }
  // Un caractère déjà maîtrisé revient une fois dans les 2 jours, dans son nouveau contexte.
  const soon = addDays(today(), 2)
  const revisit = lesson.characters.filter(c => {
    const e = existing[c.char]; return e && e.read_level >= MASTERED && (!e.read_due || e.read_due > soon)
  }).map(c => c.char)
  if (revisit.length) await supabase.from('characters').update({ read_due: soon }).in('char', revisit)

  const { error: e3 } = await supabase.from('character_courses').upsert(
    lesson.characters.map(c => ({ char: c.char, course_id: course.id })),
    { onConflict: 'user_id,char,course_id', ignoreDuplicates: true })
  if (e3) throw e3
  return { courseId: course.id, added: fresh.length, known: lesson.characters.length - fresh.length }
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
}
