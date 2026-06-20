// Local search engine — answers chat questions by searching directly in the
// already-saved course content (title, explanation, words, grammar) WITHOUT
// calling Claude. This is free and instant. Falls back to suggesting AI mode
// only when nothing relevant is found locally.

import type { Course, WordItem, GrammarItem } from '@/types'

export interface LocalSearchResult {
  found: boolean
  answer: string
  matchedCourse?: string
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/**
 * Extract keywords from a question, ignoring common stopwords (French + a bit of English).
 */
function extractKeywords(question: string): string[] {
  const stopwords = new Set([
    'le','la','les','un','une','des','de','du','et','est','que','qui','quoi',
    'comment','pourquoi','est-ce','ce','cette','ces','dans','sur','avec','pour',
    'what','is','the','a','an','how','why','does','do','in','on','for','tell','me',
    'explique','moi','dis','c\'est','ça','signifie','veut','dire','quelle','quel',
  ])
  return normalize(question)
    .replace(/[?!.,;:]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopwords.has(w))
}

/**
 * Search a single course's content for a match to the question's keywords.
 * Priority: exact word match (zh/py/fr) > grammar rule match > explanation/summary text match.
 */
function searchInCourse(course: Course, keywords: string[]): LocalSearchResult {
  if (keywords.length === 0) return { found: false, answer: '' }

  // 1. Search vocabulary words — strongest signal (exact character or pinyin or translation match)
  for (const kw of keywords) {
    const word = (course.words || []).find((w: WordItem) =>
      normalize(w.zh || '').includes(kw) ||
      normalize(w.py || '').includes(kw) ||
      normalize(w.fr || '').includes(kw)
    )
    if (word) {
      return {
        found: true,
        matchedCourse: course.title,
        answer: `**${word.zh}** (${word.py}) — ${word.fr}${word.example ? `\n\nExemple : ${word.example}` : ''}\n\n*Trouvé dans « ${course.title} »*`,
      }
    }
  }

  // 2. Search grammar rules
  for (const kw of keywords) {
    const rule = (course.grammar || []).find((g: GrammarItem) =>
      normalize(g.rule || '').includes(kw) || normalize(g.formula || '').includes(kw)
    )
    if (rule) {
      const examples = (rule.examples || []).slice(0, 2).map(e => `• ${e}`).join('\n')
      return {
        found: true,
        matchedCourse: course.title,
        answer: `**${rule.rule}**\n${rule.formula}\n\n${examples}\n\n*Trouvé dans « ${course.title} »*`,
      }
    }
  }

  // 3. Search title/summary/explanation as a last resort (looser match)
  const haystack = normalize(`${course.title} ${course.summary} ${course.explanation}`)
  const hits = keywords.filter(kw => haystack.includes(kw))
  if (hits.length >= Math.max(1, Math.ceil(keywords.length * 0.5))) {
    return {
      found: true,
      matchedCourse: course.title,
      answer: `D'après « ${course.title} » :\n\n${course.summary}\n\n*Pour plus de détails, ouvre ce cours dans ta bibliothèque.*`,
    }
  }

  return { found: false, answer: '' }
}

/**
 * Search across ALL courses (used by the global chat).
 */
export function searchLocal(question: string, courses: Course[]): LocalSearchResult {
  const keywords = extractKeywords(question)
  for (const course of courses) {
    const result = searchInCourse(course, keywords)
    if (result.found) return result
  }
  return { found: false, answer: '' }
}

/**
 * Search within a SINGLE course only (used by the per-course chat).
 */
export function searchLocalInCourse(question: string, course: Course): LocalSearchResult {
  const keywords = extractKeywords(question)
  return searchInCourse(course, keywords)
}
