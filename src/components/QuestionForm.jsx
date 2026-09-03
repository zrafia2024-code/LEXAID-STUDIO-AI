import React from "react";
import { HelpCircle, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function QuestionForm({ questions = [], answers = {}, onChange, onSubmit, loading, onBack }) {
  const { t, lang } = useI18n();

  const handleSelect = (key, value) => {
    onChange({
      ...answers,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className={`text-xl font-bold ${lang === "ur" ? "font-urdu" : ""}`}>
          {t("assistant.questions")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {lang === "ur"
            ? "ان سوالات کے جوابات سے آپ کی پوزیشن کا درست اور قطعی جائزہ ممکن ہوتا ہے۔"
            : "Answer these questions to sharpen your position strength assessment."}
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const currentVal = answers[q.key];
          const isUr = lang === "ur";
          const questionText = isUr && q.urduQuestion ? q.urduQuestion : q.question || q.label;
          const whyText = isUr && q.urduWhy ? q.urduWhy : q.why;

          return (
            <Card key={q.key || idx} className="p-5">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <p className={`text-sm font-semibold leading-relaxed ${isUr ? "font-urdu" : ""}`}>
                      {questionText}
                    </p>
                    {whyText && (
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        <span className={isUr ? "font-urdu" : ""}>{whyText}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 pl-9">
                  {q.type === "yesno" || !q.type ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant={currentVal === "yes" ? "default" : "outline"}
                        onClick={() => handleSelect(q.key, "yes")}
                        className={isUr ? "font-urdu min-w-[70px]" : "min-w-[70px]"}
                      >
                        {t("assistant.yes")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={currentVal === "no" ? "default" : "outline"}
                        onClick={() => handleSelect(q.key, "no")}
                        className={isUr ? "font-urdu min-w-[70px]" : "min-w-[70px]"}
                      >
                        {t("assistant.no")}
                      </Button>
                    </>
                  ) : q.options ? (
                    q.options.map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant={currentVal === opt.value ? "default" : "outline"}
                        onClick={() => handleSelect(q.key, opt.value)}
                        className={isUr ? "font-urdu" : ""}
                      >
                        {isUr && opt.urduLabel ? opt.urduLabel : opt.label}
                      </Button>
                    ))
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
            {t("assistant.back")}
          </Button>
        )}
        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="ml-auto gap-2"
        >
          <span>{loading ? t("assistant.assessing") : t("assistant.assess")}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
