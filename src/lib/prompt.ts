// Prompt d'extraction copié par l'app. Le même servira pour l'API (version 2).
import type { CharRow } from '@/types/hanzi'

const BASE = `Tu es mon assistant pour apprendre le chinois. Je suis francophone, niveau HSK 2.
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

Voici ma leçon :`

export function buildPrompt(chars: CharRow[]): string {
  const list = chars.length > 800
    ? chars.map(c => `${c.char}=${c.meaning_fr}`).join(' ; ')
    : chars.map(c => `${c.char} | ${c.pinyin} | ${c.meaning_fr}`).join('\n')
  return BASE.replace('{{DEJA_CONNUS}}', list || '(aucun)')
}
