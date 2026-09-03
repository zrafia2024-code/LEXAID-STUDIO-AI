import React, { useState, useEffect } from "react";
import { Sparkles, Send, ArrowRight, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import VoiceInput from "@/components/VoiceInput";
import QuestionForm from "@/components/QuestionForm";
import AssessmentCard from "@/components/AssessmentCard";
import EvidencePanel from "@/components/EvidencePanel";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Assistant() {
  const { t, lang } = useI18n();

  const [step, setStep] = useState("input"); // 'input' | 'questions' | 'assessment'
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [reassessing, setReassessing] = useState(false);

  const [understanding, setUnderstanding] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const [assessment, setAssessment] = useState(null);
  const [references, setReferences] = useState([]);
  const [caseId, setCaseId] = useState(null);
  const [saved, setSaved] = useState(false);

  const isUr = lang === "ur";

  const handleVoiceTranscript = (text) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    setDescription((prev) => {
      if (!prev || !prev.trim()) return cleanText;
      if (prev.trim().endsWith(cleanText)) return prev;
      return `${prev.trim()} ${cleanText}`;
    });
  };

  // Step 1 -> Step 2: Analyze user description
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!description.trim()) return;

    try {
      setAnalyzing(true);
      const res = await base44.functions.invoke("analyzeCase", {
        description: description.trim(),
        language: lang,
      });

      const { understanding: u, questions: q } = res.data;
      setUnderstanding(u);
      setQuestions(q || []);
      setAnswers({});
      setStep("questions");
    } catch (err) {
      console.warn("Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 2 -> Step 3: Run assessment with questions answered
  const handleAssess = async () => {
    try {
      setAssessing(true);
      const res = await base44.functions.invoke("assessCase", {
        category: understanding?.category || "other",
        answers,
        language: lang,
        description: description.trim(),
        caseId: null,
      });

      const { assessment: a, references: r, caseId: cid } = res.data;
      setAssessment(a);
      setReferences(r || []);
      setCaseId(cid);
      setSaved(true);
      setStep("assessment");
    } catch (err) {
      console.warn("Assessment error:", err);
    } finally {
      setAssessing(false);
    }
  };

  // Reassess with new information
  const handleReassess = async (note) => {
    try {
      setReassessing(true);
      const res = await base44.functions.invoke("assessCase", {
        category: understanding?.category || "other",
        answers,
        language: lang,
        description: `${description}\n\n[Update]: ${note}`,
        caseId,
        reassessNote: note,
      });

      const { assessment: a, references: r } = res.data;
      setAssessment(a);
      setReferences(r || []);
    } catch (err) {
      console.warn("Reassessment error:", err);
    } finally {
      setReassessing(false);
    }
  };

  const handleReset = () => {
    setStep("input");
    setDescription("");
    setUnderstanding(null);
    setQuestions([]);
    setAnswers({});
    setAssessment(null);
    setReferences([]);
    setCaseId(null);
    setSaved(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight text-foreground ${isUr ? "font-urdu text-3xl" : ""}`}>
              {t("assistant.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {lang === "ur"
                ? "پاکستانی آئین اور قوانین کے تحت آپ کے مسئلے کا خودکار تجزیہ"
                : "Evidence-backed preliminary legal decision support for Pakistan"}
            </p>
          </div>
        </div>

        {step !== "input" && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isUr ? "نیا تجزیہ شروع کریں" : "Start over"}</span>
          </Button>
        )}
      </div>

      {/* STEP 1: Description Input */}
      {step === "input" && (
        <Card className="p-6 space-y-5 bg-white shadow-sm border-slate-200">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="space-y-2">
              <label className={`text-sm font-semibold text-foreground ${isUr ? "font-urdu" : ""}`}>
                {isUr ? "اپنا قانونی مسئلہ بیان کریں:" : "Describe your legal issue:"}
              </label>
              <Textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("assistant.placeholder")}
                className={`text-sm leading-relaxed p-4 resize-y ${isUr ? "font-urdu text-base" : ""}`}
                disabled={analyzing}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                disabled={analyzing}
              />

              <Button
                type="submit"
                size="lg"
                disabled={analyzing || !description.trim()}
                className="bg-primary text-primary-foreground gap-2 min-w-[140px]"
              >
                {analyzing ? (
                  <>
                    <Loader label={t("assistant.analyzing")} />
                  </>
                ) : (
                  <>
                    <span>{t("assistant.submit")}</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Quick suggestions */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-muted-foreground block mb-2">
              {isUr ? "عام مسائل کی مثالیں:" : "Common scenarios to try:"}
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  en: "My landlord wants to evict me even though I have a written lease and paid rent.",
                  ur: "میرا مالک مکان مجھے بے دخل کرنا چاہتا ہے جبکہ میرے پاس تحریری کرایہ نامہ ہے اور کرایہ ادا کر دیا ہے۔",
                },
                {
                  en: "I bought a mobile phone with a warranty and the shop refused to fix it.",
                  ur: "میں نے وارنٹی والا موبائل خریدا تھا اور دکاندار ٹھیک کرنے سے انکار کر رہا ہے۔",
                },
                {
                  en: "My employer terminated my contract without 30 days notice or gratuity.",
                  ur: "میرے ادارے نے بغیر 30 دن کے نوٹس یا گریجویٹی کے مجھے ملازمت سے فارغ کر دیا۔",
                },
              ].map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDescription(isUr ? ex.ur : ex.en)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition text-left"
                >
                  <span className={isUr ? "font-urdu" : ""}>{isUr ? ex.ur : ex.en}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: Understanding & Questions */}
      {step === "questions" && understanding && (
        <div className="space-y-6">
          {/* What LEXAID Understood Card */}
          <Card className="p-6 space-y-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold text-foreground ${isUr ? "font-urdu text-lg" : ""}`}>
                {t("assistant.understanding")}
              </h3>
              <Badge variant="default" className="text-xs capitalize">
                {t(`categories.${understanding.category}`) || understanding.category}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {/* Issues identified */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  {t("assistant.issues")}
                </span>
                <ul className="space-y-1 text-xs">
                  {understanding.issues?.map((iss, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span className={isUr ? "font-urdu" : ""}>{iss}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing information */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  {t("assistant.missing")}
                </span>
                <ul className="space-y-1 text-xs">
                  {understanding.missingInfo?.map((info, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <span className={isUr ? "font-urdu" : ""}>{info}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Questions Form */}
          <QuestionForm
            questions={questions}
            answers={answers}
            onChange={setAnswers}
            onSubmit={handleAssess}
            loading={assessing}
            onBack={() => setStep("input")}
          />
        </div>
      )}

      {/* STEP 3: Assessment & Evidence */}
      {step === "assessment" && assessment && (
        <div className="space-y-8">
          <AssessmentCard
            assessment={assessment}
            caseId={caseId}
            onReassess={handleReassess}
            reassessing={reassessing}
            onSave={() => setSaved(true)}
            saved={saved}
          />

          <EvidencePanel references={references} />

          <div className="pt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              <span>{isUr ? "ایک اور تجزیہ شروع کریں" : "Start another analysis"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
