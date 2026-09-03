import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Scale, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import CaseCard from "@/components/CaseCard";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { t, lang } = useI18n();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentCases();
  }, []);

  const loadRecentCases = async () => {
    try {
      setLoading(true);
      const list = await base44.entities.LegalCase.list("-created_date", 5);
      setCases(list || []);
    } catch (err) {
      console.warn("Failed to load recent cases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (id) => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await base44.entities.LegalCase.delete(id);
      setCases((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.warn("Failed to delete case:", err);
    }
  };

  const isUr = lang === "ur";
  const steps = [
    t("home.steps.0"),
    t("home.steps.1"),
    t("home.steps.2"),
    t("home.steps.3"),
    t("home.steps.4"),
  ];

  return (
    <div className="space-y-10">
      {/* Dark Navy Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-[#121926] p-8 text-white shadow-xl md:p-12">
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-amber-400 backdrop-blur-sm">
            <Scale className="h-4 w-4" />
            <span>LEXAID</span>
          </div>

          <h1 className={`text-2xl font-bold leading-tight sm:text-3xl md:text-4xl text-white ${isUr ? "font-urdu text-3xl md:text-4xl leading-relaxed" : ""}`}>
            {t("home.hero")}
          </h1>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-2 shadow-lg"
            >
              <Link to="/assistant">
                <Sparkles className="h-4 w-4" />
                <span>{t("home.start")}</span>
                <ArrowRight className={`h-4 w-4 ${isUr ? "rotate-180" : ""}`} />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 bg-white/5 text-white hover:bg-white/15 backdrop-blur-sm gap-2"
            >
              <Link to="/library">
                <BookOpen className="h-4 w-4" />
                <span>{t("home.browse")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* How LEXAID Works Section (5 Numbered Cards) */}
      <section className="space-y-4">
        <h2 className={`text-xl font-bold tracking-tight text-foreground ${isUr ? "font-urdu text-2xl" : ""}`}>
          {t("home.howTitle")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((stepText, idx) => (
            <Card
              key={idx}
              className="relative flex flex-col justify-between overflow-hidden p-5 border-slate-200/80 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="space-y-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-700">
                  {idx + 1}
                </span>
                <p className={`text-xs leading-relaxed text-slate-700 font-medium ${isUr ? "font-urdu text-sm" : ""}`}>
                  {stepText}
                </p>
              </div>
              <div
                className={`absolute ${
                  isUr ? "left-3" : "right-3"
                } top-2 text-4xl font-black text-slate-100 pointer-events-none select-none`}
              >
                {idx + 1}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Cases Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold tracking-tight text-foreground ${isUr ? "font-urdu text-2xl" : ""}`}>
            {t("home.recent")}
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/cases" className="gap-1">
              <span>{t("nav.cases")}</span>
              <ArrowRight className={`h-4 w-4 ${isUr ? "rotate-180" : ""}`} />
            </Link>
          </Button>
        </div>

        {loading ? (
          <Loader />
        ) : cases.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground bg-white">
            <p className={isUr ? "font-urdu" : ""}>{t("home.noRecent")}</p>
            <Button asChild size="sm" className="mt-4" variant="outline">
              <Link to="/assistant">{t("home.start")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => (
              <CaseCard key={c.id} legalCase={c} onDelete={handleDeleteCase} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
