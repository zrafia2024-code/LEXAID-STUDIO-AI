import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Calendar, Folder } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import AssessmentCard from "@/components/AssessmentCard";
import EvidencePanel from "@/components/EvidencePanel";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const [legalCase, setLegalCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reassessing, setReassessing] = useState(false);

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.LegalCase.get(id);
      setLegalCase(data);
    } catch (err) {
      console.warn("Failed to load case detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassess = async (note) => {
    if (!legalCase) return;
    try {
      setReassessing(true);
      let parsedAnswers = {};
      try {
        if (legalCase.answers) parsedAnswers = JSON.parse(legalCase.answers);
      } catch {}

      const res = await base44.functions.invoke("assessCase", {
        category: legalCase.category || "tenancy",
        answers: parsedAnswers,
        language: lang,
        description: `${legalCase.description}\n\n[Reassessment]: ${note}`,
        caseId: legalCase.id,
        reassessNote: note,
      });

      const { assessment, references } = res.data;
      setLegalCase((prev) => ({
        ...prev,
        assessment: JSON.stringify(assessment),
        references: JSON.stringify(references),
        status: "reassessed",
      }));
    } catch (err) {
      console.warn("Reassessment failed:", err);
    } finally {
      setReassessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await base44.entities.LegalCase.delete(id);
      navigate("/cases");
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  const isUr = lang === "ur";

  if (loading) return <Loader />;
  if (!legalCase) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{t("history.empty")}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/cases">{t("history.title")}</Link>
        </Button>
      </div>
    );
  }

  let assessment = null;
  let references = [];
  try {
    if (legalCase.assessment) {
      assessment =
        typeof legalCase.assessment === "string"
          ? JSON.parse(legalCase.assessment)
          : legalCase.assessment;
    }
    if (legalCase.references) {
      references =
        typeof legalCase.references === "string"
          ? JSON.parse(legalCase.references)
          : legalCase.references;
    }
  } catch {}

  const catKey = legalCase.category || "other";
  const catLabel = t(`categories.${catKey}`) || catKey;

  const dateStr = legalCase.created_date
    ? new Date(legalCase.created_date).toLocaleDateString(
        isUr ? "ur-PK" : "en-PK",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : "";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Nav Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/cases">
            <ArrowLeft className="h-4 w-4" />
            <span>{t("nav.cases")}</span>
          </Link>
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          <span>{t("common.delete")}</span>
        </Button>
      </div>

      {/* Case Header Details */}
      <Card className="p-6 space-y-4 bg-white border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {catLabel}
          </Badge>
          <Badge
            variant={legalCase.status === "reassessed" ? "secondary" : "default"}
          >
            {t(`history.status.${legalCase.status}`) || legalCase.status}
          </Badge>
          {dateStr && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Calendar className="h-3.5 w-3.5" />
              {dateStr}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold leading-snug text-foreground">
          {legalCase.title || t("home.recent")}
        </h1>

        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
          {legalCase.description}
        </p>
      </Card>

      {/* Assessment Component */}
      {assessment && (
        <AssessmentCard
          assessment={assessment}
          caseId={legalCase.id}
          onReassess={handleReassess}
          reassessing={reassessing}
        />
      )}

      {/* Evidence Panel */}
      <EvidencePanel references={references} />
    </div>
  );
}
