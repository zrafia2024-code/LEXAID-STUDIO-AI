import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useI18n();

  if (compact) {
    return (
      <div className="inline-flex items-center rounded-md border bg-card p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
            lang === "en"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLang("ur")}
          className={`rounded px-2.5 py-1 text-xs font-semibold transition font-urdu ${
            lang === "ur"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          اردو
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Button
        type="button"
        variant={lang === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => setLang("en")}
      >
        English
      </Button>
      <Button
        type="button"
        variant={lang === "ur" ? "default" : "outline"}
        size="sm"
        onClick={() => setLang("ur")}
        className="font-urdu"
      >
        اردو
      </Button>
    </div>
  );
}
