import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, Mail, Lock, AlertCircle, ArrowRight, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { safeReturnTo } from "@/lib/authReturnTo";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import GoogleAuthModal from "@/components/GoogleAuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const isUr = lang === "ur";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleDetails, setGoogleDetails] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError(t("auth.fillAllFields"));
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      navigate(safeReturnTo());
    } catch (err) {
      setError(err.message || (isUr ? "لاگ ان کرنے میں ناکامی۔ براہ کرم اپنی تفصیلات چیک کریں۔" : "Failed to sign in. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate(safeReturnTo());
    } catch (err) {
      if (err.isGoogleDisabled) {
        setGoogleDetails(err.details || null);
        setShowGoogleModal(true);
      }
      setError(err.message || (isUr ? "گوگل سائن ان میں مسئلہ آیا۔" : "Google sign in failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Scale}
      title={t("auth.welcomeBack")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <span className={isUr ? "font-urdu" : ""}>
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            {t("auth.register")}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs rounded-lg border bg-destructive/10 border-destructive/20 text-destructive space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1 w-full">
                <span className="font-semibold block">
                  {error.toLowerCase().includes("not confirmed") ? "Account Email Not Confirmed Yet" : "Authentication Notice"}
                </span>
                <p className="whitespace-pre-line text-[11px] leading-relaxed opacity-90">{error}</p>
                {error.toLowerCase().includes("not confirmed") && (
                  <div className="mt-2 pt-2 border-t border-destructive/20 text-[11px] space-y-1.5 text-foreground">
                    <p className="font-semibold text-destructive">1-Click Fix in Supabase Dashboard:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                      <li>Open your <strong>Supabase Dashboard</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>Users</strong></li>
                      <li>Find your email and click the <strong>...</strong> menu on the right</li>
                      <li>Click <strong>"Confirm user"</strong></li>
                    </ol>
                    <p className="text-[10px] text-muted-foreground pt-1">
                      After clicking "Confirm user", you can immediately sign in below!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className={isUr ? "font-urdu" : ""}>{t("auth.email")}</Label>
          <div className="relative">
            <Mail className={`absolute ${isUr ? "right-3" : "left-3"} top-2.5 h-4 w-4 text-muted-foreground`} />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={isUr ? "pr-9 pl-3 text-right font-urdu" : "pl-9 pr-3"}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={isUr ? "font-urdu" : ""}>{t("auth.password")}</Label>
            <Link
              to="/forgot-password"
              className={`text-xs text-primary hover:underline font-medium ${isUr ? "font-urdu" : ""}`}
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock className={`absolute ${isUr ? "right-3" : "left-3"} top-2.5 h-4 w-4 text-muted-foreground`} />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={isUr ? "pr-9 pl-3 text-right" : "pl-9 pr-3"}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className={`w-full gap-2 ${isUr ? "font-urdu" : ""}`}>
          <span>{loading ? t("common.loading") : t("auth.signIn")}</span>
          <ArrowRight className={`h-4 w-4 ${isUr ? "rotate-180" : ""}`} />
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className={`bg-card px-2 text-muted-foreground ${isUr ? "font-urdu" : ""}`}>{t("auth.orContinueWith")}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleGoogleLogin}
            className={`w-full gap-2 ${isUr ? "font-urdu" : ""}`}
          >
            <GoogleIcon className="h-4 w-4" />
            <span>{t("auth.googleSignIn")}</span>
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowGoogleModal(true);
              }}
              className={`text-[11px] text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1 ${isUr ? "font-urdu" : ""}`}
            >
              <HelpCircle className="h-3 w-3" />
              <span>{isUr ? "گوگل لاگ ان کی ترتیبات" : "Google login setup instructions"}</span>
            </button>
          </div>
        </div>
      </form>

      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        details={googleDetails}
      />
    </AuthLayout>
  );
}
