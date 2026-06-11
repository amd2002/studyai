# 🧠 StudyAI — Cahier Intelligent (100% gratuit)

Photographie un cours → l'IA (Claude) génère explication, vocabulaire classé,
quiz et plan d'apprentissage. Mobile/tablette, installable (PWA).

**Stack 100% gratuite :**
- **Code** → GitHub
- **Base de données + Auth + Storage + Fonction IA** → Supabase (gratuit)
- **Site web** → GitHub Pages (gratuit, déploiement auto)

Pas de carte bancaire. Pas de serveur à payer.

---

## 🏗 Architecture

```
                  ┌─────────────────────────────────────┐
   Ton navigateur │  React + Vite (PWA)                  │
   (GitHub Pages) │  - Login / Dashboard                 │
                  └──────────────┬──────────────────────┘
                                 │
              ┌──────────────────┼─────────────────────┐
              ▼                                          ▼
   ┌────────────────────┐                    ┌────────────────────────┐
   │ Supabase Database  │                    │ Supabase Edge Function │
   │ + Auth + Storage   │                    │  /analyze              │
   │ (RLS = sécurité)   │                    │  → appelle Claude      │
   └────────────────────┘                    │  (clé API = secret)    │
                                              └────────────────────────┘
```

```
studyai/
├── src/
│   ├── lib/
│   │   ├── supabase.ts       client Supabase
│   │   └── api.ts            requêtes DB + appel fonction IA
│   ├── context/AuthContext.tsx
│   ├── pages/Login.tsx, Dashboard.tsx
│   └── types/index.ts
├── supabase/
│   ├── migrations/0001_init.sql   ⭐ schéma + Row Level Security
│   └── functions/analyze/index.ts ⭐ appel Claude (Deno/TypeScript)
└── .github/workflows/deploy.yml   déploiement auto GitHub Pages
```

---

## 🚀 Mise en route (étape par étape)

### 1️⃣ Créer le projet Supabase (gratuit)

1. Va sur https://supabase.com → **New project** (gratuit, pas de CB).
2. Note ton **Project URL** et ta clé **anon public** (Settings > API).
3. **SQL Editor** → colle le contenu de `supabase/migrations/0001_init.sql` → **Run**.
   (Ça crée la table `courses`, la sécurité RLS, et le bucket de stockage.)
4. **Authentication > Providers** → active *Email* et *Google* (optionnel).

### 2️⃣ Déployer la fonction IA

```bash
# Installe le CLI Supabase une fois
npm install -g supabase

supabase login
supabase link --project-ref TON_PROJECT_REF

# Mets ta clé Claude comme secret (jamais dans le code !)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx

# Déploie la fonction
supabase functions deploy analyze --no-verify-jwt
```

> 🔑 Récupère ta clé Claude sur https://console.anthropic.com

### 3️⃣ Lancer en local

```bash
npm install
cp .env.example .env        # remplis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev                 # → http://localhost:5173
```

### 4️⃣ Mettre le code sur GitHub + déployer

```bash
git init
git add .
git commit -m "StudyAI initial"
git branch -M main
git remote add origin https://github.com/TON_USER/studyai.git
git push -u origin main
```

Puis sur GitHub :
1. **Settings > Pages** → Source : **GitHub Actions**.
2. **Settings > Secrets and variables > Actions** → ajoute :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Si ton site est servi sur `user.github.io/studyai/`, ajoute aussi la variable
   `BASE_PATH=/studyai/` dans le workflow (ligne `env:` du build).

À chaque `git push`, le site se reconstruit et se déploie tout seul. 🎉

---

## 🔒 Pourquoi c'est sécurisé

| Élément | Exposé au navigateur ? | Pourquoi c'est OK |
|---|---|---|
| `VITE_SUPABASE_ANON_KEY` | Oui | Conçue pour ça — la sécurité vient des règles **RLS** en base |
| `ANTHROPIC_API_KEY` | **Non, jamais** | Stockée comme *secret* Supabase, utilisée seulement par la fonction Edge |
| Données utilisateur | — | **RLS** : la base refuse qu'un user lise les cours d'un autre |

C'est la grande différence avec le prototype HTML : ici la clé Claude est protégée
côté serveur, comme dans une vraie app de production.

---

## 💰 Limites du tier gratuit (large pour ton usage)

| Service | Gratuit |
|---|---|
| Supabase DB | 500 Mo |
| Supabase Storage | 1 Go |
| Supabase Edge Functions | 500 000 appels/mois |
| GitHub Pages | 100 Go bande passante/mois |

---

## 🛣 Prochaines features (archi déjà prête)

- [ ] Flashcards (répétition espacée) — réutilise `words`
- [ ] Quiz plein écran — `quiz` déjà généré
- [ ] Ardoise + reconnaissance d'écriture — nouvelle fonction `/recognize`
- [ ] Notes audio — `kind: 'audio'` + Supabase Storage déjà prévus

---

Massaid Barry — 2026.
