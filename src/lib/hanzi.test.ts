import { describe, it, expect } from 'vitest'
import { grade, buildSession, requeue, addDays, today } from './srs'
import { parseLesson, planMerge, extractJson } from './importer'
import type { CharRow } from '@/types/hanzi'

const row = (char: string, p: Partial<CharRow> = {}): CharRow => ({
  char, pinyin: '', meaning_fr: '', created_at: '2026-01-01', has_strokes: true,
  read_level: 0, read_due: null, read_lapses: 0, read_last: null,
  write_level: 0, write_due: null, write_lapses: 0, write_last: null, write_unlocked: false, ...p,
})

describe('srs', () => {
  it('réussite : niveau +1, date selon le délai, débloque l’écriture', () => {
    const p = grade(row('好'), 'read', true, '2026-11-06')
    expect(p.read_level).toBe(1); expect(p.read_due).toBe('2026-11-07'); expect(p.write_unlocked).toBe(true)
    const p2 = grade(row('好', { read_level: 3 }), 'read', true, '2026-11-06')
    expect(p2.read_level).toBe(4); expect(p2.read_due).toBe('2026-11-13')
  })
  it('échec : niveau −2 (minimum 1), erreur comptée', () => {
    const p = grade(row('好', { read_level: 5, read_lapses: 1 }), 'read', false, '2026-11-06')
    expect(p.read_level).toBe(3); expect(p.read_lapses).toBe(2); expect(p.read_due).toBe('2026-11-10')
    expect(grade(row('好', { read_level: 1 }), 'read', false).read_level).toBe(1)
  })
  it('écriture séparée de la lecture', () => {
    const p = grade(row('好', { write_unlocked: true }), 'write', true, '2026-11-06')
    expect(p.write_level).toBe(1); expect(p.read_level).toBeUndefined()
  })
  it('session : anciens dus + nouveaux limités ; écriture seulement si débloquée', () => {
    const t = today()
    const cs = [row('a', { read_level: 2, read_due: addDays(t, -1) }), row('b', { read_level: 2, read_due: addDays(t, 3) }), row('c'), row('d'), row('e')]
    const s = buildSession(cs, 'read', 2, () => 0, t)
    expect(s.map(x => x.char).sort()).toEqual(['a', 'c', 'd'])
    expect(buildSession(cs, 'write', 10, () => 0, t)).toEqual([])
  })
  it('boucle : une carte ratée revient 3 à 5 cartes plus loin', () => {
    const q = requeue([1, 2, 3, 4, 5, 6, 7], 0, () => 0)
    expect(q.indexOf(0)).toBe(3)
    expect(requeue([1], 0, () => 0)).toEqual([1, 0])
  })
})

describe('import', () => {
  const good = {
    title: '你好', title_py: 'nǐ hǎo', title_fr: 'Bonjour',
    sentences: [{ zh: '你好，老师。', py: 'Nǐ hǎo, lǎoshī.', fr: 'Bonjour, professeur.' }],
    words: [{ zh: '老师', py: 'lǎoshī', fr: 'professeur' }], grammar: [],
    characters: [{ char: '你', pinyin: 'nǐ', meaning_fr: 'tu' }, { char: '好', pinyin: 'hǎo', meaning_fr: 'bien' }, { char: '老', pinyin: 'lǎo', meaning_fr: 'vieux' }],
  }
  it('lit le JSON entouré de texte et dans un bloc ```json', () => {
    const r = parseLesson('Voici le résultat :\n```json\n' + JSON.stringify(good) + '\n```\nBonne étude !')
    expect(r.lesson.sentences).toHaveLength(1)
    // 师 manquait : ajouté automatiquement
    expect(r.fixedChars).toEqual(['师'])
    expect(r.lesson.characters.find(c => c.char === '师')?.pinyin).toBe('shī')
  })
  it('répare guillemets typographiques et virgules en trop', () => {
    const broken = '{“title”: “你好”, “sentences”: [{“zh”: “你好”, “py”: “nǐ hǎo”, “fr”: “salut”},], “characters”: [],}'
    const r = parseLesson(broken)
    expect(r.lesson.characters.map(c => c.char)).toEqual(['你', '好'])
  })
  it('refuse une réponse sans JSON avec un message clair', () => {
    expect(() => extractJson('désolé je ne peux pas')).toThrow(/JSON/)
  })
  it('fusion : les connus ne sont pas dupliqués', () => {
    const r = parseLesson(JSON.stringify(good))
    const m = planMerge(r.lesson, { 你: row('你', { read_level: 4 }) })
    expect(m.known.map(c => c.char)).toEqual(['你'])
    expect(m.fresh.map(c => c.char).sort()).toEqual(['好', '师', '老'].sort())
  })
})
