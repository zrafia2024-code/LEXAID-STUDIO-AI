import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, Check, AlertCircle, ShieldAlert, KeyRound, CheckCircle2, ArrowRight } from "lucide-react";
import { supabaseUrl } from "@/lib/supabase";

export default function GoogleAuthModal({ isOpen, onClose, details }) {
  const [copied, setCopied] = useState(false);

  const matchedProjectId = (supabaseUrl || "").match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] || "";
  const projectId = details?.projectId || matchedProjectId || "your-project-ref";
  const callbackUrl = details?.callbackUrl || (supabaseUrl ? `${supabaseUrl}/auth/v1/callback` : `https://${projectId}.supabase.co/auth/v1/callback`);
  const dashboardUrl = details?.dashboardUrl || (projectId !== "your-project-ref" ? `https://supabase.com/dashboard/project/${projectId}/auth/providers` : "https://supabase.com/dashboard");

  const handleCopy = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6 bg-white border border-slate-200 shadow-xl rounded-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Google Login Setup Required in Supabase
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Supabase disables Google Sign-In by default until credentials are added.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs text-slate-700">
          {/* Status banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1">
              <p className="font-semibold">Why did this happen?</p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Supabase returned: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950">Unsupported provider: provider is not enabled</code>.
                Google OAuth must be enabled once in your Supabase project dashboard.
              </p>
            </div>
          </div>

          {/* 3 Step Setup */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>3-Step Quick Configuration:</span>
            </h4>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">Step 1: Open Google Provider in Supabase</span>
                  <Badge variant="outline" className="text-[10px] bg-slate-100 font-mono">
                    Project: {projectId}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Go to Authentication &rarr; Providers &rarr; Google and toggle <strong>Enable Google provider</strong> to <strong>ON</strong>.
                </p>
                <div className="pt-1">
                  <a
                    href={dashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <span>Open Supabase Providers Dashboard</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 text-[11px]">Step 2: Copy your Supabase Callback URI</span>
                <p className="text-[11px] text-slate-600">
                  Paste this exact URI into <em>"Authorized redirect URIs"</em> in Google Cloud Console:
                </p>
                <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-900 text-slate-100 rounded font-mono text-[10px]">
                  <span className="truncate">{callbackUrl}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 px-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 shrink-0"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 text-[11px]">Step 3: Paste Client ID & Client Secret</span>
                <p className="text-[11px] text-slate-600">
                  Paste your Google Cloud OAuth Client ID and Client Secret into Supabase and click <strong>Save</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Alternative */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-[11px] text-emerald-900">
            <p className="font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              <span>Sign in immediately with Email & Password:</span>
            </p>
            <p className="text-emerald-800">
              Email &amp; password authentication connects directly to your database without requiring external Google OAuth configuration.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              window.open(dashboardUrl, "_blank");
            }}
            className="gap-1.5 text-xs bg-slate-900 text-white hover:bg-slate-800"
          >
            <span>Open Supabase Dashboard</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
