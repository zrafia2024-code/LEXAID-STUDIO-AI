import React, { useState } from "react";
import { Settings as SettingsIcon, Languages, Mic, Info, ShieldCheck, Database } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import VoiceInput from "@/components/VoiceInput";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { t, lang } = useI18n();
  const { user, isSupabaseConfigured } = useAuth();
  const [testTranscript, setTestTranscript] = useState("");
  const isUr = lang === "ur";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight text-foreground ${isUr ? "font-urdu text-3xl" : ""}`}>
              {t("settings.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isUr ? "زبان، صوتی معاون اور ایپ ترتیبات" : "Language, voice support and application settings"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        {/* Language Selection */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-accent" />
              <div>
                <h3 className={`text-base font-bold text-foreground ${isUr ? "font-urdu text-lg" : ""}`}>
                  {t("settings.language")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isUr ? "ایپ کے تمام متن اور قانونی تجزیے کی زبان منتخب کریں" : "Select language for analysis and UI"}
                </p>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <LanguageSwitcher />
          </div>
        </Card>

        {/* Voice Assistant */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Mic className="h-5 w-5 text-accent" />
            <div>
              <h3 className={`text-base font-bold text-foreground ${isUr ? "font-urdu text-lg" : ""}`}>
                {t("settings.voice")}
              </h3>
              <p className={`text-xs text-muted-foreground ${isUr ? "font-urdu" : ""}`}>
                {t("settings.voiceDesc")}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            {isUr
              ? "اردو اور انگریزی دونوں میں مائیکروفون کے ذریعے بول کر مسئلہ بیان کرنے کی سہولت دستیاب ہے۔ نیچے مائیکروفون ٹیسٹ کریں:"
              : "Supports speech-to-text in both Urdu (ur-PK) and English (en-PK). Test your microphone live below:"}
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <VoiceInput
              onTranscript={(txt) => setTestTranscript((prev) => (prev ? `${prev} ${txt}` : txt))}
            />
            {testTranscript && (
              <div className="p-2.5 bg-white border border-slate-200 rounded text-xs">
                <span className="font-semibold text-slate-500 block mb-1">
                  {isUr ? "پہچانا گیا متن:" : "Detected text:"}
                </span>
                <p className={`text-slate-800 ${isUr ? "font-urdu text-sm" : ""}`}>{testTranscript}</p>
                <button
                  type="button"
                  onClick={() => setTestTranscript("")}
                  className="mt-2 text-[11px] text-red-600 hover:underline"
                >
                  {isUr ? "صاف کریں" : "Clear"}
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Supabase Authentication & Database Status */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Supabase Authentication
                </h3>
                <p className="text-xs text-muted-foreground">
                  Integrated with Supabase Project for user accounts and secure auth
                </p>
              </div>
            </div>
            <Badge variant={isSupabaseConfigured ? "default" : "secondary"}>
              {isSupabaseConfigured ? "Connected" : "Local / Sandbox Active"}
            </Badge>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Current User:</span>
              <span className="font-semibold text-slate-800">{user?.email || "Citizen User"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Account ID:</span>
              <span className="font-mono text-[11px] text-slate-700">{user?.id || "local"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Environment Config:</span>
              <span className="font-mono text-[11px] text-slate-700">
                {isSupabaseConfigured ? "VITE_SUPABASE_URL (Active)" : "Supabase ready (provide URL & key in secrets)"}
              </span>
            </div>
          </div>
        </Card>

        {/* About LEXAID */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-accent" />
            <h3 className={`text-base font-bold text-foreground ${isUr ? "font-urdu text-lg" : ""}`}>
              {t("settings.about")}
            </h3>
          </div>
          <p className={`text-xs leading-relaxed text-slate-600 ${isUr ? "font-urdu text-sm" : ""}`}>
            {t("settings.aboutText")}
          </p>
          <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground border-t border-slate-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Based on Constitution of Pakistan 1973 & Statutory Laws</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
