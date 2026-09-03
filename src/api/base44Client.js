import { CATEGORIES, normalizeCategory, getQuestionsForCategory, runReasoning } from "../../base44/shared/legalReasoning";
import { retrieve } from "../../base44/shared/retrieval";

// Default seed precedents from Pakistani law and Constitution
const INITIAL_PRECEDENTS = [
  {
    id: "prec-1",
    title: "Article 9 — Security of person (Constitution of Pakistan)",
    titleUr: "آرٹیکل 9 — سلامتی شخص (آئین پاکستان 1973)",
    caseId: "CONST-ART-9",
    court: "Statute",
    date: "1973",
    category: "constitutional",
    summary: "No person shall be deprived of life or liberty save in accordance with law. Fundamental protection against illegal detention, state abuse, and unlawful eviction without due process.",
    summaryUr: "قانون کے مطابق ہونے کے سوا کسی شخص کو زندگی یا آزادی سے محروم نہیں کیا جائے گا۔ بلا جواز گرفتاری، ریاستی اختیارات کے ناجائز استعمال اور زبردستی بے دخلی کے خلاف بنیادی آئینی تحفظ۔",
    fullText: "Article 9 of the Constitution of the Islamic Republic of Pakistan guarantees that no person shall be deprived of life or liberty save in accordance with law. The Supreme Court has repeatedly affirmed that 'life' includes the right to livelihood, dignity, and shelter.",
    keywords: ["article 9", "security", "life", "liberty", "detention", "constitution", "fundamental right"],
    sourceType: "statute",
    citation: "Constitution of Pakistan 1973, Art. 9",
    isSample: false,
  },
  {
    id: "prec-2",
    title: "Punjab Rented Premises Act 2009 — Section 15 (Eviction Grounds)",
    titleUr: "پنجاب رینٹڈ پریمسز ایکٹ 2009 — دفعہ 15 (بے دخلی کی قانونی وجوہات)",
    caseId: "PRPA-2009-S15",
    court: "Statute",
    date: "2009",
    category: "tenancy",
    summary: "Landlord cannot evict a tenant arbitrarily. Eviction requires specific statutory grounds: expiry of tenancy, default in rent payment, subletting without consent, or personal bona fide need.",
    summaryUr: "مالک مکان اپنی مرضی سے کرایہ دار کو بے دخل نہیں کر سکتا۔ بے دخلی کے لیے کرایہ نامے کی مدت ختم ہونا، کرائے میں تاخیر یا ذاتی ضروری ضرورت جیسے قانونی دلائل رینٹ ٹربیونل کے سامنے ثابت کرنا لازمی ہے۔",
    fullText: "Under Section 15 of Punjab Rented Premises Act 2009, an application for eviction can only be submitted to the Rent Tribunal on verified grounds including expiry of tenancy period, failure to pay rent within 30 days of due date, or breach of written tenancy agreement.",
    keywords: ["rent", "tenancy", "eviction", "tenant", "landlord", "written agreement", "rent tribunal"],
    sourceType: "statute",
    citation: "Punjab Rented Premises Act 2009, Sec. 15",
    isSample: false,
  },
  {
    id: "prec-3",
    title: "Sindh Rented Premises Ordinance 1979 — Protection from Dispossession",
    titleUr: "سندھ رینٹڈ پریمسز آرڈیننس 1979 — غیر قانونی بے دخلی سے تحفظ",
    caseId: "SRPO-1979-S15",
    court: "Statute",
    date: "1979",
    category: "tenancy",
    summary: "Tenant cannot be forcefully dispossessed without an order of the Rent Controller. Forceful eviction or utility disconnection by landlord is a penal offence.",
    summaryUr: "رینٹ کنٹرولر کے باضابطہ حکم کے بغیر کرایہ دار کو زبردستی بے دخل نہیں کیا جا سکتا۔ بجلی، پانی یا گیس کی بندش مالک کی طرف سے قابل سزا جرم ہے۔",
    fullText: "Under Sindh Rented Premises Ordinance, a landlord is strictly prohibited from cutting off electricity, water, or gas or attempting forceful entry without a decree from the Rent Controller.",
    keywords: ["rent", "sindh", "eviction", "controller", "dispossession", "utilities", "notice"],
    sourceType: "statute",
    citation: "SRPO 1979, Sec. 15 & 17",
    isSample: false,
  },
  {
    id: "prec-4",
    title: "Family Courts Act 1964 — Maintenance & Dower (Mehar)",
    titleUr: "فیملی کورٹس ایکٹ 1964 — نفقہ اور مہر کا تحفظ",
    caseId: "FCA-1964-S5",
    court: "Statute",
    date: "1964",
    category: "family",
    summary: "Family Courts have exclusive jurisdiction over dissolution of marriage, maintenance for wife and minors, recovery of prompt/deferred dower (mehar), and custody of children.",
    summaryUr: "فیملی کورٹس کو تنسیخ نکاح، بیوی اور بچوں کے ماہانہ نفقہ، بقایا مہر اور بچوں کی حضانت کے معاملات فوری حل کرنے کے خصوصی اختیارات حاصل ہیں۔",
    fullText: "Section 5 read with Schedule of Family Courts Act 1964 empowers the Family Court to adjudicate expeditiously claims of maintenance for wife and children, recovery of dowry articles, and mehar.",
    keywords: ["family", "maintenance", "mehar", "dower", "custody", "divorce", "khula", "children"],
    sourceType: "statute",
    citation: "Family Courts Act 1964, Sec. 5",
    isSample: false,
  },
  {
    id: "prec-5",
    title: "Guardians and Wards Act 1890 — Welfare of the Minor",
    titleUr: "گارڈینز اینڈ وارڈز ایکٹ 1890 — بچے کی فلاح و بہبود",
    caseId: "GWA-1890-S17",
    court: "Statute",
    date: "1890",
    category: "family",
    summary: "In determining custody, the welfare of the minor is the supreme and paramount consideration for the court, overriding mechanical claims.",
    summaryUr: "بچوں کی حضانت اور تحویل کے فیصلے میں عدالت کے لیے بچے کی تعلیم، صحت اور فلاح و بہبود ہی سب سے بنیادی اور لازمی اصول ہے۔",
    fullText: "Section 17 of the Guardians and Wards Act establishes that the court shall be guided by what appears to be for the welfare of the minor consistent with the law to which the minor is subject.",
    keywords: ["custody", "minor", "welfare of minor", "guardian", "children", "family"],
    sourceType: "statute",
    citation: "Guardians and Wards Act 1890, Sec. 17",
    isSample: false,
  },
  {
    id: "prec-6",
    title: "Pakistan Penal Code (PPC) — Section 489-F (Dishonestly Issuing Cheque)",
    titleUr: "تعزیرات پاکستان — دفعہ 489-F (بدنیتی سے چیک جاری کرنا)",
    caseId: "PPC-1860-S489F",
    court: "Statute",
    date: "1860",
    category: "contract",
    summary: "Dishonestly issuing a cheque towards repayment of loan or fulfillment of an obligation that bounces is punishable with imprisonment up to 3 years or fine.",
    summaryUr: "قرض کی واپسی یا معاہدے کے تحت دیا گیا چیک ڈس آنر (باؤنس) ہونے پر 3 سال تک قید اور جرمانہ کی سزا کا قانون ہے۔",
    fullText: "Whoever dishonestly issues a cheque towards repayment of a loan or fulfillment of an obligation which is dishonoured on presentation shall be punished with imprisonment up to three years or with fine.",
    keywords: ["cheque", "dishonour", "bounce", "489-f", "loan", "debt", "contract", "payment"],
    sourceType: "statute",
    citation: "PPC 1860, Sec. 489-F",
    isSample: false,
  },
  {
    id: "prec-7",
    title: "West Pakistan Land Revenue Act 1967 — Title & Mutation (Intiqal)",
    titleUr: "لینڈ ریونیو ایکٹ 1967 — اراضی انتقال اور ملکیتی حقوق",
    caseId: "LRA-1967-S42",
    court: "Statute",
    date: "1967",
    category: "property",
    summary: "Mutation (intiqal) in revenue records is for fiscal purposes; substantive ownership is proven by title deeds, registered registry, or continuous peaceful possession.",
    summaryUr: "ریونیو ریکارڈ میں انتقال محض مالیاتی حساب کے لیے ہوتا ہے، حقیقی ملکیت رجسٹرڈ بیع نامہ اور ملکیتی دستاویزات سے ثابت ہوتی ہے۔",
    fullText: "Section 42 of Land Revenue Act 1967 lays down procedure for making entry in record-of-rights. The superior courts have consistently held that mutation does not confer title in itself without registered transfer deed.",
    keywords: ["property", "land", "mutation", "intiqal", "registry", "fard", "possession", "title"],
    sourceType: "statute",
    citation: "Land Revenue Act 1967, Sec. 42",
    isSample: false,
  },
  {
    id: "prec-8",
    title: "Punjab Consumer Protection Act 2005 — Defective Products & Services",
    titleUr: "پنجاب تحفظ صارف ایکٹ 2005 — ناقص اشیاء اور خدمات کا معاوضہ",
    caseId: "PCPA-2005-S13",
    court: "Statute",
    date: "2005",
    category: "consumer",
    summary: "Manufacturer and seller are liable for defective products and deficient services. Consumer Court can award refund, damages, and replacement with simple 15-day written notice.",
    summaryUr: "وارنٹی والی اشیاء یا سروس میں خرابی کی صورت میں خریدار 15 دن کے نوٹس کے بعد ڈسٹرکٹ کنزیومر کورٹ سے رقم کی واپسی اور ہرجانہ لے سکتا ہے۔",
    fullText: "Under Punjab Consumer Protection Act 2005, any buyer who purchased goods or hired services can issue a 15-day legal notice for defects and claim compensation before the District Consumer Court.",
    keywords: ["consumer", "defective", "warranty", "refund", "notice", "service", "claim"],
    sourceType: "statute",
    citation: "Punjab Consumer Protection Act 2005, Sec. 13",
    isSample: false,
  },
  {
    id: "prec-9",
    title: "Industrial and Commercial Employment (Standing Orders) Ordinance 1968",
    titleUr: "اسٹینڈنگ آرڈرز آرڈیننس 1968 — ملازمین کی برطرفی کا تحفظ",
    caseId: "SO-1968-SO12",
    court: "Statute",
    date: "1968",
    category: "employment",
    summary: "Standing Order 12 prohibits termination of permanent workmen without one month's notice or wages in lieu thereof, stating explicit reason in writing.",
    summaryUr: "مستقل ملازم کو بغیر تحریری نوٹس یا ایک ماہ کی تنخواہ اور واضح ٹھوس وجہ کے نوکری سے فارغ نہیں کیا جا سکتا۔",
    fullText: "The services of a permanent workman shall not be terminated nor shall a workman be removed, retrenched, or discharged without explicit written reason stating the grounds for termination.",
    keywords: ["employment", "labour", "termination", "wages", "gratuity", "standing order 12", "notice"],
    sourceType: "statute",
    citation: "Standing Orders Ordinance 1968, SO 12",
    isSample: false,
  },
  {
    id: "prec-10",
    title: "Article 25 — Equality of Citizens (Constitution of Pakistan)",
    titleUr: "آرٹیکل 25 — شہریوں کی برابری (آئین پاکستان 1973)",
    caseId: "CONST-ART-25",
    court: "Statute",
    date: "1973",
    category: "constitutional",
    summary: "All citizens are equal before law and are entitled to equal protection of law. There shall be no discrimination on the basis of sex alone.",
    summaryUr: "تمام شہری قانون کی نظر میں برابر ہیں اور مساوی تحفظ کے حقدار ہیں۔ جنس یا نسل کی بنیاد پر کوئی امتیازی سلوک نہیں کیا جا سکتا۔",
    fullText: "Article 25 mandates equality before the law and equal protection of law for all citizens, guaranteeing fundamental non-discrimination and constitutional remedies under Article 199/184(3).",
    keywords: ["article 25", "equality", "discrimination", "fundamental rights", "constitution"],
    sourceType: "statute",
    citation: "Constitution of Pakistan 1973, Art. 25",
    isSample: false,
  },
  {
    id: "prec-11",
    title: "Section 506 PPC & Section 20 PECA — Criminal Intimidation & Cyberbullying",
    titleUr: "دفعہ 506 تعزیرات پاکستان اور دفعہ 20 پیکا — مجرمانہ دھمکیاں اور سائبر بلینگ",
    caseId: "PPC-506-PECA-20",
    court: "Statute",
    date: "1860 / 2016",
    category: "harassment",
    summary: "Threats by classmates, physical intimidation, or abusive WhatsApp messages constitute cognizable offences under Section 506 PPC and Section 20 of PECA 2016.",
    summaryUr: "کلاس فیلوز کی جانب سے دھمکیاں، تشدد یا سوشل میڈیا/واٹس ایپ پر بلینگ اور کردار کشی تعزیرات پاکستان دفعہ 506 اور پیکا 2016 کے تحت قابل گرفت جرم ہے۔",
    fullText: "Section 506 PPC penalizes criminal intimidation by threats of injury, reputation loss, or life with imprisonment up to 7 years. Section 20 PECA 2016 penalizes online harassment, stalking, and cyber defamation with up to 3 years imprisonment via FIA Cybercrime Wing.",
    keywords: ["bullying", "classmate", "harassment", "506", "peca", "threat", "cyberbullying", "school", "college", "دھمکی", "بلینگ", "ہراسگی", "سکول"],
    sourceType: "statute",
    citation: "PPC Sec. 506 / PECA Sec. 20",
    isSample: false,
  },
  {
    id: "prec-12",
    title: "Protection Against Harassment at Educational Institutions Act (Amended 2022)",
    titleUr: "تحفظ برائے انسداد ہراسگی ایکٹ (بشمول سکول، کالج، یونیورسٹیاں اور طلبہ)",
    caseId: "HARASS-ACT-2022",
    court: "Statute",
    date: "2022",
    category: "harassment",
    summary: "The 2022 amendment strictly covers educational institutions and students, requiring mandatory inquiry committees for bullying and peer harassment.",
    summaryUr: "سال 2022 کی قانونی ترمیم کے تحت تمام تعلیمی اداروں اور طلبہ کو تحفظ حاصل ہے اور اینٹی ہراسمنٹ کمیٹی یا محتسب کو فوری کارروائی کی قانونی پابندی ہے۔",
    fullText: "Protects all students from hostile campus environments, bullying, ragging, and intimidation by classmates or faculty.",
    keywords: ["harassment act", "campus bullying", "student rights", "ragging", "ombudsperson", "طلبہ", "ہراسگی", "کالج", "محتسب"],
    sourceType: "statute",
    citation: "Harassment Act 2010 / 2022",
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
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.email && !parsed.email.includes("lexaid.pk")) return parsed;
        } catch {}
      }
      return null;
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
      return { access_token: "token-" + Date.now() };
    },
    setToken: (token) => {},
    loginWithProvider: (provider, returnTo) => {
      window.location.href = returnTo || "/login";
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
        const isUrdu = language === "ur";

        let catId = normalizeCategory(description);
        let understanding = null;

        // Try backend AI analysis endpoint
        try {
          const res = await fetch("/api/analyze-case", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, language }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.analysis) {
              const a = json.analysis;
              if (a.category) {
                catId = normalizeCategory(a.category);
              }
              const cat = CATEGORIES[catId] || CATEGORIES.other;
              understanding = {
                category: catId,
                title: a.title || description.slice(0, 50),
                summary: a.summary || "",
                issues: Array.isArray(a.issues) && a.issues.length > 0 ? a.issues : [
                  isUrdu ? "ڈیجیٹل یا تعلیمی پلیٹ فارم پر ہراسگی" : "Harassment through digital platforms",
                  isUrdu ? "سائبر سیفٹی اور فوجداری قوانین کی ممکنہ خلاف ورزی" : "Potential violation of cyber safety laws",
                ],
                extractedFacts: Array.isArray(a.extractedFacts) && a.extractedFacts.length > 0 ? a.extractedFacts : [
                  isUrdu ? "صارف کو ہم جماعتوں کی جانب سے ہراسگی یا بلینگ کا سامنا ہے" : "The user is being bullied by classmates online",
                ],
                missingInfo: Array.isArray(a.missingInfo) && a.missingInfo.length > 0 ? a.missingInfo : [
                  isUrdu ? "وہ پلیٹ فارم جہاں بلینگ ہو رہی ہے" : "The platform where the bullying is happening",
                  isUrdu ? "پیغامات یا پوسٹس کے شواہد" : "Evidence of the messages or posts",
                  isUrdu ? "واقعے میں ملوث افراد کی عمر" : "The age of the people involved",
                  isUrdu ? "کیا سکول کو مطلع کیا گیا ہے" : "Whether the school has been informed",
                ],
                entities: a.entities || (isUrdu ? ["سائل (طالب علم)", "ہم جماعت"] : ["Complainant/Student", "Classmates"]),
                confidence: a.confidence || 90,
              };
            }
          }
        } catch (fetchErr) {
          console.warn("Backend /api/analyze-case call failed:", fetchErr);
        }

        // Deterministic fallback if backend did not return
        if (!understanding) {
          const descLower = description.toLowerCase();
          if (
            descLower.includes("bully") ||
            descLower.includes("classmate") ||
            descLower.includes("harass") ||
            descLower.includes("threat") ||
            descLower.includes("school") ||
            descLower.includes("college") ||
            descLower.includes("student") ||
            description.includes("بلینگ") ||
            description.includes("ہم جماعت") ||
            description.includes("ہراسگی") ||
            description.includes("دھمکی")
          ) {
            catId = "harassment";
            understanding = {
              category: "harassment",
              title: isUrdu ? "ہم جماعتوں کی جانب سے ہراسگی اور بلینگ" : "Bullying & Harassment by Classmates",
              summary: isUrdu
                ? "ہم جماعتوں کی جانب سے ہراسگی اور بلینگ کا معاملہ انسداد ہراسگی ایکٹ اور تعزیرات پاکستان کے تحت جانچا جا رہا ہے۔"
                : "Bullying and peer harassment by classmates under educational anti-harassment and criminal laws.",
              issues: isUrdu
                ? [
                    "کیا ہم جماعتوں کی کارروائیاں تحفظ برائے انسداد ہراسگی ایکٹ 2010 (تعلیمی اداروں کے لیے 2022 کی ترمیم شدہ) کے تحت ہراسگی کے زمرے میں آتی ہیں",
                    "کیا بلینگ میں مجموعہ تعزیرات پاکستان (PPC) کی دفعات 503، 506، یا 509 کے تحت دھمکیاں، گالی گلوچ، یا جسمانی خوف و ہراس شامل ہے",
                    "کیا پریوینشن آف الیکٹرانک کرائمز ایکٹ (PECA) 2016 کی دفعہ 20 کے تحت کوئی آن لائن یا ڈیجیٹل بلینگ کا ارتکاب ہوا ہے",
                  ]
                : [
                    "Whether the classmates' actions constitute harassment under the Protection Against Harassment at the Workplace Act 2010 (as amended in 2022 for educational institutions)",
                    "Whether the bullying involves threats, verbal abuse, or physical intimidation under Pakistan Penal Code (PPC) Sections 503, 506, or 509",
                    "Whether any online or digital bullying took place under Section 20 of the Prevention of Electronic Crimes Act (PECA) 2016",
                  ],
              extractedFacts: isUrdu
                ? ["صارف کو ہم جماعتوں کی جانب سے ہراسگی یا بلینگ کا سامنا ہے"]
                : ["The user is being bullied by classmates"],
              missingInfo: isUrdu
                ? [
                    "بلینگ کے کون سے مخصوص افعال ہو رہے ہیں (جیسے جسمانی تشدد، زبانی توہین، دھمکیاں، یا معاشرتی بائیکاٹ)؟",
                    "کیا بلینگ سکول کے اندر ہو رہی ہے، باہر، یا سوشل میڈیا اور میسجنگ ایپس کے ذریعے آن لائن؟",
                    "کیا اس واقعے کی اطلاع سکول پرنسپل، اساتذہ، یا انسداد ہراسگی انکوائری کمیٹی کو دی گئی ہے؟",
                    "کیا اس میں ملوث افراد نابالغ ہیں یا بالغ یونیورسٹی/کالج کے طلبہ؟",
                  ]
                : [
                    "What specific acts of bullying are occurring (such as physical violence, verbal insults, threats, or isolation)?",
                    "Is the bullying happening inside the school, outside, or online via social media or messaging apps?",
                    "Has this incident been reported to the school principal, teachers, or an anti-harassment inquiry committee?",
                    "Are the individuals involved minors or adult university/college students?",
                  ],
              entities: isUrdu ? ["طالب علم", "ہم جماعت"] : ["Student", "Classmates"],
              confidence: 90,
            };
          } else {
            const cat = CATEGORIES[catId] || CATEGORIES.other;
            understanding = {
              category: catId,
              title: description.slice(0, 50) + (description.length > 50 ? "..." : ""),
              summary: isUrdu
                ? `آپ کا کیس پاکستانی ${cat.urduLabel} کے قوانین کے دائرہ اختیار میں جانچا جا رہا ہے۔`
                : `Your matter is being evaluated under Pakistani ${cat.label} jurisprudence.`,
              issues: isUrdu
                ? [
                    `مسئلہ کا قانونی زمرہ: ${cat.urduLabel}`,
                    "متعلقہ عدالتی فورم یا ٹربیونل سے رجوع کرنے کی شرائط۔",
                  ]
                : [
                    `Primary legal domain identified: ${cat.label}`,
                    "Assessment of relevant statutory protections under Pakistani law.",
                  ],
              extractedFacts: isUrdu
                ? ["صارف کی طرف سے بیان کردہ بنیادی مسئلہ درج ہو گیا ہے۔"]
                : ["User stated preliminary factual background."],
              missingInfo: isUrdu
                ? [
                    "کیا اس معاملے کا کوئی باقاعدہ نوٹس یا دستاویز موجود ہے؟",
                    "واقعہ یا معاہدے کی تاریخ اور تفصیلات۔",
                  ]
                : [
                    "Whether formal written documentation or notice exists.",
                    "Confirmation of relevant dates and timeline.",
                  ],
              entities: isUrdu ? ["سائل (شہری)", "فریق مخالف"] : ["Complainant/Citizen", "Opposing Party"],
              confidence: 85,
            };
          }
        }

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

        let explanationEn = `Based on evaluation under Pakistani ${catObj.label} laws, your position demonstrates a ${reasoning.level.toLowerCase()} (Score: ${reasoning.score}/100). The presence of ${reasoning.supporting.length > 0 ? reasoning.supporting.map((s) => s.label).join(", ") : "applicable statutory grounds"} materially strengthens your claim before the designated court or tribunal.`;
        let explanationUr = `پاکستانی ${catObj.urduLabel} کے قوانین کے تحت جانچ کے مطابق، آپ کے مقدمے کی ابتدائی حیثیت ${reasoning.urduLevel} ہے (اسکور: ${reasoning.score}/100)۔ ${reasoning.supporting.length > 0 ? reasoning.supporting.map((s) => s.urduLabel).join("، ") : "قانونی بنیادیں"} آپ کے مؤقف کو متعلقہ عدالت یا ٹربیونل میں تقویت بخشتی ہیں۔`;
        let nextStepsEn = [
          "Organize and preserve all original documents, agreements, and receipts in chronological order.",
          "Avoid signing any new deeds or compromise papers without prior legal review.",
          "If an adverse action or eviction notice is issued, prepare a formal response within the prescribed statutory time.",
          "Consult an advocate of the High Court or local Bar Association for representation."
        ];
        let nextStepsUr = [
          "تمام اصل دستاویزات، معاہدات اور رسیدوں کو تاریخ وار ترتیب دے کر محفوظ رکھیں۔",
          "قانونی مشورے کے بغیر کسی بھی نئے اقرار نامے یا سمجھوتے پر دستخط نہ کریں۔",
          "اگر فریق مخالف نے کوئی نوٹس دیا ہو تو قانونی مدت کے اندر اس کا تحریری جواب دیں۔",
          "عدالتی چارہ جوئی کے لیے مقامی بار ایسوسی ایشن یا مستند وکیل سے رجوع کریں۔"
        ];
        let whatChanged = reassessNote ? (isUr ? `نئی معلومات کا اثر: ${reassessNote}` : `Updated based on new information: ${reassessNote}`) : null;

        // Try backend AI assessment endpoint for rich statutory context
        try {
          const res = await fetch("/api/assess-case", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: normCat,
              answers,
              language,
              description,
              caseId,
              reassessNote,
            }),
          });
          if (res.ok) {
            const j = await res.json();
            if (j?.assessmentText) {
              if (j.assessmentText.explanation_ur) explanationUr = j.assessmentText.explanation_ur;
              if (j.assessmentText.explanation_en) explanationEn = j.assessmentText.explanation_en;
              if (j.assessmentText.nextSteps_ur?.length) nextStepsUr = j.assessmentText.nextSteps_ur;
              if (j.assessmentText.nextSteps_en?.length) nextStepsEn = j.assessmentText.nextSteps_en;
              if (j.assessmentText.whatChanged) whatChanged = j.assessmentText.whatChanged;
            }
          }
        } catch (fetchErr) {
          console.warn("Backend /api/assess-case call failed:", fetchErr);
        }

        const assessment = {
          ...reasoning,
          explanation_en: explanationEn,
          explanation_ur: explanationUr,
          nextSteps_en: nextStepsEn,
          nextSteps_ur: nextStepsUr,
          whatChanged,
          reassessNote: reassessNote || null,
        };

        const references = hits.map((h) => ({
          id: h.id,
          title: h.title,
          titleUr: h.titleUr || "",
          caseId: h.caseId,
          court: h.court,
          date: h.date,
          category: h.category,
          excerpt: h.excerpt || h.summary,
          summary: h.summary,
          summaryUr: h.summaryUr || "",
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
        const fileContent = args.fileContent || "";
        const fileDataUrl = args.fileDataUrl || "";
        const isUr = language === "ur";

        // Call backend /api/analyze-document with document content & language
        try {
          const res = await fetch("/api/analyze-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName,
              fileContent,
              fileDataUrl,
              language,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.analysis) {
              return { data: { analysis: json.analysis } };
            }
          }
        } catch (fetchErr) {
          console.warn("Backend /api/analyze-document failed, using heuristic:", fetchErr);
        }

        // Context-aware heuristic fallback in plain everyday language (as if sitting beside the user)
        const fLower = (fileName + " " + fileContent).toLowerCase();
        let documentType = isUr ? "قانونی دستاویز" : "Legal Document";
        let simpleExplanation = isUr
          ? `ہم نے یہ کاغذ (${fileName}) آپ کے ساتھ مل کر دیکھا ہے۔ آسان الفاظ میں: اس میں فریقین کے حقوق، ذمہ داریاں اور اصول لکھے ہیں تاکہ ہر کسی کو معلوم ہو کہ کیا کرنا جائز ہے اور کس چیز سے روکا گیا ہے۔`
          : `We looked over this document (${fileName}) with you. In plain words: it explains what was agreed or decided, what rules each person must follow, and what will happen if someone does not keep their word.`;
        let importantPoints = isUr
          ? ["دستاویز میں شامل افراد کے نام، دستخط اور ان کے کیے گئے وعدے درج ہیں۔", "اس میں طے شدہ شرائط اور رقم یا جائیداد سے متعلق اصول لکھے ہیں۔"]
          : ["It lists the people involved and the promises each person made.", "It explains what money, property, or rules everyone agreed to follow."];
        let importantDates = isUr ? ["معاہدے پر دستخط کا دن یا نوٹس کا جواب دینے کی آخری تاریخ"] : ["The date this starts, payment due dates, or the deadline to answer a notice"];
        let termsNeedingAttention = isUr
          ? ["اگر کوئی شخص ان اصولوں پر عمل نہیں کرے گا تو اسے ہرجانہ دینا پڑ سکتا ہے یا قانونی کارروائی کا سامنا ہوگا۔"]
          : ["If someone fails to follow the rules in this paper, they may face the financial penalties or legal consequences mentioned in it."];
        let nextSteps = isUr
          ? ["اس کاغذ کی اصل کاپی محفوظ جگہ پر رکھیں اور ایک صاف تصویر اپنے پاس رکھیں۔", "کوئی بڑا قدم اٹھانے سے پہلے کسی بااعتماد وکیل سے اس کے تمام نکات اچھی طرح سمجھ لیں۔"]
          : ["Keep the original document in a safe place and save a clear photo or copy.", "Talk with a qualified legal advisor to make sure you feel completely comfortable with every detail."];
        let questionsForProfessional = isUr
          ? ["اس دستاویز کے تحت ہمارے حقوق محفوظ رکھنے کے لیے فوری طور پر کیا کرنا ضروری ہے؟"]
          : ["What practical steps should we take right now to make sure our rights are completely protected under this paper?"];

        if (fLower.includes("supreme") || fLower.includes("scmr") || fLower.includes("cpla")) {
          documentType = isUr ? "سپریم کورٹ آف پاکستان کا حتمی فیصلہ" : "Supreme Court of Pakistan Final Decision";
          simpleExplanation = isUr
            ? "یہ سپریم کورٹ آف پاکستان (ملک کی سب سے بڑی عدالت) کا حتمی فیصلہ ہے۔ جج صاحبان نے نچلی عدالت کے فیصلے کا جائزہ لے کر آخری فیصلہ سنایا ہے۔ پاکستان میں سپریم کورٹ کا فیصلہ ملک کی تمام عدالتوں اور تمام شہریوں پر لازمی لاگو ہوتا ہے۔"
            : "This is a final ruling from the Supreme Court of Pakistan—the highest court in the country. In simple terms: the judges reviewed the case and made a final decision that must be followed by every court and person across Pakistan.";
          importantPoints = isUr
            ? ["سپریم کورٹ نے پورے معاملے کا جائزہ لے کر اپنا حتمی اور پکا فیصلہ سنا دیا ہے۔", "اس فیصلے نے اس جیسے تمام دیگر مقدمات کے لیے بھی ایک پکا اصول طے کر دیا ہے۔"]
            : ["The highest court gave its final ruling after carefully reviewing the case.", "This ruling sets the standard rule that all other courts in Pakistan must now follow."];
          importantDates = isUr ? ["وہ تاریخ جس دن سپریم کورٹ کے جج صاحب نے یہ حتمی فیصلہ سنایا"] : ["The date when the judges officially announced this final decision"];
          termsNeedingAttention = isUr
            ? ["اگر کوئی فریق اس فیصلے پر دوبارہ غور کی درخواست (Review) دینا چاہے تو عام طور پر صرف 30 دن کی مہلت ہوتی ہے۔"]
            : ["If anyone wants to ask the judges to take another look at the ruling (a Review), they usually only have 30 days to apply."];
          nextSteps = isUr
            ? ["اپنے وکیل کے ذریعے سپریم کورٹ کے دفتر سے اس فیصلے کی مہر لگی کاپی حاصل کریں۔", "اپنے وکیل سے سمجھیں کہ اس فیصلے پر عمل درآمد کے لیے فوری طور پر کیا کرنا ہے۔"]
            : ["Ask your lawyer to get an official stamped copy of the decision from the court registry.", "Talk to your advocate about what needs to happen to put the judges' decision into practice."];
          questionsForProfessional = isUr
            ? ["کیا یہ فیصلہ بالکل حتمی ہو چکا ہے یا کسی فریق نے اس پر نظر ثانی کی درخواست دی ہے؟"]
            : ["Is this ruling completely final, or has any review request been submitted?"];
        }

        const analysis = {
          documentType,
          simpleExplanation,
          importantPoints,
          importantDates,
          termsNeedingAttention,
          nextSteps,
          questionsForProfessional,
          urduExplanation: isUr ? simpleExplanation : "یہ دستاویز پاکستان کے قانونی فریم ورک کے تحت جانچی گئی ہے۔",
        };

        return { data: { analysis } };
      }

      return { data: {} };
    },
  },
};
