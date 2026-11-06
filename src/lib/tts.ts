// Audio : voix du téléphone (Web Speech API).
let zh: SpeechSynthesisVoice | null = null
let fr: SpeechSynthesisVoice | null = null
function pick() {
  try {
    const v = speechSynthesis.getVoices()
    zh = v.find(x => /zh[-_]CN/i.test(x.lang)) || v.find(x => /^zh/i.test(x.lang)) || null
    fr = v.find(x => /^fr/i.test(x.lang)) || null
  } catch { /* pas de synthèse vocale */ }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) { pick(); speechSynthesis.onvoiceschanged = pick }

export const ttsAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text: string, opts: { lang?: 'zh' | 'fr'; rate?: number } = {}): Promise<void> {
  return new Promise(resolve => {
    if (!ttsAvailable() || !text) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    const isFr = opts.lang === 'fr'
    u.lang = isFr ? 'fr-FR' : 'zh-CN'
    const v = isFr ? fr : zh
    if (v) u.voice = v
    u.rate = opts.rate ?? (isFr ? 1 : 0.75)
    u.onend = () => resolve(); u.onerror = () => resolve()
    speechSynthesis.speak(u)
  })
}
export const say = (text: string, rate?: number) => { try { speechSynthesis.cancel() } catch {} ; return speak(text, { rate }) }
export const stopSpeech = () => { try { speechSynthesis.cancel() } catch {} }
