import { useState } from 'react'
import { api } from '@/lib/api'
import { extractTextFromImage } from '@/lib/ocr'
import { getExplainLang } from '@/pages/Settings'
import type { AnalyzeResult } from '@/types'

const SUBJECT_ICONS: Record<string, string> = {
  'Chinois': '🇨🇳', 'Mathématiques': '📐', 'Sciences': '🔬', 'Histoire': '📜', 'Autre': '📚'
}

type Stage = 'idle' | 'ocr' | 'analyzing'

export default function Scanner({ onGoQuiz }: { onGoQuiz: (q: any[], w: any[]) => void }) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [imageType, setImageType] = useState('image/png')
  const [stage, setStage]         = useState<Stage>('idle')
  const [result, setResult]       = useState<AnalyzeResult | null>(null)
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)
  const [activeTab, setActiveTab] = useState<'explication'|'mots'|'grammaire'|'plan'>('explication')
  const [ocrMode, setOcrMode]     = useState<'text'|'image'|null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setImageData(ev.target?.result as string)
      setImageType(file.type)
      setResult(null); setSaved(false); setOcrMode(null)
      // Auto-analyze immediately once a photo is picked — one less tap.
      runAnalysis(ev.target?.result as string, file.type)
    }
    reader.readAsDataURL(file)
  }

  const runAnalysis = async (data: string, type: string) => {
    setError(''); setResult(null)
    const lang = getExplainLang()

    // Step 1: OCR locally first to save tokens.
    setStage('ocr')
    const ocr = await extractTextFromImage(data)

    setStage('analyzing')
    try {
      let res: AnalyzeResult
      if (ocr.success) {
        setOcrMode('text')
        // No subject passed — the AI infers it from the content itself.
        res = await api.analyze({ text_content: ocr.text, subject: 'auto', explain_language: lang })
      } else {
        setOcrMode('image')
        res = await api.analyze({
          image_base64: data.split(',')[1],
          image_media_type: type,
          subject: 'auto',
          explain_language: lang,
        })
      }
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setStage('idle')
    }
  }

  const save = async () => {
    if (!result) return
    setError('')
    try {
      await api.createCourse({ ...result, kind: 'lesson' })
      setSaved(true)
    } catch (e: any) {
      setError(`Erreur de sauvegarde : ${e.message}`)
    }
  }

  const reset = () => { setImageData(null); setResult(null); setSaved(false); setError(''); setOcrMode(null) }

  const CONTENT_TABS = [
    { id: 'explication', icon: '◎', label: 'Cours' },
    { id: 'mots',        icon: '✦', label: 'Mots'  },
    { id: 'grammaire',   icon: '⚙', label: 'Règles'},
    { id: 'plan',        icon: '▤', label: 'Plan'  },
  ] as const

  return (
    <div className="h-full overflow-y-auto scrollbar-none pb-28">
      <div className="px-5 pt-5">

        {!result && stage === 'idle' && !imageData && (
          <label className="block rounded-3xl text-center cursor-pointer transition-all duration-200 mb-4 relative overflow-hidden"
            style={{ border: '2px dashed rgba(124,111,255,0.2)', background: 'rgba(15,15,30,0.5)', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="py-10">
              <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.2)' }}>
                <span className="text-3xl text-accent2">◎</span>
              </div>
              <p className="text-txt2 font-medium text-sm mb-1">Photo ou PDF d'un cours</p>
              <p className="text-muted text-xs">L'IA détecte la matière automatiquement</p>
            </div>
            <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFile} className="hidden" />
          </label>
        )}

        {imageData && !result && (
          <div className="rounded-3xl p-2 mb-4" style={{ background: 'rgba(124,111,255,0.05)', border: '1px solid rgba(124,111,255,0.15)' }}>
            <img src={imageData} alt="preview" className="max-h-52 mx-auto rounded-2xl object-cover" />
          </div>
        )}

        {stage === 'ocr' && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full border-2 border-s3 border-t-accent animate-spin mx-auto mb-4"
              style={{ boxShadow: '0 0 20px rgba(124,111,255,0.3)' }} />
            <p className="text-txt2 font-medium text-sm mb-1">Lecture du texte...</p>
            <p className="text-muted text-xs">Extraction locale pour économiser des tokens</p>
          </div>
        )}

        {stage === 'analyzing' && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full border-2 border-s3 border-t-accent animate-spin mx-auto mb-4"
              style={{ boxShadow: '0 0 20px rgba(124,111,255,0.3)' }} />
            <p className="text-txt2 font-medium text-sm mb-1">Analyse en cours</p>
            <p className="text-muted text-xs">
              {ocrMode === 'text' ? 'Claude lit le texte extrait...' : 'Claude analyse l\'image...'}
            </p>
          </div>
        )}

        {error && !result && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center mb-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            {error}
            <button onClick={reset} className="block mx-auto mt-2 text-xs underline opacity-80">Réessayer</button>
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={reset} className="flex items-center gap-2 text-muted text-sm">
                <span>←</span> Nouveau scan
              </button>
              <button onClick={save} disabled={saved}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={saved
                  ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }
                  : { background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', color: '#fff', boxShadow: '0 4px 12px rgba(124,111,255,0.3)' }}>
                {saved ? '✓ Sauvegardé' : '↓ Sauvegarder'}
              </button>
            </div>

            {error && (
              <div className="rounded-2xl px-4 py-3 text-sm mb-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <div className="text-[10px] font-mono px-3 py-1.5 rounded-full inline-flex items-center gap-1"
                style={{ background: 'rgba(124,111,255,0.1)', color: '#A78BFA', border: '1px solid rgba(124,111,255,0.2)' }}>
                {SUBJECT_ICONS[result.subject] || '📚'} {result.subject}
              </div>
              {ocrMode && (
                <div className="text-[10px] font-mono px-3 py-1.5 rounded-full inline-block"
                  style={{ background: ocrMode === 'text' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: ocrMode === 'text' ? '#10b981' : '#f59e0b', border: `1px solid ${ocrMode === 'text' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                  {ocrMode === 'text' ? '⚡ Texte extrait' : '🖼 Image envoyée'}
                </div>
              )}
            </div>

            <div className="rounded-3xl p-4 mb-4 relative overflow-hidden"
              style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(124,111,255,0.15), transparent)', filter: 'blur(20px)' }} />
              <h2 className="font-syne font-bold text-base text-txt mb-1">{result.title}</h2>
              <p className="text-xs text-muted leading-relaxed mb-3">{result.summary}</p>
              <div className="flex gap-3 text-xs">
                {[
                  { n: result.words?.length||0, l: 'mots', c: '#F0C96A' },
                  { n: result.quiz?.length||0,  l: 'quiz', c: '#7C6FFF' },
                  { n: result.plan?.length||0,  l: 'sem.', c: '#10b981' },
                ].map(s => (
                  <span key={s.l} className="font-mono font-semibold" style={{ color: s.c }}>{s.n} {s.l}</span>
                ))}
              </div>
            </div>

            {(result.quiz?.length > 0 || result.words?.length > 0) && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {result.quiz?.length > 0 && (
                  <button onClick={() => onGoQuiz(result.quiz, result.words||[])}
                    className="rounded-2xl p-3 text-sm font-bold transition-all active:scale-95"
                    style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.2)', color: '#A78BFA' }}>
                    ◈ Lancer le quiz
                  </button>
                )}
                {result.words?.length > 0 && (
                  <button onClick={() => onGoQuiz([], result.words||[])}
                    className="rounded-2xl p-3 text-sm font-bold transition-all active:scale-95"
                    style={{ background: 'rgba(240,201,106,0.08)', border: '1px solid rgba(240,201,106,0.2)', color: '#F0C96A' }}>
                    ✦ Flashcards
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-1 mb-4 p-1 rounded-2xl" style={{ background: 'rgba(124,111,255,0.06)', border: '1px solid rgba(124,111,255,0.1)' }}>
              {CONTENT_TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={activeTab === t.id
                    ? { background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)', color: '#fff', boxShadow: '0 2px 8px rgba(124,111,255,0.3)' }
                    : { color: '#6B6880' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'explication' && (
              <div className="rounded-3xl p-4 prose-ai" style={{ background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(124,111,255,0.1)' }}
                dangerouslySetInnerHTML={{ __html: result.explanation }} />
            )}

            {activeTab === 'mots' && (
              <div className="grid grid-cols-2 gap-3">
                {result.words?.map((w, i) => (
                  <div key={i} className="rounded-2xl p-3 relative overflow-hidden"
                    style={{ background: 'rgba(240,201,106,0.05)', border: '1px solid rgba(240,201,106,0.12)', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
                    <div className="font-ser text-3xl mb-1" style={{ color: '#F0C96A' }}>{w.zh}</div>
                    <div className="font-mono text-xs mb-1" style={{ color: '#22d3ee' }}>{w.py}</div>
                    <div className="text-xs font-semibold text-txt2">{w.fr}</div>
                    <div className="text-[10px] mt-2 px-2 py-0.5 rounded-full inline-block font-mono"
                      style={{ background: 'rgba(124,111,255,0.1)', color: '#7C6FFF' }}>{w.category}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'grammaire' && (
              <div className="space-y-3">
                {result.grammar?.map((g, i) => (
                  <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(15,15,30,0.8)', borderLeft: '3px solid #7C6FFF', border: '1px solid rgba(124,111,255,0.15)' }}>
                    <div className="font-bold text-sm text-txt mb-2">{g.rule}</div>
                    <div className="font-mono text-xs px-3 py-2 rounded-xl mb-3" style={{ background: 'rgba(124,111,255,0.1)', color: '#A78BFA', border: '1px solid rgba(124,111,255,0.15)' }}>{g.formula}</div>
                    <ul className="space-y-1.5">
                      {g.examples?.map((ex, j) => (
                        <li key={j} className="text-xs text-muted flex gap-2"><span style={{ color: '#7C6FFF' }}>›</span>{ex}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="space-y-3">
                {result.plan?.map(w => (
                  <div key={w.week} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,111,255,0.1)' }}>
                    <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(124,111,255,0.08)', borderBottom: '1px solid rgba(124,111,255,0.1)' }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #7C6FFF, #A78BFA)' }}>S{w.week}</div>
                      <div className="font-semibold text-sm text-txt">{w.title}</div>
                    </div>
                    <div className="p-3 space-y-2" style={{ background: 'rgba(15,15,30,0.6)' }}>
                      {w.days?.map((d, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer py-1">
                          <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: '#7C6FFF' }} />
                          <span className="text-xs text-txt2"><span className="text-accent2 font-semibold">{d.day}</span> · {d.task}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => exportPDF(result)}
              className="w-full mt-4 py-3.5 rounded-2xl text-sm font-semibold text-muted transition-all active:scale-98"
              style={{ background: 'rgba(124,111,255,0.05)', border: '1px solid rgba(124,111,255,0.1)' }}>
              ↓ Exporter en PDF
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function exportPDF(result: AnalyzeResult) {
  const win = window.open('', '_blank')!
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${result.title}</title>
  <style>
    body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a2e;line-height:1.7;background:#fff}
    h1{font-size:26px;border-bottom:3px solid #7C6FFF;padding-bottom:10px;margin-bottom:8px}
    h2{font-size:18px;color:#7C6FFF;margin:24px 0 8px}
    h3{font-size:15px;color:#333;margin:14px 0 6px}
    p{margin-bottom:8px;font-size:14px} ul{padding-left:16px;margin-bottom:8px}
    li{font-size:13px;margin-bottom:3px}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    td,th{padding:8px 12px;border:1px solid #e0e0f0;text-align:left;font-size:13px}
    th{background:#f0f0ff;font-weight:bold;color:#7C6FFF}
    .zh{font-size:22px;font-weight:bold;color:#1a1a2e}
    .py{color:#06b6d4;font-family:monospace;font-size:12px}
    code{background:#f5f5ff;padding:2px 8px;border-radius:6px;font-family:monospace;font-size:12px;color:#7C6FFF}
    .badge{display:inline-block;background:#ede9fe;color:#7C6FFF;padding:3px 12px;border-radius:20px;font-size:12px;margin-bottom:16px;font-weight:600}
    .summary{background:#f8f7ff;border-left:3px solid #7C6FFF;padding:12px 16px;border-radius:0 8px 8px 0;font-size:14px;color:#555;margin-bottom:20px}
    @media print{body{margin:0}}
  </style></head><body>
  <div class="badge">${result.subject}</div>
  <h1>${result.title}</h1>
  <div class="summary">${result.summary}</div>
  <h2>📖 Explication du cours</h2>${result.explanation}
  ${result.words?.length ? `<h2>📝 Vocabulaire — ${result.words.length} mots</h2>
  <table><tr><th>Caractère</th><th>Pinyin</th><th>Traduction</th><th>Catégorie</th><th>Exemple</th></tr>
  ${result.words.map(w=>`<tr><td class="zh">${w.zh||''}</td><td class="py">${w.py||''}</td><td><b>${w.fr||''}</b></td><td><small>${w.category||''}</small></td><td><small>${w.example||''}</small></td></tr>`).join('')}
  </table>` : ''}
  ${result.grammar?.length ? `<h2>⚙️ Grammaire</h2>${result.grammar.map(g=>`<h3>${g.rule}</h3><p><code>${g.formula}</code></p><ul>${(g.examples||[]).map(e=>`<li>${e}</li>`).join('')}</ul>`).join('')}` : ''}
  ${result.quiz?.length ? `<h2>🎯 Quiz — ${result.quiz.length} questions</h2>${result.quiz.map((q,i)=>`<p><b>${i+1}. ${q.question}</b>${q.options?'<br><small>'+q.options.map((o:string,j:number)=>`${j===q.answer?'✅ ':'○ '}${o}`).join(' &nbsp; ')+'</small>':''}<br><i style="color:#888;font-size:13px">→ ${q.explanation||''}</i></p>`).join('')}` : ''}
  <script>window.print();<\/script></body></html>`)
  win.document.close()
}
