import { useState } from 'react'
import { api } from '@/lib/api'
import type { AnalyzeResult } from '@/types'

const SUBJECTS = ['Chinois', 'Mathématiques', 'Sciences', 'Histoire', 'Autre']

export default function Scanner({ onGoQuiz }: { onGoQuiz: (q: any[], w: any[]) => void }) {
  const [subject, setSubject]     = useState('Chinois')
  const [lang, setLang]           = useState('français')
  const [imageData, setImageData] = useState<string | null>(null)
  const [imageType, setImageType] = useState('image/png')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<AnalyzeResult | null>(null)
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)
  const [activeTab, setActiveTab] = useState<'explication'|'mots'|'grammaire'|'plan'>('explication')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setImageData(ev.target?.result as string); setImageType(file.type); setResult(null); setSaved(false) }
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    if (!imageData) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await api.analyze({ image_base64: imageData.split(',')[1], image_media_type: imageType, subject, explain_language: lang })
      setResult(res)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const save = async () => {
    if (!result) return
    try { await api.createCourse({ ...result, kind: 'lesson' }); setSaved(true) }
    catch (e: any) { setError(e.message) }
  }

  const reset = () => { setImageData(null); setResult(null); setSaved(false); setError('') }

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="px-4 pt-4">

        {/* Config */}
        {!result && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="bg-s2 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent">
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={lang} onChange={e => setLang(e.target.value)}
                className="bg-s2 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent">
                <option value="français">🇫🇷 Français</option>
                <option value="anglais">🇬🇧 Anglais</option>
                <option value="arabe">🇸🇦 Arabe</option>
              </select>
            </div>

            {/* Upload zone */}
            <label className="block border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-accent transition mb-3">
              {imageData
                ? <img src={imageData} alt="preview" className="max-h-48 mx-auto rounded-xl object-cover" />
                : <div><div className="text-5xl mb-2">📷</div><div className="text-sm text-muted">Tap pour choisir une photo ou PDF</div><div className="text-xs text-muted mt-1">Cours, notes, tableaux...</div></div>}
              <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFile} className="hidden" />
            </label>

            {imageData && !loading && (
              <button onClick={analyze} className="w-full bg-accent text-white py-3.5 rounded-xl font-bold text-sm mb-2">
                🔍 Analyser avec l'IA
              </button>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-2 border-border border-t-accent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted">Analyse en cours...</p>
                <p className="text-xs text-muted mt-1">Claude lit ton cours 🧠</p>
              </div>
            )}

            {error && <p className="text-danger text-xs mt-2 text-center">{error}</p>}
          </>
        )}

        {/* Result */}
        {result && (
          <>
            <div className="flex items-center justify-between mb-3">
              <button onClick={reset} className="text-xs text-muted bg-s2 border border-border px-3 py-1.5 rounded-full">← Retour</button>
              <button onClick={save} disabled={saved}
                className={`text-xs px-4 py-1.5 rounded-full font-bold ${saved ? 'bg-green/20 text-green border border-green' : 'bg-accent text-white'}`}>
                {saved ? '✅ Sauvegardé' : '💾 Sauvegarder'}
              </button>
            </div>

            {/* Title */}
            <div className="bg-s2 border border-border rounded-2xl p-4 mb-3">
              <h2 className="font-extrabold text-base mb-1">{result.title}</h2>
              <p className="text-xs text-muted leading-relaxed">{result.summary}</p>
              <div className="flex gap-3 mt-2 text-xs text-muted">
                <span>📝 {result.words?.length || 0} mots</span>
                <span>🎯 {result.quiz?.length || 0} questions</span>
                <span>🗓 {result.plan?.length || 0} semaines</span>
              </div>
            </div>

            {/* Quick actions */}
            {(result.quiz?.length > 0 || result.words?.length > 0) && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {result.quiz?.length > 0 && (
                  <button onClick={() => onGoQuiz(result.quiz, result.words || [])}
                    className="bg-accent/10 border border-accent/30 text-accent2 rounded-xl p-3 text-sm font-bold">
                    🎯 Lancer le quiz
                  </button>
                )}
                {result.words?.length > 0 && (
                  <button onClick={() => onGoQuiz([], result.words || [])}
                    className="bg-s2 border border-border rounded-xl p-3 text-sm font-bold">
                    🃏 Flashcards
                  </button>
                )}
              </div>
            )}

            {/* Content tabs */}
            <div className="flex gap-1 mb-3 bg-s2 border border-border rounded-xl p-1">
              {(['explication','mots','grammaire','plan'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono tracking-wide transition ${activeTab === t ? 'bg-accent text-white' : 'text-muted'}`}>
                  {t === 'explication' ? '📖' : t === 'mots' ? '📝' : t === 'grammaire' ? '⚙️' : '🗓'}
                </button>
              ))}
            </div>

            {activeTab === 'explication' && (
              <div className="bg-s2 border border-border rounded-2xl p-4 prose-sm text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: result.explanation }} />
            )}

            {activeTab === 'mots' && (
              <div>
                {/* Category filter */}
                {result.words?.length > 0 && (() => {
                  const cats = ['Tous', ...Array.from(new Set(result.words.map(w => w.category)))]
                  return cats.length > 1 ? (
                    <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
                      {cats.map(c => <span key={c} className="flex-shrink-0 text-xs bg-s2 border border-border px-3 py-1 rounded-full text-muted">{c}</span>)}
                    </div>
                  ) : null
                })()}
                <div className="grid grid-cols-2 gap-2">
                  {result.words?.map((w, i) => (
                    <div key={i} className="bg-s2 border border-border rounded-xl p-3">
                      <div className="font-ser text-2xl text-gold">{w.zh}</div>
                      <div className="font-mono text-xs text-cyan">{w.py}</div>
                      <div className="text-xs font-bold mt-1">{w.fr}</div>
                      <div className="text-[10px] text-muted mt-1 bg-s3 px-2 py-0.5 rounded-full inline-block">{w.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'grammaire' && (
              <div className="space-y-2">
                {result.grammar?.map((g, i) => (
                  <div key={i} className="bg-s2 border-l-4 border-blue border border-border rounded-xl p-3">
                    <div className="font-bold text-sm mb-1">{g.rule}</div>
                    <div className="font-mono text-xs text-accent2 bg-s3 px-2 py-1 rounded-lg mb-2">{g.formula}</div>
                    <ul className="space-y-1">
                      {g.examples?.map((ex, j) => <li key={j} className="text-xs text-muted">• {ex}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="space-y-3">
                {result.plan?.map(w => (
                  <div key={w.week} className="bg-s2 border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2 bg-s3 border-b border-border">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-xs font-bold text-white">S{w.week}</div>
                      <div className="font-bold text-sm">{w.title}</div>
                    </div>
                    <div className="p-3 space-y-2">
                      {w.days?.map((d, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="accent-accent w-4 h-4" />
                          <span className="text-xs"><b>{d.day}</b> · {d.task}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Export PDF */}
            <button onClick={() => exportPDF(result)}
              className="w-full mt-4 bg-s2 border border-border rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2">
              📄 Exporter en PDF
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
    body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a2e;line-height:1.7}
    h1{font-size:26px;border-bottom:3px solid #6c63ff;padding-bottom:10px;margin-bottom:6px}
    h2{font-size:18px;color:#6c63ff;margin:24px 0 8px}
    h3{font-size:15px;color:#333;margin:14px 0 6px}
    p{margin-bottom:8px} ul{padding-left:16px;margin-bottom:8px}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    td,th{padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px}
    th{background:#f0f0ff;font-weight:bold}
    .zh{font-size:22px;font-weight:bold;color:#1a1a2e}
    .py{color:#06b6d4;font-family:monospace;font-size:12px}
    code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px}
    .badge{display:inline-block;background:#e8e6ff;color:#6c63ff;padding:2px 10px;border-radius:10px;font-size:11px;margin-bottom:14px}
    @media print{body{margin:0}}
  </style></head><body>
  <div class="badge">${result.subject}</div>
  <h1>${result.title}</h1>
  <p><em>${result.summary}</em></p>
  <h2>📖 Explication</h2>${result.explanation}
  ${result.words?.length ? `<h2>📝 Vocabulaire (${result.words.length} mots)</h2>
  <table><tr><th>Caractère</th><th>Pinyin</th><th>Traduction</th><th>Catégorie</th><th>Exemple</th></tr>
  ${result.words.map(w=>`<tr><td class="zh">${w.zh||''}</td><td class="py">${w.py||''}</td><td>${w.fr||''}</td><td>${w.category||''}</td><td style="font-size:12px">${w.example||''}</td></tr>`).join('')}
  </table>` : ''}
  ${result.grammar?.length ? `<h2>⚙️ Grammaire</h2>${result.grammar.map(g=>`<h3>${g.rule}</h3><p><code>${g.formula}</code></p><ul>${(g.examples||[]).map(e=>`<li>${e}</li>`).join('')}</ul>`).join('')}` : ''}
  ${result.quiz?.length ? `<h2>🎯 Quiz (${result.quiz.length} questions)</h2>${result.quiz.map((q,i)=>`<p><b>${i+1}. ${q.question}</b>${q.options?'<br>'+q.options.map((o:string,j:number)=>`${j===q.answer?'✅ ':''}${o}`).join(' · '):''}<br><em style="color:#888">→ ${q.explanation||''}</em></p>`).join('')}` : ''}
  <script>window.print();<\/script></body></html>`)
  win.document.close()
}
