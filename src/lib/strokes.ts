// Données de traits auto-hébergées (public/strokes/<bloc>.json), un bloc = 256 caractères.
// Chargées à la demande, mises en cache par le service worker → marche hors ligne et en Chine.
const cache = new Map<number, Promise<Record<string, unknown>>>()
const bucket = (ch: string) => Math.floor((ch.codePointAt(0)! - 0x3400) / 256)

export async function loadStrokes(ch: string): Promise<unknown | null> {
  const b = bucket(ch)
  if (b < 0) return null
  if (!cache.has(b)) {
    cache.set(b, fetch(`${import.meta.env.BASE_URL}strokes/${b}.json`)
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => { cache.delete(b); return {} }))
  }
  const data = await cache.get(b)!
  return (data as Record<string, unknown>)[ch] ?? null
}

/** Chargeur au format attendu par hanzi-writer. */
export const charDataLoader = (ch: string, onLoad: (d: any) => void, onError: (e?: any) => void) => {
  loadStrokes(ch).then(d => (d ? onLoad(d) : onError(new Error('no data')))).catch(onError)
}
