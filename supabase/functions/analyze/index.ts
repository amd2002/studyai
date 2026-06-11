// ============================================================
//  Edge Function : /analyze
//  Tourne sur Supabase (Deno). Reçoit une image/texte de cours,
//  appelle Claude, renvoie un JSON structuré.
//
//  La clé ANTHROPIC_API_KEY est un SECRET Supabase — jamais exposée au client.
//  Déploiement :  supabase functions deploy analyze
//  Secret :       supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = "claude-sonnet-4-20250514";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function systemPrompt(subject: string, explainLanguage: string): string {
  return `Tu es StudyAI, un assistant pédagogique expert. Tu analyses des contenus
de cours (images, texte) et génères des fiches d'étude ultra complètes,
expliquées en ${explainLanguage}.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour :
{
  "title": "Titre court",
  "subject": "${subject}",
  "summary": "Résumé 2-3 phrases",
  "explanation": "HTML (<h3>,<p>,<ul>,<li>,<code>; chinois: <span class='zh'>字</span> <span class='py'>pinyin</span>)",
  "words": [{"zh":"字","py":"zì","fr":"sens","category":"vocabulaire|verbe|grammaire","example":"phrase"}],
  "grammar": [{"rule":"...","formula":"...","examples":["...","..."]}],
  "quiz": [
    {"type":"qcm","question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."},
    {"type":"vrai_faux","question":"...","answer":true,"explanation":"..."},
    {"type":"fill","question":"___ 好","answer":"你","explanation":"..."}
  ],
  "plan": [{"week":1,"title":"...","days":[{"day":"Lundi","task":"..."}]}],
  "tags": ["tag1","tag2"]
}
Au moins 8 questions et 10 mots. Pour le chinois, toujours le pinyin.`;
}

function extractJson(text: string): unknown {
  let t = text.trim().replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (m) t = m[0];
  return JSON.parse(t);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      image_base64,
      image_media_type = "image/png",
      text_content,
      subject = "Chinois",
      explain_language = "français",
    } = body;

    // Build Claude message content
    let content: unknown;
    if (image_base64) {
      content = [
        {
          type: "image",
          source: { type: "base64", media_type: image_media_type, data: image_base64 },
        },
        { type: "text", text: `Analyse ce cours de ${subject} et génère le JSON.` },
      ];
    } else {
      content = `Voici un cours de ${subject} :\n\n${text_content ?? ""}\n\nGénère le JSON complet.`;
    }

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: systemPrompt(subject, explain_language),
        messages: [{ role: "user", content }],
      }),
    });

    const data = await resp.json();
    const raw = data.content?.[0]?.text ?? "";
    const result = extractJson(raw);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
