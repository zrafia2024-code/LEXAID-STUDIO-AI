import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { retrieve } from "../../shared/retrieval.ts";

// Reference-library search (Similar Case Finder). Deterministic, traceable
// retrieval over the LegalPrecedent entity. No fabricated cases or citations.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const query = (body?.query || "").toString().trim();
    const category = (body?.category || "").toString().trim();
    const limit = Math.min(parseInt(body?.limit, 10) || 12, 30);

    if (!query && !category) return Response.json({ error: "Provide a search query or category." }, { status: 400 });

    const records = await base44.asServiceRole.entities.LegalPrecedent.list("-updated_date", 500);
    const list = Array.isArray(records) ? records : [];
    let hits = retrieve(list, query, category, limit);

    // If only a category filter (no query), return category matches ranked by recency.
    if (!query && category) {
      hits = list
        .filter((r) => r.category === category)
        .slice(0, limit)
        .map((r) => ({
          id: r.id,
          title: r.title,
          caseId: r.caseId,
          court: r.court,
          date: r.date,
          category: r.category,
          summary: r.summary,
          fullText: r.fullText || "",
          excerpt: r.summary || "",
          sourceType: r.sourceType,
          citation: r.citation,
          isSample: r.isSample,
          score: 0,
          matchedTerms: [],
        }));
    }

    return Response.json({ results: hits });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
