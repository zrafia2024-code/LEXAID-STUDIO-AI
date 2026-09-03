import React from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function QuestionForm({ questions = [], answers = {}, onChange, onSubmit, loading, onBack }) {
  const { t, lang } = useI18n();
  const isUr = lang === "ur";

  const handleSelect = (key, value) => {
    onChange({
      ...answers,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section outside cards */}
      <div className="pt-2">
        <h2 className={`text-xl font-bold text-slate-900 tracking-tight ${isUr ? "font-urdu text-2xl" : ""}`}>
          {isUr ? "تجزیے کو مزید واضح کرنے کے لیے چند سوالات" : "A few questions to sharpen the analysis"}
        </h2>
        <p className={`text-sm text-slate-500 mt-1 ${isUr ? "font-urdu text-base" : ""}`}>
          {isUr
            ? "اپنی پوزیشن کا جائزہ مزید درست اور مصدقہ بنانے کے لیے درج ذیل سوالات کے جوابات دیں۔"
            : "Answer these questions to sharpen your position strength assessment."}
        </p>
      </div>

      {/* Individual Question Cards */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const key = q.key || q.id || `q_${idx}`;
          const currentVal = answers[key];
          const questionText = isUr && q.urduQuestion ? q.urduQuestion : q.question || q.label;
          const rawWhy = isUr && q.urduWhy ? q.urduWhy : q.why;
          const cleanWhy = rawWhy ? rawWhy.replace(/^(Why this matters:\s*|یہ کیوں ضروری ہے:\s*)/i, "") : "";

          return (
            <Card
              key={key}
              className="rounded-xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* Question index number */}
                <span className="text-sm font-semibold text-slate-600 w-5 pt-0.5 shrink-0 select-none">
                  {idx + 1}
                </span>

                {/* Content */}
                <div className="space-y-2 flex-1 min-w-0">
                  <p className={`text-base font-semibold text-slate-900 leading-snug ${isUr ? "font-urdu text-lg" : ""}`}>
                    {questionText}
                  </p>

                  {cleanWhy && (
                    <div className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed pt-0.5">
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className={isUr ? "font-urdu" : ""}>{cleanWhy}</span>
                    </div>
                  )}

                  {/* Options / Action Buttons */}
                  <div className="flex flex-wrap gap-2.5 pt-3">
                    {q.type === "yesno" || !q.type ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSelect(key, "yes")}
                          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all border ${
                            currentVal === "yes"
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm"
                              : "bg-[#131B2C] text-slate-200 border-slate-700/80 hover:bg-[#1E293B]"
                          } ${isUr ? "font-urdu min-w-[70px]" : "min-w-[65px]"}`}
                        >
                          {isUr ? "ہاں" : "Yes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelect(key, "no")}
                          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all border ${
                            currentVal === "no"
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm"
                              : "bg-[#131B2C] text-slate-200 border-slate-700/80 hover:bg-[#1E293B]"
                          } ${isUr ? "font-urdu min-w-[70px]" : "min-w-[65px]"}`}
                        >
                          {isUr ? "نہیں" : "No"}
                        </button>
                      </>
                    ) : q.options ? (
                      q.options.map((opt) => {
                        const optVal = typeof opt === "string" ? opt : opt.value;
                        let optLabel = optVal;
                        if (typeof opt === "object") {
                          optLabel = isUr && opt.urduLabel ? opt.urduLabel : opt.label;
                        } else {
                          if (optVal === "granted") optLabel = isUr ? "منظور شدہ" : "Granted";
                          else if (optVal === "denied") optLabel = isUr ? "مسترد شدہ" : "Denied";
                          else if (optVal === "not_applied") optLabel = isUr ? "درخواست نہیں دی" : "Not applied";
                        }
                        const isSelected = currentVal === optVal;
                        return (
                          <button
                            key={optVal}
                            type="button"
                            onClick={() => handleSelect(key, optVal)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all border ${
                              isSelected
                                ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm"
                                : "bg-[#131B2C] text-slate-200 border-slate-700/80 hover:bg-[#1E293B]"
                            } ${isUr ? "font-urdu" : ""}`}
                          >
                            {optLabel}
                          </button>
                        );
                      })
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer Navigation Matching Base44 */}
      <div className="flex items-center justify-between pt-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className={`text-sm font-medium text-slate-700 hover:text-slate-900 transition px-2 py-2 ${
              isUr ? "font-urdu" : ""
            }`}
          >
            {isUr ? "واپس" : "Back"}
          </button>
        )}
        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className={`bg-[#131f37] hover:bg-[#1c2c4c] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm ml-auto ${
            isUr ? "font-urdu" : ""
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>
            {loading
              ? isUr
                ? "جائزہ لیا جا رہا ہے..."
                : "Assessing..."
              : isUr
              ? "ابتدائی قانونی جائزہ حاصل کریں"
              : "Get preliminary assessment"}
          </span>
        </Button>
      </div>
    </div>
  );
}
