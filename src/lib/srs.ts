// Répétition espacée : niveaux 0 à 7 et délais en jours.
import type { CharRow, Track } from '@/types/hanzi'

export const INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60]
export const MAX_LEVEL = INTERVALS.length - 1
export const MASTERED = 5
export const HARD_LAPSES = 3

export function today(d = new Date()): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return today(new Date(y, m - 1, d + n))
}

const lv = (c: CharRow, t: Track) => (t === 'read' ? c.read_level : c.write_level)
const due = (c: CharRow, t: Track) => (t === 'read' ? c.read_due : c.write_due)
const lapses = (c: CharRow, t: Track) => (t === 'read' ? c.read_lapses : c.write_lapses)

export const isNew = (c: CharRow, t: Track) => lv(c, t) === 0 && !due(c, t)
export const isDue = (c: CharRow, t: Track, on = today()) => !isNew(c, t) && !!due(c, t) && due(c, t)! <= on
export const isMastered = (c: CharRow, t: Track) => lv(c, t) >= MASTERED
export const isHard = (c: CharRow) => c.read_lapses >= HARD_LAPSES || c.write_lapses >= HARD_LAPSES
export const available = (c: CharRow, t: Track) => (t === 'read' ? true : c.write_unlocked && c.has_strokes)

/** Résultat d'une réponse (au premier essai de la session). Renvoie les champs à mettre à jour. */
export function grade(c: CharRow, t: Track, ok: boolean, on = today()): Partial<CharRow> {
  const cur = lv(c, t)
  const level = ok ? Math.min(MAX_LEVEL, cur + 1) : Math.max(1, cur - 2)
  const next = addDays(on, INTERVALS[level])
  const now = new Date().toISOString()
  const patch: Partial<CharRow> = t === 'read'
    ? { read_level: level, read_due: next, read_last: now, read_lapses: lapses(c, t) + (ok ? 0 : 1) }
    : { write_level: level, write_due: next, write_last: now, write_lapses: lapses(c, t) + (ok ? 0 : 1) }
  // Une première lecture réussie débloque l'écriture.
  if (t === 'read' && ok && !c.write_unlocked) patch.write_unlocked = true
  return patch
}

export interface Card { char: string; track: Track; isNew: boolean }

/**
 * Session du jour : les cartes à revoir (anciennes) + jusqu'à `newPerDay` nouvelles,
 * en priorité celles du cours le plus récent (ordre de `newestFirst`).
 */
export function buildSession(
  chars: CharRow[],
  track: Track,
  newPerDay: number,
  newestFirst: (a: CharRow, b: CharRow) => number,
  on = today(),
): Card[] {
  const ok = chars.filter(c => available(c, track))
  const dueCards = ok.filter(c => isDue(c, track, on))
    .sort((a, b) => (due(a, track)! < due(b, track)! ? -1 : 1))
  const fresh = ok.filter(c => isNew(c, track)).sort(newestFirst).slice(0, newPerDay)
  // Mélange léger : on intercale les nouvelles parmi les anciennes.
  const out: Card[] = []
  const d = dueCards.map(c => ({ char: c.char, track, isNew: false }))
  const n = fresh.map(c => ({ char: c.char, track, isNew: true }))
  while (d.length || n.length) {
    if (d.length) out.push(d.shift()!)
    if (d.length) out.push(d.shift()!)
    if (n.length) out.push(n.shift()!)
  }
  return out
}

/** Boucle d'erreur : la carte ratée revient 3 à 5 cartes plus loin. */
export function requeue<T>(queue: T[], card: T, rand = Math.random): T[] {
  const gap = 3 + Math.floor(rand() * 3)
  const q = queue.slice()
  q.splice(Math.min(gap, q.length), 0, card)
  return q
}
