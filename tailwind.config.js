/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { bg:'#0a0a0f', s1:'#111118', s2:'#18181f', s3:'#22222c', border:'#2a2a38', accent:'#6c63ff', accent2:'#a78bfa', gold:'#f59e0b', green:'#10b981', danger:'#ef4444', cyan:'#06b6d4', txt:'#e8e6f0', muted:'#6b6880' },
    fontFamily: { sans:['Syne','sans-serif'], mono:['Syne Mono','monospace'], ser:['Noto Serif SC','serif'] }
  }},
  plugins: []
}
