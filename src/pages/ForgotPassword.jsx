import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Scale, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Scale}
      title="Reset password"
      subtitle="We'll send you instructions to reset your password"
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to login</span>
        </Link>
      }
    >
      {sent ? (
        <div className="text-center space-y-4 py-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Check your inbox</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If an account exists for <strong>{email}</strong>, a password reset link has been sent.
          </p>
          <Button asChild variant="outline" className="w-full mt-4">
            <Link to="/login">Return to login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
