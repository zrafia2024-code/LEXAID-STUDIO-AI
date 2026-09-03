import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Languages, Mic, Info, ShieldCheck, Database, LogIn, CheckCircle2, Users, RefreshCw, AlertCircle, ExternalLink, Copy, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth, syncUserToPwaUsers } from "@/lib/AuthContext";
import { supabase, supabaseUrl } from "@/lib/supabase";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import VoiceInput from "@/components/VoiceInput";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { t, lang } = useI18n();
  const { user, isSupabaseConfigured } = useAuth();
  const [testTranscript, setTestTranscript] = useState("");
  const isUr = lang === "ur";

  // pwa_users table state
  const [pwaUsers, setPwaUsers] = useState([]);
  const [isLoadingPwaUsers, setIsLoadingPwaUsers] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchPwaUsers = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsLoadingPwaUsers(true);
    try {
      // Fetch via supabase client
      const { data, error } = await supabase
        .from("pwa_users")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setPwaUsers(data);
      } else {
        // Fallback to server endpoint
        const res = await fetch("/api/pwa-users");
        if (res.ok) {
          const json = await res.json();
          setPwaUsers(json.users || []);
        }
      }
    } catch (err) {
      console.warn("Could not fetch pwa_users:", err);
    } finally {
      setIsLoadingPwaUsers(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchPwaUsers();
    }
  }, [isSupabaseConfigured]);

  const handleManualSync = async () => {
    if (!user) return;
    setSyncStatus({ loading: true, msg: "Saving current user to public.pwa_users..." });
    try {
      const res = await syncUserToPwaUsers(user);
      if (res?.success) {
        setSyncStatus({ success: true, msg: `Successfully synced ${user.email} to pwa_users!` });
        await fetchPwaUsers();
      } else {
        setSyncStatus({
          error: true,
          msg: "Sync failed. If RLS is enabled on pwa_users, execute the INSERT policy in Supabase SQL editor below.",
        });
      }
    } catch (e) {
      setSyncStatus({ error: true, msg: e.message || "Failed to sync" });
    }
  };

  const copySqlPolicy = () => {
    const sql = `CREATE POLICY "insert pwa_users" ON public.pwa_users FOR INSERT WITH CHECK (true);\nCREATE POLICY "update pwa_users" ON public.pwa_users FOR UPDATE USING (true);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

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
                  Supabase Authentication & Cloud Backend
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connected to your Supabase project for real user authentication and cloud synchronization
                </p>
              </div>
            </div>
            <Badge
              variant={isSupabaseConfigured ? "default" : "secondary"}
              className={isSupabaseConfigured ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-1" : ""}
            >
              {isSupabaseConfigured && <CheckCircle2 className="h-3 w-3" />}
              {isSupabaseConfigured ? "Connected" : "Awaiting Credentials"}
            </Badge>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Connection Status:</span>
              <span className={`font-semibold ${isSupabaseConfigured ? "text-emerald-700" : "text-amber-700"}`}>
                {isSupabaseConfigured ? "Successfully Connected to Supabase Project" : "Not Configured"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Project Endpoint:</span>
              <span className="font-mono text-[11px] text-slate-700 truncate max-w-[280px]">
                {supabaseUrl || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Logged-in Account:</span>
              <span className="font-semibold text-slate-800">
                {user ? (user.email || user.full_name) : "No user signed in"}
              </span>
            </div>
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account ID:</span>
                <span className="font-mono text-[11px] text-slate-700 truncate max-w-[260px]">{user.id}</span>
              </div>
            ) : (
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in or register a new Supabase account &rarr;
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* public.pwa_users Table Synchronization */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Supabase Table: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-emerald-800">public.pwa_users</code></span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Every registered user is stored with their email, name, base44_user_id, and created_at timestamp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPwaUsers}
                disabled={isLoadingPwaUsers}
                className="gap-1.5 text-xs h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPwaUsers ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              {user && (
                <Button
                  size="sm"
                  onClick={handleManualSync}
                  className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Sync Current User</span>
                </Button>
              )}
            </div>
          </div>

          {syncStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                syncStatus.error
                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                  : syncStatus.success
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-slate-50 text-slate-700 border border-slate-200"
              }`}
            >
              {syncStatus.loading && <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />}
              {syncStatus.success && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
              {syncStatus.error && <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
              <span>{syncStatus.msg}</span>
            </div>
          )}

          {/* RLS Policy Notice */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Row Level Security (RLS) Write Access Policy
              </span>
              <button
                type="button"
                onClick={copySqlPolicy}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                {copiedSql ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSql ? "Copied SQL!" : "Copy SQL"}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              If writes to <code className="font-mono">pwa_users</code> are blocked by RLS, execute this query in your Supabase SQL Editor:
            </p>
            <pre className="p-2 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto whitespace-pre">
{`CREATE POLICY "insert pwa_users" ON public.pwa_users FOR INSERT WITH CHECK (true);
CREATE POLICY "update pwa_users" ON public.pwa_users FOR UPDATE USING (true);`}
            </pre>
          </div>

          {/* Recent Synced Users List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Recent Synced Users in Table ({pwaUsers.length})</span>
            </div>
            {pwaUsers.length === 0 ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-slate-200 text-xs text-muted-foreground">
                No users loaded yet. Newly registered and logged-in accounts will appear here automatically.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                {pwaUsers.map((u) => (
                  <div key={u.id || u.email} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{u.name || "User"}</span>
                        <span className="font-mono text-[11px] text-slate-500">&lt;{u.email}&gt;</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Base44 ID: {u.base44_user_id || "N/A"} • Created: {new Date(u.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                      Synced
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Google OAuth Provider Setup Instructions */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Google Login Setup in Supabase
              </h3>
              <p className="text-xs text-muted-foreground">
                Why "Unsupported provider: provider is not enabled" appears and how to enable it
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
            <p>
              Supabase disables Google OAuth by default until you enable it in your Supabase project dashboard. To enable Google Sign-In:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 text-xs">
              <li>
                Open your <strong>Supabase Dashboard</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Google</strong>.
              </li>
              <li>
                Toggle <strong>Enable Google provider</strong> to <strong>ON</strong>.
              </li>
              <li>
                In <strong>Google Cloud Console</strong> (APIs &amp; Services &rarr; Credentials), create an <em>OAuth 2.0 Client ID</em> (Web application).
              </li>
              <li>
                Paste your Supabase redirect URI (shown in Supabase Google provider settings, e.g. <code className="font-mono bg-slate-100 px-1 rounded">{supabaseUrl ? `${supabaseUrl}/auth/v1/callback` : "https://<your-project-id>.supabase.co/auth/v1/callback"}</code>) into <em>Authorized redirect URIs</em>.
              </li>
              <li>
                Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> into Supabase and click <strong>Save</strong>.
              </li>
            </ol>
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Email &amp; Password authentication is fully functional and immediately connects all users to <code className="font-mono font-bold">pwa_users</code>!</span>
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
