// Lecture tolérante de la réponse de l'IA + préparation de la fusion.
import { pinyin as toPinyin } from 'pinyin-pro'
import type { CharRow, ImportChar, LessonImport } from '@/types/hanzi'

export const isHan = (ch: string) => /\p{Script=Han}/u.test(ch)
export const hanChars = (s: string) => Array.from(s).filter(isHan)

/** Extrait l'objet JSON même s'il est entouré de texte ou dans un bloc ```json. */
export function extractJson(raw: string): unknown {
  let t = raw.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1]
  const start = t.indexOf('{'), end = t.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error("Je ne trouve pas de JSON dans la réponse. Copie bien toute la réponse de l'IA.")
  t = t.slice(start, end + 1)
  try { return JSON.parse(t) } catch { /* on répare */ }
  const fixed = t
    .replace(/[“”„″]/g, '"')          // guillemets typographiques
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')                        // virgules en trop
    .replace(/"((?:[^"\\]|\\.)*)"/g, (_m, s: string) => '"' + s.replace(/\r?\n/g, ' ').replace(/\t/g, ' ') + '"')
  try { return JSON.parse(fixed) } catch (e) {
    throw new Error('Le JSON est cassé (' + (e as Error).message + '). Demande à l’IA : « Renvoie uniquement le JSON, valide. »')
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : [])

export interface ParseResult {
  lesson: LessonImport
  problems: string[]          // à montrer à l'écran de vérification
  fixedChars: string[]        // caractères ajoutés automatiquement (sens à compléter)
}

/** Valide et normalise. Lance une erreur claire si c'est inutilisable. */
export function parseLesson(raw: string): ParseResult {
  const j = extractJson(raw) as Record<string, unknown>
  if (!j || typeof j !== 'object') throw new Error('La réponse n’est pas un objet JSON.')
  const problems: string[] = []

  const sentences = arr(j.sentences).map((s, i) => {
    const zh = str(s?.zh), py = str(s?.py), fr = str(s?.fr)
    if (zh && !py) problems.push(`La phrase ${i + 1} n'a pas de pinyin.`)
    if (zh && !fr) problems.push(`La phrase ${i + 1} n'a pas de traduction.`)
    return { zh, py, fr }
  }).filter(s => s.zh)
  if (!sentences.length) throw new Error('Aucune phrase trouvée ("sentences" est vide).')

  const words = arr(j.words).map(w => ({ zh: str(w?.zh), py: str(w?.py), fr: str(w?.fr) })).filter(w => w.zh)
  const grammar = arr(j.grammar).map(g => ({ pattern: str(g?.pattern), py: str(g?.py), fr: str(g?.fr), example: str(g?.example) })).filter(g => g.pattern)

  const text = [str(j.title), ...sentences.map(s => s.zh)].join('')
  const inText = new Set(hanChars(text))

  const seen = new Map<string, ImportChar>()
  for (const c of arr(j.characters)) {
    const ch = str(c?.char)
    if (Array.from(ch).length !== 1 || !isHan(ch)) { if (ch) problems.push(`« ${ch} » n'est pas un seul caractère : ignoré.`); continue }
    if (seen.has(ch)) continue
    if (!inText.has(ch)) problems.push(`« ${ch} » n'apparaît dans aucune phrase.`)
    seen.set(ch, { char: ch, pinyin: str(c?.pinyin) || toPinyin(ch), meaning_fr: str(c?.meaning_fr) })
  }
  const fixedChars: string[] = []
  for (const ch of inText) if (!seen.has(ch)) {
    seen.set(ch, { char: ch, pinyin: toPinyin(ch), meaning_fr: '' })
    fixedChars.push(ch)
  }

  const title = str(j.title) || sentences[0].zh.slice(0, 12)
  return {
    lesson: {
      title, title_py: str(j.title_py) || toPinyin(title), title_fr: str(j.title_fr),
      sentences, words, grammar, characters: [...seen.values()],
    },
    problems, fixedChars,
  }
}

export interface MergePlan { fresh: ImportChar[]; known: ImportChar[] }
export function planMerge(lesson: LessonImport, existing: Record<string, CharRow>): MergePlan {
  const fresh: ImportChar[] = [], known: ImportChar[] = []
  for (const c of lesson.characters) (existing[c.char] ? known : fresh).push(c)
  return { fresh, known }
}

/** Message de correction à recoller dans l'IA quand l'import échoue. */
export const fixMessage = (err: string) =>
  `Ta réponse n'a pas pu être importée : ${err}\nRenvoie UNIQUEMENT le bloc JSON complet et valide, au format demandé, sans texte autour.`
