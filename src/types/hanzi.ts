export interface Sentence { zh: string; py: string; fr: string }
export interface Word { zh: string; py: string; fr: string }
export interface GrammarPoint { pattern: string; py: string; fr: string; example: string }

export interface ImportChar { char: string; pinyin: string; meaning_fr: string }

/** Ce que l'IA renvoie avec le prompt d'extraction (et plus tard l'API). */
export interface LessonImport {
  title: string
  title_py: string
  title_fr: string
  sentences: Sentence[]
  words: Word[]
  grammar: GrammarPoint[]
  characters: ImportChar[]
}

export type Track = 'read' | 'write'

export interface CharRow {
  char: string
  pinyin: string
  meaning_fr: string
  created_at: string
  has_strokes: boolean
  read_level: number
  read_due: string | null
  read_lapses: number
  read_last: string | null
  write_level: number
  write_due: string | null
  write_lapses: number
  write_last: string | null
  write_unlocked: boolean
}

export interface CourseRow {
  id: string
  title: string
  title_py: string
  title_fr: string
  sentences: Sentence[]
  words: Word[]
  grammar: GrammarPoint[]
  created_at: string
}

export interface Store {
  chars: Record<string, CharRow>
  courses: CourseRow[]
  /** char -> ids des cours où il apparaît */
  links: Record<string, string[]>
}
