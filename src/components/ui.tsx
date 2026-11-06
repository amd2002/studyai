import type { ReactNode } from 'react'

/*
  Direction : « encre et papier quadrillé ».
  Fond encre (violet nuit de StudyAI), caractères en kaishu (style pinceau) sur une case 田字格
  aux pointillés rouges comme dans un vrai cahier d'écriture, or pour ce qui est à retenir,
  rouge sceau 朱砂 réservé au tampon « maîtrisé ». Une seule chose forte par écran : le caractère.
*/

/** Chinois toujours accompagné du pinyin et de la traduction ; caractères plus grands. */
export function Zh({ zh, py, fr, hl, size = 'md' }: { zh: string; py?: string; fr?: string; hl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-[26px]' : size === 'sm' ? 'text-[17px]' : 'text-xl'
  return (
    <div className="min-w-0">
      <div className={`font-ser ${cls} leading-snug text-txt`}>
        {hl ? Array.from(zh).map((c, i) => c === hl ? <span key={i} className="text-gold">{c}</span> : <span key={i}>{c}</span>) : zh}
      </div>
      {py && <div className="text-[13px] text-accent3/90 italic mt-0.5">{py}</div>}
      {fr && <div className="text-[13px] text-txt2/80">{fr}</div>}
    </div>
  )
}

/** Case 田字格 : cadre plein, croix et diagonales en pointillés rouges. */
export function Tian({ size, children, className = '', diag = true }: { size: number | string; children?: ReactNode; className?: string; diag?: boolean }) {
  return (
    <div className={`relative rounded-[18px] bg-ink border border-seal/25 overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g stroke="rgba(224,72,62,0.32)" strokeWidth="0.5" strokeDasharray="2.2 2.2" vectorEffect="non-scaling-stroke" fill="none">
          <line x1="50" y1="0" x2="50" y2="100" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" vectorEffect="non-scaling-stroke" />
          {diag && <><line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" /><line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" /></>}
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

/** Tampon 朱砂 « 熟 » (shú, maîtrisé). */
export function Seal({ size = 34, char = '熟' }: { size?: number; char?: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-[6px] bg-seal text-white font-ser rotate-[-6deg] shadow-[0_2px_10px_rgba(224,72,62,0.35)]"
      style={{ width: size, height: size, fontSize: size * 0.62 }} aria-label="maîtrisé">{char}</span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[22px] p-5 bg-s1 border border-border ${className}`}>{children}</div>
}

export function Btn({ children, onClick, kind = 'primary', className = '', disabled }: {
  children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'ok' | 'bad' | 'quiet'; className?: string; disabled?: boolean
}) {
  const k = {
    primary: 'bg-accent text-white',
    ghost: 'bg-s2 text-txt border border-border',
    quiet: 'bg-transparent text-accent2',
    ok: 'bg-green text-white',
    bad: 'bg-s2 text-txt border border-border',
  }[kind]
  return (
    <button disabled={disabled} onClick={onClick}
      className={`rounded-2xl px-4 py-3.5 font-semibold text-[15px] transition active:scale-[0.97] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ${k} ${className}`}>
      {children}
    </button>
  )
}

/** Titre de section discret, en casse normale. */
export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold text-muted mb-2.5">{children}</p>
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto scrollbar-none px-5 pt-5 pb-10">{children}</div>
}

export function Back({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} className="text-[15px] text-accent2 mb-4 -ml-1 px-1 py-1">‹ {children}</button>
}

/** Couleur d'un niveau 0–7 (gris → ambre → or → vert). */
export function levelColor(level: number, isNew: boolean) {
  if (isNew) return '#3a3858'
  if (level >= 5) return '#10b981'
  if (level >= 3) return '#F0C96A'
  return '#c2793a'
}

/** Petite jauge de 7 niveaux. */
export function Steps({ level, isNew, label }: { level: number; isNew: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-ser text-[15px] text-txt2 w-5">{label}</span>
      <div className="flex gap-[3px] flex-1">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="h-[6px] flex-1 rounded-full" style={{ background: !isNew && i < level ? levelColor(level, false) : '#22213d' }} />
        ))}
      </div>
    </div>
  )
}
