import React from "react";
import { BookOpen, ShieldCheck, Scale, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function EvidencePanel({ references = [] }) {
  const { t, lang } = useI18n();

  if (!references || references.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t("assessment.noEvidence")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-accent" />
        <h3 className={`text-base font-semibold ${lang === "ur" ? "font-urdu" : ""}`}>
          {t("assessment.evidence")} ({references.length})
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        {references.map((item, idx) => {
          const catKey = item.category || "other";
          const catLabel = t(`categories.${catKey}`) || catKey;

          return (
            <Card key={item.id || idx} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.sourceType === "statute" ? t("similar.statute") : t("similar.case")}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {catLabel}
                  </Badge>
                  {item.isSample && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                      {t("similar.sample")}
                    </Badge>
                  )}
                </div>

                {item.score !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {t("similar.relevance")}: <strong className="text-primary">{item.score}</strong>
                  </span>
                )}
              </div>

              <div>
                <h4 className={`text-sm font-semibold text-foreground ${lang === "ur" ? "font-urdu text-base" : ""}`}>
                  {lang === "ur" && item.titleUr ? item.titleUr : item.title}
                </h4>
                {item.citation && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5" dir="ltr">
                    {item.citation}
                  </p>
                )}
              </div>

              {(item.summaryUr || item.excerpt || item.summary) && (
                <p className={`text-xs leading-relaxed text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/50 ${lang === "ur" ? "font-urdu text-sm" : ""}`}>
                  "{lang === "ur" && item.summaryUr ? item.summaryUr : item.excerpt || item.summary}"
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                <div className="flex items-center gap-3">
                  {item.court && (
                    <span>
                      {t("common.court")}: <strong>{lang === "ur" && item.court === "Statute" ? "پاکستانی قانون / آئین" : item.court}</strong>
                    </span>
                  )}
                  {item.date && (
                    <span>
                      {t("common.date")}: <strong>{item.date}</strong>
                    </span>
                  )}
                </div>
                {item.caseId && (
                  <span className="font-mono text-[10px]" dir="ltr">{item.caseId}</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
