import React, { useState, useEffect } from "react";
import { FileText, Upload, CheckCircle2, AlertTriangle, Calendar, HelpCircle, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Documents() {
  const { t, lang } = useI18n();

  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [linkedCaseId, setLinkedCaseId] = useState("none");

  useEffect(() => {
    loadDocs();
    loadCases();
  }, []);

  const loadDocs = async () => {
    try {
      const list = await base44.entities.LegalDocument.list("-created_date", 20);
      setDocuments(list || []);
    } catch (err) {
      console.warn("Load docs error:", err);
    }
  };

  const loadCases = async () => {
    try {
      const list = await base44.entities.LegalCase.list("-created_date", 20);
      setCases(list || []);
    } catch (err) {
      console.warn("Load cases error:", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setAnalyzing(true);

      let fileContent = "";
      let fileDataUrl = "";

      try {
        if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
          fileContent = await file.text();
        } else {
          fileDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          });
        }
      } catch (readErr) {
        console.warn("File read error:", readErr);
      }

      const res = await base44.functions.invoke("simplifyDocument", {
        fileName: file.name,
        fileContent,
        fileDataUrl,
        language: lang,
      });

      const resAnalysis = res.data?.analysis;
      setAnalysis(resAnalysis);

      // Save document record
      const newDoc = await base44.entities.LegalDocument.create({
        name: file.name,
        type: file.type || "application/pdf",
        summary: resAnalysis.simpleExplanation,
        analysis: JSON.stringify(resAnalysis),
        case_id: linkedCaseId !== "none" ? linkedCaseId : null,
      });

      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err) {
      console.warn("Analyze document error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectPastDoc = (doc) => {
    try {
      if (doc.analysis) {
        const parsed = typeof doc.analysis === "string" ? JSON.parse(doc.analysis) : doc.analysis;
        setAnalysis(parsed);
      }
    } catch (e) {
      console.warn("Parse past doc analysis error:", e);
    }
  };

  const isUr = lang === "ur";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight text-foreground ${isUr ? "font-urdu text-3xl" : ""}`}>
              {t("documents.title")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("documents.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-5">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 hover:bg-slate-50/50 transition cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="h-8 w-8 text-amber-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              {file ? file.name : t("documents.upload")}
            </p>
            <span className="text-xs text-muted-foreground mt-1">
              {isUr ? "پی ڈی ایف، تصاویر یا ٹیکسٹ فائلز (10MB تک)" : "Supports PDF, PNG, JPG, TXT (up to 10MB)"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="w-full sm:w-72">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {t("documents.linkCase")}
              </label>
              <Select value={linkedCaseId} onValueChange={setLinkedCaseId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={t("documents.none")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("documents.none")}</SelectItem>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title ? c.title.slice(0, 30) : c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={!file || analyzing}
              className={`w-full sm:w-auto min-w-[160px] gap-2 transition-colors ${
                analyzing
                  ? "bg-[#381F05] hover:bg-[#381F05] text-amber-500 border border-amber-600/30 disabled:opacity-100 cursor-wait shadow-sm"
                  : ""
              }`}
            >
              {analyzing ? (
                <span className="inline-flex items-center gap-2 text-amber-500 font-semibold">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className={isUr ? "font-urdu" : ""}>{t("documents.analyzing")}</span>
                </span>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>{t("documents.title")}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Analysis Result */}
      {analysis && (
        <Card className="p-6 space-y-6 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className={`text-xs uppercase font-bold text-muted-foreground ${isUr ? "font-urdu" : ""}`}>
                {t("documents.appears")}
              </span>
              <h2 className={`text-xl font-bold text-foreground ${isUr ? "font-urdu text-2xl" : ""}`}>
                {analysis.documentType}
              </h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {isUr ? "تجزیہ شدہ" : "Analyzed"}
            </Badge>
          </div>

          {/* Simple explanation */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-primary">
                {t("documents.simple")}
              </h3>
              <p className={`text-xs text-muted-foreground ${isUr ? "font-urdu" : ""}`}>
                {t("documents.simpleSubtitle")}
              </p>
            </div>
            <p className={`text-sm leading-relaxed text-slate-700 ${isUr ? "font-urdu" : ""}`}>
              {analysis.simpleExplanation}
            </p>
          </div>

          {/* Points & Dates Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{t("documents.points")}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {analysis.importantPoints?.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span className={isUr ? "font-urdu" : ""}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>{t("documents.dates")}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {analysis.importantDates?.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span className={isUr ? "font-urdu" : ""}>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Terms needing attention */}
          {analysis.termsNeedingAttention?.length > 0 && (
            <div className="space-y-2 bg-amber-500/5 p-4 rounded-lg border border-amber-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>{t("documents.terms")}</span>
              </h4>
              <ul className="space-y-1 text-xs text-slate-800">
                {analysis.termsNeedingAttention.map((trm, i) => (
                  <li key={i} className={isUr ? "font-urdu" : ""}>
                    • {trm}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {analysis.nextSteps?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("documents.nextSteps")}
              </h4>
              <ul className="space-y-1 text-xs text-slate-700">
                {analysis.nextSteps.map((step, i) => (
                  <li key={i} className={isUr ? "font-urdu" : ""}>
                    {i + 1}. {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions to ask */}
          {analysis.questionsForProfessional?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-accent" />
                <span>{t("documents.questions")}</span>
              </h4>
              <ul className="space-y-1 text-xs text-slate-700 italic">
                {analysis.questionsForProfessional.map((q, i) => (
                  <li key={i} className={isUr ? "font-urdu" : ""}>
                    "{q}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Your Documents History */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground">
          {t("documents.yourDocs")}
        </h3>
        {documents.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            {t("documents.empty")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                onClick={() => handleSelectPastDoc(doc)}
                className="p-4 space-y-2 bg-white hover:border-primary/50 cursor-pointer transition shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {doc.name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {isUr ? "دیکھیں" : "View"}
                  </Badge>
                </div>
                {doc.summary && (
                  <p className={`text-xs text-muted-foreground line-clamp-2 ${isUr ? "font-urdu" : ""}`}>
                    {doc.summary}
                  </p>
                )}
                <span className="text-[10px] text-slate-400 block pt-1">
                  {new Date(doc.created_date).toLocaleDateString()}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
