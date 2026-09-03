import React from "react";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Disclaimer() {
  const { t, lang } = useI18n();
  return (
    <div
      role="note"
      className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <p className={lang === "ur" ? "font-urdu leading-relaxed" : "leading-relaxed"}>{t("disclaimer")}</p>
    </div>
  );
}
