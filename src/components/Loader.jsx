import React from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Loader({ label }) {
  const { t, lang } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
      <span className={`text-sm ${lang === "ur" ? "font-urdu" : ""}`}>
        {label || t("common.loading")}
      </span>
    </div>
  );
}
