import { CATEGORIES, normalizeCategory, getQuestionsForCategory, runReasoning } from "../../base44/shared/legalReasoning";
import { retrieve } from "../../base44/shared/retrieval";

// Default seed precedents from Pakistani law and Constitution
const INITIAL_PRECEDENTS = [
  {
    id: "prec-1",
    title: "Article 9 — Security of person (Constitution of Pakistan)",
    caseId: "CONST-ART-9",
    court: "Statute",
    date: "1973",
    category: "constitutional",
    summary: "No person shall be deprived of life or liberty save in accordance with law. Fundamental protection against illegal detention, state abuse, and unlawful eviction without due process.",
    fullText: "Article 9 of the Constitution of the Islamic Republic of Pakistan guarantees that no person shall be deprived of life or liberty save in accordance with law. The Supreme Court has repeatedly affirmed that 'life' includes the right to livelihood, dignity, and shelter.",
    keywords: ["article 9", "security", "life", "liberty", "detention", "constitution", "fundamental right"],
    sourceType: "statute",
    citation: "Constitution of Pakistan 1973, Art. 9",
    isSample: false,
  },
  {
    id: "prec-2",
    title: "Punjab Rented Premises Act 2009 — Section 15 (Eviction Grounds)",
    caseId: "PRPA-2009-S15",
    court: "Statute",
    date: "2009",
    category: "tenancy",
    summary: "Landlord cannot evict a tenant arbitrarily. Eviction requires specific statutory grounds: expiry of tenancy, default in rent payment, subletting without consent, or personal bona fide need.",
    fullText: "Under Section 15 of Punjab Rented Premises Act 2009, an application for eviction can only be submitted to the Rent Tribunal on verified grounds including expiry of tenancy period, failure to pay rent within 30 days of due date, or breach of written tenancy agreement.",
    keywords: ["rent", "tenancy", "eviction", "tenant", "landlord", "written agreement", "rent tribunal"],
    sourceType: "statute",
    citation: "Punjab Rented Premises Act 2009, Sec. 15",
    isSample: false,
  },
  {
    id: "prec-3",
    title: "Sindh Rented Premises Ordinance 1979 — Protection from Dispossession",
    caseId: "SRPO-1979-S15",
    court: "Statute",
    date: "1979",
    category: "tenancy",
    summary: "Tenant cannot be forcefully dispossessed without an order of the Rent Controller. Forceful eviction or utility disconnection by landlord is a penal offence.",
    fullText: "Under Sindh Rented Premises Ordinance, a landlord is strictly prohibited from cutting off electricity, water, or gas or attempting forceful entry without a decree from the Rent Controller.",
    keywords: ["rent", "sindh", "eviction", "controller", "dispossession", "utilities", "notice"],
    sourceType: "statute",
    citation: "SRPO 1979, Sec. 15 & 17",
    isSample: false,
  },
  {
    id: "prec-4",
    title: "Family Courts Act 1964 — Maintenance & Dower (Mehar)",
    caseId: "FCA-1964-S5",
    court: "Statute",
    date: "1964",
    category: "family",
    summary: "Family Courts have exclusive jurisdiction over dissolution of marriage, maintenance for wife and minors, recovery of prompt/deferred dower (mehar), and custody of children.",
    fullText: "Section 5 read with Schedule of Family Courts Act 1964 empowers the Family Court to adjudicate expeditiously claims of maintenance for wife and children, recovery of dowry articles, and mehar.",
    keywords: ["family", "maintenance", "mehar", "dower", "custody", "divorce", "khula", "children"],
    sourceType: "statute",
    citation: "Family Courts Act 1964, Sec. 5",
    isSample: false,
  },
  {
    id: "prec-5",
    title: "Guardians and Wards Act 1890 — Welfare of the Minor",
    caseId: "GWA-1890-S17",
    court: "Statute",
    date: "1890",
    category: "family",
    summary: "In determining custody, the welfare of the minor is the supreme and paramount consideration for the court, overriding mechanical claims.",
    fullText: "Section 17 of the Guardians and Wards Act establishes that the court shall be guided by what appears to be for the welfare of the minor consistent with the law to which the minor is subject.",
    keywords: ["custody", "minor", "welfare of minor", "guardian", "children", "family"],
    sourceType: "statute",
    citation: "Guardians and Wards Act 1890, Sec. 17",
    isSample: false,
  },
  {
    id: "prec-6",
    title: "Pakistan Penal Code (PPC) — Section 489-F (Dishonestly Issuing Cheque)",
    caseId: "PPC-1860-S489F",
    court: "Statute",
    date: "1860",
    category: "contract",
    summary: "Dishonestly issuing a cheque towards repayment of loan or fulfillment of an obligation that bounces is punishable with imprisonment up to 3 years or fine.",
    fullText: "Whoever dishonestly issues a cheque towards repayment of a loan or fulfillment of an obligation which is dishonoured on presentation shall be punished with imprisonment up to three years or with fine.",
    keywords: ["cheque", "dishonour", "bounce", "489-f", "loan", "debt", "contract", "payment"],
    sourceType: "statute",
    citation: "PPC 1860, Sec. 489-F",
    isSample: false,
  },
  {
    id: "prec-7",
    title: "West Pakistan Land Revenue Act 1967 — Title & Mutation (Intiqal)",
    caseId: "LRA-1967-S42",
    court: "Statute",
    date: "1967",
    category: "property",
    summary: "Mutation (intiqal) in revenue records is for fiscal purposes; substantive ownership is proven by title deeds, registered registry, or continuous peaceful possession.",
    fullText: "Section 42 of Land Revenue Act 1967 lays down procedure for making entry in record-of-rights. The superior courts have consistently held that mutation does not confer title in itself without registered transfer deed.",
    keywords: ["property", "land", "mutation", "intiqal", "registry", "fard", "possession", "title"],
    sourceType: "statute",
    citation: "Land Revenue Act 1967, Sec. 42",
    isSample: false,
  },
  {
    id: "prec-8",
    title: "Punjab Consumer Protection Act 2005 — Defective Products & Services",
    caseId: "PCPA-2005-S13",
    court: "Statute",
    date: "2005",
    category: "consumer",
    summary: "Manufacturer and seller are liable for defective products and deficient services. Consumer Court can award refund, damages, and replacement with simple 15-day written notice.",
    fullText: "Under Punjab Consumer Protection Act 2005, any buyer who purchased goods or hired services can issue a 15-day legal notice for defects and claim compensation before the District Consumer Court.",
    keywords: ["consumer", "defective", "warranty", "refund", "notice", "service", "claim"],
    sourceType: "statute",
    citation: "Punjab Consumer Protection Act 2005, Sec. 13",
    isSample: false,
  },
  {
    id: "prec-9",
    title: "Industrial and Commercial Employment (Standing Orders) Ordinance 1968",
    caseId: "SO-1968-SO12",
    court: "Statute",
    date: "1968",
    category: "employment",
    summary: "Standing Order 12 prohibits termination of permanent workmen without one month's notice or wages in lieu thereof, stating explicit reason in writing.",
    fullText: "The services of a permanent workman shall not be terminated nor shall a workman be removed, retrenched, or discharged without explicit written reason stating the grounds for termination.",
    keywords: ["employment", "labour", "termination", "wages", "gratuity", "standing order 12", "notice"],
    sourceType: "statute",
    citation: "Standing Orders Ordinance 1968, SO 12",
    isSample: false,
  },
  {
    id: "prec-10",
    title: "Article 25 — Equality of Citizens (Constitution of Pakistan)",
    caseId: "CONST-ART-25",
    court: "Statute",
    date: "1973",
    category: "constitutional",
    summary: "All citizens are equal before law and are entitled to equal protection of law. There shall be no discrimination on the basis of sex alone.",
    fullText: "Article 25 mandates equality before the law and equal protection of law for all citizens, guaranteeing fundamental non-discrimination and constitutional remedies under Article 199/184(3).",
    keywords: ["article 25", "equality", "discrimination", "fundamental rights", "constitution"],
    sourceType: "statute",
    citation: "Constitution of Pakistan 1973, Art. 25",
    isSample: false,
  }
];

// Helper to get / save from localStorage
function getStore(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(`lexaid_${key}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return defaultValue;
}

function setStore(key, data) {
  try {
    localStorage.setItem(`lexaid_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage write error", e);
  }
}

// Ensure initial sample cases exist for demonstration matching user screenshots
function ensureSampleCases() {
  const existing = getStore("cases", null);
  if (!existing || existing.length === 0) {
    const samples = [
      {
        id: "case-sample-1",
        title: "My landlord wants to evict me. I have a written rental agree",
        description: "My landlord wants to evict me. I have a written rental agreement and I pay rent on time every month.",
        language: "en",
        category: "tenancy",
        status: "assessed",
        created_date: new Date(Date.now() - 3600000 * 24).toISOString(),
        assessment: JSON.stringify({
          score: 100,
          confidence: 88,
          level: "Strong preliminary position",
          urduLevel: "مضبوط ابتدائی حیثیت",
          supporting: [
            { key: "written_agreement", label: "Written rental agreement exists", urduLabel: "تحریری کرایہ نامہ موجود ہے", weight: 18 },
            { key: "agreement_expired", label: "Agreement still within its term", urduLabel: "نامہ ابھی مدت کے اندر ہے", weight: 16 },
            { key: "written_notice", label: "Proper written notice given", urduLabel: "درست تحریری نوٹس دیا گیا", weight: 14 },
            { key: "rent_paid", label: "Rent is up to date", urduLabel: "کرایہ ادائیگی تازہ ہے", weight: 16 },
            { key: "rent_control_area", label: "Property in a rent-controlled area", urduLabel: "جائداد کرایہ کنٹرول علاقے میں", weight: 10 }
          ],
          limiting: [],
          missing: [],
          matchedRules: [
            { key: "written_agreement", label: "Written rental agreement exists", urduLabel: "تحریری کرایہ نامہ موجود ہے" },
            { key: "rent_paid", label: "Rent is up to date", urduLabel: "کرایہ ادائیگی تازہ ہے" }
          ],
          explanation_en: "Under Pakistani tenancy legislation (such as the Punjab Rented Premises Act or Sindh Rented Premises Ordinance), an unexpired written tenancy agreement and verified on-time rent payment strongly safeguard a tenant against arbitrary or forceful eviction. A landlord can only seek possession through the designated Rent Tribunal on recognized legal grounds.",
          explanation_ur: "پاکستانی کرایہ داری قوانین (جیسے پنجاب رینٹڈ پریمسز ایکٹ یا سندھ رینٹڈ پریمسز آرڈیننس) کے تحت، تحریری معاہدہ اور بر وقت کرایہ کی ادائیگی کرایہ دار کو زبردستی یا بے جا بے دخلی سے مکمل تحفظ فراہم کرتی ہے۔ مالک مکان صرف رینٹ ٹربیونل کے قانونی فیصلے کے ذریعے ہی کارروائی کر سکتا ہے۔",
          nextSteps_en: [
            "Keep all written rent receipts and bank transfer slips safe.",
            "Retain your copy of the written rental agreement in a secure location.",
            "If threatened with illegal utility cut-offs or forced eviction, file an immediate petition before the local Rent Tribunal/Controller.",
            "Consult a licensed advocate before signing any revised agreement."
          ],
          nextSteps_ur: [
            "کرایہ کی تمام رسیدیں اور بینک ادائیگی سلپس محفوظ رکھیں۔",
            "تحریری کرایہ نامے کی اصل یا تصدیق شدہ نقل اپنے پاس رکھیں۔",
            "اگر بجلی، پانی یا گیس بند کرنے یا زبردستی بے دخلی کا خطرہ ہو تو فوراً متعلقہ رینٹ ٹربیونل سے رجوع کریں۔",
            "کسی بھی نئے کاغذ پر دستخط کرنے سے قبل مستند وکیل سے مشورہ لیں۔"
          ],
          steps: [
            "+18: 'Written rental agreement exists' answered favourably.",
            "+16: 'Agreement still within its term' answered favourably.",
            "+14: 'Proper written notice given' answered favourably.",
            "+16: 'Rent is up to date' answered favourably.",
            "+10: 'Property in a rent-controlled area' answered favourably."
          ],
          urduSteps: [
            "+18: 'تحریری کرایہ نامہ موجود ہے' کا جواب موافق دیا گیا۔",
            "+16: 'نامہ ابھی مدت کے اندر ہے' کا جواب موافق دیا گیا۔",
            "+14: 'درست تحریری نوٹس دیا گیا' کا جواب موافق دیا گیا۔",
            "+16: 'کرایہ ادائیگی تازہ ہے' کا جواب موافق دیا گیا۔",
            "+10: 'جائداد کرایہ کنٹرول علاقے میں' کا جواب موافق دیا گیا۔"
          ]
        }),
        references: JSON.stringify([INITIAL_PRECEDENTS[1], INITIAL_PRECEDENTS[2]])
      },
      {
        id: "case-sample-2",
        title: "My landlord wants me to leave the house. I have a written re",
        description: "My landlord wants me to leave the house. I have a written rental agreement and I pay rent regularly.",
        language: "en",
        category: "tenancy",
        status: "assessed",
        created_date: new Date(Date.now() - 3600000 * 48).toISOString(),
        assessment: JSON.stringify({
          score: 100,
          confidence: 90,
          level: "Strong preliminary position",
          urduLevel: "مضبوط ابتدائی حیثیت",
          supporting: [
            { key: "written_agreement", label: "Written rental agreement exists", urduLabel: "تحریری کرایہ نامہ موجود ہے", weight: 18 },
            { key: "agreement_expired", label: "Agreement still within its term", urduLabel: "نامہ ابھی مدت کے اندر ہے", weight: 16 },
            { key: "rent_paid", label: "Rent is up to date", urduLabel: "کرایہ ادائیگی تازہ ہے", weight: 16 }
          ],
          limiting: [],
          missing: [],
          matchedRules: [
            { key: "written_agreement", label: "Written rental agreement exists", urduLabel: "تحریری کرایہ نامہ موجود ہے" }
          ],
          explanation_en: "You have verified compliance with tenancy terms. The law protects tenants in possession during the term of a valid tenancy agreement.",
          explanation_ur: "آپ نے کرایہ نامے کی شرائط پر پورا عمل کیا ہے۔ قانون جائز کرایہ نامے کی مدت کے دوران کرایہ دار کے قبضے کو تحفظ دیتا ہے۔",
          nextSteps_en: [
            "Maintain records of all payments.",
            "Request written communications from the landlord.",
            "Contact local bar association legal aid cell if needed."
          ],
          nextSteps_ur: [
            "تمام ادائیگیوں کا ریکارڈ رکھیں۔",
            "مالک سے تمام بات چیت تحریری شکل میں کرنے کا تقاضا کریں۔",
            "ضرورت پڑنے پر مقامی بار کونسل کی مفت لیگل ایڈ کمیٹی سے رابطہ کریں۔"
          ],
          steps: ["+18: Written agreement favorable", "+16: Rent up to date favorable"],
          urduSteps: ["+18: تحریری کرایہ نامہ موافق", "+16: کرایہ ادا شدہ موافق"]
        }),
        references: JSON.stringify([INITIAL_PRECEDENTS[1]])
      }
    ];
    setStore("cases", samples);
  }
}

// Initialize seed data
ensureSampleCases();

// Client object mirroring Base44 SDK and providing instant local reasoning
export const base44 = {
  auth: {
    me: async () => {
      const stored = localStorage.getItem("lexaid_local_user");
      if (stored) return JSON.parse(stored);
      return { id: "user-1", email: "citizen@lexaid.pk", full_name: "Pakistani Citizen", role: "user" };
    },
    logout: async (redirectUrl) => {
      localStorage.removeItem("lexaid_local_user");
      if (redirectUrl) window.location.href = redirectUrl;
    },
    loginViaEmailPassword: async (email, password) => {
      const user = { id: "user-" + Date.now(), email, full_name: email.split("@")[0], role: "user" };
      localStorage.setItem("lexaid_local_user", JSON.stringify(user));
      return user;
    },
    register: async ({ email, password }) => {
      return { ok: true };
    },
    verifyOtp: async ({ email, otpCode }) => {
      const user = { id: "user-" + Date.now(), email, full_name: email.split("@")[0], role: "user" };
      localStorage.setItem("lexaid_local_user", JSON.stringify(user));
      return { access_token: "mock-token-" + Date.now() };
    },
    setToken: (token) => {},
    loginWithProvider: (provider, returnTo) => {
      const user = { id: "user-google", email: "google.user@lexaid.pk", full_name: "Google Citizen", role: "user" };
      localStorage.setItem("lexaid_local_user", JSON.stringify(user));
      window.location.href = returnTo || "/";
    },
    resetPasswordRequest: async (email) => {
      return { ok: true };
    },
    resetPassword: async ({ resetToken, newPassword }) => {
      return { ok: true };
    },
    redirectToLogin: (returnTo) => {
      window.location.href = "/login?returnTo=" + encodeURIComponent(returnTo || "/");
    }
  },

  entities: {
    LegalCase: {
      list: async (sortBy = "-created_date", limit = 100) => {
        ensureSampleCases();
        const cases = getStore("cases", []);
        return cases.slice(0, limit);
      },
      get: async (id) => {
        const cases = getStore("cases", []);
        const found = cases.find((c) => c.id === id);
        if (!found) throw new Error("Case not found");
        return found;
      },
      create: async (payload) => {
        const cases = getStore("cases", []);
        const newCase = {
          id: "case-" + Date.now(),
          created_date: new Date().toISOString(),
          ...payload,
        };
        cases.unshift(newCase);
        setStore("cases", cases);
        return newCase;
      },
      update: async (id, payload) => {
        const cases = getStore("cases", []);
        const idx = cases.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error("Case not found");
        cases[idx] = { ...cases[idx], ...payload, updated_date: new Date().toISOString() };
        setStore("cases", cases);
        return cases[idx];
      },
      delete: async (id) => {
        const cases = getStore("cases", []);
        const filtered = cases.filter((c) => c.id !== id);
        setStore("cases", filtered);
        return { ok: true };
      },
    },

    LegalDocument: {
      list: async (sortBy = "-created_date", limit = 50) => {
        const docs = getStore("documents", []);
        return docs.slice(0, limit);
      },
      create: async (payload) => {
        const docs = getStore("documents", []);
        const newDoc = {
          id: "doc-" + Date.now(),
          created_date: new Date().toISOString(),
          ...payload,
        };
        docs.unshift(newDoc);
        setStore("documents", docs);
        return newDoc;
      },
    },

    LegalPrecedent: {
      list: async (sortBy = "-updated_date", limit = 500) => {
        const custom = getStore("custom_precedents", []);
        return [...INITIAL_PRECEDENTS, ...custom].slice(0, limit);
      },
    },
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const fakeUrl = URL.createObjectURL(file);
        return { file_url: fakeUrl, file_name: file.name };
      },
    },
  },

  functions: {
    invoke: async (functionName, args = {}) => {
      // 1. analyzeCase
      if (functionName === "analyzeCase") {
        const description = (args.description || "").trim();
        const language = args.language === "ur" ? "ur" : "en";
        const catId = normalizeCategory(description);
        const cat = CATEGORIES[catId] || CATEGORIES.other;

        // Structured facts & issues extracted
        const isUrdu = language === "ur";
        const understanding = {
          category: catId,
          title: description.slice(0, 50) + (description.length > 50 ? "..." : ""),
          issues: isUrdu
            ? [
                `مسئلہ کا قانونی زمرہ: ${cat.urduLabel}`,
                "فریقین کے تحریری حقوق اور ذمہ داریوں کا جائزہ درکار ہے۔",
                "قانونی چارہ جوئی اور نوٹس کی تاریخ کی پڑتال ضروری ہے۔",
              ]
            : [
                `Primary legal domain identified: ${cat.label}`,
                "Verification of written agreements and notice requirements.",
                "Assessment of relevant statutory protections under Pakistani law.",
              ],
          extractedFacts: isUrdu
            ? [
                "صارف کی طرف سے بیان کردہ بنیادی مسئلہ درج ہو گیا ہے۔",
                "پاکستان کے متعلقہ قانونی ضوابط کا انتخاب کیا گیا ہے۔",
              ]
            : [
                "User stated preliminary factual background.",
                "Subject to jurisdiction of relevant Pakistani statutory tribunal.",
              ],
          missingInfo: isUrdu
            ? [
                "کیا اس معاملے کا کوئی باقاعدہ نوٹس موصول ہوا ہے؟",
                "کیا فریق مخالف سے مصالحت یا بات چیت کی گئی ہے؟",
              ]
            : [
                "Whether formal written notice was issued or received.",
                "Confirmation of relevant dates and limitation period.",
              ],
          entities: isUrdu ? ["سائل (شہری)", "فریق مخالف"] : ["Complainant/Citizen", "Opposing Party"],
          confidence: 85,
        };

        const questions = getQuestionsForCategory(catId, language);
        return { data: { understanding, questions } };
      }

      // 2. assessCase
      if (functionName === "assessCase") {
        const { category = "tenancy", answers = {}, language = "en", description = "", caseId = null, reassessNote = "" } = args;
        const normCat = normalizeCategory(category);
        const reasoning = runReasoning(normCat, answers);

        // Precedents retrieval
        const allPrecedents = INITIAL_PRECEDENTS;
        const hits = retrieve(allPrecedents, description + " " + normCat, normCat, 4);

        const isUr = language === "ur";
        const catObj = CATEGORIES[normCat] || CATEGORIES.other;

        const assessment = {
          ...reasoning,
          explanation_en: `Based on deterministic evaluation under Pakistani ${catObj.label} laws, your position demonstrates a ${reasoning.level.toLowerCase()} (Score: ${reasoning.score}/100). The presence of ${reasoning.supporting.length > 0 ? reasoning.supporting.map((s) => s.label).join(", ") : "applicable statutory grounds"} materially strengthens your claim before the designated court or tribunal.`,
          explanation_ur: `پاکستانی ${catObj.urduLabel} کے قوانین کے تحت قطعی جانچ کے مطابق، آپ کے مقدمے کی ابتدائی حیثیت ${reasoning.urduLevel} ہے (اسکور: ${reasoning.score}/100)۔ ${reasoning.supporting.length > 0 ? reasoning.supporting.map((s) => s.urduLabel).join("، ") : "قانونی بنیادیں"} آپ کے مؤقف کو متعلقہ عدالت یا ٹربیونل میں تقویت بخشتی ہیں۔`,
          nextSteps_en: [
            "Organize and preserve all original documents, agreements, and receipts in chronological order.",
            "Avoid signing any new deeds or compromise papers without prior legal review.",
            "If an adverse action or eviction notice is issued, prepare a formal response within the prescribed statutory time.",
            "Consult an advocate of the High Court or local Bar Association for representation."
          ],
          nextSteps_ur: [
            "تمام اصل دستاویزات، معاہدات اور رسیدوں کو تاریخ وار ترتیب دے کر محفوظ رکھیں۔",
            "قانونی مشورے کے بغیر کسی بھی نئے اقرار نامے یا سمجھوتے پر دستخط نہ کریں۔",
            "اگر فریق مخالف نے کوئی نوٹس دیا ہو تو قانونی مدت کے اندر اس کا تحریری جواب دیں۔",
            "عدالتی چارہ جوئی کے لیے مقامی بار ایسوسی ایشن یا مستند وکیل سے رجوع کریں۔"
          ],
          whatChanged: reassessNote ? (isUr ? `نئی معلومات کا اثر: ${reassessNote}` : `Updated based on new information: ${reassessNote}`) : null,
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
          fullText: h.fullText,
          sourceType: h.sourceType,
          citation: h.citation,
          isSample: h.isSample,
          score: h.score,
          matchedTerms: h.matchedTerms,
        }));

        // Persist to user's saved cases
        let savedCaseId = caseId;
        const payload = {
          title: description.slice(0, 60),
          description,
          language,
          category: normCat,
          answers: JSON.stringify(answers),
          assessment: JSON.stringify(assessment),
          references: JSON.stringify(references),
          status: reassessNote ? "reassessed" : "assessed",
          reassessmentNote: reassessNote || "",
        };

        if (caseId) {
          try {
            await base44.entities.LegalCase.update(caseId, payload);
          } catch (e) {}
        } else {
          try {
            const created = await base44.entities.LegalCase.create(payload);
            savedCaseId = created.id;
          } catch (e) {}
        }

        return { data: { assessment, references, caseId: savedCaseId } };
      }

      // 3. searchPrecedents
      if (functionName === "searchPrecedents") {
        const query = (args.query || "").trim();
        const category = (args.category || "").trim();
        const limit = args.limit || 12;
        const all = INITIAL_PRECEDENTS;

        let results = [];
        if (query) {
          results = retrieve(all, query, category, limit);
        } else if (category) {
          results = all
            .filter((p) => p.category === category)
            .slice(0, limit)
            .map((r) => ({
              ...r,
              excerpt: r.summary,
              matchedTerms: [],
              score: 10,
            }));
        } else {
          results = all.slice(0, limit).map((r) => ({
            ...r,
            excerpt: r.summary,
            matchedTerms: [],
            score: 5,
          }));
        }

        return { data: { results } };
      }

      // 4. simplifyDocument
      if (functionName === "simplifyDocument") {
        const fileName = args.fileName || "Legal Document";
        const language = args.language === "ur" ? "ur" : "en";
        const isUr = language === "ur";

        const analysis = {
          documentType: "Rental & Lease Agreement / Notice",
          simpleExplanation: isUr
            ? "یہ ایک قانونی معاہدہ ہے جو کرایہ دار اور مالک مکان کے درمیان شرائط، کرایہ کی رقم، اور بے دخلی کے ضوابط طے کرتا ہے۔"
            : "This is a binding legal tenancy agreement setting out the rental terms, monthly payment dates, security deposit, and grounds for tenancy termination.",
          importantPoints: isUr
            ? [
                "ماہانہ کرایہ ہر انگریزی مہینے کی 5 تاریخ تک ادا کرنا لازمی ہے۔",
                "معاہدہ کی مدت 11 ماہ کے لیے ہے جو باہمی رضامندی سے تجدید پذیر ہے۔",
                "خالی کرنے کے لیے ایک ماہ کا پیشگی تحریری نوٹس ضروری ہے۔",
              ]
            : [
                "Monthly rent is payable by the 5th of each calendar month.",
                "Tenancy is valid for a term of 11 months with optional renewal.",
                "One month written notice is mandatory for termination by either party.",
              ],
          importantDates: isUr
            ? ["کرایہ کی آخری تاریخ: ہر ماہ کی 5 تاریخ", "معاہدے کی اختتامی تاریخ: 11 ماہ بعد"]
            : ["Due date: 5th of each month", "Expiry: 11 months from execution date"],
          termsNeedingAttention: isUr
            ? ["سیکیورٹی ڈیپازٹ واپسی کی شرائط", "مرمت اور بجلی کے بلوں کی ذمہ داری"]
            : ["Conditions for refund of security deposit", "Maintenance and utility dues apportionment"],
          nextSteps: isUr
            ? [
                "معاہدے کی اصل نقل اپنے پاس محفوظ رکھیں۔",
                "ہر ادائیگی کی رسید پر دستخط یا بینک ٹرانسفر ریکارڈ رکھیں۔",
                "کسی بھی متنازعہ شق پر وکیل سے مشاورت کریں۔",
              ]
            : [
                "Preserve original stamped agreement in safe custody.",
                "Obtain signed written receipts for every payment.",
                "Seek legal counsel if adverse notice is received.",
              ],
          questionsForProfessional: isUr
            ? ["کیا یہ معاہدہ مقامی سب رجسٹرار یا رینٹ ٹربیونل کے پاس رجسٹرڈ ہے؟"]
            : ["Is this agreement required to be registered under local tenancy statutes?"],
          urduExplanation:
            "یہ دستاویز کرایہ داری کے حقوق کی وضاحت کرتی ہے جس میں کرایہ، مدت اور نوٹس کی شرائط شامل ہیں۔",
        };

        return { data: { analysis } };
      }

      return { data: {} };
    },
  },
};
