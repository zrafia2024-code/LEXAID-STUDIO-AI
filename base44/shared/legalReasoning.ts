// LEXAID deterministic legal reasoning engine.
// Independent of any LLM provider. Turns structured facts into an explainable
// preliminary assessment. The LLM NEVER decides a legal outcome — this layer does.
//
// IMPORTANT: Scores reflect "preliminary position strength" based on defined
// factors, NOT a prediction of any court outcome. All factors are traceable.

export const CATEGORIES = {
  tenancy: {
    id: "tenancy",
    label: "Tenancy & Rent Disputes",
    urduLabel: "کرایہ داری اور کرایہ تنازعات",
    blurb: "Rental agreements, eviction, rent payment and tenant rights.",
    urduBlurb: "کرایہ نامے، بے دخلی، کرایہ ادائیگی اور کرایہ دار کے حقوق۔",
    factors: [
      {
        key: "written_agreement",
        label: "Written rental agreement exists",
        urduLabel: "تحریری کرایہ نامہ موجود ہے",
        question: "Do you have a written rental agreement?",
        urduQuestion: "کیا آپ کے پاس تحریری کرایہ نامہ ہے؟",
        why: "A written agreement sets out the rights and duties of both parties.",
        urduWhy: "تحریری نامہ دونوں فریقوں کے حقوق اور فرائض کا تعین کرتا ہے۔",
        type: "yesno",
        weight: 18,
        favorable: ["yes"],
      },
      {
        key: "agreement_expired",
        label: "Agreement still within its term",
        urduLabel: "نامہ ابھی مدت کے اندر ہے",
        question: "Has the rental agreement expired or been terminated?",
        urduQuestion: "کیا کرایہ نامہ ختم یا منسوخ ہو چکا ہے؟",
        why: "An unexpired agreement generally protects the tenant from eviction.",
        urduWhy: "غیر ختم شدہ نامہ عموما کرایہ دار کو بے دخلی سے بچاتا ہے۔",
        type: "yesno",
        weight: 16,
        favorable: ["no"],
      },
      {
        key: "written_notice",
        label: "Proper written notice given",
        urduLabel: "درست تحریری نوٹس دیا گیا",
        question: "Did the landlord give you written notice to vacate?",
        urduQuestion: "کیا مالک نے خالی کرنے کا تحریری نوٹس دیا؟",
        why: "Notice requirements affect the legality of an eviction demand.",
        urduWhy: "نوٹس کی شرائط بے دخلی کے مطالبے کی قانونی حیثیت پر اثر انداز ہوتی ہیں۔",
        type: "yesno",
        weight: 14,
        favorable: ["no"],
      },
      {
        key: "rent_paid",
        label: "Rent is up to date",
        urduLabel: "کرایہ ادائیگی تازہ ہے",
        question: "Are your rent payments up to date?",
        urduQuestion: "کیا آپ کی کرایہ ادائیگیاں تازہ ہیں؟",
        why: "Unpaid rent is a common lawful ground for eviction.",
        urduWhy: "بقایا کرایہ بے دخلی کی ایک عام قانونی وجہ ہے۔",
        type: "yesno",
        weight: 16,
        favorable: ["yes"],
      },
      {
        key: "rent_control_area",
        label: "Property in a rent-controlled area",
        urduLabel: "جائداد کرایہ کنٹرول علاقے میں",
        question: "Is the property in a rent-controlled / notified area?",
        urduQuestion: "کیا جائداد کرایہ کنٹرول /نوٹیفائیڈ علاقے میں ہے؟",
        why: "Rent control laws add eviction protections in notified areas.",
        urduWhy: "نوٹیفائیڈ علاقوں میں کرایہ کنٹرول قوانین اضافی تحفظ فراہم کرتے ہیں۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
    ],
  },
  family: {
    id: "family",
    label: "Family & Personal Laws",
    urduLabel: "خاندانی اور ذاتی قوانین",
    blurb: "Marriage, divorce, dower, maintenance, custody and inheritance.",
    urduBlurb: "نکاح، طلاق، مہر، نفقہ، حضانت اور وراثت۔",
    factors: [
      {
        key: "marriage_registered",
        label: "Marriage is registered (nikahnama)",
        urduLabel: "نکاح رجسٹرڈ ہے (نکاح نامہ)",
        question: "Is your marriage registered with a nikahnama?",
        urduQuestion: "کیا آپ کا نکاح نکاح نامے کے ساتھ رجسٹرڈ ہے؟",
        why: "A registered nikahnama is key evidence for family-law claims.",
        urduWhy: "رجسٹرڈ نکاح نامہ خاندانی قانونی دعووں کے لیے اہم ثبوت ہے۔",
        type: "yesno",
        weight: 18,
        favorable: ["yes"],
      },
      {
        key: "mehr_paid",
        label: "Mehar (dower) settled",
        urduLabel: "مہر (طے شدہ/ادا)",
        question: "Has the agreed mehar been paid or settled?",
        urduQuestion: "کیا طے شدہ مہر ادا یا تسلی شدہ ہے؟",
        why: "Unpaid mehar is a recognised claim in family courts.",
        urduWhy: "غیر ادا شدہ مہر خاندانی عدالتوں میں تسلیم شدہ دعوی ہے۔",
        type: "yesno",
        weight: 14,
        favorable: ["no"],
      },
      {
        key: "maintenance_sought",
        label: "Maintenance formally sought",
        urduLabel: "نفقہ باقاعدہ مطالبہ کیا گیا",
        question: "Have you formally sought maintenance through the court?",
        urduQuestion: "کیا آپ نے عدالت کے ذریعے باقاعدہ نفقہ کا مطالبہ کیا ہے؟",
        why: "Maintenance requires a formal claim and proof of means.",
        urduWhy: "نفقہ کے لیے باقاعدہ دعوی اور وسائل کا ثبوت ضروری ہے۔",
        type: "yesno",
        weight: 12,
        favorable: ["yes"],
      },
      {
        key: "children_involved",
        label: "Children / custody involved",
        urduLabel: "بچے /حضانت شامل ہیں",
        question: "Are there children whose custody or welfare is involved?",
        urduQuestion: "کیا بچے موجود ہیں جن کی حضانت یا بہتری شامل ہے؟",
        why: "Custody is decided on the welfare of the child principle.",
        urduWhy: "حضانت بچے کی بہتری کے اصول پر طے ہوتی ہے۔",
        type: "yesno",
        weight: 12,
        favorable: ["yes"],
      },
      {
        key: "divorce_procedure",
        label: "Correct divorce procedure followed",
        urduLabel: "درست طلاق طریقہ کار اپنایا گیا",
        question: "Was a recognised divorce procedure (notice, iddat, arbitration) used?",
        urduQuestion: "کیا تسلیم شدہ طلاق طریقہ کار (نوٹس، عدت، ثالثی) استعمال کیا گیا؟",
        why: "Procedural defects can affect the validity of a divorce.",
        urduWhy: "طریقہ کار کی خامیاں طلاق کی درستگی کو متاثر کر سکتی ہیں۔",
        type: "yesno",
        weight: 16,
        favorable: ["yes"],
      },
    ],
  },
  criminal: {
    id: "criminal",
    label: "Criminal",
    urduLabel: "فوجداری",
    blurb: "FIR, arrest, bail, offences under the Penal Code and procedure.",
    urduBlurb: "ایف آئی آر، گرفتاری، ضمانت، پینل کوڈ اور طریقہ کار کے تحت جرائم۔",
    factors: [
      {
        key: "fir_registered",
        label: "FIR registered",
        urduLabel: "ایف آئی آر درج ہے",
        question: "Has an FIR been registered about the incident?",
        urduQuestion: "کیا واقعہ کے متعلق ایف آئی آر درج کی گئی ہے؟",
        why: "An FIR is usually the starting point for criminal proceedings.",
        urduWhy: "ایف آئی آر عموما فوجداری کارروائی کا آغاز ہے۔",
        type: "yesno",
        weight: 16,
        favorable: ["yes"],
      },
      {
        key: "arrest_made",
        label: "Accused arrested or identified",
        urduLabel: "ملزم گرفتار یا شناخت شدہ",
        question: "Has the accused been arrested or identified?",
        urduQuestion: "کیا ملزم گرفتار یا شناخت کیا گیا ہے؟",
        why: "Identification supports the progress of a case.",
        urduWhy: "شناخت مقدمے کی پیش رفت میں مدد کرتی ہے۔",
        type: "yesno",
        weight: 12,
        favorable: ["yes"],
      },
      {
        key: "evidence_available",
        label: "Evidence / witnesses available",
        urduLabel: "ثبوت /گواہ دستیاب",
        question: "Do you have evidence or witnesses for the incident?",
        urduQuestion: "کیا آپ کے پاس واقعہ کا ثبوت یا گواہ ہیں؟",
        why: "Witnesses and documentary evidence materially affect outcomes.",
        urduWhy: "گواہ اور دستاویزی ثبوت نتائج پر نمایاں اثر ڈالتے ہیں۔",
        type: "yesno",
        weight: 16,
        favorable: ["yes"],
      },
      {
        key: "bail_status",
        label: "Bail status clear",
        urduLabel: "ضمانت کی حیثیت واضح",
        question: "Has bail been granted, denied, or not applied for?",
        urduQuestion: "کیا ضمانت منظور، مسترد یا درخواست نہیں دی گئی؟",
        why: "Bail status affects liberty while the case is pending.",
        urduWhy: "ضمانت کی حیثیت مقدمے کے زیریں آزادی کو متاثر کرتی ہے۔",
        type: "choice",
        options: ["granted", "denied", "not_applied"],
        weight: 10,
        favorable: ["granted"],
      },
      {
        key: "legal_representation",
        label: "Has legal representation",
        urduLabel: "قانونی نمائندگی موجود",
        question: "Do you have a lawyer or legal representation?",
        urduQuestion: "کیا آپ کے پاس وکیل یا قانونی نمائندگی ہے؟",
        why: "Representation is important in criminal proceedings.",
        urduWhy: "فوجداری کارروائی میں نمائندگی اہم ہے۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
    ],
  },
  property: {
    id: "property",
    label: "Property & Land",
    urduLabel: "جائداد اور زمین",
    blurb: "Ownership, transfer, mutation, inheritance and boundary disputes.",
    urduBlurb: "ملکیت، منتقلی، میوٹیشن، وراثت اور سرحد تنازعات۔",
    factors: [
      {
        key: "title_documents",
        label: "Title / ownership documents held",
        urduLabel: "ملکیت دستاویزات موجود",
        question: "Do you hold title or ownership documents (registry, fard, mutation)?",
        urduQuestion: "کیا آپ کے پاس ملکیت کی دستاویزات (رجسٹری، فرد، میوٹیشن) ہیں؟",
        why: "Title documents are the primary proof of ownership.",
        urduWhy: "ملکیت دستاویزات ملکیت کا بنیادی ثبوت ہیں۔",
        type: "yesno",
        weight: 20,
        favorable: ["yes"],
      },
      {
        key: "mutation_entered",
        label: "Mutation entered in revenue record",
        urduLabel: "میوٹیشن ریونیو ریکارڈ میں درج",
        question: "Has the mutation of ownership been entered in the revenue record?",
        urduQuestion: "کیا ملکیت کی میوٹیشن ریونیو ریکارڈ میں درج ہو چکی ہے؟",
        why: "Un-entered mutation weakens enforceable ownership.",
        urduWhy: "غیر درج میوٹیشن قابل نفاذ ملکیت کو کمزور کرتی ہے۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "possession_held",
        label: "In peaceful possession",
        urduLabel: "پرامن قبضہ میں",
        question: "Are you currently in possession of the property?",
        urduQuestion: "کیا آپ اس وقت جائداد پر قبضہ رکھتے ہیں؟",
        why: "Possession is a strong factor in property disputes.",
        urduWhy: "قبضہ جائداد تنازعات میں ایک مضبوط عنصر ہے۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "encumbrance_check",
        label: "Encumbrances / liens checked",
        urduLabel: "بوجھ /لین کی پڑتال",
        question: "Have you checked for liens, mortgages or court attachments?",
        urduQuestion: "کیا آپ نے لین، رہن یا عدالتی ضبطی کی پڑتال کی ہے؟",
        why: "Undisclosed encumbrances can defeat a transfer.",
        urduWhy: "غیر افشا بوجھ منتقلی کو ناکام کر سکتے ہیں۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
      {
        key: "boundary_dispute",
        label: "Boundary / demarcation clear",
        urduLabel: "سرحد /تعین واضح",
        question: "Is there a boundary or demarcation dispute?",
        urduQuestion: "کیا سرحد یا تعین کا تنازع ہے؟",
        why: "A boundary dispute often requires a demarcation survey.",
        urduWhy: "سرحد تنازع اکثر تعین سروے کا متقاضی ہوتا ہے۔",
        type: "yesno",
        weight: 10,
        favorable: ["no"],
      },
    ],
  },
  consumer: {
    id: "consumer",
    label: "Consumer Protection",
    urduLabel: "صارفین کا تحفظ",
    blurb: "Defective goods, deficient services, misleading claims and refunds.",
    urduBlurb: "معیب اشیاء، ناقص خدمات، گمراہ کن دعوے اور واپسی۔",
    factors: [
      {
        key: "receipt_proof",
        label: "Receipt / proof of purchase",
        urduLabel: "رسید /خرید کا ثبوت",
        question: "Do you have a receipt or proof of purchase?",
        urduQuestion: "کیا آپ کے پاس رسید یا خرید کا ثبوت ہے؟",
        why: "Proof of transaction is essential for a consumer claim.",
        urduWhy: "لین دین کا ثبوت صارفی دعوی کے لیے ضروری ہے۔",
        type: "yesno",
        weight: 18,
        favorable: ["yes"],
      },
      {
        key: "defect_notified",
        label: "Defect notified to seller",
        urduLabel: "خرابی بیچنے والے کو مطلع",
        question: "Did you notify the seller/service provider of the defect?",
        urduQuestion: "کیا آپ نے بیچنے والے /خدمت فراہم کرنے والے کو خرابی کی اطلاع دی؟",
        why: "Notice gives the seller a chance to remedy before court.",
        urduWhy: "اطلاع عدالت سے پہلے بیچنے والے کو اصلاح کا موقع دیتی ہے۔",
        type: "yesno",
        weight: 12,
        favorable: ["yes"],
      },
      {
        key: "within_warranty",
        label: "Within warranty / guarantee period",
        urduLabel: "وارنٹی /ضمانت کی مدت کے اندر",
        question: "Was the defect reported within the warranty period?",
        urduQuestion: "کیا خرابی وارنٹی کی مدت کے اندر اطلاع دی گئی؟",
        why: "Warranty periods limit the seller's liability.",
        urduWhy: "وارنٹی کی مدتیں بیچنے والے کی ذمہ داری کو محدود کرتی ہیں۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "misleading_claim",
        label: "Misleading advertisement / claim",
        urduLabel: "گمراہ کن اشتہار /دعوی",
        question: "Was there a misleading advertisement or claim?",
        urduQuestion: "کیا کوئی گمراہ کن اشتہار یا دعوی تھا؟",
        why: "Misleading claims are specifically actionable under consumer law.",
        urduWhy: "گمراہ کن دعوے صارفی قانون کے تحت قابل کارروائی ہیں۔",
        type: "yesno",
        weight: 12,
        favorable: ["yes"],
      },
      {
        key: "complaint_filed",
        label: "Complaint filed with consumer court",
        urduLabel: "صارفی عدالت میں شکایت درج",
        question: "Have you filed a complaint with the consumer court?",
        urduQuestion: "کیا آپ نے صارفی عدالت میں شکایت درج کروائی ہے؟",
        why: "A formal complaint starts the consumer-court process.",
        urduWhy: "باقاعدہ شکایت صارفی عدالت کا عمل شروع کرتی ہے۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
    ],
  },
  employment: {
    id: "employment",
    label: "Employment & Labour",
    urduLabel: "روزگار اور مزدوری",
    blurb: "Unpaid wages, wrongful termination, gratuity and workplace rights.",
    urduBlurb: "غیر ادا شدہ اجرت، غلط برطرفی، گریجوٹی اور کامگاہ کے حقوق۔",
    factors: [
      {
        key: "written_contract",
        label: "Written employment contract",
        urduLabel: "تحریری روزگار معاہدہ",
        question: "Do you have a written employment contract or appointment letter?",
        urduQuestion: "کیا آپ کے پاس تحریری روزگار معاہدہ یا تقرری نامہ ہے؟",
        why: "A written contract clarifies terms and entitlements.",
        urduWhy: "تحریری معاہدہ شرائط اور حقوق کی وضاحت کرتا ہے۔",
        type: "yesno",
        weight: 16,
        favorable: ["yes"],
      },
      {
        key: "wages_unpaid",
        label: "Wages / salary unpaid",
        urduLabel: "اجرت /تنخواہ غیر ادا شدہ",
        question: "Are wages or salary genuinely unpaid?",
        urduQuestion: "کیا اجرت یا تنخواہ واقعی غیر ادا شدہ ہے؟",
        why: "Unpaid wages are directly recoverable under labour law.",
        urduWhy: "غیر ادا شدہ اجرت مزدور قانون کے تحت قابل وصول ہے۔",
        type: "yesno",
        weight: 16,
        favorable: ["yes"],
      },
      {
        key: "termination_procedure",
        label: "Due termination procedure followed",
        urduLabel: "درست برطرفی طریقہ کار",
        question: "Was a fair termination procedure (notice, inquiry) followed?",
        urduQuestion: "کیا منصفانہ برطرفی طریقہ کار (نوٹس، تحقیق) اپنایا گیا؟",
        why: "Procedural fairness affects the legality of termination.",
        urduWhy: "طریقہ کار کی انصاف برطرفی کی قانونی حیثیت کو متاثر کرتا ہے۔",
        type: "yesno",
        weight: 14,
        favorable: ["no"],
      },
      {
        key: "gratuity_pf",
        label: "Gratuity / PF entitlement",
        urduLabel: "گریجوٹی /پی ایف کا استحقاق",
        question: "Are gratuity or provident fund dues outstanding?",
        urduQuestion: "کیا گریجوٹی یا پراویڈنٹ فنڈ کے بقایا واجبات ہیں؟",
        why: "Terminal benefits are recoverable on separation.",
        urduWhy: "آخرین فوائد علیحدگی پر قابل وصول ہیں۔",
        type: "yesno",
        weight: 12,
        favorable: ["yes"],
      },
      {
        key: "labour_court_filed",
        label: "Claim filed with labour court",
        urduLabel: "مزدور عدالت میں دعوی درج",
        question: "Have you filed a claim with the labour court / NIRC?",
        urduQuestion: "کیا آپ نے مزدور عدالت /این آئی آر سی میں دعوی درج کیا ہے؟",
        why: "A formal claim is required to enforce labour rights.",
        urduWhy: "مزدور حقوق کو نافذ کرنے کے لیے باقاعدہ دعوی ضروری ہے۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
    ],
  },
  contract: {
    id: "contract",
    label: "Contract & Civil",
    urduLabel: "معاہدہ اور دیوانی",
    blurb: "Breach of contract, agreements, cheques, debts and civil claims.",
    urduBlurb: "معاہدہ کی خلاف ورزی، نامے، چیک، قرض اور دیوانی دعوے۔",
    factors: [
      {
        key: "written_contract",
        label: "Written contract exists",
        urduLabel: "تحریری معاہدہ موجود",
        question: "Is there a written and signed contract?",
        urduQuestion: "کیا کوئی تحریری اور دستخط شدہ معاہدہ ہے؟",
        why: "A written contract is the strongest evidence of terms.",
        urduWhy: "تحریری معاہدہ شرائط کا مضبوط ثبوت ہے۔",
        type: "yesno",
        weight: 18,
        favorable: ["yes"],
      },
      {
        key: "performed_part",
        label: "You performed your part",
        urduLabel: "آپ نے اپنا حصہ پورا کیا",
        question: "Have you performed your obligations under the contract?",
        urduQuestion: "کیا آپ نے معاہدہ کے تحت اپنے فرائض پورے کیے؟",
        why: "Performance by the claimant is usually required to claim breach.",
        urduWhy: "دعوے دار کی کارروائی خلاف ورزی کے دعوی کے لیے عموما ضروری ہے۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "breach_evidenced",
        label: "Breach evidenced",
        urduLabel: "خلاف ورزی ثابت",
        question: "Can you evidence the other party's breach?",
        urduQuestion: "کیا آپ دوسری فریق کی خلاف ورزی ثابت کر سکتے ہیں؟",
        why: "Proof of breach is the core of a contract claim.",
        urduWhy: "خلاف ورزی کا ثبوت معاہدہ دعوی کا مرکز ہے۔",
        type: "yesno",
        weight: 16,
        favorable: ["yes"],
      },
      {
        key: "notice_of_breach",
        label: "Notice of breach given",
        urduLabel: "خلاف ورزی کا نوٹس دیا",
        question: "Did you give the other party notice of the breach?",
        urduQuestion: "کیا آپ نے دوسری فریق کو خلاف ورزی کا نوٹس دیا؟",
        why: "Notice is often required before suing for breach.",
        urduWhy: "خلاف ورزی کے دعوی سے پہلے نوٹس اکثر ضروری ہے۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
      {
        key: "damages_quantified",
        label: "Damages quantified",
        urduLabel: "نقصانات کا تعین",
        question: "Have you quantified your loss or damages?",
        urduQuestion: "کیا آپ نے اپنا نقصان یا نقصانات کا تعین کیا ہے؟",
        why: "Quantified damages make a claim concrete.",
        urduWhy: "تعین شدہ نقصانات دعوی کو ٹھوس بناتے ہیں۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
    ],
  },
  constitutional: {
    id: "constitutional",
    label: "Constitutional & Fundamental Rights",
    urduLabel: "آئینی اور بنیادی حقوق",
    blurb: "Fundamental rights, writs, unlawful state action and public remedies.",
    urduBlurb: "بنیادی حقوق، رٹ، غیر قانونی ریاستی عمل اور عوامی علاج۔",
    factors: [
      {
        key: "fundamental_right",
        label: "A fundamental right is affected",
        urduLabel: "بنیادی حق متاثر ہے",
        question: "Is a fundamental right (life, liberty, equality, speech) affected?",
        urduQuestion: "کیا کوئی بنیادی حق (زندگی، آزادی، مساوات، اظہار) متاثر ہے؟",
        why: "Constitutional remedies require an affected fundamental right.",
        urduWhy: "آئینی علاج کے لیے متاثر بنیادی حق ضروری ہے۔",
        type: "yesno",
        weight: 18,
        favorable: ["yes"],
      },
      {
        key: "state_actor",
        label: "State / public authority involved",
        urduLabel: "ریاست /عوامی اتھارٹی شامل",
        question: "Is a state organ or public authority involved?",
        urduQuestion: "کیا کوئی ریاستی ادارہ یا عوامی اتھارٹی شامل ہے؟",
        why: "Writ jurisdiction generally targets state action.",
        urduWhy: "رٹ کا دائرہ کار عموما ریاستی عمل کو ہدف بناتا ہے۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "remedy_exhausted",
        label: "Alternative remedy considered",
        urduLabel: "متبادل علاج پر غور",
        question: "Have you considered or used any alternative remedy?",
        urduQuestion: "کیا آپ نے کوئی متبادل علاج پر غور یا استعمال کیا ہے؟",
        why: "Courts may require alternative remedies to be exhausted first.",
        urduWhy: "عدالتیں متبادل علاج ختم ہونے کا تقاضا کر سکتی ہیں۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
      {
        key: "writ_filed",
        label: "Writ petition prepared",
        urduLabel: "رٹ درخواست تیار",
        question: "Has a writ petition been drafted or filed?",
        urduQuestion: "کیا رٹ درخواست تیار یا دائر کی گئی ہے؟",
        why: "A writ is the standard constitutional remedy.",
        urduWhy: "رٹ معیاری آئینی علاج ہے۔",
        type: "yesno",
        weight: 12,
        favorable: ["yes"],
      },
    ],
  },
  harassment: {
    id: "harassment",
    label: "Harassment & Bullying",
    urduLabel: "ہراسگی اور بلینگ",
    blurb: "Classmate bullying, school/college harassment, ragging, cyberbullying, and criminal intimidation under Pakistani laws.",
    urduBlurb: "کلاس فیلوز کی جانب سے دھمکیاں، سکول یا کالج میں ہراسگی، سائبر بلینگ اور بلیک میلنگ۔",
    factors: [
      {
        key: "threats_or_abuse",
        label: "Direct threats, bullying, or abusive behavior occurred",
        urduLabel: "براہ راست دھمکیاں، بدسلوکی یا تشدد کا وقوعہ ہوا",
        question: "Were physical violence, verbal abuse, or direct threats made by classmates or peers?",
        urduQuestion: "کیا کلاس فیلوز یا کسی فرد کی جانب سے جسمانی تشدد، گالی گلوچ یا دھمکیاں دی گئیں؟",
        why: "Criminal intimidation (Section 503/506 PPC) and assault are punishable criminal offences under Pakistani law.",
        urduWhy: "دھمکیاں دینا (تعزیرات پاکستان دفعہ 506) اور تشدد قانونی طور پر قابل سزا جرم ہے۔",
        type: "yesno",
        weight: 18,
        favorable: ["yes"],
      },
      {
        key: "digital_or_written_proof",
        label: "Digital evidence or witness proof exists",
        urduLabel: "ڈیجیٹل شواہد (پیغامات/ویڈیو) یا گواہان موجود ہیں",
        question: "Do you have proof such as WhatsApp messages, audio/video recordings, screenshots, or witnesses?",
        urduQuestion: "کیا آپ کے پاس واٹس ایپ پیغامات، وائس نوٹس، ویڈیو، اسکرین شاٹس یا گواہان کے ثبوت ہیں؟",
        why: "Electronic evidence is admissible under Qanun-e-Shahadat 1984 and PECA 2016 for cyber harassment investigations.",
        urduWhy: "قانون شہادت 1984 اور پیکا ایکٹ 2016 کے تحت الیکٹرانک شواہد عدالت اور ایف آئی اے میں قابل قبول ہیں۔",
        type: "yesno",
        weight: 16,
        favorable: ["yes"],
      },
      {
        key: "reported_to_administration",
        label: "Reported to school/college administration or harassment committee",
        urduLabel: "سکول/کالج انتظامیہ یا اینٹی ہراسمنٹ کمیٹی کو شکایت درج کرائی گئی",
        question: "Have you filed a formal written complaint to the school/college principal, disciplinary board, or harassment committee?",
        urduQuestion: "کیا آپ نے سکول/کالج پرنسپل، ڈسپلن کمیٹی یا اینٹی ہراسمنٹ سیل کو تحریری شکایت دی ہے؟",
        why: "Educational institutions in Pakistan are legally bound under Harassment Act 2022 to maintain inquiry committees and protect students.",
        urduWhy: "اینٹی ہراسمنٹ ترمیمی ایکٹ 2022 کے تحت تمام تعلیمی ادارے طلبہ کے تحفظ اور فوری کارروائی کے قانونی پابند ہیں۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "cyber_harassment_involved",
        label: "Online bullying, defamation, or social media harassment involved",
        urduLabel: "آن لائن ہراسگی، سوشل میڈیا پر بدنامی یا بلیک میلنگ شامل ہے",
        question: "Does the bullying involve social media, group chats, online threats, or non-consensual sharing of pictures?",
        urduQuestion: "کیا اس میں واٹس ایپ، سوشل میڈیا، آن لائن گروپس میں کردار کشی یا تصویریں پھیلانے کا عمل شامل ہے؟",
        why: "Section 20 of PECA 2016 specifically penalizes digital harassment, defamation, and cyberbullying via FIA Cybercrime Wing.",
        urduWhy: "پیکا ایکٹ 2016 کی دفعہ 20 سوشل میڈیا اور انٹرنیٹ پر بلینگ اور کردار کشی پر ایف آئی اے کو فوری کارروائی کا اختیار دیتی ہے۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "impact_on_safety_or_education",
        label: "Compromised personal safety, education, or mental well-being",
        urduLabel: "تعلیم، ذاتی تحفظ یا ذہنی سکون شدید متاثر ہوا ہے",
        question: "Has this situation prevented you from attending classes safely, or caused fear and distress?",
        urduQuestion: "کیا اس کی وجہ سے آپ کے لیے کلاس میں جانا مشکل ہو گیا ہے یا شدید خوف اور ذہنی دباؤ پیدا ہوا ہے؟",
        why: "Article 14 (Inviolability of Dignity) and Article 25A (Right to Education) of the Constitution guarantee a safe learning environment.",
        urduWhy: "آئین پاکستان کا آرٹیکل 14 (عزت و وقار کا تحفظ) اور 25A پرامن اور محفوظ تعلیمی ماحول کا بنیادی حق دیتے ہیں۔",
        type: "yesno",
        weight: 12,
        favorable: ["yes"],
      },
    ],
  },
  other: {
    id: "other",
    label: "General Legal Matter",
    urduLabel: "عمومی قانونی معاملہ",
    blurb: "A legal issue that does not clearly fit another category.",
    urduBlurb: "ایک قانونی معاملہ جو واضح طور پر کسی دوسری زمرے میں نہیں آتا۔",
    factors: [
      {
        key: "documents_available",
        label: "Relevant documents available",
        urduLabel: "متعلقہ دستاویزات دستیاب",
        question: "Do you have relevant documents or evidence?",
        urduQuestion: "کیا آپ کے پاس متعلقہ دستاویزات یا ثبوت ہیں؟",
        why: "Documents materially affect most legal matters.",
        urduWhy: "دستاویزات اکثر قانونی معاملات پر نمایاں اثر ڈالتے ہیں۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "deadline_known",
        label: "Any deadline / limitation known",
        urduLabel: "کوئی آخری تاریخ /عدم پابندی معلوم",
        question: "Is there a known deadline or limitation period?",
        urduQuestion: "کیا کوئی معلوم آخری تاریخ یا عدم پابندی کی مدت ہے؟",
        why: "Missing a limitation period can bar a claim forever.",
        urduWhy: "عدم پابندی کی مدت گزر جانا دعوی ہمیشہ کے لیے بند کر سکتی ہے۔",
        type: "yesno",
        weight: 14,
        favorable: ["yes"],
      },
      {
        key: "opposing_party",
        label: "Opposing party identified",
        urduLabel: "مخالف فریق شناخت شدہ",
        question: "Is the opposing party clearly identified?",
        urduQuestion: "کیا مخالف فریق واضح طور پر شناخت شدہ ہے؟",
        why: "A claim needs a clearly identified respondent.",
        urduWhy: "دعوی کے لیے واضح شناخت شدہ مخالف ضروری ہے۔",
        type: "yesno",
        weight: 10,
        favorable: ["yes"],
      },
      {
        key: "legal_advice_sought",
        label: "Professional legal advice sought",
        urduLabel: "قانونی مشورہ لیا گیا",
        question: "Have you consulted a qualified lawyer about this?",
        urduQuestion: "کیا آپ نے اس بارے میں کسی مستند وکیل سے مشورہ کیا ہے؟",
        why: "Professional advice clarifies the real options.",
        urduWhy: "قانونی مشورہ حقیقی اختیارات واضح کرتا ہے۔",
        type: "yesno",
        weight: 8,
        favorable: ["yes"],
      },
    ],
  },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES);

export function normalizeCategory(raw) {
  if (!raw) return "other";
  const r = String(raw).toLowerCase().trim();
  if (CATEGORIES[r]) return r;

  // Urdu & English category mapping
  const map = {
    // Bullying, Campus Harassment, Ragging, Cyberbullying, Intimidation -> Harassment
    harassment: "harassment", bully: "harassment", bullied: "harassment", bullying: "harassment", classmate: "harassment", classmates: "harassment",
    ragging: "harassment", harass: "harassment", "cyber bully": "harassment", cyberbullying: "harassment",
    cyberbully: "harassment", intimidation: "harassment", threatened: "harassment", threat: "harassment", blackmail: "harassment",
    "school bullying": "harassment", "college bullying": "harassment", student: "harassment", peers: "harassment", peca: "harassment",
    "506": "harassment", "503": "harassment", "509": "harassment",
    ہراسگی: "harassment", "تنگ کرنا": "harassment", دھمکی: "harassment", دھمکیاں: "harassment", بلینگ: "harassment", "کلاس فیلو": "harassment",
    کلاس: "harassment", سکول: "harassment", کالج: "harassment", ریگنگ: "harassment", "بلیک میل": "harassment", "سائبر ہراسگی": "harassment", "بدسلوکی": "harassment",

    // Constitutional / Supreme Court / High Court
    constitutional: "constitutional", constitution: "constitutional", writ: "constitutional", fundamental: "constitutional", rights: "constitutional",
    supreme: "constitutional", "supreme court": "constitutional", "high court": "constitutional", "habeas corpus": "constitutional", judicial: "constitutional",
    آئین: "constitutional", "سپریم کورٹ": "constitutional", "ہائی کورٹ": "constitutional", رٹ: "constitutional", "بنیادی حق": "constitutional",
    "عوامی مفاد": "constitutional", "سو موٹو": "constitutional", "عدلیہ": "constitutional", "آرٹیکل": "constitutional",

    // Criminal
    criminal: "criminal", fir: "criminal", arrest: "criminal", bail: "criminal", offence: "criminal", crime: "criminal",
    police: "criminal", murder: "criminal", "302": "criminal", theft: "criminal", assault: "criminal", investigation: "criminal",
    فوجداری: "criminal", "ایف آئی آر": "criminal", پولیس: "criminal", گرفتاری: "criminal", ضمانت: "criminal", جرم: "criminal",
    قتل: "criminal", چوری: "criminal", حراست: "criminal", ریمانڈ: "criminal", "تعزیرات": "criminal", "ضابطہ فوجداری": "criminal",

    // Property & Land
    property: "property", land: "property", ownership: "property", mutation: "property", transfer: "property", plot: "property", registry: "property", fard: "property",
    جائداد: "property", زمین: "property", پلاٹ: "property", رجسٹری: "property", فرد: "property", انتقال: "property", قبضہ: "property", پٹوار: "property", استقرار: "property",

    // Tenancy & Rent
    tenancy: "tenancy", rent: "tenancy", landlord: "tenancy", tenant: "tenancy", eviction: "tenancy", lease: "tenancy",
    کرایہ: "tenancy", "کرایہ دار": "tenancy", "مالک مکان": "tenancy", "بے دخلی": "tenancy", "کرایہ نامہ": "tenancy", "رینٹ ٹربیونل": "tenancy",

    // Family Law
    family: "family", divorce: "family", marriage: "family", mehar: "family", maintenance: "family", custody: "family", inheritance: "family", nikah: "family", khula: "family",
    خاندان: "family", فیملی: "family", نکاح: "family", طلاق: "family", خلع: "family", مہر: "family", نفقہ: "family", خرچہ: "family", بچے: "family", حضانت: "family", وراثت: "family",

    // Consumer Protection
    consumer: "consumer", refund: "consumer", warranty: "consumer", defective: "consumer", product: "consumer", seller: "consumer",
    صارف: "consumer", دکاندار: "consumer", وارنٹی: "consumer", خراب: "consumer", خریداری: "consumer", ناقص: "consumer", ہرجانہ: "consumer",

    // Employment & Labor
    employment: "employment", labour: "employment", labor: "employment", wage: "employment", salary: "employment", termination: "employment", job: "employment", gratuity: "employment",
    ملازمت: "employment", نوکری: "employment", برطرفی: "employment", تنخواہ: "employment", ادارہ: "employment", ملازم: "employment", مزدور: "employment", لیبر: "employment",

    // Contract & Financial
    contract: "contract", agreement: "contract", cheque: "contract", debt: "contract", breach: "contract", loan: "contract", fraud: "contract", "489-f": "contract",
    معاہدہ: "contract", چیک: "contract", قرض: "contract", رقم: "contract", فریب: "contract", فراڈ: "contract", "لین دین": "contract", "بوگس چیک": "contract",
  };
  for (const k in map) {
    if (r.includes(k)) return map[k];
  }
  return "other";
}

export function getQuestionsForCategory(categoryId, language) {
  const cat = CATEGORIES[categoryId] || CATEGORIES.other;
  return cat.factors.map((f) => ({
    key: f.key,
    id: f.key,
    question: language === "ur" ? f.urduQuestion : f.question,
    why: language === "ur" ? f.urduWhy : f.why,
    type: f.type,
    options: f.options,
    label: language === "ur" ? f.urduLabel : f.label,
    urduQuestion: f.urduQuestion,
    urduWhy: f.urduWhy,
    urduLabel: f.urduLabel,
  }));
}

export function runReasoning(categoryId, answers) {
  const cat = CATEGORIES[categoryId] || CATEGORIES.other;
  const matched = [];
  const supporting = [];
  const limiting = [];
  const missing = [];
  const steps = [];
  const urduSteps = [];
  let score = 50;
  let missingCount = 0;

  for (const f of cat.factors) {
    const ans = answers ? answers[f.key] : undefined;
    if (ans === undefined || ans === null || ans === "") {
      missing.push({ key: f.key, label: f.label, urduLabel: f.urduLabel, question: f.question, urduQuestion: f.urduQuestion });
      missingCount++;
      continue;
    }
    matched.push({ key: f.key, label: f.label, urduLabel: f.urduLabel });
    const isFavorable = f.favorable.includes(String(ans).toLowerCase());
    if (isFavorable) {
      supporting.push({ key: f.key, label: f.label, urduLabel: f.urduLabel, weight: f.weight });
      score += f.weight;
      steps.push("+" + f.weight + ': "' + f.label + '" answered favourably.');
      urduSteps.push("+" + f.weight + ': "' + f.urduLabel + '" موافق جواب دیا گیا۔');
    } else {
      limiting.push({ key: f.key, label: f.label, urduLabel: f.urduLabel, weight: f.weight });
      score -= f.weight;
      steps.push("-" + f.weight + ': "' + f.label + '" answered unfavourably.');
      urduSteps.push("-" + f.weight + ': "' + f.urduLabel + '" غیر موافق جواب دیا گیا۔');
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidence = Math.max(20, Math.round(100 - missingCount * 12));
  let level = "Weak preliminary position";
  let urduLevel = "کمزور ابتدائی حیثیت";
  if (score >= 75) {
    level = "Strong preliminary position";
    urduLevel = "مضبوط ابتدائی حیثیت";
  } else if (score >= 60) {
    level = "Moderate preliminary position";
    urduLevel = "متوسط ابتدائی حیثیت";
  } else if (score >= 40) {
    level = "Uncertain preliminary position";
    urduLevel = "غیر یقینی ابتدائی حیثیت";
  }

  if (missingCount > 0) {
    steps.push(missingCount + " material fact(s) still missing — confidence reduced.");
    urduSteps.push(missingCount + " اہم حقائق ابھی نامعلوم ہیں — یقین کم کیا گیا۔");
  }

  return {
    category: cat.id,
    matchedRules: matched,
    supporting,
    limiting,
    missing,
    score,
    confidence,
    level,
    urduLevel,
    steps,
    urduSteps,
  };
}
