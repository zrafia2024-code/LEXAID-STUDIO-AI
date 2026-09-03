import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useI18n();

  if (compact) {
    return (
      <div className="inline-flex items-center rounded-xl border border-slate-800/90 bg-[#060B14] p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            lang === "en"
              ? "bg-[#1E293B] text-amber-400 shadow-sm border border-slate-700/60"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLang("ur")}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition font-urdu ${
            lang === "ur"
              ? "bg-[#1E293B] text-amber-400 shadow-sm border border-slate-700/60"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          اردو
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-slate-400" />
      <Button
        type="button"
        variant={lang === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => setLang("en")}
        className={lang === "en" ? "bg-amber-500 text-slate-950 font-bold" : "border-slate-700 bg-slate-900 text-slate-200"}
      >
        English
      </Button>
      <Button
        type="button"
        variant={lang === "ur" ? "default" : "outline"}
        size="sm"
        onClick={() => setLang("ur")}
        className={`font-urdu ${lang === "ur" ? "bg-amber-500 text-slate-950 font-bold" : "border-slate-700 bg-slate-900 text-slate-200"}`}
      >
        اردو
      </Button>
    </div>
  );
}
