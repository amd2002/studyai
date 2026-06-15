/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#080810',
        bg2:     '#0d0d1a',
        s1:      '#0f0f1e',
        s2:      '#141428',
        s3:      '#1a1a35',
        border:  'rgba(124,111,255,0.12)',
        accent:  '#7C6FFF',
        accent2: '#A78BFA',
        accent3: '#C4B5FD',
        gold:    '#F0C96A',
        gold2:   '#FDE68A',
        green:   '#10b981',
        danger:  '#ef4444',
        cyan:    '#22d3ee',
        txt:     '#F0EEF8',
        txt2:    '#C4C0D8',
        muted:   '#6B6880',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        mono: ['Syne Mono', 'monospace'],
        ser:  ['Noto Serif SC', 'serif'],
      },
      backgroundImage: {
        'grad-accent': 'linear-gradient(135deg, #7C6FFF, #A78BFA)',
        'grad-gold':   'linear-gradient(135deg, #F0C96A, #FDE68A)',
        'grad-bg':     'linear-gradient(135deg, #080810 0%, #0d0b1f 50%, #080810 100%)',
      },
      boxShadow: {
        'glow':    '0 0 30px rgba(124,111,255,0.25), 0 0 60px rgba(124,111,255,0.1)',
        'glow-sm': '0 0 15px rgba(124,111,255,0.2)',
        'gold':    '0 0 20px rgba(240,201,106,0.3)',
        'card':    '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
}
