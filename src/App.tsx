import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { I18nProvider } from "@/lib/i18n";
import Layout from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";

// Main App Pages
import Home from "@/pages/Home";
import Assistant from "@/pages/Assistant";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import Library from "@/pages/Library";
import Documents from "@/pages/Documents";
import Settings from "@/pages/Settings";

// Auth Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import PageNotFound from "@/lib/PageNotFound";

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <I18nProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Main Application Pages with Dark Sidebar Layout */}
              <Route
                path="/"
                element={
                  <Layout>
                    <Home />
                  </Layout>
                }
              />
              <Route
                path="/assistant"
                element={
                  <Layout>
                    <Assistant />
                  </Layout>
                }
              />
              <Route
                path="/cases"
                element={
                  <Layout>
                    <Cases />
                  </Layout>
                }
              />
              <Route
                path="/cases/:id"
                element={
                  <Layout>
                    <CaseDetail />
                  </Layout>
                }
              />
              <Route
                path="/library"
                element={
                  <Layout>
                    <Library />
                  </Layout>
                }
              />
              <Route
                path="/documents"
                element={
                  <Layout>
                    <Documents />
                  </Layout>
                }
              />
              <Route
                path="/settings"
                element={
                  <Layout>
                    <Settings />
                  </Layout>
                }
              />

              {/* Backwards Compatibility Aliases */}
              <Route path="/legal-assistant" element={<Navigate to="/assistant" replace />} />
              <Route path="/case-analysis" element={<Navigate to="/assistant" replace />} />
              <Route path="/saved-cases" element={<Navigate to="/cases" replace />} />
              <Route path="/history" element={<Navigate to="/cases" replace />} />
              <Route path="/precedent-search" element={<Navigate to="/library" replace />} />
              <Route path="/document-simplifier" element={<Navigate to="/documents" replace />} />
              <Route path="/legal-aid-finder" element={<Navigate to="/assistant" replace />} />
              <Route path="/timeline-tracker" element={<Navigate to="/cases" replace />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              {/* 404 Fallback */}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
