import React, { useState, useEffect } from "react";
import { BookOpen, Search, Filter, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Library() {
  const { t, lang } = useI18n();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: "all", labelKey: "similar.all" },
    { value: "constitutional", labelKey: "categories.constitutional" },
    { value: "harassment", labelKey: "categories.harassment" },
    { value: "tenancy", labelKey: "categories.tenancy" },
    { value: "family", labelKey: "categories.family" },
    { value: "criminal", labelKey: "categories.criminal" },
    { value: "property", labelKey: "categories.property" },
    { value: "consumer", labelKey: "categories.consumer" },
    { value: "employment", labelKey: "categories.employment" },
    { value: "contract", labelKey: "categories.contract" },
  ];

  useEffect(() => {
    executeSearch();
  }, [category]);

  const executeSearch = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await base44.functions.invoke("searchPrecedents", {
        query: query.trim(),
        category: category === "all" ? "" : category,
        limit: 30,
      });
      setResults(res.data?.results || []);
    } catch (err) {
      console.warn("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isUr = lang === "ur";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight text-foreground ${isUr ? "font-urdu text-3xl" : ""}`}>
              {t("similar.title")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("similar.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm">
        <form onSubmit={executeSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search
              className={`absolute ${
                isUr ? "right-3" : "left-3"
              } top-2.5 h-4 w-4 text-muted-foreground`}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("similar.search")}
              className={`${isUr ? "pr-9 pl-3 font-urdu" : "pl-9 pr-3"}`}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={isUr ? "font-urdu" : ""}>
                <SelectValue placeholder={t("similar.filter")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value} className={isUr ? "font-urdu" : ""}>
                    {t(c.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full sm:w-auto min-w-[100px]">
            {t("similar.searchBtn")}
          </Button>
        </form>
      </Card>

      {/* Results */}
      {loading ? (
        <Loader />
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center bg-white shadow-sm space-y-2">
          <p className={`text-sm text-muted-foreground ${isUr ? "font-urdu" : ""}`}>
            {t("similar.noResults")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1">
          {results.map((item, idx) => {
            const catKey = item.category || "other";
            const catLabel = t(`categories.${catKey}`) || catKey;

            return (
              <Card key={item.id || idx} className="p-5 space-y-3 hover:border-slate-300 transition">
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

                  {item.score !== undefined && item.score > 0 && query && (
                    <span className="text-xs text-muted-foreground">
                      {t("similar.relevance")}: <strong className="text-primary">{item.score}</strong>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className={`text-base font-bold text-foreground ${isUr ? "font-urdu text-lg" : ""}`}>
                    {isUr && item.titleUr ? item.titleUr : item.title}
                  </h3>
                  {item.citation && (
                    <p className="text-xs font-mono text-muted-foreground mt-0.5" dir="ltr">
                      {item.citation}
                    </p>
                  )}
                </div>

                <p className={`text-xs leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 ${isUr ? "font-urdu text-sm leading-relaxed" : ""}`}>
                  {isUr && item.summaryUr ? item.summaryUr : (item.excerpt || item.summary)}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    {item.court && (
                      <span>
                        {t("common.court")}: <strong>{isUr && item.court === "Statute" ? "پاکستانی قانون / آئین" : item.court}</strong>
                      </span>
                    )}
                    {item.date && (
                      <span>
                        {t("common.date")}: <strong>{item.date}</strong>
                      </span>
                    )}
                  </div>
                  {item.caseId && (
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700" dir="ltr">
                      {item.caseId}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
