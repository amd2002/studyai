export interface WordItem { zh: string; py: string; fr: string; category: string; example: string }
export interface GrammarItem { rule: string; formula: string; examples: string[] }
export interface QuizItem {
  type: 'qcm' | 'vrai_faux' | 'fill'
  question: string
  options?: string[]
  answer: number | boolean | string
  explanation: string
}
export interface PlanDay { day: string; task: string }
export interface PlanWeek { week: number; title: string; days: PlanDay[] }

export interface AnalyzeResult {
  title: string
  subject: string
  summary: string
  explanation: string
  words: WordItem[]
  grammar: GrammarItem[]
  quiz: QuizItem[]
  plan: PlanWeek[]
  tags: string[]
}

export interface Course extends AnalyzeResult {
  id: string
  kind: 'lesson' | 'slate' | 'audio'
  media_url: string
  created_at: string | null
}

export type Lang = 'fr' | 'en'
