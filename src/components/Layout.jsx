import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Scale,
  Home,
  Sparkles,
  FolderOpen,
  BookOpen,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  LogIn,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import Disclaimer from "@/components/Disclaimer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";

export default function Layout({ children }) {
  const { t, lang } = useI18n();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", icon: Home, labelKey: "nav.home" },
    { to: "/assistant", icon: Sparkles, labelKey: "nav.assistant" },
    { to: "/cases", icon: FolderOpen, labelKey: "nav.cases" },
    { to: "/library", icon: BookOpen, labelKey: "nav.similar" },
    { to: "/documents", icon: FileText, labelKey: "nav.documents" },
    { to: "/settings", icon: SettingsIcon, labelKey: "nav.settings" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isUr = lang === "ur";

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B1220] text-slate-100 p-5 border-r border-slate-800/60">
      <div className="space-y-6">
        {/* Brand Header */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-start gap-3 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition group-hover:scale-105">
            <Scale className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-white">LEXAID</h1>
            <p className="text-[11px] leading-tight text-amber-400/90 font-medium line-clamp-2">
              {t("tagline")}
            </p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#162032] text-amber-400 border border-amber-500/50 shadow-sm font-semibold"
                    : "text-slate-400 hover:bg-[#162032]/60 hover:text-slate-200 border border-transparent"
                } ${isUr ? "font-urdu text-base" : ""}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-amber-400" : "text-slate-400"
                  }`}
                />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Language Switcher, User Profile & Logout */}
      <div className="pt-5 border-t border-slate-800/80 space-y-3">
        <div className="px-1">
          <LanguageSwitcher compact />
        </div>

        {user ? (
          <>
            <div className="px-2 pt-1">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user.full_name || user.email}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-[#162032] hover:text-rose-300 transition ${
                isUr ? "font-urdu text-sm" : ""
              }`}
            >
              <LogOut className={`h-4 w-4 ${isUr ? "rotate-180" : ""}`} />
              <span>{t("common.logout")}</span>
            </button>
          </>
        ) : (
          <div className="px-1">
            <Link
              to="/login"
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-2 text-xs font-medium transition ${
                isUr ? "font-urdu text-sm" : ""
              }`}
            >
              <LogIn className="h-3.5 w-3.5 text-amber-400" />
              <span>{isUr ? "لاگ ان / سائن اپ" : "Sign In / Register"}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Desktop Left/Right Sidebar */}
      <aside
        className={`app-sidebar-desktop hidden md:flex md:w-64 md:shrink-0 md:flex-col md:fixed md:inset-y-0 z-30 shadow-2xl ${
          isUr ? "md:right-0 md:left-auto" : "md:left-0 md:right-auto"
        }`}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={`relative flex w-4/5 max-w-xs flex-1 flex-col bg-[#0B1220] shadow-2xl ${
              isUr ? "mr-0 ml-auto" : "ml-0 mr-auto"
            }`}
          >
            <div className={`absolute top-4 ${isUr ? "left-4" : "right-4"} z-10`}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`app-main-content flex-1 flex flex-col min-w-0 transition-[padding] duration-150 ${
          isUr ? "md:pr-64 md:pl-0" : "md:pl-64 md:pr-0"
        }`}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#030712]/85 px-4 md:px-8 backdrop-blur-md">
          {/* Left: Mobile Menu button + Pakistan Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-slate-800"
              aria-label="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-emerald-200">PK</span>
              <span className="hidden sm:inline text-emerald-600 font-normal">|</span>
              <span className="truncate max-w-[240px] sm:max-w-none text-emerald-200 font-medium">
                {t("pakistanOnly")}
              </span>
            </div>
          </div>

          {/* Right: Language Switcher */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {/* Standard Disclaimer Notice */}
          <Disclaimer />
          {children}
        </main>
      </div>
    </div>
  );
}
