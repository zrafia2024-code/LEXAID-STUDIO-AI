import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Plus, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import CaseCard from "@/components/CaseCard";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Cases() {
  const { t, lang } = useI18n();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const list = await base44.entities.LegalCase.list("-created_date", 100);
      setCases(list || []);
    } catch (err) {
      console.warn("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await base44.entities.LegalCase.delete(id);
      setCases((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  const isUr = lang === "ur";

  const filteredCases = cases.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight text-foreground ${isUr ? "font-urdu text-3xl" : ""}`}>
            {t("history.title")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("history.subtitle")}</p>
        </div>

        <Button asChild size="sm" className="gap-2">
          <Link to="/assistant">
            <Plus className="h-4 w-4" />
            <span>{isUr ? "نیا مقدمہ درج کریں" : "New Analysis"}</span>
          </Link>
        </Button>
      </div>

      {/* Search Input */}
      {cases.length > 0 && (
        <div className="relative max-w-md">
          <Search
            className={`absolute ${
              isUr ? "right-3" : "left-3"
            } top-2.5 h-4 w-4 text-muted-foreground`}
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isUr ? "مقدمات میں تلاش کریں..." : "Filter saved cases..."}
            className={`${isUr ? "pr-9 pl-3 font-urdu" : "pl-9 pr-3"}`}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <Loader />
      ) : filteredCases.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center bg-white shadow-sm space-y-3">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className={`text-sm text-muted-foreground ${isUr ? "font-urdu" : ""}`}>
            {t("history.empty")}
          </p>
          <Button asChild size="sm" variant="outline" className="mt-2">
            <Link to="/assistant">{t("home.start")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((item) => (
            <CaseCard key={item.id} legalCase={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
