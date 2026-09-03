import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { runReasoning, normalizeCategory, CATEGORIES } from "../../shared/legalReasoning.ts";
import { retrieve } from "../../shared/retrieval.ts";

// Assessment pipeline: retrieval (RAG) + deterministic reasoning + plain-language
// explanation. The LLM only writes the explanation from the deterministic result;
// it never decides the score or the legal position.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const description = (body?.description || "").toString().trim();
    const category = normalizeCategory(body?.category || body?.understandingCategory);
    const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};
    const language = body?.language === "ur" ? "ur" : "en";
    const caseId = body?.caseId ? String(body.caseId) : null;
    const reassessNote = (body?.reassessNote || "").toString().trim();

    if (!description) return Response.json({ error: "Description is required." }, { status: 400 });

    // 1. Deterministic reasoning over the structured facts.
    const reasoning = runReasoning(category, answers);

    // 2. Retrieval over the LegalPrecedent library (RAG evidence layer).
    let hits = [];
    try {
      const records = await base44.asServiceRole.entities.LegalPrecedent.list("-updated_date", 500);
      const list = Array.isArray(records) ? records : [];
      hits = retrieve(list, description + " " + (body?.issues || []).join(" "), category, 5);
    } catch (e) {
      hits = [];
    }

    // 3. LLM writes a plain-language explanation from the deterministic result.
    const catLabel = CATEGORIES[category] ? CATEGORIES[category].label : "General";
    const evidenceText = hits.map((h, i) =>
      `[${i + 1}] ${h.title}${h.court ? " (" + h.court + ")" : ""}${h.date ? ", " + h.date : ""} — ${h.excerpt}`
    ).join("\n");

    const prompt = `You are LEXAID, a legal-information helper for ordinary people in Pakistan. You do NOT give legal advice or predict outcomes. Retrieved references are evidence only — do not invent citations or cases.
Area: ${catLabel}
User problem: ${description}
Answers to questions: ${JSON.stringify(answers)}
Deterministic assessment:
- Score (position strength /100): ${reasoning.score}
- Confidence: ${reasoning.confidence}
- Level: ${reasoning.level}
- Supporting factors: ${reasoning.supporting.map((s) => s.label).join(", ") || "none"}
- Limiting factors: ${reasoning.limiting.map((s) => s.label).join(", ") || "none"}
- Missing information: ${reasoning.missing.map((s) => s.label).join(", ") || "none"}
Reasoning steps: ${reasoning.steps.join(" | ")}
Retrieved evidence:
${evidenceText || "(none)"}
${reassessNote ? "New information added by user during reassessment: " + reassessNote : ""}

Write for a person who has NO legal knowledge. Use VERY SIMPLE, everyday words. Short sentences. No jargon. Imagine you are explaining to someone who finds all of this very confusing.

Return JSON:
{
"explanation_en": "<3-5 very short, simple English sentences. Explain the score and the main reasons in plain words a child could understand. Refer to evidence by its number like [1].>",
"explanation_ur": "<same in very simple Urdu>",
"nextSteps_en": ["<3-5 simple, practical things the person should do next, in easy words. Example: 'Keep a copy of your rental agreement.' 'Take photos of the house.' 'Go to the nearest free legal aid office.' 'Talk to a licensed lawyer before signing anything.'>"],
"nextSteps_ur": ["<same simple steps in Urdu>"],
"whatChanged": ${reassessNote ? '"<what changed because of the new information, in very simple words in the user language>"' : "null"}
}
Do not repeat the disclaimer. Do not invent laws or citations.`;

    let explanation = { explanation_en: "", explanation_ur: "", whatChanged: null };
    try {
      explanation = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            explanation_en: { type: "string" },
            explanation_ur: { type: "string" },
            nextSteps_en: { type: "array", items: { type: "string" } },
            nextSteps_ur: { type: "array", items: { type: "string" } },
            whatChanged: { type: ["string", "null"] },
          },
          required: ["explanation_en", "explanation_ur", "nextSteps_en", "nextSteps_ur"],
        },
      });
    } catch (e) {
      explanation = {
        explanation_en: reasoning.steps.join(" "),
        explanation_ur: reasoning.urduSteps.join(" "),
        nextSteps_en: [],
        nextSteps_ur: [],
        whatChanged: null,
      };
    }

    const assessment = {
      ...reasoning,
      explanation_en: explanation.explanation_en || reasoning.steps.join(" "),
      explanation_ur: explanation.explanation_ur || reasoning.urduSteps.join(" "),
      nextSteps_en: Array.isArray(explanation.nextSteps_en) ? explanation.nextSteps_en : [],
      nextSteps_ur: Array.isArray(explanation.nextSteps_ur) ? explanation.nextSteps_ur : [],
      whatChanged: explanation.whatChanged || null,
      reassessNote: reassessNote || null,
    };

    const references = hits.map((h) => ({
      id: h.id,
      title: h.title,
      caseId: h.caseId,
      court: h.court,
      date: h.date,
      category: h.category,
      excerpt: h.excerpt,
      sourceType: h.sourceType,
      citation: h.citation,
      isSample: h.isSample,
      score: h.score,
      matchedTerms: h.matchedTerms,
    }));

    // 4. Persist to the user's LegalCase (create or update + reassessment history).
    let savedCase = null;
    try {
      const payload = {
        title: (body?.title || description.slice(0, 60)),
        description,
        language,
        category,
        understanding: JSON.stringify(body?.understanding || {}),
        questions: JSON.stringify(body?.questions || []),
        answers: JSON.stringify(answers),
        assessment: JSON.stringify(assessment),
        references: JSON.stringify(references),
        status: reassessNote ? "reassessed" : "assessed",
        reassessmentNote: reassessNote || "",
      };

      if (caseId) {
        const existing = await base44.entities.LegalCase.get(caseId);
        const prevAssessments = existing?.assessment ? [existing.assessment] : [];
        const merged = { ...payload };
        // keep a simple reassessment trail inside assessment JSON
        const newAssess = JSON.parse(payload.assessment);
        newAssess.previous = existing?.assessment ? JSON.parse(existing.assessment) : null;
        merged.assessment = JSON.stringify(newAssess);
        savedCase = await base44.entities.LegalCase.update(caseId, merged);
      } else {
        savedCase = await base44.entities.LegalCase.create({ ...payload, status: "assessed" });
      }
    } catch (e) {
      savedCase = null;
    }

    return Response.json({ assessment, references, caseId: savedCase ? savedCase.id : caseId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
