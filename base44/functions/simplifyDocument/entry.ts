import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Legal document simplifier. Text is extracted from the uploaded file, then the
// LLM structures a plain-language breakdown. No invented clauses or conclusions.

const MAX_TEXT = 12000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const fileUrl = (body?.fileUrl || "").toString().trim();
    const fileName = (body?.fileName || "document").toString().trim();
    const language = body?.language === "ur" ? "ur" : "en";
    const caseId = body?.caseId ? String(body.caseId) : null;

    if (!fileUrl) return Response.json({ error: "A file is required." }, { status: 400 });

    // Extract text from the uploaded file (pdf, image, txt, etc.).
    let extractedText = "";
    try {
      const res = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
      });
      extractedText = (res?.output?.text || res?.text || "").toString();
    } catch (e) {
      extractedText = "";
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return Response.json({ error: "Could not extract readable text from this document. Try a clearer scan or a text-based file." }, { status: 422 });
    }

    const trimmed = extractedText.slice(0, MAX_TEXT);
    const prompt = `You are LEXAID. Simplify a legal document for an ordinary person in Pakistan who has NO legal knowledge. Use VERY SIMPLE, everyday words. Short sentences. No jargon. Explain as if talking to someone who finds legal documents very confusing. Do NOT invent clauses, obligations or legal conclusions. Only describe what the document actually appears to contain. If something is unclear, say so in simple words.

Document filename: ${fileName}
Document text:
"""
${trimmed}
"""

Return JSON:
{
"documentType": "<what this document appears to be, in simple words, e.g. 'a rental agreement', 'a court notice', 'a marriage certificate'>",
"simpleExplanation": "<2-4 very short, simple sentences. Explain what this paper is for, like you are talking to a beginner.>",
"importantPoints": ["<simple point a beginner should know>"],
"importantDates": ["<date or deadline in simple words, or 'Not clearly stated'>"],
"termsNeedingAttention": ["<a word or clause to check, explained simply>"],
"nextSteps": ["<3-5 simple, practical things the person should do next, in easy words>"],
"questionsForProfessional": ["<a simple question to ask a qualified lawyer>"],
"urduExplanation": "<same very simple explanation in Urdu>"
}

Write documentType in English. Write simpleExplanation, importantPoints, importantDates, termsNeedingAttention, nextSteps, and questionsForProfessional in ${language === "ur" ? "simple, easy Urdu" : "simple English"}. Always also provide urduExplanation in simple Urdu. Do not invent citations.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          documentType: { type: "string" },
          simpleExplanation: { type: "string" },
          importantPoints: { type: "array", items: { type: "string" } },
          importantDates: { type: "array", items: { type: "string" } },
          termsNeedingAttention: { type: "array", items: { type: "string" } },
          nextSteps: { type: "array", items: { type: "string" } },
          questionsForProfessional: { type: "array", items: { type: "string" } },
          urduExplanation: { type: "string" },
        },
        required: ["documentType", "simpleExplanation", "importantPoints", "nextSteps", "urduExplanation"],
      },
    });

    let savedDoc = null;
    try {
      savedDoc = await base44.entities.LegalDocument.create({
        fileName,
        fileUrl,
        extractedText: trimmed,
        analysis: JSON.stringify(analysis),
        caseId: caseId || "",
      });
    } catch (e) {
      savedDoc = null;
    }

    return Response.json({ analysis, extractedTextLength: trimmed.length, docId: savedDoc ? savedDoc.id : null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
