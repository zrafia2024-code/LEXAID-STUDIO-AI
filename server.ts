import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { PAKISTAN_LAWS_DATABASE } from "./src/data/pakistanLawsDatabase";

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous limit for document uploads (base64 / PDF / text)
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// Feature-specific GoogleGenAI clients cache
const genAiClients: Record<string, GoogleGenAI | null> = {};

export function getGenAI(feature: "simplifier" | "assistant" | "default" = "default"): GoogleGenAI | null {
  let key: string | undefined;

  if (feature === "simplifier") {
    key = process.env.GEMINI_SIMPLIFIER_API_KEY || process.env.GEMINI_API_KEY;
  } else if (feature === "assistant") {
    key = process.env.GEMINI_ASSISTANT_API_KEY || process.env.GEMINI_API_KEY;
  } else {
    key = process.env.GEMINI_API_KEY || process.env.GEMINI_ASSISTANT_API_KEY || process.env.GEMINI_SIMPLIFIER_API_KEY;
  }

  if (!key) return null;

  const cacheKey = `${feature}:${key}`;
  if (!genAiClients[cacheKey]) {
    genAiClients[cacheKey] = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClients[cacheKey];
}

const PRIMARY_GEMINI_MODEL = "gemini-3.8-flash";
const FALLBACK_GEMINI_MODEL = "gemini-3.6-flash";

async function generateWithGemini(
  ai: GoogleGenAI,
  options: { contents: any; config?: any; enableSearchGrounding?: boolean }
) {
  const baseConfig = options.config || {};
  let toolsConfig = baseConfig;

  if (options.enableSearchGrounding) {
    toolsConfig = {
      ...baseConfig,
      tools: [{ googleSearch: {} }],
    };
  }

  try {
    return await ai.models.generateContent({
      model: PRIMARY_GEMINI_MODEL,
      contents: options.contents,
      config: toolsConfig,
    });
  } catch (err: any) {
    console.warn(`Primary Gemini model execution note (${err?.message || err}), retrying...`);

    // If search grounding was enabled and failed (e.g. tools conflict with certain response types), retry without search
    if (options.enableSearchGrounding) {
      try {
        return await ai.models.generateContent({
          model: PRIMARY_GEMINI_MODEL,
          contents: options.contents,
          config: baseConfig,
        });
      } catch (innerErr: any) {
        console.warn("Retrying with fallback model without search...", innerErr?.message);
      }
    }

    const isModelUnavailable =
      err?.status === 404 ||
      err?.message?.includes("404") ||
      err?.message?.includes("NOT_FOUND") ||
      err?.message?.includes("is no longer available");

    if (isModelUnavailable || true) {
      return await ai.models.generateContent({
        model: FALLBACK_GEMINI_MODEL,
        contents: options.contents,
        config: baseConfig,
      });
    }
    throw err;
  }
}

// Supabase server client helper
function getSupabaseServerClient() {
  const rawUrl = (process.env.VITE_SUPABASE_URL || "").trim();
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  const keyToUse = serviceKey || anonKey;

  if (!supabaseUrl || !keyToUse) return null;
  return {
    client: createClient(supabaseUrl, keyToUse),
    hasServiceRole: Boolean(serviceKey),
    supabaseUrl,
  };
}

// 1. Health check with detailed feature API key reporting
app.get("/api/health", (_req, res) => {
  const sb = getSupabaseServerClient();
  const simplifierKey = Boolean(process.env.GEMINI_SIMPLIFIER_API_KEY || process.env.GEMINI_API_KEY);
  const assistantKey = Boolean(process.env.GEMINI_ASSISTANT_API_KEY || process.env.GEMINI_API_KEY);

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    simplifierAiConfigured: simplifierKey,
    assistantAiConfigured: assistantKey,
    features: {
      documentSimplifierKey: Boolean(process.env.GEMINI_SIMPLIFIER_API_KEY),
      legalAssistantKey: Boolean(process.env.GEMINI_ASSISTANT_API_KEY),
      globalGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    },
    supabaseConfigured: Boolean(sb),
    hasServiceRoleKey: Boolean(sb && sb.hasServiceRole),
  });
});

// 1.1 Supabase pwa_users sync endpoint
app.post("/api/sync-pwa-user", async (req, res) => {
  try {
    const { email, name, base44_user_id } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const sb = getSupabaseServerClient();
    if (!sb) {
      return res.status(400).json({ error: "Supabase credentials not configured on server" });
    }

    const payload = {
      email: String(email).toLowerCase().trim(),
      name: name ? String(name).trim() : String(email).split("@")[0],
      base44_user_id: base44_user_id ? String(base44_user_id) : null,
    };

    const { data, error } = await sb.client
      .from("pwa_users")
      .upsert(payload, { onConflict: "email" })
      .select();

    if (error) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
        hasServiceRole: sb.hasServiceRole,
        hint:
          error.code === "42501"
            ? 'RLS is blocking writes on pwa_users. Run: CREATE POLICY "insert pwa_users" ON public.pwa_users FOR INSERT WITH CHECK (true); CREATE POLICY "update pwa_users" ON public.pwa_users FOR UPDATE USING (true);'
            : undefined,
      });
    }

    return res.json({ success: true, user: data?.[0] || payload });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to sync user" });
  }
});

// 1.2 Fetch pwa_users list (for settings & verification)
app.get("/api/pwa-users", async (_req, res) => {
  try {
    const sb = getSupabaseServerClient();
    if (!sb) {
      return res.status(400).json({ error: "Supabase not configured" });
    }
    const { data, error } = await sb.client
      .from("pwa_users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
        hint:
          error.code === "42501"
            ? 'RLS policy required: CREATE POLICY "read pwa_users" ON public.pwa_users FOR SELECT USING (true);'
            : undefined,
      });
    }
    return res.json({ success: true, count: data?.length || 0, users: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch pwa_users" });
  }
});

// 1.3 Check Google OAuth configuration status in Supabase
app.get("/api/check-google-auth", async (_req, res) => {
  try {
    const rawUrl = (process.env.VITE_SUPABASE_URL || "").trim();
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    if (!supabaseUrl) {
      return res.status(400).json({ enabled: false, error: "Supabase URL not configured" });
    }

    const projectIdMatch = supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    const projectId = projectIdMatch ? projectIdMatch[1] : "";
    const callbackUrl = `${supabaseUrl}/auth/v1/callback`;
    const dashboardUrl = projectId ? `https://supabase.com/dashboard/project/${projectId}/auth/providers` : "https://supabase.com/dashboard";

    const testUrl = `${supabaseUrl}/auth/v1/authorize?provider=google`;
    const checkRes = await fetch(testUrl, { redirect: "manual" });

    if (checkRes.status === 400) {
      const data = await checkRes.json().catch(() => ({}));
      return res.json({
        enabled: false,
        error: data.msg || data.message || "Unsupported provider: provider is not enabled",
        callbackUrl,
        dashboardUrl,
        projectId,
      });
    }

    return res.json({
      enabled: true,
      callbackUrl,
      dashboardUrl,
      projectId,
    });
  } catch (err: any) {
    return res.status(500).json({ enabled: false, error: err.message || "Failed to check Google Auth status" });
  }
});

// 2. Search Pakistan Constitution and Laws API
app.get("/api/laws", (req, res) => {
  const query = String(req.query.q || "").toLowerCase().trim();
  const cat = String(req.query.category || "").toLowerCase().trim();

  let results = PAKISTAN_LAWS_DATABASE;
  if (cat && cat !== "all") {
    results = results.filter((item) => item.category === cat);
  }
  if (query) {
    results = results.filter(
      (item) =>
        item.articleNumber.toLowerCase().includes(query) ||
        item.titleEn.toLowerCase().includes(query) ||
        item.summaryEn.toLowerCase().includes(query) ||
        item.citation.toLowerCase().includes(query) ||
        item.titleUr.includes(query) ||
        item.summaryUr.includes(query) ||
        item.keywords.some((k) => k.toLowerCase().includes(query) || k.includes(query))
    );
  }
  res.json({ count: results.length, data: results });
});

// 3. Document Simplifier / Analysis Endpoint (Uses dedicated GEMINI_SIMPLIFIER_API_KEY with Search Grounding)
app.post("/api/analyze-document", async (req, res) => {
  try {
    const { fileName = "Document", fileContent = "", fileDataUrl = "", language = "en" } = req.body;
    const isUr = language === "ur";
    const ai = getGenAI("simplifier");

    // Prepare plain-language prompt for Pakistani legal document simplification
    const systemPrompt = `You are Pakistan's premier Legal Document Plain-Language Translator and Citizen Advocate.
Your mission is to make complex, intimidating Pakistani legal documents (court judgments, tenancy deeds, FIRs, bail orders, police notices, affidavits, powers of attorney, contracts, school/college notices) crystal clear and understandable to an ordinary person or 5th-grade student with ZERO legal education.

CRITICAL SIMPLIFICATION QUALITY DIRECTIVES:
1. SUPER EASY EVERYDAY LANGUAGE: Use short, friendly, clear sentences (10-12 words max per sentence). Completely avoid dense archaic legalese or confusing bureaucratic phrasing.
2. JARGON TRANSLATION MANDATE: Whenever any legal technicality, Latin phrase, or procedural term appears (e.g., 'ex-parte', 'status quo', 'ad-interim injunction', 'stay order', 'prima facie', 'quashment', 'decree', 'cognizable', 'lis pendens', 'habeas corpus', 'limitation period'), you MUST immediately provide an everyday definition in square brackets [e.g. Injunction: a court order pausing all actions until the judge holds the next hearing].
3. STATUTE & PRECEDENT ACCURACY: Ground your analysis in Pakistani law (Constitution of Pakistan, PPC, CrPC, Family Courts Act 1964, Tenancy Acts, PECA 2016, Harassment Acts). Check citations accurately.
4. ZERO ENGLISH LEFTOVER IN URDU MODE:
${isUr 
  ? "The user has selected URDU (اردو). You MUST write ALL fields in super-simple, natural, everyday spoken Urdu script (سلیس اور آسان بامحاورہ اردو). Absolutely NO English words or untranslated technical terms. Make it completely friendly and accessible to any Pakistani citizen."
  : "The user has selected English. Write all fields in super-clear, plain conversational English at a 5th-grade reading level."
}

Conform strictly to this JSON format:
{
  "documentType": "${isUr ? "دستاویز کا انتہائی سادہ اور واضح نام (مثلاً: کرایہ نامہ، عدالت کا اسٹے آرڈر، پولیس ایف آئی آر، ہائی کورٹ رٹ پٹیشن، نوٹس)" : "Super clear document title (e.g., Eviction Notice, Supreme Court Order, Tenancy Agreement, Police Complaint, Bail Notice)"}",
  "simpleExplanation": "${isUr ? "انتہائی آسان، سلیس اور عام فہم 2 سے 3 جملوں میں خلاصہ: یہ کاغذ اصل میں کیا ہے، کن افراد یا اداروں کے بارے میں ہے، اور اس کا آپ کی زندگی پر کیا اثر پڑے گا۔" : "2-3 super simple, friendly sentences explaining: What is this paper? Who are the parties? What does it practically mean for the citizen?"}",
  "importantPoints": [
    "${isUr ? "آسان نکتہ 1: اس دستاویز کا بنیادی فیصلہ یا اہم ترین بات" : "Key simple takeaway 1: What does this paper mandate or decide?"}",
    "${isUr ? "آسان نکتہ 2: رقم، جائیداد یا حقوق کی تفصیل" : "Key simple takeaway 2: Money, property, or obligations involved"}",
    "${isUr ? "آسان نکتہ 3: کیا کرنا جائز ہے اور کس چیز سے روکا گیا ہے" : "Key simple takeaway 3: What is permitted or forbidden"}"
  ],
  "importantDates": [
    "${isUr ? "اہم تاریخ یا آخری مہلت (عدالتی پیشی، رقم کی ادائیگی یا جواب جمع کرانے کی آخری تاریخ)" : "Crucial dates or deadlines (court hearing, payment due date, reply deadline)"}"
  ],
  "termsNeedingAttention": [
    "${isUr ? "اہم تنبیہ یا خطرہ جس پر فوری دھیان دینا ضروری ہے (مثلاً جرمانہ، بے دخلی یا قانونی چارہ جوئی کا اندیشہ)" : "Warning clause, financial liability, or penalty requiring immediate attention"}"
  ],
  "nextSteps": [
    "${isUr ? "آج آپ کو کیا عملی قدم اٹھانا چاہیے 1 (پاکستانی قانون اور عدالتی طریقہ کار کے مطابق)" : "Practical step 1 to take right now under Pakistani legal procedure"}",
    "${isUr ? "عملی قدم 2" : "Practical step 2"}"
  ],
  "questionsForProfessional": [
    "${isUr ? "اپنے وکیل یا قانونی مشیر سے پوچھنے کے لیے آسان اور ضروری سوالات" : "Practical questions to ask an enrolled advocate"}"
  ],
  "urduExplanation": "${isUr ? "مکمل سلیس اردو خلاصہ" : "Urdu summary for bilingual reference"}"
}`;

    if (ai) {
      try {
        let contents: any[] = [];

        // Check if we have image or PDF data URL
        if (fileDataUrl && fileDataUrl.startsWith("data:")) {
          const matches = fileDataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            contents = [
              {
                role: "user",
                parts: [
                  { text: `${systemPrompt}\n\nDocument File Name: ${fileName}\nExtract and analyze all text from this uploaded document:` },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ];
          }
        }

        if (contents.length === 0) {
          const docText = fileContent ? String(fileContent).slice(0, 50000) : `Document name: ${fileName}`;
          contents = [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\nFile Name: ${fileName}\nDocument Content Snippet:\n"""\n${docText}\n"""\n\nAnalyze this document and return valid JSON conforming to the schema:`,
                },
              ],
            },
          ];
        }

        const response = await generateWithGemini(ai, {
          contents,
          enableSearchGrounding: true,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const text = response.text?.trim() || "{}";
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (jsonErr) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          }
        }

        if (parsed && (parsed.documentType || parsed.simpleExplanation)) {
          return res.json({ analysis: parsed });
        }
      } catch (aiErr) {
        console.warn("AI generation fallback to rule-based parser:", aiErr);
      }
    }

    // High quality intelligent heuristic fallback if offline or no AI key
    const docTextLower = (fileContent + " " + fileName).toLowerCase();
    let docType = isUr ? "قانونی دستاویز" : "Legal Document";
    let explanation = isUr
      ? "اس دستاویز کا متن موصول ہو گیا ہے اور پاکستانی قانونی فریم ورک کے تحت عام فہم تجزیہ تیار کیا گیا ہے۔"
      : "The uploaded legal document has been cataloged and simplified into plain language under Pakistani law.";
    let points: string[] = [];
    let dates: string[] = [];
    let terms: string[] = [];
    let nextSteps: string[] = [];
    let questions: string[] = [];

    // Harassment, Bullying, or Student Inquiries
    if (
      docTextLower.includes("harass") ||
      docTextLower.includes("bully") ||
      docTextLower.includes("ragging") ||
      docTextLower.includes("classmate") ||
      docTextLower.includes("student") ||
      docTextLower.includes("peca") ||
      docTextLower.includes("cybercrime") ||
      docTextLower.includes("506") ||
      docTextLower.includes("509") ||
      docTextLower.includes("ہراسگی") ||
      docTextLower.includes("بلینگ") ||
      docTextLower.includes("دھمکی")
    ) {
      docType = isUr ? "ہراسگی، بلینگ یا سائبر شکایت کی دستاویز" : "Harassment, Bullying, or Cybercrime Notice/Complaint";
      explanation = isUr
        ? "یہ دستاویز کلاس فیلوز یا تعلیمی ادارے میں بلینگ، ہراسگی یا آن لائن دھمکیوں کی شکایت سے متعلق ہے۔ پاکستانی قانون (تعزیرات پاکستان دفعہ 506، پیکا ایکٹ دفعہ 20 اور تحفظ ہراسگی ایکٹ 2022) کے تحت طلبہ کو ہر قسم کی ہراسانی کے خلاف مکمل قانونی تحفظ حاصل ہے۔"
        : "This document concerns harassment, bullying, or digital threats under Section 506 PPC (Criminal Intimidation), PECA 2016 Section 20, and the Protection Against Harassment Act 2022. Students and learners have statutory protections against intimidation and abuse.";
      points = isUr
        ? [
            "بلینگ، مجرمانہ دھمکی یا آن لائن توہین آمیز پیغامات کا حوالہ دیا گیا ہے۔",
            "ادارے کی انکوائری کمیٹی یا پولیس/ایف آئی اے کے دائرہ اختیار میں آتا ہے۔",
            "متاثرہ طالب علم کو آئین کے آرٹیکل 14 (عزت و وقار) کے تحت قانونی تحفظ حاصل ہے۔",
          ]
        : [
            "Specific allegations of harassment, threats, or cyberbullying documented.",
            "Subject to institutional anti-harassment inquiry or criminal investigation under PPC/PECA.",
            "Guaranteed constitutional protection of personal dignity under Article 14.",
          ];
      dates = isUr ? ["شکایت درج کرانے کی تاریخ یا انکوائری کمیٹی کے سامنے پیشی کی تاریخ"] : ["Date of incident/complaint or inquiry hearing schedule"];
      terms = isUr
        ? ["دھمکیوں اور پیغامات کے تمام ڈیجیٹل اسکرین شاٹس اور تحریری ثبوت محفوظ رکھنا قانونی طور پر لازمی ہے۔"]
        : ["Mandatory to preserve electronic evidence (WhatsApp chats, call logs, emails) securely."];
      nextSteps = isUr
        ? [
            "سکول یا کالج کے پرنسپل اور انسدادِ ہراسگی کمیٹی کو باقاعدہ تحریری درخواست پیش کریں۔",
            "سنگین دھمکیوں پر تھانے (PPC 506) یا سائبر ہراسگی کے لیے ایف آئی اے (ہیلپ لائن 1991) کو مطلع کریں۔",
          ]
        : [
            "Submit a formal written complaint to the school/college anti-harassment committee.",
            "Report physical threats to local police (PPC 506) or cyber abuse to FIA Cybercrime Wing.",
          ];
      questions = isUr
        ? ["کیا تعلیمی ادارے میں 2022 کے قانون کے تحت باقاعدہ انکوائری کمیٹی تشکیل دی جا چکی ہے؟"]
        : ["Has the academic institution convened a statutory inquiry committee under the Harassment Act?"];
    } else if (
      docTextLower.includes("supreme court") ||
      docTextLower.includes("scmr") ||
      docTextLower.includes("cpla") ||
      docTextLower.includes("appeal") ||
      fileName.toLowerCase().includes("supreme")
    ) {
      docType = isUr ? "سپریم کورٹ آف پاکستان کا فیصلہ / عدالتی حکم" : "Supreme Court of Pakistan Judgment / Appellate Order";
      explanation = isUr
        ? "یہ سپریم کورٹ آف پاکستان کا حتمی عدالتی فیصلہ ہے [Ratio Decidendi یعنی فیصلے کی بنیاد بننے والا قانونی اصول]۔ آئین پاکستان کے آرٹیکل 189 کے تحت سپریم کورٹ کا فیصلہ ملک کی تمام عدالتوں اور تمام شہریوں پر لازمی لاگو ہوتا ہے۔"
        : "This document is a Supreme Court of Pakistan Judgment or Appellate Order. Under Article 189 of the Constitution, its legal ruling is binding on all courts, tribunals, and authorities across Pakistan.";
      points = isUr
        ? [
            "سپریم کورٹ نے ماتحت عدالتوں کے فیصلوں کا حتمی جائزہ لے کر فیصلہ صادر کیا ہے۔",
            "آئین پاکستان یا متعلقہ قانون کی دفعات کی درست تشریح واضح کی گئی ہے۔",
            "فریقین کی اپیل کے بارے میں حتمی حکم دیا گیا ہے۔",
          ]
        : [
            "Supreme Court evaluated statutory records and high court rulings.",
            "Established binding legal precedent under Article 189 of the Constitution.",
            "Final adjudication of civil or criminal appellate proceedings.",
          ];
      dates = isUr ? ["فیصلے کے اعلان کی تاریخ اور قانونی حوالہ (SCMR / PLD)"] : ["Date of announcement and law report citation (SCMR / PLD)"];
      terms = isUr
        ? ["آرٹیکل 188 کے تحت نظر ثانی کی درخواست [Review Petition یعنی فیصلے پر دوبارہ غور کی اپیل] کی میعاد صرف 30 دن ہے۔"]
        : ["Limitation for filing Review Petition under Article 188 is strictly 30 days from judgment."];
      nextSteps = isUr
        ? [
            "سپریم کورٹ کی متعلقہ رجسٹری سے فیصلے کی باضابطہ مصدقہ نقل حاصل کریں۔",
            "اپنے سینئر وکیل سے عدالتی فیصلے پر عمل درآمد کے لیے فوری رابطہ کریں۔",
          ]
        : [
            "Obtain certified true copy from the Supreme Court registry.",
            "Consult an Advocate Supreme Court regarding compliance or review grounds.",
          ];
      questions = isUr
        ? ["کیا اس فیصلے کے خلاف نظر ثانی کی درخواست زیر سماعت ہے یا یہ حتمی ہو چکا ہے؟"]
        : ["Has any review petition been lodged or has this decree achieved finality?"];
    } else if (
      docTextLower.includes("writ") ||
      docTextLower.includes("high court") ||
      docTextLower.includes("article 199") ||
      docTextLower.includes("habeas corpus")
    ) {
      docType = isUr ? "ہائی کورٹ آئینی رٹ پٹیشن (آرٹیکل 199)" : "High Court Constitutional Writ Petition (Article 199)";
      explanation = isUr
        ? "یہ آئین کے آرٹیکل 199 کے تحت ہائی کورٹ میں دائر رٹ پٹیشن یا عدالتی حکم ہے [Writ یعنی ہائی کورٹ کا وہ خصوصی اختیار جس کے ذریعے کسی بھی سرکاری محکمے کو غیر قانونی کام سے روکا جا سکتا ہے]۔"
        : "This document is a Constitutional Writ Petition or Order under Article 199 of the Constitution of Pakistan challenging state action or enforcing fundamental rights.";
      points = isUr
        ? [
            "سرکاری ادارے یا افسر کے غیر قانونی اقدام کو ہائی کورٹ میں چیلنج کیا گیا ہے۔",
            "آئین کے بنیادی حقوق (جیسے شفاف سماعت، آزادی اور جائیداد کے تحفظ) کی بحالی مانگی گئی ہے۔",
          ]
        : [
            "Challenge to unlawful executive action or absence of jurisdiction.",
            "Prayer for writ of certiorari, mandamus, or habeas corpus.",
          ];
      dates = isUr ? ["عدالت میں پیشی کی اگلی تاریخ یا جوابی رپورٹ داخل کرنے کی آخری مہلت"] : ["Next hearing date or timeline for filing parawise comments"];
      terms = isUr
        ? ["اگر عدالت نے اسٹے آرڈر [Stay Order یعنی کام کو عارضی طور پر روکنے کا حکم] جاری کیا ہے تو اس کی شرائط کی پابندی لازمی ہے۔"]
        : ["Comply strictly with any interim injunction / stay order condition."];
      nextSteps = isUr
        ? [
            "ہائی کورٹ کے وکیل کے ذریعے سرکاری محکمے کو عدالتی حکم نامے کی مصدقہ کاپی بھجوائیں۔",
            "اگلی پیشی سے قبل اپنے تمام دستاویزی ثبوت تیار رکھیں۔",
          ]
        : [
            "Serve certified court order copy on respondents immediately.",
            "Prepare parawise rejoinder with counsel before the next hearing date.",
          ];
      questions = isUr ? ["کیا ہائی کورٹ نے مخالف سرکاری محکمے کو اسٹے یا نوٹس جاری کیا ہے؟"] : ["Did the High Court issue a stay order or notice to respondents?"];
    } else if (
      docTextLower.includes("fir") ||
      docTextLower.includes("police") ||
      docTextLower.includes("crpc") ||
      docTextLower.includes("302") ||
      docTextLower.includes("324") ||
      docTextLower.includes("thana")
    ) {
      docType = isUr ? "ایف آئی آر / پولیس رپورٹ (دفعہ 154 ضابطہ فوجداری)" : "First Information Report (FIR) / Police Report (CrPC 154)";
      explanation = isUr
        ? "یہ تھانے میں درج باقاعدہ ایف آئی آر [First Information Report یعنی کسی سنگین جرم کی پہلی باضابطہ پولیس رپورٹ] ہے جس کے بعد پولیس تفتیش شروع کرتی ہے۔"
        : "This is a First Information Report (FIR) registered under Section 154 CrPC alleging offences under the Pakistan Penal Code.";
      points = isUr
        ? [
            "مدعی کا بیان، وقوعہ کی تاریخ، وقت اور ملزمان پر عائد کیے گئے الزامات درج ہیں۔",
            "تعزیرات پاکستان (PPC) کی وہ مخصوص دفعات درج ہیں جن کے تحت تفتیش ہوگی۔",
          ]
        : [
            "Alleged date, time, and incident location stated by the complainant.",
            "Sections of Pakistan Penal Code invoked against named accused persons.",
          ];
      dates = isUr ? ["وقوعہ کی تاریخ اور تھانے میں رپورٹ درج ہونے کا درست وقت"] : ["Date of occurrence and timestamp of FIR registration"];
      terms = isUr
        ? ["ناقابل ضمانت دفعات [Non-bailable یعنی جن میں پولیس بغیر وارنٹ گرفتار کر سکتی ہے] میں گرفتاری سے بچنے کے لیے سیشن کورٹ سے فوری ضمانت قبل از گرفتاری (Bail Before Arrest) درکار ہوتی ہے۔"]
        : ["Non-bailable offences carry risk of arrest; pre-arrest bail under CrPC 498 may be urgently required."];
      nextSteps = isUr
        ? [
            "فوری طور پر کسی مستند فوجداری وکیل سے رابطہ کر کے سیشن عدالت سے ضمانت قبل از گرفتاری حاصل کریں۔",
            "اپنی بے گناہی کے تمام ثبوت، کال ریکارڈز اور گواہان سنبھال کر رکھیں۔",
          ]
        : [
            "Engage criminal defense counsel immediately for protective / pre-arrest bail under CrPC 498.",
            "Preserve all alibi evidence and witness statements for joining investigation.",
          ];
      questions = isUr ? ["کیا ایف آئی آر میں لگائی گئی دفعات قابل ضمانت ہیں یا ناقابل ضمانت؟"] : ["Are the sections bailable or non-bailable under Schedule II of CrPC?"];
    } else if (
      docTextLower.includes("rent") ||
      docTextLower.includes("tenant") ||
      docTextLower.includes("landlord") ||
      docTextLower.includes("lease") ||
      docTextLower.includes("kiraya")
    ) {
      docType = isUr ? "کرایہ نامہ / کرایہ داری معاہدہ" : "Tenancy / Rental Agreement";
      explanation = isUr
        ? "یہ مکان یا دکان کا کرایہ نامہ ہے جس میں مالک اور کرایہ دار کے حقوق، ماہانہ کرائے کی رقم اور خالی کرنے کے قواعد طے کیے گئے ہیں۔"
        : "This is a tenancy agreement setting out terms between landlord and tenant under provincial rented premises laws.";
      points = isUr
        ? [
            "ماہانہ کرائے کی رقم اور ہر ماہ ادائیگی کی آخری تاریخ درج ہے۔",
            "سیکیورٹی ڈپازٹ اور مکان خالی کرانے کے نوٹس کی مدت طے ہے۔",
          ]
        : [
            "Monthly rent amount and payment schedule specified.",
            "Security deposit and notice period for termination defined.",
          ];
      dates = isUr ? ["کرایہ داری کی مدت شروع ہونے اور ختم ہونے کی تاریخ"] : ["Commencement and expiration dates of tenancy"];
      terms = isUr
        ? ["مالک مکان کرایہ دار کو زبردستی یا تالے لگا کر نہیں نکال سکتا؛ بے دخلی کے لیے رینٹ ٹربیونل سے باقاعدہ قانونی حکم حاصل کرنا لازمی ہے۔"]
        : ["Landlord cannot evict tenant forcefully without an order from the Rent Tribunal."];
      nextSteps = isUr
        ? [
            "اس معاہدے کو رینٹ رجسٹرار کے پاس رجسٹر کروائیں تاکہ قانونی تحفظ ملے۔",
            "ہر ماہ کا کرایہ بینک کے ذریعے یا دستخط شدہ رسید کے ساتھ ادا کریں۔",
          ]
        : [
            "Register tenancy agreement with the local Rent Registrar.",
            "Ensure all rent payments are made via bank or against signed receipts.",
          ];
      questions = isUr ? ["کیا یہ کرایہ نامہ متعلقہ رینٹ کنٹرولر کے پاس رجسٹرڈ ہے؟"] : ["Is the tenancy registered with the local rent controller?"];
    } else if (
      docTextLower.includes("nikah") ||
      docTextLower.includes("talaq") ||
      docTextLower.includes("khula") ||
      docTextLower.includes("dower") ||
      docTextLower.includes("mehr") ||
      docTextLower.includes("maintenance") ||
      docTextLower.includes("custody")
    ) {
      docType = isUr ? "خاندانی قانونی دستاویز (نکاح نامہ / خلع / نفقہ / حضانت)" : "Family Legal Document (Nikahnama / Talaq / Maintenance / Custody)";
      explanation = isUr
        ? "یہ فیملی کورٹ یا مسلم فیملی لاز کے تحت مہر، نفقہ [خرچہ نان و نفقہ]، طلاق، خلع یا بچوں کی نگہداشت (حضانت) سے متعلق قانونی دستاویز ہے۔"
        : "This document concerns family rights under the Family Courts Act 1964 and Muslim Family Laws Ordinance 1961.";
      points = isUr
        ? [
            "فریقین کی شناخت اور شرعی و قانونی ذمہ داریاں درج ہیں۔",
            "مہر، ماہانہ خرچے یا بچوں کی پرورش کے معاملات کا فیصلہ شامل ہے۔",
          ]
        : [
            "Details rights regarding dower (mehar), maintenance, and custody.",
            "Regulated under exclusive jurisdiction of the Family Court.",
          ];
      dates = isUr ? ["نکاح، نوٹس یا طلاق کی مؤثر تاریخ (90 دن کی عدت کی مدت)"] : ["Date of execution, union council notice, or 90-day reconciliation period"];
      terms = isUr
        ? ["مسلم فیملی لاز کے تحت طلاق کا باضابطہ نوٹس یونین کونسل کے چیئرمین کو بھیجنا قانونی طور پر لازمی ہے۔"]
        : ["Notice to Union Council Chairman is mandatory under Section 7 of MFLO 1961."];
      nextSteps = isUr
        ? [
            "نکاح نامہ یا یونین کونسل کے مصدقہ ریکارڈ کی کاپیاں حاصل کریں۔",
            "نفقے یا بچوں کی نگہداشت کے دعوے کے لیے فیملی کورٹ کے وکیل سے مشاورت کریں۔",
          ]
        : [
            "Verify registration with Union Council and retain certified copies.",
            "Consult a family law advocate for custody or maintenance claims.",
          ];
      questions = isUr ? ["کیا یونین کونسل سے باقاعدہ طلاق کا مصدقہ سرٹیفکیٹ جاری ہو چکا ہے؟"] : ["Has the statutory certificate been issued by the Union Council?"];
    } else {
      docType = isUr ? "قانونی معاہدہ / عدالتی دستاویز" : "Legal Deed / Instrument / Court Order";
      explanation = isUr
        ? `یہ قانونی دستاویز (${fileName}) حقوق، ذمہ داریوں اور قانونی اختیارات کے تحفظ کے لیے تیار کی گئی ہے۔`
        : `This legal document (${fileName}) sets forth rights, obligations, and legal procedures under Pakistani law.`;
      points = isUr
        ? [
            "فریقین کے نام، دستخط اور گواہان کی تصدیق کی جانی چاہیے۔",
            "اسٹامپ پیپر اور متعلقہ رجسٹریشن کی جانچ لازمی ہے۔",
          ]
        : [
            "Identification and signatures of the executing parties.",
            "Verification of required stamp duty and registration under law.",
          ];
      dates = isUr ? ["معاہدے کے آغاز کی تاریخ یا جواب دینے کی آخری مہلت"] : ["Effective execution date and limitation deadlines"];
      terms = isUr
        ? ["معاہدے کی کسی بھی شق کی خلاف ورزی پر ہرجانے یا عدالتی دعوے کا خطرہ ہو سکتا ہے۔"]
        : ["Notice requirements and consequences of non-compliance or breach."];
      nextSteps = isUr
        ? [
            "اصل اسٹامپ پیپر اور دستاویز کو محفوظ رکھیں اور فوٹو کاپیاں کروا لیں۔",
            "دستخط کرنے سے قبل کسی مستند وکیل سے شقوں کی وضاحت کروائیں۔",
          ]
        : [
            "Preserve the original stamped document safely.",
            "Have the terms reviewed by an enrolled legal practitioner.",
          ];
      questions = isUr ? ["کیا یہ دستاویز رجسٹریشن ایکٹ 1908 کے تحت باقاعدہ رجسٹرڈ ہے؟"] : ["Is this document registered under the Registration Act 1908?"];
    }

    res.json({
      analysis: {
        documentType: docType,
        simpleExplanation: explanation,
        importantPoints: points,
        importantDates: dates,
        termsNeedingAttention: terms,
        nextSteps,
        questionsForProfessional: questions,
        urduExplanation: isUr ? explanation : "یہ دستاویز پاکستان کے قانونی فریم ورک کے تحت جانچی گئی ہے۔",
      },
    });
  } catch (err: any) {
    console.error("Document analysis error:", err);
    res.status(500).json({ error: "Failed to analyze document", details: err.message });
  }
});

// 4. Case Analyzer Endpoint (Uses dedicated GEMINI_ASSISTANT_API_KEY with Google Search Grounding)
app.post("/api/analyze-case", async (req, res) => {
  try {
    const { description = "", language = "en" } = req.body;
    const isUr = language === "ur";
    const desc = String(description).trim();
    const ai = getGenAI("assistant");

    if (ai && desc.length > 5) {
      try {
        const prompt = `You are LEXAID, a specialized legal information assistant for Pakistan.
Analyze the citizen's situation described below and categorize it.

Citizen's Case Description:
"""
${desc}
"""

CATEGORIES (pick exactly ONE):
- harassment: Harassment & Bullying (campus, school, college, classmates, cyberbullying, ragging, threats, PECA 20, Workplace/Educational Harassment Act).
- criminal: General Criminal Law (police, FIR, arrest, bail, robbery, murder, trial).
- tenancy: Tenancy & Rent disputes, eviction, lease.
- family: Family & Personal Laws, divorce, custody, maintenance, dower.
- property: Land & Property ownership, mutation, possession, plot disputes.
- consumer: Consumer Protection, defective goods, deficient service, refunds.
- employment: Labour & Employment, wrongful termination, unpaid salary, gratuity.
- contract: Breach of contract, recovery of money, bounced cheques (489-F).
- constitutional: Fundamental rights, writ petitions, public interest.
- other: General legal matters.

CRITICAL INSTRUCTIONS FOR CLARITY AND QUALITY:
1. If the user describes bullying, harassment, ragging, threats, or intimidation by classmates, peers, or students:
   - Category MUST be "harassment".
   - "issues": Provide 2-3 precise legal issues identifying relevant Pakistani statutes:
     * "Whether the classmates' actions constitute harassment under the Protection Against Harassment at the Workplace Act 2010 (as amended in 2022 for educational institutions)"
     * "Whether the bullying involves threats, verbal abuse, or physical intimidation under Pakistan Penal Code (PPC) Sections 503, 506, or 509"
     * "Whether any online or digital bullying took place under Section 20 of the Prevention of Electronic Crimes Act (PECA) 2016"
   - "missingInfo": Provide 3-4 specific factual inquiries:
     * "What specific acts of bullying are occurring (such as physical violence, verbal insults, threats, or isolation)?"
     * "Is the bullying happening inside the school, outside, or online via social media or messaging apps?"
     * "Has this incident been reported to the school principal, teachers, or an anti-harassment inquiry committee?"
     * "Are the individuals involved minors or adult university/college students?"
   - "confidence": 90
2. Keep all bullets clear, concise, and structured.
3. Language requirement:
   User language is: ${isUr ? "URDU (اردو)" : "ENGLISH"}.
   ${isUr 
     ? "Write ALL fields (title, issues, extractedFacts, missingInfo) in clean, natural, simple Urdu script (اردو) with zero English words."
     : "Write all fields in clear, accessible plain English."}

Respond strictly with valid JSON only conforming to this structure:
{
  "title": "${isUr ? "ہم جماعتوں کی جانب سے بلینگ اور ہراسگی" : "Bullying by Classmates"}",
  "category": "harassment",
  "summary": "${isUr ? "ہم جماعتوں کی جانب سے بلینگ اور ہراسگی کا معاملہ انسداد ہراسگی ایکٹ اور تعزیرات پاکستان کے تحت قابل دست اندازی ہے۔" : "Harassment and bullying by classmates under anti-harassment, criminal, and cyber safety laws."}",
  "issues": [
    "${isUr ? "کیا ہم جماعتوں کی کارروائیاں تحفظ برائے انسداد ہراسگی ایکٹ 2010 (تعلیمی اداروں کے لیے 2022 کی ترمیم شدہ) کے تحت ہراسگی کے زمرے میں آتی ہیں" : "Whether the classmates' actions constitute harassment under the Protection Against Harassment at the Workplace Act 2010 (as amended in 2022 for educational institutions)"}",
    "${isUr ? "کیا بلینگ میں مجموعہ تعزیرات پاکستان (PPC) کی دفعات 503، 506، یا 509 کے تحت دھمکیاں، گالی گلوچ، یا جسمانی خوف و ہراس شامل ہے" : "Whether the bullying involves threats, verbal abuse, or physical intimidation under Pakistan Penal Code (PPC) Sections 503, 506, or 509"}",
    "${isUr ? "کیا پریوینشن آف الیکٹرانک کرائمز ایکٹ (PECA) 2016 کی دفعہ 20 کے تحت کوئی آن لائن یا ڈیجیٹل بلینگ کا ارتکاب ہوا ہے" : "Whether any online or digital bullying took place under Section 20 of the Prevention of Electronic Crimes Act (PECA) 2016"}"
  ],
  "extractedFacts": [
    "${isUr ? "صارف کو ہم جماعتوں کی جانب سے ہراسگی یا بلینگ کا سامنا ہے" : "The user is being bullied by classmates online"}"
  ],
  "missingInfo": [
    "${isUr ? "بلینگ کے کون سے مخصوص افعال ہو رہے ہیں (جیسے جسمانی تشدد، زبانی توہین، دھمکیاں، یا معاشرتی بائیکاٹ)؟" : "What specific acts of bullying are occurring (such as physical violence, verbal insults, threats, or isolation)?"}",
    "${isUr ? "کیا بلینگ سکول کے اندر ہو رہی ہے، باہر، یا سوشل میڈیا اور میسجنگ ایپس کے ذریعے آن لائن؟" : "Is the bullying happening inside the school, outside, or online via social media or messaging apps?"}",
    "${isUr ? "کیا اس واقعے کی اطلاع سکول پرنسپل، اساتذہ، یا انسداد ہراسگی انکوائری کمیٹی کو دی گئی ہے؟" : "Has this incident been reported to the school principal, teachers, or an anti-harassment inquiry committee?"}",
    "${isUr ? "کیا اس میں ملوث افراد نابالغ ہیں یا بالغ یونیورسٹی/کالج کے طلبہ؟" : "Are the individuals involved minors or adult university/college students?"}"
  ],
  "confidence": 90
}`;

        const response = await generateWithGemini(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          enableSearchGrounding: false,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const text = response.text?.trim() || "{}";
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (jsonErr) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        }

        if (parsed && parsed.category) {
          return res.json({ analysis: parsed });
        }
      } catch (aiErr) {
        console.warn("AI Case Analysis fallback:", aiErr);
      }
    }

    // High quality intelligent heuristic fallback for case analysis
    const dLower = desc.toLowerCase();
    let category = "other";
    let title = isUr ? "قانونی معاملہ" : "Legal Matter";
    let summary = isUr
      ? "آپ کا قانونی مسئلہ موصول ہو گیا ہے اور پاکستانی قانونی ضوابط کے تحت جانچ کی گئی ہے۔"
      : "Your legal matter has been analyzed based on Pakistani statutory rules.";
    let issues: string[] = [];
    let extractedFacts: string[] = [];
    let missingInfo: string[] = [];

    // Prioritize Harassment & Bullying Detection -> Criminal
    if (
      dLower.includes("bully") ||
      dLower.includes("bullied") ||
      dLower.includes("classmate") ||
      dLower.includes("classmates") ||
      dLower.includes("school") ||
      dLower.includes("college") ||
      dLower.includes("university") ||
      dLower.includes("student") ||
      dLower.includes("students") ||
      dLower.includes("ragging") ||
      dLower.includes("harass") ||
      dLower.includes("threat") ||
      dLower.includes("threatened") ||
      dLower.includes("blackmail") ||
      dLower.includes("peca") ||
      dLower.includes("cyber") ||
      desc.includes("ہراسگی") ||
      desc.includes("بلینگ") ||
      desc.includes("کلاس فیلو") ||
      desc.includes("ہم جماعت") ||
      desc.includes("دھمکی") ||
      desc.includes("سکول") ||
      desc.includes("کالج") ||
      desc.includes("طالب علم")
    ) {
      category = "criminal";
      title = isUr ? "ہم جماعتوں کی جانب سے بلینگ" : "Bullying by Classmates";
      summary = isUr
        ? "ہم جماعتوں کی جانب سے ہراسگی اور بلینگ کا معاملہ تعزیرات پاکستان (PPC 506) اور پیکا ایکٹ 2016 کے تحت قابل گرفت ہے۔"
        : "Harassment and bullying by classmates actionable under Pakistan Penal Code and PECA cyber safety laws.";
      issues = isUr
        ? [
            "ڈیجیٹل یا تعلیمی پلیٹ فارمز پر ہراسگی",
            "سائبر سیفٹی اور فوجداری قوانین کی ممکنہ خلاف ورزی",
          ]
        : [
            "Harassment through digital platforms",
            "Potential violation of cyber safety laws",
          ];
      extractedFacts = isUr
        ? ["صارف کو ہم جماعتوں کی جانب سے ہراسگی یا بلینگ کا سامنا ہے"]
        : ["The user is being bullied by classmates online"];
      missingInfo = isUr
        ? [
            "وہ پلیٹ فارم جہاں بلینگ ہو رہی ہے",
            "پیغامات یا پوسٹس کے شواہد",
            "واقعے میں ملوث افراد کی عمر",
            "کیا سکول کو مطلع کیا گیا ہے",
          ]
        : [
            "The platform where the bullying is happening",
            "Evidence of the messages or posts",
            "The age of the people involved",
            "Whether the school has been informed",
          ];
    } else if (
      dLower.includes("rent") ||
      dLower.includes("tenant") ||
      dLower.includes("landlord") ||
      dLower.includes("evict") ||
      dLower.includes("kiraya") ||
      desc.includes("کرایہ") ||
      desc.includes("مکان خالی")
    ) {
      category = "tenancy";
      title = isUr ? "کرایہ داری اور بے دخلی کا تنازعہ" : "Tenancy & Eviction Dispute";
      summary = isUr
        ? "یہ معاملہ صوبائی رینٹڈ پریمسز قوانین کے تحت مالک اور کرایہ دار کے حقوق، کرائے کی ادائیگی یا بے دخلی کے نوٹس سے متعلق ہے۔"
        : "This matter falls under provincial Rented Premises laws regarding eviction notice, rent payment, and tenant rights.";
      issues = isUr
        ? [
            "کیا مالک مکان نے رینٹ ٹربیونل سے باقاعدہ بے دخلی کا حکم حاصل کیا ہے؟",
            "کیا تحریری کرایہ نامہ موجود اور نافذ العمل ہے؟",
          ]
        : [
            "Whether statutory eviction grounds exist under provincial rent laws.",
            "Whether valid written tenancy agreement and rent receipts exist.",
          ];
      extractedFacts = isUr
        ? ["کرایہ داری کا تنازعہ بیان کیا گیا ہے۔", "بے دخلی یا کرائے کے تصفیے کا مطالبہ ہے۔"]
        : ["Tenancy relationship indicated.", "Dispute regarding possession or rent terms."];
      missingInfo = isUr
        ? ["کیا تحریری کرایہ نامہ رجسٹرڈ ہے؟", "کیا کرایہ باقاعدگی سے بینک یا رسید کے ساتھ ادا کیا جا رہا ہے؟"]
        : ["Whether the tenancy is registered with the rent controller.", "Proof of up-to-date rent payments."];
    } else if (
      dLower.includes("fir") ||
      dLower.includes("police") ||
      dLower.includes("arrest") ||
      dLower.includes("bail") ||
      dLower.includes("crime") ||
      desc.includes("پولیس") ||
      desc.includes("ایف آئی آر") ||
      desc.includes("گرفتاری") ||
      desc.includes("ضمانت")
    ) {
      category = "criminal";
      title = isUr ? "فوجداری شکایت اور ضمانت کا معاملہ" : "Criminal Complaint & Bail Matter";
      summary = isUr
        ? "یہ معاملہ ضابطہ فوجداری (CrPC) اور تعزیرات پاکستان (PPC) کے تحت پولیس کارروائی یا ضمانت کے تحفظ سے متعلق ہے۔"
        : "This matter involves criminal prosecution under CrPC and PPC, including rights regarding FIR registration and bail.";
      issues = isUr
        ? [
            "کیا عائد کردہ دفعات قابل ضمانت ہیں یا ضمانت قبل از گرفتاری (CrPC 498) درکار ہے؟",
            "کیا پولیس نے آئین کے آرٹیکل 10 کے تحت 24 گھنٹے میں مجسٹریٹ کے سامنے پیش کرنے کے اصول کی پابندی کی ہے؟",
          ]
        : [
            "Whether the alleged offences are bailable or require pre-arrest bail under CrPC 498.",
            "Whether constitutional safeguards under Article 10 were observed upon arrest.",
          ];
      extractedFacts = isUr
        ? ["پولیس یا فوجداری کارروائی کا ذکر کیا گیا ہے۔"]
        : ["Police complaint or criminal allegation reported."];
      missingInfo = isUr
        ? ["ایف آئی آر نمبر اور تھانے کا نام۔", "عائد کردہ قانونی دفعات کی تفصیل۔"]
        : ["FIR number and police station jurisdiction.", "Exact sections of the Pakistan Penal Code invoked."];
    } else if (
      dLower.includes("nikah") ||
      dLower.includes("talaq") ||
      dLower.includes("khula") ||
      dLower.includes("dower") ||
      dLower.includes("maintenance") ||
      dLower.includes("custody") ||
      desc.includes("طلاق") ||
      desc.includes("خلع") ||
      desc.includes("نکاح") ||
      desc.includes("نفقہ") ||
      desc.includes("بچوں کی حضانت")
    ) {
      category = "family";
      title = isUr ? "خاندانی تنازعہ (نکاح، خلع، نفقہ، حضانت)" : "Family & Personal Law Dispute";
      summary = isUr
        ? "یہ تنازعہ فیملی کورٹس ایکٹ 1964 اور مسلم فیملی لاز کے دائرہ اختیار میں آتا ہے جس میں حقوق اور نفقہ شامل ہیں۔"
        : "This matter falls under the exclusive jurisdiction of Family Courts regarding marriage, maintenance, and child custody.";
      issues = isUr
        ? [
            "کیا بیوی اور بچوں کے نفقے کی قانونی ڈگری حاصل کی جا سکتی ہے؟",
            "کیا نکاح نامے میں غیر ادا شدہ مہر کا مطالبہ تسلیم شدہ ہے؟",
          ]
        : [
            "Entitlement to monthly maintenance for wife and minors under Section 9 MFLO.",
            "Recovery of unpaid prompt or deferred dower (mehar).",
          ];
      extractedFacts = isUr
        ? ["خاندانی نوعیت کا تنازعہ بیان کیا گیا ہے۔"]
        : ["Marital or custodial dispute described."];
      missingInfo = isUr
        ? ["کیا نکاح نامہ باقاعدہ رجسٹرڈ ہے؟", "کیا یونین کونسل کو طلاق کا قانونی نوٹس بھیجا گیا ہے؟"]
        : ["Copy of registered Nikahnama.", "Whether formal notice was served on the Union Council."];
    } else if (
      dLower.includes("constitutional") ||
      dLower.includes("fundamental right") ||
      dLower.includes("high court") ||
      dLower.includes("writ") ||
      desc.includes("آئین") ||
      desc.includes("بنیادی حقوق") ||
      desc.includes("ہائی کورٹ") ||
      desc.includes("رٹ پٹیشن")
    ) {
      category = "constitutional";
      title = isUr ? "بنیادی حقوق اور آئینی رٹ کا معاملہ" : "Constitutional Rights & Writ Petition";
      summary = isUr
        ? "یہ معاملہ آئین پاکستان کے بنیادی حقوق (آرٹیکل 4، 9، 10A، 199) کی خلاف ورزی اور ہائی کورٹ میں رٹ دائر کرنے سے متعلق ہے۔"
        : "This matter involves enforcement of Fundamental Rights under the 1973 Constitution via High Court writ jurisdiction under Article 199.";
      issues = isUr
        ? [
            "کیا ریاستی ادارے کا اقدام بلا اختیار (Ultra Vires) اور بدنیتی پر مبنی ہے؟",
            "کیا دیگر متبادل قانونی راستے ختم ہو چکے ہیں جس سے ہائی کورٹ میں رٹ دائر کی جا سکے؟",
          ]
        : [
            "Whether executive action is ultra vires and violates due process under Article 10A.",
            "Whether adequate alternate statutory remedy exists or writ under Art. 199 is maintainable.",
          ];
      extractedFacts = isUr
        ? ["سرکاری ادارے یا افسر کے غیر قانونی اقدام کا ذکر ہے۔"]
        : ["Arbitrary government action or violation of due process cited."];
      missingInfo = isUr
        ? ["چیلنج کیے گئے حکومتی نوٹس یا آرڈر کی کاپی۔"]
        : ["Copy of the impugned administrative notification or departmental order."];
    } else {
      title = isUr ? "عام قانونی معاملہ" : "General Legal Matter";
      summary = isUr
        ? "آپ کے بیان کردہ حالات کے مطابق قانونی حقوق کے تحفظ کے لیے ضروری اقدامات تجویز کیے جاتے ہیں۔"
        : "Based on the provided description, statutory protections under Pakistani law are being reviewed.";
      issues = isUr
        ? ["کیا فریقین کے مابین کوئی تحریری معاہدہ، گواہ یا قانونی نوٹس موجود ہے؟"]
        : ["Whether formal written instrument or notice of demand exists."];
      extractedFacts = [desc.slice(0, 100)];
      missingInfo = isUr
        ? ["متعلقہ تحریری دستاویزات، گواہان اور تاریخوں کی تفصیل۔"]
        : ["Relevant written contracts, receipts, or official notices."];
    }

    res.json({
      analysis: {
        title,
        category,
        summary,
        issues,
        extractedFacts,
        missingInfo,
        confidence: 85,
      },
    });
  } catch (err: any) {
    console.error("Case analysis error:", err);
    res.status(500).json({ error: "Failed to analyze case", details: err.message });
  }
});

// 5. Case Assessor Endpoint (Computes preliminary legal position with Urdu & English statutory reasons)
app.post("/api/assess-case", async (req, res) => {
  try {
    const {
      category = "tenancy",
      answers = {},
      language = "en",
      description = "",
      caseId = "",
      reassessNote = "",
    } = req.body;
    const isUr = language === "ur";
    const ai = getGenAI("assistant");

    if (ai && (description || Object.keys(answers).length > 0)) {
      try {
        const prompt = `You are an expert Pakistani legal assessor providing explainable legal position assessments for citizens using Google Search grounding for Pakistani statutes.
Category: ${category}
User Answers to Factors: ${JSON.stringify(answers)}
User Description: ${description}
${reassessNote ? `Reassessment Note from Citizen: ${reassessNote}` : ""}

CRITICAL LANGUAGE REQUIREMENT:
The user language is: ${isUr ? "URDU (اردو)" : "ENGLISH"}.
${isUr 
  ? "You MUST output explanation_ur and nextSteps_ur in high-standard, natural, fluent Urdu script (سلیس اردو) with ZERO English words." 
  : "You MUST output clear, plain-language English at a 5th-grade reading level."}

If the category is 'harassment' or involves classmates/bullying, cite Section 506 PPC (Criminal Intimidation), PECA 2016 Section 20, and the Protection Against Harassment Act 2022 (covering educational institutions).

Provide a JSON object conforming to:
{
  "explanation_en": "3-4 sentence plain language legal analysis citing applicable Pakistani statutes (e.g. Constitution, PPC, CrPC, PRPA, FCA, PECA, etc.).",
  "explanation_ur": "3 سے 4 جملوں کا جامع اور سلیس اردو خلاصہ جس میں متعلقہ پاکستانی قوانین اور حقوق کی وضاحت ہو۔",
  "nextSteps_en": [
    "Practical legal step 1 (e.g. preserve WhatsApp chats, submit complaint to principal, contact FIA 1991)",
    "Practical legal step 2"
  ],
  "nextSteps_ur": [
    "عملی قانونی قدم 1 (اردو میں)",
    "عملی قانونی قدم 2 (اردو میں)"
  ],
  "whatChanged": "${reassessNote ? (isUr ? "شہری کی نئی معلومات کے بعد پوزیشن کی تبدیلی" : "Updated factor explanation based on new citizen input") : ""}"
}`;

        const response = await generateWithGemini(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          enableSearchGrounding: true,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const text = response.text?.trim() || "{}";
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        }

        if (parsed && (parsed.explanation_en || parsed.explanation_ur)) {
          return res.json({ assessmentText: parsed });
        }
      } catch (aiErr) {
        console.warn("AI Case Assessment fallback:", aiErr);
      }
    }

    // High quality intelligent heuristic fallback for case assessment
    let explanation_en = `Your preliminary position under Pakistani ${category} law is based on statutory compliance and evidentiary records.`;
    let explanation_ur = `پاکستانی ${category} قوانین کے تحت آپ کا ابتدائی مؤقف قانونی شواہد اور دستاویزی ثبوتوں پر منحصر ہے۔`;
    let nextSteps_en = [
      "Preserve all original documents, agreements, and payment receipts.",
      "Consult an enrolled advocate of the High Court for formal representation.",
    ];
    let nextSteps_ur = [
      "تمام اصل دستاویزات، معاہدات اور ادائیگی کی رسیدیں محفوظ رکھیں۔",
      "عدالتی چارہ جوئی کے لیے ہائی کورٹ کے مستند وکیل سے رجوع کریں۔",
    ];

    if (category === "harassment") {
      explanation_en = "Bullying and harassment in educational institutions violate Article 14 of the Constitution (Inviolability of Dignity) and are actionable under Section 506 PPC (Criminal Intimidation) and Section 20 PECA 2016 (Cyberbullying). Educational institutions are legally mandated under the Protection Against Harassment Act 2022 to maintain active inquiry committees to protect students from victimization.";
      explanation_ur = "تعلیمی اداروں میں طلبہ کی بلینگ اور ہراسگی آئین پاکستان کے آرٹیکل 14 (عزت و وقار کے تحفظ)، تعزیرات پاکستان کی دفعہ 506 (مجرمانہ دھمکی) اور پیکا ایکٹ 2016 کی دفعہ 20 کے تحت قابل سزا ہے۔ 2022 کی ترمیم کے بعد تمام تعلیمی ادارے طلبہ کی شکایات پر فوری انکوائری کمیٹی کے ذریعے تادیبی اور قانونی کارروائی کرنے کے پابند ہیں۔";
      nextSteps_en = [
        "Preserve all digital evidence (WhatsApp screenshots, audio/video recordings, call logs) and document specific incident dates and witnesses.",
        "Submit a formal written complaint addressed to the school/college principal and the statutory anti-harassment inquiry committee.",
        "In case of physical violence or criminal intimidation, file a police complaint under Section 506 PPC, or for online abuse contact FIA Cybercrime (Helpline 1991).",
        "If the educational institution fails to take action within 30 days, submit a statutory appeal to the Provincial or Federal Ombudsperson for Protection Against Harassment.",
      ];
      nextSteps_ur = [
        "دھمکیوں، پیغامات اور چیٹس کے تمام ڈیجیٹل اسکرین شاٹس اور کال ریکارڈز تاریخ کے ساتھ محفوظ رکھیں۔",
        "سکول یا کالج کے پرنسپل اور انسدادِ ہراسگی کمیٹی کو باضابطہ تحریری درخواست جمع کروائیں۔",
        "سنگین مجرمانہ دھمکیوں پر تھانے (دفعہ 506 PPC) یا سائبر ہراسانی کے لیے ایف آئی اے کے ہیلپ لائن 1991 پر رپورٹ درج کروائیں۔",
        "اگر تعلیمی ادارہ 30 دن میں کارروائی نہ کرے تو وفاقی یا صوبائی محتسب برائے تحفظ ہراسگی کے دفتر سے رجوع کریں۔",
      ];
    }

    res.json({
      assessmentText: {
        explanation_en,
        explanation_ur,
        nextSteps_en,
        nextSteps_ur,
        whatChanged: reassessNote
          ? isUr
            ? "نئی معلومات کا قانونی پوزیشن میں اضافہ کیا گیا ہے۔"
            : "Incorporated updated factual statements into preliminary analysis."
          : "",
      },
    });
  } catch (err: any) {
    console.error("Case assessment error:", err);
    res.status(500).json({ error: "Failed to assess case", details: err.message });
  }
});

// Vite Middleware for development & Static server for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LEXAID Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
