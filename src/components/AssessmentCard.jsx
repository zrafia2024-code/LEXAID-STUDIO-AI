import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Scale,
  RefreshCw,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import VoiceInput from "@/components/VoiceInput";

export default function AssessmentCard({
  assessment,
  caseId,
  onReassess,
  reassessing,
  onSave,
  saved,
}) {
  const { t, lang } = useI18n();
  const [showReasoning, setShowReasoning] = useState(false);
  const [reassessNote, setReassessNote] = useState("");
  const [showReassessBox, setShowReassessBox] = useState(false);

  if (!assessment) return null;

  const isUr = lang === "ur";
  const score = assessment.score ?? 0;
  const levelText = isUr && assessment.urduLevel ? assessment.urduLevel : assessment.level;
  const explanation = isUr && assessment.explanation_ur ? assessment.explanation_ur : assessment.explanation_en;
  const nextSteps = isUr && assessment.nextSteps_ur ? assessment.nextSteps_ur : assessment.nextSteps_en || [];

  const handleReassessSubmit = () => {
    if (!reassessNote.trim() || !onReassess) return;
    onReassess(reassessNote.trim());
    setReassessNote("");
    setShowReassessBox(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Score & Level */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            {/* Score Ring */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/10">
              <div className="text-center">
                <span className="text-2xl font-black text-primary leading-none">
                  {score}
                </span>
                <span className="block text-[10px] text-muted-foreground font-medium">
                  /100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {t("assessment.level")}
              </span>
              <h2 className={`text-xl font-bold leading-tight ${isUr ? "font-urdu text-2xl" : ""}`}>
                {levelText}
              </h2>
              {assessment.confidence !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {t("assessment.confidence")}: <strong>{assessment.confidence}%</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSave && (
              <Button
                type="button"
                variant={saved ? "secondary" : "outline"}
                size="sm"
                onClick={onSave}
                disabled={saved}
                className="gap-1.5"
              >
                <Bookmark className="h-4 w-4" />
                <span>{saved ? t("assessment.saved") : t("assessment.saveCase")}</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReassessBox(!showReassessBox)}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${reassessing ? "animate-spin" : ""}`} />
              <span>{t("assessment.reassess")}</span>
            </Button>
          </div>
        </div>

        {/* What Changed Banner (if reassessed) */}
        {assessment.whatChanged && (
          <div className="mt-4 rounded-md border border-accent/40 bg-accent/10 p-3 text-xs text-foreground">
            <strong>{t("assessment.reassessNote")}:</strong> {assessment.whatChanged}
          </div>
        )}
      </Card>

      {/* Reassess Input Area */}
      {showReassessBox && (
        <Card className="p-4 space-y-3 border-accent/40 bg-accent/5">
          <h4 className={`text-sm font-semibold ${isUr ? "font-urdu" : ""}`}>
            {t("assessment.reassess")}
          </h4>
          <Textarea
            value={reassessNote}
            onChange={(e) => setReassessNote(e.target.value)}
            placeholder={t("assessment.reassessPlaceholder")}
            rows={3}
            className={isUr ? "font-urdu" : ""}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <VoiceInput
              onTranscript={(txt) => setReassessNote((prev) => (prev ? `${prev} ${txt}` : txt))}
              disabled={reassessing}
            />
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowReassessBox(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleReassessSubmit}
                disabled={reassessing || !reassessNote.trim()}
                className="gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reassessing ? "animate-spin" : ""}`} />
                <span>{t("assessment.reassessSubmit")}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Plain Language Explanation */}
      {explanation && (
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className={`text-base ${isUr ? "font-urdu text-lg" : ""}`}>
              {t("assessment.explanation")}
            </h3>
          </div>
          <p className={`text-sm leading-relaxed text-foreground/90 ${isUr ? "font-urdu text-base leading-loose" : ""}`}>
            {explanation}
          </p>
          <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            {t("assessment.aiNote")}
          </p>
        </Card>
      )}

      {/* Supporting & Limiting Factors Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Supporting Factors */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <h4 className={`text-sm font-semibold ${isUr ? "font-urdu" : ""}`}>
              {t("assessment.supporting")} ({assessment.supporting?.length || 0})
            </h4>
          </div>
          {assessment.supporting && assessment.supporting.length > 0 ? (
            <ul className="space-y-2">
              {assessment.supporting.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className={isUr ? "font-urdu" : ""}>
                    {isUr && f.urduLabel ? f.urduLabel : f.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {isUr ? "کوئی واضح حامی عامل نہیں ملا" : "None identified"}
            </p>
          )}
        </Card>

        {/* Limiting Factors */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <h4 className={`text-sm font-semibold ${isUr ? "font-urdu" : ""}`}>
              {t("assessment.limiting")} ({assessment.limiting?.length || 0})
            </h4>
          </div>
          {assessment.limiting && assessment.limiting.length > 0 ? (
            <ul className="space-y-2">
              {assessment.limiting.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className={isUr ? "font-urdu" : ""}>
                    {isUr && f.urduLabel ? f.urduLabel : f.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {isUr ? "کوئی روکنے والا عامل نہیں ملا" : "None identified"}
            </p>
          )}
        </Card>
      </div>

      {/* What To Do Next */}
      {nextSteps && nextSteps.length > 0 && (
        <Card className="p-5 space-y-3">
          <h4 className={`text-sm font-semibold ${isUr ? "font-urdu text-base" : ""}`}>
            {t("assessment.nextSteps")}
          </h4>
          <ol className="space-y-2.5">
            {nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-foreground/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                  {idx + 1}
                </span>
                <span className={isUr ? "font-urdu text-sm" : ""}>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Reasoning Steps Details (Collapsible) */}
      {(assessment.steps || assessment.urduSteps) && (
        <div className="pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
          >
            <span>{t("assessment.reasoning")}</span>
            {showReasoning ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showReasoning && (
            <Card className="mt-2 p-4 text-xs font-mono bg-muted/40 space-y-1.5 border-dashed">
              {(isUr && assessment.urduSteps ? assessment.urduSteps : assessment.steps || []).map((s, i) => (
                <div key={i} className="text-muted-foreground">
                  {s}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
