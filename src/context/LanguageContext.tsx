import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isUrdu: boolean;
  t: (key: string) => string;
}

const translations: Record<string, { en: string; ur: string }> = {
  // Brand & Header
  app_name: { en: 'LEXAID Pakistan', ur: 'لیکزئیڈ پاکستان' },
  tagline: {
    en: 'Understand your legal rights in simple, everyday language.',
    ur: 'اپنے قانونی حقوق نہایت آسان اور سادہ زبان میں سمجھیں۔'
  },
  disclaimer: {
    en: 'LEXAID provides legal information to help citizens understand Pakistani law. It is not a court or a lawyer. For serious court trials, always consult a licensed lawyer.',
    ur: 'لیکزئیڈ عام شہریوں کو پاکستانی قوانین اور ان کے حقوق سمجھنے میں رہنمائی فراہم کرتا ہے۔ یہ عدالت یا وکیل کا متبادل نہیں ہے۔ حتمی عدالتی کارروائی کے لیے کسی مستند وکیل سے مشورہ کریں۔'
  },
  for_pakistan: { en: 'For Pakistan Only — Based on Pakistani Law', ur: 'صرف پاکستان کے لیے — پاکستانی قانون پر مبنی' },

  // Navigation
  nav_home: { en: 'Home', ur: 'ہوم' },
  nav_assistant: { en: 'Legal Assistant', ur: 'قانونی مددگار' },
  nav_case_check: { en: 'Step-by-Step Check', ur: 'کیس کی آسان جانچ' },
  nav_documents: { en: 'Understand Documents', ur: 'کاغذات اور نوٹس سمجھیں' },
  nav_laws: { en: 'Laws & Fundamental Rights', ur: 'آسان قوانین اور حقوق' },
  nav_legal_aid: { en: 'Free Legal Aid & Helplines', ur: 'مفت وکیل اور ہیلپ لائنز' },
  nav_deadlines: { en: 'Court Deadlines & Time Limits', ur: 'عدالتی مدت اور آخری تاریخ' },
  nav_my_cases: { en: 'My Saved Cases', ur: 'میرے محفوظ کیسز' },
  nav_settings: { en: 'Settings', ur: 'سیٹنگز' },

  // Emergency Helplines
  helpline_human_rights: { en: 'Human Rights Helpline: 1099', ur: 'انسانی حقوق ہیلپ لائن: 1099' },
  helpline_women: { en: 'Women Protection: 1043', ur: 'خواتین تحفظ ہیلپ لائن: 1043' },
  helpline_police: { en: 'Police Emergency: 15', ur: 'پولیس ایمرجنسی: 15' },
  helpline_cyber: { en: 'FIA Cyber Crime: 1991', ur: 'ایف آئی اے سائبر ونگ: 1991' },

  // Home Hero
  hero_title: {
    en: 'Have a Legal Problem? Get Clear Answers in Plain Words.',
    ur: 'کیا آپ کو کوئی قانونی مسئلہ درپیش ہے؟ آسان اور سیدھے الفاظ میں رہنمائی حاصل کریں۔'
  },
  hero_desc: {
    en: 'No confusing legal jargon. Understand what Pakistani law says about rent eviction, police FIRs, bail, family disputes, cheque bounce, and your constitutional rights.',
    ur: 'کوئی مشکل قانونی اصطلاحات نہیں۔ کرایہ داری، پولیس ایف آئی آر، ضمانت، خلع اور فیملی مسائل، چیک باؤنس اور اپنے آئینی حقوق کو آسان زبان میں سمجھیں۔'
  },
  hero_btn_ask: { en: 'Ask Legal Assistant', ur: 'قانونی مددگار سے پوچھیں' },
  hero_btn_check: { en: 'Start Case Check', ur: 'کیس کی مرحلہ وار جانچ' },
  hero_btn_laws: { en: 'Browse Everyday Laws', ur: 'روزمرہ قوانین دیکھیں' },

  // How it works
  how_title: { en: 'How LEXAID Helps You in 4 Easy Steps', ur: 'لیکزئیڈ آپ کی مدد کیسے کرتا ہے؟ (4 آسان مراحل)' },
  step1_title: { en: '1. Tell your issue', ur: '1۔ اپنا مسئلہ لکھیں' },
  step1_desc: { en: 'Explain what happened in your own words (English or Urdu).', ur: 'جو واقعہ پیش آیا اسے اپنے سادہ الفاظ (اردو یا انگلش) میں لکھیں یا بولیں۔' },
  step2_title: { en: '2. Answer simple questions', ur: '2۔ 2 سے 3 آسان سوالات' },
  step2_desc: { en: 'Answer simple yes/no questions to clarify the facts.', ur: 'معاملے کو واضح کرنے کے لیے چند سیدھے ہاں/ناں والے سوالات کے جواب دیں۔' },
  step3_title: { en: '3. See what the law says', ur: '3۔ پاکستانی قانون کا جائزہ' },
  step3_desc: { en: 'Find out whether the other party has the legal right to do what they are doing.', ur: 'جانیں کہ کیا دوسری پارٹی قانونی طور پر حق بجانب ہے یا آپ کو قانون کا تحفظ حاصل ہے۔' },
  step4_title: { en: '4. Clear next steps & help', ur: '4۔ واضح حل اور مفت رہنمائی' },
  step4_desc: { en: 'Get practical do’s and don’ts, important deadlines, and free legal aid numbers.', ur: 'فوری کرنے والے کام، عدالتی آخری تاریخیں اور مفت حکومتی وکیلوں کے نمبر حاصل کریں۔' },

  // Categories
  cat_tenancy_title: { en: 'Rent & Eviction', ur: 'کرایہ داری اور مکان خالی کروانا' },
  cat_tenancy_desc: { en: 'Landlord threatening to evict? Rent default? Know tenant protection rules.', ur: 'کیا مالک مکان بغیر نوٹس کے مکان خالی کروانا چاہتا ہے؟ کرایہ دار کے حقوق جانیں۔' },
  cat_family_title: { en: 'Khula, Talaq & Family', ur: 'خلع، طلاق اور نان و نفقہ' },
  cat_family_desc: { en: 'Wife’s right to Khula, child custody, maintenance expenses, and Haq Mehr.', ur: 'بیوی کا حقِ خلع، بچوں کا ماہانہ خرچہ (نفقہ)، مہر اور بچوں کی تحویل کے آسان اصول۔' },
  cat_criminal_title: { en: 'Police, FIR & Bail', ur: 'تھانہ، ایف آئی آر اور ضمانت' },
  cat_criminal_desc: { en: 'Police arrest rules, 24-hour magistrate limit, bail under 497 CrPC.', ur: 'پولیس گرفتاری کے 24 گھنٹے کے اصول، تھانے میں ایف آئی آر کا اندراج اور ضمانت۔' },
  cat_property_title: { en: 'Property & Stamp Papers', ur: 'جائیداد، رجسٹری اور اسٹامپ پیپر' },
  cat_property_desc: { en: 'Power of attorney risks, land fraud, staying orders (Order 39).', ur: 'مختار نامہ عام کے خطرات، جعلی رجسٹری اور عدالت سے اسٹے آرڈر کے اصول۔' },
  cat_cheque_title: { en: 'Cheque Bounce (489-F)', ur: 'چیک باؤنس اور لین دین' },
  cat_cheque_desc: { en: 'Bounced cheque FIR conditions, defence proof, and settlement rights.', ur: 'چیک ڈس آنر ہونے پر ایف آئی آر 489-F کے اصول اور قانونی دفاع۔' },
  cat_cyber_title: { en: 'Online Harassment (PECA)', ur: 'موبائل اور انٹرنیٹ پر ہراسانی' },
  cat_cyber_desc: { en: 'Blackmailing, fake accounts, FIA Cyber Wing helpline & FIR process.', ur: 'بلیک میلنگ، واٹس ایپ یا فیس بک پر ہراسانی اور ایف آئی اے رپورٹنگ۔' },

  // Common Citizen Advice Boxes
  arrest_notice_title: {
    en: 'Important Police Arrest Rules in Pakistan (Article 10 of Constitution)',
    ur: 'پاکستان میں پولیس گرفتاری کے اہم ترین شہری حقوق (آئین کا آرٹیکل 10)'
  },
  arrest_notice_desc: {
    en: '1. Police CANNOT arrest without informing you of the reason. 2. You must be brought before a Magistrate within 24 hours. 3. Female citizens can only be arrested by female police officers. 4. You have the full right to speak to a lawyer immediately.',
    ur: '1۔ پولیس بغیر وجہ بتائے گرفتار نہیں کر سکتی۔ 2۔ گرفتاری کے بعد 24 گھنٹے کے اندر علاقہ مجسٹریٹ کے سامنے پیش کرنا قانوناً لازمی ہے۔ 3۔ خاتون شہری کو صرف لیڈی پولیس اہلکار ہی گرفتار کر سکتی ہے۔ 4۔ آپ کو فوری وکیل سے رابطہ کرنے کا پورا قانونی حق حاصل ہے۔'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('lexaid_lang');
    return saved === 'ur' ? 'ur' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('lexaid_lang', language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[language] || item.en;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isUrdu: language === 'ur',
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
