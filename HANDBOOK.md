# HANDBOOK — App « 汉字圈 » (Hànzì quān)

> Cahier des charges à donner à Claude Code. Fichier de données à joindre : `seed-data.json`.

## 1. Objectif

Une app personnelle (un seul utilisateur : moi, étudiant francophone en chinois à Guangzhou, niveau ~HSK 2) pour **maîtriser les caractères chinois : les lire ET les écrire**.

Principe central : **à chaque fois que je donne un nouveau cours, l'app se met à jour**. Elle extrait les caractères, ajoute les nouveaux, garde les anciens, et me fait réviser **les nouveaux et les anciens ensemble**, en boucle, jusqu'à ce que je les maîtrise.

Langue de l'interface : **français**. Tout caractère ou phrase chinoise est **toujours** affiché avec son **pinyin** (avec les tons) et sa **traduction française**. Les caractères sont toujours affichés **plus grands** que le pinyin et la traduction.

## 2. Stack recommandée

- **Frontend** : React + Vite + TypeScript, en **PWA** installable sur iPhone (utilisation principale sur téléphone, au doigt).
- **Backend / données** : Supabase (Auth avec un seul compte, Postgres).
- **IA : PAS d'API dans la version 1.** L'analyse d'un cours se fait « à la main » avec un prompt (voir 3.1 et 5) : l'app me donne un prompt à copier, je le colle avec mon cours dans une IA de chat (Claude, etc.), puis je colle la réponse JSON dans l'app. L'intégration de l'API Anthropic est prévue plus tard (section 10). Le code doit donc séparer « source de l'analyse » (collage manuel aujourd'hui, API demain) et « import/fusion » (identique dans les deux cas).
- **Écriture** : bibliothèque `hanzi-writer` (npm) et données de traits `hanzi-writer-data` (npm, environ 9 500 caractères). Les données doivent être auto-hébergées dans l'app (dossier `public/strokes/`) pour marcher hors ligne et depuis la Chine sans dépendre d'un CDN.
- **Audio** : Web Speech API (`speechSynthesis`, langue `zh-CN`, vitesse lente par défaut 0.75).
- **Hors ligne** : les révisions doivent fonctionner sans réseau (cache local, synchronisation au retour du réseau). Seul l'ajout d'un cours a besoin d'Internet.

Note réseau : je suis en Chine. Il faut tester que l'Edge Function et Supabase répondent bien, et ne charger aucune ressource bloquée (Google Fonts, etc.). Les polices doivent être embarquées dans l'app.

## 3. Fonctionnalités

### 3.1 Ajouter un cours (l'app « s'actualise »)

1. Écran **« Nouveau cours »**, en 3 étapes numérotées :
   - **Étape 1 · Copier le prompt.** Un gros bouton **« Copier le prompt »** copie le prompt de la section 5 dans le presse-papiers. Le prompt est **généré par l'app** : il contient à la fin la liste de mes caractères déjà connus (caractère + sens), pour que l'IA garde les mêmes sens d'un cours à l'autre.
   - **Étape 2 · Aller dans l'IA.** Texte d'aide : « Colle le prompt dans Claude, ajoute la photo ou le texte de ta leçon, envoie. » (Option : bouton qui ouvre claude.ai.)
   - **Étape 3 · Coller la réponse.** Une grande zone de texte où je colle la réponse de l'IA, puis bouton **« Importer »**.
2. **Lecture de la réponse, tolérante** : extraire le JSON même s'il est entouré de texte ou dans un bloc ```json```, réparer les erreurs simples (virgules en trop, guillemets typographiques “ ”, retours à la ligne dans les chaînes). Valider avec zod. Si c'est invalide : message clair qui dit quoi corriger (ex. « La phrase 4 n'a pas de pinyin ») et bouton « Copier un message de correction pour l'IA ».
3. **Écran de vérification** avant d'enregistrer :
   - « **X nouveaux caractères** » (en vert), « **Y déjà connus** » (en gris, avec leur niveau actuel) ;
   - je peux corriger le pinyin ou le sens d'un caractère, et en retirer.
4. **« Ajouter au programme »** → **fusion** :
   - un caractère **nouveau** est créé, avec le statut « nouveau » et deux pistes de révision (lecture et écriture) au niveau 0 ;
   - un caractère **déjà connu** n'est jamais dupliqué : on lui ajoute juste le lien vers ce cours (ses nouvelles phrases d'exemple). Sa progression reste intacte. S'il était déjà « maîtrisé », il revient une fois en révision dans les 2 jours, pour le revoir dans son nouveau contexte ;
   - les phrases du cours sont enregistrées.
5. Le cours apparaît dans **« Mes cours »** (liste avec date et nombre de caractères). Je peux ouvrir un cours pour relire ses phrases (caractères, pinyin, traduction, bouton audio) ou le supprimer. Supprimer un cours ne supprime pas les caractères appris : ils perdent seulement le lien vers ce cours.

### 3.2 Réviser — LECTURE

- **Recto** : le caractère seul, en très grand. Option « afficher le contexte » : un mot du cours qui le contient, ce caractère étant mis en évidence.
- Je réfléchis, puis je touche **« Voir »**.
- **Verso** : pinyin, sens en français, bouton ▶ (audio), puis 1 ou 2 **phrases d'exemple tirées de MES cours** (caractères, pinyin, traduction), avec le caractère surligné.
- Deux boutons : **« Je savais »** / **« Pas encore »**.
- Variante QCM (à activer) : le caractère est affiché avec 4 choix de sens, ou 4 choix de pinyin. Les mauvaises réponses sont tirées parmi mes autres caractères.

### 3.3 Réviser — ÉCRITURE

- Je vois : le **pinyin**, le **sens**, et une **phrase d'exemple** où le caractère est remplacé par ＿.
- Je **trace le caractère au doigt** dans une grille 田字格 (mode quiz de `hanzi-writer`). L'app vérifie **chaque trait, dans le bon ordre**.
- Aide : après 3 erreurs sur un même trait, l'app montre le trait attendu (`showHintAfterMisses: 3`).
- Résultat : 0 à 1 erreur au total = réussi ; 2 erreurs ou plus = « pas encore ».
- Boutons : **« Voir l'ordre des traits »** (animation), **« Recommencer »**.
- Si un caractère n'a pas de données de traits, on le signale et la piste écriture est désactivée pour lui.

### 3.4 La boucle (cœur de l'app)

- Une **session du jour** mélange :
  1. tous les caractères **à revoir aujourd'hui** (les anciens) ;
  2. jusqu'à **N nouveaux** caractères par jour (réglable, 10 par défaut), en priorité ceux du **cours le plus récent**.
- **Boucle d'erreur** : une carte ratée **revient dans la même session**, 3 à 5 cartes plus loin, **jusqu'à ce que je la réussisse**. La session ne se termine que quand toutes les cartes du jour sont réussies au moins une fois.
- La lecture et l'écriture sont **deux progressions séparées** pour chaque caractère. Je peux savoir lire un caractère sans savoir l'écrire.
- Un nouveau caractère passe d'abord par la lecture. Sa carte d'écriture ne s'ouvre qu'une fois sa lecture réussie une première fois.

### 3.5 Répétition espacée (algorithme)

Niveaux 0 à 7, avec un délai avant la prochaine révision :

| Niveau | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| Délai | même session | 1 j | 2 j | 4 j | 7 j | 15 j | 30 j | 60 j |

- **Réussi** (au premier essai de la session) : niveau +1, prochaine date = aujourd'hui + délai du nouveau niveau.
- **Raté** : niveau = max(1, niveau − 2) et la carte repasse dans la boucle de la session. Elle compte comme une erreur (`lapses` +1).
- **Maîtrisé** = niveau ≥ 5 sur une piste.
- Les caractères avec beaucoup d'erreurs (`lapses` ≥ 3) sont marqués **« difficiles »** et regroupés dans un filtre dédié.

### 3.6 Écoute en boucle (mode passif)

- Sans interaction, écran pouvant rester allumé (Wake Lock). Pour chaque caractère de la sélection : lecture du caractère → pause → lecture de la phrase d'exemple → pause → (option) lecture du sens en français → caractère suivant. Tourne en boucle.
- Sélection possible : un cours, les caractères du jour, ou les caractères difficiles.
- Réglages : vitesse, nombre de répétitions, durée des pauses.

### 3.7 Mes caractères

- **Grille** de tous mes caractères, colorés selon leur niveau (gris = nouveau, orange = en cours, vert = maîtrisé). Deux petites pastilles par caractère : L (lecture) et É (écriture).
- Filtres : par cours, nouveaux, difficiles, maîtrisés, piste lecture ou écriture.
- Recherche par caractère, par pinyin (sans tenir compte des tons) ou par sens.
- **Fiche d'un caractère** : grand caractère, pinyin, sens, audio, animation de l'ordre des traits, liste des cours où il apparaît, toutes ses phrases d'exemple, historique (dernière révision, niveau, nombre d'erreurs).

### 3.8 Accueil / statistiques

- « Aujourd'hui : **A à lire · B à écrire · C nouveaux** » et un gros bouton **« Commencer la session »**.
- Total de caractères, nombre de caractères maîtrisés en lecture et en écriture, série de jours consécutifs, petit graphique des 30 derniers jours.

## 4. Modèle de données (Supabase / Postgres)

```sql
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,          -- ex. 谈谈你最难忘的一次旅行
  title_py text, title_fr text,
  source_text text,             -- texte collé
  image_paths text[],           -- photos dans Storage
  created_at timestamptz default now()
);

create table sentences (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade,
  position int, zh text not null, py text not null, fr text not null
);

create table characters (
  char text primary key,        -- un seul caractère
  pinyin text not null, meaning_fr text not null,
  created_at timestamptz default now(),
  has_strokes boolean default true,
  -- piste lecture
  read_level int default 0, read_due date, read_lapses int default 0, read_last timestamptz,
  -- piste écriture
  write_level int default 0, write_due date, write_lapses int default 0, write_last timestamptz,
  write_unlocked boolean default false
);

create table character_courses (
  char text references characters on delete cascade,
  course_id uuid references courses on delete cascade,
  primary key (char, course_id)
);

create table review_log (
  id bigserial primary key, char text, track text check (track in ('read','write')),
  ok boolean, mistakes int, at timestamptz default now()
);
```

- Les phrases d'exemple d'un caractère = les `sentences` des cours liés qui **contiennent** ce caractère (requête `zh like '%' || char || '%'`).
- Mettre la RLS (Row Level Security) en place pour que seul mon compte puisse lire et écrire.

## 5. Le prompt d'extraction (copié par l'app)

Texte exact à copier (le bloc `{{DEJA_CONNUS}}` est remplacé par l'app par une ligne par caractère connu, format `字 | pinyin | sens`, ou par « (aucun) ») :

```text
Tu es mon assistant pour apprendre le chinois. Je suis francophone, niveau HSK 2.
Je vais t'envoyer une leçon de chinois (photo et/ou texte). Analyse-la et réponds UNIQUEMENT avec un bloc JSON valide, sans aucun texte avant ou après.

RÈGLES
1. "sentences" : chaque phrase chinoise de la leçon, dans l'ordre, sans en oublier (dialogues, textes, exemples de grammaire). Pour chacune : "zh" (caractères exacts, ponctuation chinoise), "py" (pinyin avec les tons, mots séparés par des espaces, tons modifiés comme à l'oral : yí ge, bú shì), "fr" (traduction française naturelle).
2. "characters" : CHAQUE caractère chinois unique de la leçon (pas la ponctuation, pas les lettres). Pour chacun :
   - "char" : un seul caractère ;
   - "pinyin" : la lecture utilisée DANS CETTE LEÇON (了 → le, 便 dans 便宜 → pián) ;
   - "meaning_fr" : sens court en français (8 mots maximum). Si le caractère seul a peu de sens, ajoute le mot de la leçon entre parenthèses, ex. "bien que (虽然)".
3. Pour les caractères déjà dans ma liste "DÉJÀ CONNUS" ci-dessous, reprends EXACTEMENT le même pinyin et le même sens, sauf si la lecture est vraiment différente dans cette leçon.
4. "words" : les mots et expressions de vocabulaire importants de la leçon (2 caractères ou plus), avec "zh", "py", "fr".
5. "grammar" : les structures de grammaire de la leçon, avec "pattern" (ex. "虽然……但是……"), "py", "fr" (explication courte en français), "example" (une phrase de la leçon qui l'utilise).
6. "title" : le titre de la leçon en chinois s'il y en a un (sinon invente un titre court en chinois), avec "title_py" et "title_fr".
7. Vérifie avant de répondre : JSON valide, guillemets droits ", aucune virgule en trop, tous les caractères des phrases sont bien dans "characters".

FORMAT EXACT
{
  "title": "", "title_py": "", "title_fr": "",
  "sentences": [{"zh": "", "py": "", "fr": ""}],
  "words": [{"zh": "", "py": "", "fr": ""}],
  "grammar": [{"pattern": "", "py": "", "fr": "", "example": ""}],
  "characters": [{"char": "", "pinyin": "", "meaning_fr": ""}]
}

DÉJÀ CONNUS
{{DEJA_CONNUS}}

Voici ma leçon :
```

- Validation côté app (zod) : chaque `char` est un seul caractère CJK. Tout caractère présent dans une phrase mais absent de `characters` est ajouté automatiquement avec un pinyin calculé (bibliothèque `pinyin-pro`) et un sens vide marqué « à compléter ». Un caractère de `characters` absent des phrases est signalé à l'écran de vérification.
- Si la liste « déjà connus » devient très longue (> 800 caractères), n'envoyer que ceux qui apparaissent dans le texte collé, ou le format compact `字=sens`.
- Stocker aussi `words` et `grammar` (tables `words` et `grammar_points`, liées au cours) : ils s'affichent dans la page du cours, et les mots apparaissent sur le verso des cartes des caractères qu'ils contiennent.

## 6. Données de départ — `seed-data.json`

- `courses` : mes **4 sujets d'oral** (01 restaurant, 02 campus, 03 but de l'apprentissage du chinois, 04 voyage), avec 51 phrases au total (caractères, pinyin, traduction).
- `characters` : les **255 caractères** de ces sujets, avec pinyin, sens en français et `first_course`.
- Créer un script `scripts/seed.ts` qui importe ce fichier, crée les cours, les phrases, les caractères et les liens `character_courses`. Tous les caractères démarrent au niveau 0.

## 7. Écrans et navigation

Barre d'onglets en bas : **Accueil · Réviser · Écouter · Caractères · Cours (+)**.
Design sobre et lisible, mode clair et sombre, gros boutons utilisables au pouce. Le caractère est l'élément principal de chaque carte. Police chinoise embarquée : Noto Serif SC ou Noto Sans SC, en sous-ensemble ou chargée en local.

## 8. Étapes de développement

1. Projet Vite + React + PWA, Supabase (schéma et RLS), connexion, import du seed. **Vérifier** : les 255 caractères et les 4 cours sont en base.
2. Révision **lecture** et algorithme de répétition espacée, avec la boucle d'erreur. **Vérifier** par des tests unitaires sur l'algorithme (réussite, échec, dates).
3. Révision **écriture** avec `hanzi-writer` et les données de traits auto-hébergées. **Vérifier** sur iPhone (tracé au doigt, pas de défilement de la page pendant le tracé).
4. **Ajout de cours par prompt** : génération du prompt avec la liste des caractères connus, bouton copier, collage de la réponse, lecture tolérante du JSON, écran de vérification, fusion. **Vérifier** avec un cours qui contient à la fois des caractères déjà connus et des nouveaux : aucun doublon, la progression des anciens reste intacte. Tester aussi une réponse avec du texte autour du JSON et une réponse cassée.
5. Écoute en boucle, grille « Mes caractères », fiche caractère, statistiques.
6. Mode hors ligne (cache et synchronisation), installation sur l'écran d'accueil de l'iPhone, déploiement.

## 9. Critères d'acceptation

- [ ] Avec le prompt copié et la réponse de l'IA collée, un nouveau cours est importé en moins de 2 minutes, et ses nouveaux caractères sont dans ma session du jour.
- [ ] Une réponse avec du texte autour du JSON s'importe quand même.
- [ ] Un caractère déjà connu n'est jamais dupliqué et garde sa progression.
- [ ] Une carte ratée revient dans la même session jusqu'à ce que je la réussisse.
- [ ] Chaque caractère a deux progressions séparées, lecture et écriture.
- [ ] Le tracé vérifie l'ordre des traits, et je peux voir l'animation.
- [ ] Partout, le chinois est accompagné du pinyin et de la traduction française.
- [ ] Les révisions marchent sans Internet.

## 10. Plus tard : intégration de l'API (version 2)

- Ajouter une Edge Function Supabase `analyze-course` qui envoie la photo/texte à l'API Anthropic (modèle avec vision) avec **le même prompt** que la section 5, et renvoie le JSON.
- Dans l'écran « Nouveau cours », ajouter un bouton « Analyser automatiquement » à côté du mode prompt. Le mode prompt reste disponible (gratuit, et utile si l'API ne répond pas depuis la Chine).
- La réponse passe par **exactement la même** lecture, validation et fusion que le collage manuel.
- La clé API ne doit jamais se retrouver dans le frontend.
