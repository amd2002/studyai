import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { cachedStore, emptyStore, fetchStore, saveCache } from '@/lib/data'
import type { CharRow, Store } from '@/types/hanzi'

interface Ctx {
  store: Store
  loading: boolean
  offline: boolean
  error: string
  reload: () => Promise<void>
  patchChar: (char: string, patch: Partial<CharRow>) => void
}
const StoreCtx = createContext<Ctx>({
  store: emptyStore(), loading: true, offline: false, error: '', reload: async () => {}, patchChar: () => {},
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(cachedStore)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setError('')
    try { setStore(await fetchStore()); setOffline(false) }
    catch (e: any) {
      setOffline(true)
      setError(String(e?.message || e))
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { reload() }, [reload])

  const patchChar = useCallback((char: string, patch: Partial<CharRow>) => {
    setStore(s => {
      if (!s.chars[char]) return s
      const n = { ...s, chars: { ...s.chars, [char]: { ...s.chars[char], ...patch } } }
      saveCache(n); return n
    })
  }, [])

  return <StoreCtx.Provider value={{ store, loading, offline, error, reload, patchChar }}>{children}</StoreCtx.Provider>
}
export const useStore = () => useContext(StoreCtx)

/** Ordre « cours le plus récent d'abord » pour les nouveaux caractères. */
export function newestFirst(store: Store) {
  const rank = new Map(store.courses.map((c, i) => [c.id, i]))  // courses triés du plus récent
  const best = (ch: string) => Math.min(...(store.links[ch] ?? []).map(id => rank.get(id) ?? 9999), 9999)
  return (a: CharRow, b: CharRow) => best(a.char) - best(b.char) || (a.created_at < b.created_at ? -1 : 1)
}

/** Phrases d'exemple des cours liés qui contiennent ce caractère. */
export function examplesFor(store: Store, ch: string, max = 2) {
  const ids = new Set(store.links[ch] ?? [])
  const out: { zh: string; py: string; fr: string; course: string }[] = []
  for (const c of store.courses) {
    if (!ids.has(c.id)) continue
    for (const s of c.sentences ?? []) if (s.zh.includes(ch)) { out.push({ ...s, course: c.title }); if (out.length >= max) return out }
  }
  return out
}
export function wordsFor(store: Store, ch: string, max = 4) {
  const seen = new Set<string>(); const out: { zh: string; py: string; fr: string }[] = []
  for (const c of store.courses) for (const w of c.words ?? []) {
    if (w.zh.includes(ch) && w.zh.length > 1 && !seen.has(w.zh)) { seen.add(w.zh); out.push(w); if (out.length >= max) return out }
  }
  return out
}
