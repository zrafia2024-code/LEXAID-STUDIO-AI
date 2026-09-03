import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { normalizeCategory, getQuestionsForCategory, CATEGORIES } from "../../shared/legalReasoning.ts";

// AI query-understanding layer. The LLM structures the user's problem; it is
// NOT the legal decision-maker. Follow-up questions come from the deterministic
// reasoning engine (the category's missing factors), not the LLM.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const description = (body?.description || "").toString().trim();
    const language = body?.language === "ur" ? "ur" : "en";

    if (!description || description.length < 10) {
      return Response.json({ error: "Please describe your legal issue in more detail." }, { status: 400 });
    }

    const categoryList = Object.values(CATEGORIES)
      .map((c) => `${c.id} — ${c.label}`)
      .join("\n");

    const prompt = `You are LEXAID, a specialized legal-information assistant for Pakistan. 
You do NOT give legal advice or predict outcomes.
A citizen described a legal problem. Analyse it and return STRICT JSON only.

User language: ${language}
User problem:
"""
${description}
"""

Choose the single most probable legal area from this list (use the id before the dash):
${categoryList}

SPECIAL RULE FOR HARASSMENT & BULLYING:
If the citizen describes bullying, ragging, threats, physical intimidation, isolation, insults, or blackmail by classmates, peers, seniors, teachers, or students, or online harassment, you MUST categorize it as "harassment".

Return JSON with this shape:
{
"category": "<one of the ids above>",
"title": "<short 4-8 word label for the case>",
"issues": ["<issue 1>", "<issue 2>"],
"extractedFacts": ["<fact stated by the user>"],
"missingInfo": ["<material fact not stated that may affect analysis>"],
"entities": ["<people/organisations/property mentioned>"],
"confidence": <0-100 integer, how clearly the problem was understood>
}

Rules:
- Do not invent laws, citations or case names.
- Use VERY SIMPLE, everyday words that anyone can understand. No legal jargon. Short sentences.
- Write each issue, fact and missing item as a simple sentence a beginner could understand.
- If the area is unclear, use "other".
- If the user language is Urdu (ur), you MUST write the title, issues, extractedFacts, missingInfo and entities in simple, natural, fluent Urdu with ZERO English sentences. If English, write in simple English. Never mix languages.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          category: { type: "string" },
          title: { type: "string" },
          issues: { type: "array", items: { type: "string" } },
          extractedFacts: { type: "array", items: { type: "string" } },
          missingInfo: { type: "array", items: { type: "string" } },
          entities: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
        },
        required: ["category", "title", "issues", "extractedFacts", "missingInfo", "entities", "confidence"],
      },
    });

    const category = normalizeCategory(llm.category);
    const understanding = {
      category,
      title: llm.title || "",
      issues: Array.isArray(llm.issues) ? llm.issues : [],
      extractedFacts: Array.isArray(llm.extractedFacts) ? llm.extractedFacts : [],
      missingInfo: Array.isArray(llm.missingInfo) ? llm.missingInfo : [],
      entities: Array.isArray(llm.entities) ? llm.entities : [],
      confidence: typeof llm.confidence === "number" ? llm.confidence : 60,
    };

    const questions = getQuestionsForCategory(category, language);

    return Response.json({ understanding, questions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
