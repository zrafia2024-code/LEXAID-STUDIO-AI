import React from "react";
import { Link } from "react-router-dom";
import { Trash2, ChevronRight, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CaseCard({ legalCase, onDelete }) {
  const { t, lang } = useI18n();

  let assessment = null;
  try {
    if (legalCase.assessment) {
      assessment =
        typeof legalCase.assessment === "string"
          ? JSON.parse(legalCase.assessment)
          : legalCase.assessment;
    }
  } catch {}

  const categoryKey = legalCase.category || "other";
  const categoryLabel = t(`categories.${categoryKey}`) || categoryKey;

  const statusLabel =
    t(`history.status.${legalCase.status}`) || legalCase.status || "Assessed";

  const dateStr = legalCase.created_date
    ? new Date(legalCase.created_date).toLocaleDateString(
        lang === "ur" ? "ur-PK" : "en-PK",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      )
    : "";

  return (
    <div className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs capitalize">
            {categoryLabel}
          </Badge>
          <Badge
            variant={
              legalCase.status === "reassessed"
                ? "secondary"
                : legalCase.status === "assessed"
                ? "default"
                : "outline"
            }
            className="text-xs"
          >
            {statusLabel}
          </Badge>
          {dateStr && (
            <span className="text-xs text-muted-foreground">{dateStr}</span>
          )}
        </div>

        <h3 className="text-base font-semibold leading-snug">
          {legalCase.title || t("home.recent")}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {legalCase.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 sm:mt-0 sm:justify-end">
        {assessment?.score !== undefined && (
          <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-3 py-1.5 text-center">
            <span className="text-xs text-muted-foreground">{t("assessment.score")}</span>
            <span className="text-lg font-bold text-primary">
              {assessment.score}
              <span className="text-xs font-normal text-muted-foreground">/100</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(legalCase.id)}
              aria-label={t("common.delete")}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          )}

          <Button asChild size="sm" variant="outline">
            <Link to={`/cases/${legalCase.id}`} className="gap-1">
              <span>{t("history.open")}</span>
              <ChevronRight className={`h-3.5 w-3.5 ${lang === "ur" ? "rotate-180" : ""}`} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
