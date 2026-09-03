// LEXAID retrieval layer.
// Keyword + category retrieval over the LegalPrecedent entity.
// Deterministic and traceable: every result carries its source record id and
// a relevance score derived from actual overlap, never fabricated.

export interface PrecedentRecord {
  id: string;
  title: string;
  titleUr?: string;
  caseId?: string;
  court?: string;
  date?: string;
  category: string;
  summary: string;
  summaryUr?: string;
  fullText?: string;
  keywords?: string[];
  sourceType?: string;
  citation?: string;
  isSample?: boolean;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are",
  "was", "were",
  "i", "my", "me", "we", "you", "he", "she", "they", "it", "this", "that", "with",
  "by",
  "has", "have", "had", "not", "no", "do", "does", "did", "but", "if", "so", "be",
  "as", "at",
  "from", "want", "wants", "what", "can", "will", "would", "should", "there",
  "here",
]);

export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => {
      if (!t || STOPWORDS.has(t)) return false;
      if (/^\d+$/.test(t)) return true; // keep article numbers like 8, 9, 25
      return t.length > 2;
    });
}

export interface RetrievalHit {
  id: string;
  title: string;
  titleUr?: string;
  caseId?: string;
  court?: string;
  date?: string;
  category: string;
  summary: string;
  summaryUr?: string;
  fullText?: string;
  excerpt: string;
  sourceType?: string;
  citation?: string;
  isSample?: boolean;
  score: number;
  matchedTerms: string[];
}

export function retrieve(
  records: PrecedentRecord[],
  query: string,
  category: string,
  limit = 5
): RetrievalHit[] {
  const qTokens = new Set(tokenize(query));
  const hits: RetrievalHit[] = [];

  for (const r of records) {
    const haystack = `${r.title} ${r.summary} ${r.fullText || ""} ${(r.keywords || []).join(" ")}`.toLowerCase();
    const rTokens = new Set(tokenize(haystack));
    let overlap = 0;
    const matched: string[] = [];

    for (const t of qTokens) {
      if (rTokens.has(t)) {
        overlap++;
        matched.push(t);
      }
    }

    let score = overlap * 10;
    // category match boost
    if (r.category && r.category === category) score += 25;
    // title match boost (helps "Article 25" land on the right article)
    const titleLower = (r.title || "").toLowerCase();
    for (const t of qTokens) {
      if (titleLower.includes(t)) score += 15;
    }
    // keyword field boost
    for (const k of r.keywords || []) {
      if (qTokens.has(k.toLowerCase())) score += 6;
    }

    if (score <= 0) continue;

    const excerpt = makeExcerpt(r.summary || r.fullText || "", query);
    hits.push({
      id: r.id,
      title: r.title,
      titleUr: r.titleUr,
      caseId: r.caseId,
      court: r.court,
      date: r.date,
      category: r.category,
      summary: r.summary,
      summaryUr: r.summaryUr,
      fullText: r.fullText || "",
      excerpt,
      sourceType: r.sourceType,
      citation: r.citation,
      isSample: r.isSample,
      score,
      matchedTerms: matched,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

function makeExcerpt(text: string, query: string): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 200) return clean;
  const qTokens = tokenize(query);
  let bestIdx = 0;
  let bestScore = -1;
  const lower = clean.toLowerCase();

  for (let i = 0; i + 200 <= clean.length; i += 40) {
    const window = lower.slice(i, i + 200);
    let s = 0;
    for (const t of qTokens) if (window.includes(t)) s++;
    if (s > bestScore) { bestScore = s; bestIdx = i; }
  }

  let snippet = clean.slice(bestIdx, bestIdx + 200);
  if (bestIdx > 0) snippet = "…" + snippet;
  if (bestIdx + 200 < clean.length) snippet = snippet + "…";
  return snippet;
}
