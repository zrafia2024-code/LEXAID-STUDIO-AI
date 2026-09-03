import React from "react";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Disclaimer() {
  const { t, lang } = useI18n();
  const isUr = lang === "ur";
  return (
    <div
      role="note"
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-[#120E08] px-4 py-3.5 text-sm shadow-sm"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
      <p className={`leading-relaxed text-slate-200 ${isUr ? "font-urdu text-base" : ""}`}>
        <strong className="font-semibold text-white">
          {isUr ? "قانونی انتباہ: " : "Legal Disclaimer: "}
        </strong>
        {t("disclaimer")}
      </p>
    </div>
  );
}
