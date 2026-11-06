import type { ReactNode } from 'react'

/** Chinois toujours accompagné du pinyin et de la traduction ; caractères plus grands. */
export function Zh({ zh, py, fr, hl, size = 'md' }: { zh: string; py?: string; fr?: string; hl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'
  return (
    <div className="min-w-0">
      <div className={`font-ser ${cls} leading-snug text-txt`}>
        {hl ? Array.from(zh).map((c, i) => c === hl ? <span key={i} className="text-gold font-bold">{c}</span> : <span key={i}>{c}</span>) : zh}
      </div>
      {py && <div className="text-sm text-accent3 italic">{py}</div>}
      {fr && <div className="text-sm text-txt2">{fr}</div>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl p-5 bg-s1/90 border border-border shadow-card ${className}`}>{children}</div>
}

export function Btn({ children, onClick, kind = 'primary', className = '', disabled }: {
  children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'ok' | 'bad'; className?: string; disabled?: boolean
}) {
  const k = {
    primary: 'bg-grad-accent text-white shadow-glow-sm',
    ghost: 'bg-s2 text-txt2 border border-border',
    ok: 'bg-green text-white',
    bad: 'bg-transparent text-danger border border-danger/50',
  }[kind]
  return (
    <button disabled={disabled} onClick={onClick}
      className={`rounded-2xl px-4 py-3.5 font-semibold text-sm transition active:scale-[0.97] disabled:opacity-40 ${k} ${className}`}>
      {children}
    </button>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-mono text-muted tracking-widest uppercase mb-2">{children}</p>
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto scrollbar-none px-5 pt-5 pb-28">{children}</div>
}

/** Pastille de niveau 0–7. */
export function levelColor(level: number, isNew: boolean) {
  if (isNew) return '#6B6880'
  if (level >= 5) return '#10b981'
  if (level >= 3) return '#F0C96A'
  return '#f59e0b'
}
