import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, Mail, Lock, User, AlertCircle, ArrowRight, ExternalLink, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import GoogleAuthModal from "@/components/GoogleAuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
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
      setError("Please fill in email and password.");
      return;
    }
    try {
      setLoading(true);
      await register(email, password, fullName);
      navigate(safeReturnTo());
    } catch (err) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      setError(err.message || "Google signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Scale}
      title="Create an account"
      subtitle="Start your legal journey with LEXAID"
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
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
                  {error.toLowerCase().includes("rate limit") ? "Supabase Email Rate Limit Exceeded" : "Authentication Notice"}
                </span>
                <p className="whitespace-pre-line text-[11px] leading-relaxed opacity-90">{error}</p>
                {error.toLowerCase().includes("rate limit") && (
                  <div className="mt-2 pt-2 border-t border-destructive/20 text-[11px] space-y-1.5 text-foreground">
                    <p className="font-semibold text-destructive">Quick 1-Minute Fix in Supabase:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                      <li>Open your <strong>Supabase Dashboard</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Email</strong></li>
                      <li>Toggle <strong>"Confirm email"</strong> to <strong>OFF</strong></li>
                      <li>Click <strong>Save</strong></li>
                    </ol>
                    <p className="text-[10px] text-muted-foreground pt-1">
                      This removes the 3 emails/hour cap and lets users sign up immediately without waiting for an email.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Muhammad Ali"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="pl-9"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full gap-2">
          <span>{loading ? "Creating account..." : "Create account"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleGoogleSignup}
            className="w-full gap-2"
          >
            <GoogleIcon className="h-4 w-4" />
            <span>Google</span>
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowGoogleModal(true);
              }}
              className="text-[11px] text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
            >
              <HelpCircle className="h-3 w-3" />
              <span>Google login setup instructions</span>
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
