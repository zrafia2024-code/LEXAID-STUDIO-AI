# LEXAID — AI Legal Decision Support for Pakistan

> **A citizen-focused legal information and preliminary decision-support platform that turns difficult legal problems and documents into clearer, actionable information grounded in Pakistani law.**

## The problem

Legal information is often difficult to access when a person needs it most. Citizens may face unfamiliar legal language, uncertainty about which law applies, difficulty finding relevant precedents, and documents that are too complex to understand without professional help.

LEXAID is designed around that gap: **make the first layer of legal understanding faster, clearer, and more accessible without pretending to replace a qualified lawyer or court.**

## What LEXAID does

LEXAID combines conversational legal intake, Pakistani-law references, precedent discovery, document analysis, case history, and bilingual UX in one application.

### 1. Legal issue intake & assessment

Users describe a legal problem in natural language. LEXAID can:

- analyze the initial description;
- identify the likely legal category;
- ask follow-up questions before assessment;
- generate a preliminary assessment;
- surface supporting references;
- allow reassessment when new facts are supplied;
- save the resulting case for later review.

The application also includes voice input for the intake flow.

### 2. Pakistani law & precedent discovery

The Library provides searchable legal material with category filters. Results can distinguish between statutes and cases and can expose citation, court, date, case identifier, summary/excerpt, and relevance information when supplied by the underlying data source.

The server also exposes a searchable Pakistan-law dataset used by the application for constitutional and legal references.

### 3. Legal document analysis

Users can upload PDF, PNG, JPG/JPEG, or TXT documents and request a plain-language analysis. An analyzed document can be associated with a saved case.

The analysis is structured around:

- document type;
- simple explanation;
- important points;
- important dates/deadlines;
- terms or warnings requiring attention;
- practical next steps;
- questions for a professional.

The server-side Gemini flow supports multimodal data URLs and text content and uses search grounding when configured.

### 4. Case workspace / history

Saved legal cases can be browsed, filtered, opened, and deleted. Recent cases are surfaced from the home experience.

### 5. Bilingual experience

The application supports English and Urdu interface/content paths. The legal-assistance and document-simplification flows adapt their output to the selected language.

### 6. Authentication and application services

The app includes login, registration, password-reset flows, Supabase integration, PWA configuration, and server health/configuration endpoints.

## Judge-facing value proposition

**For citizens:** understand a legal problem or document before deciding what to do next.

**For students and researchers:** search legal categories and references through a focused interface.

**For legal professionals:** use structured intake, preliminary analysis, document summaries, and saved case context as a decision-support layer.

**For the public-interest space:** reduce the friction between a person's real-world problem and the legal information needed to navigate it.

## How the product works

```text
User describes a legal problem
          |
          v
Initial AI intake analysis
          |
          v
Follow-up questions
          |
          v
Preliminary legal assessment
          |
          +----------> Pakistani law / precedent references
          |
          v
Saved case context

Legal document
     |
     v
Upload / parse
     |
     v
Gemini document analysis
     |
     v
Plain-language explanation
+ key points + dates + warnings + next steps
     |
     v
Optional case association
```

## Technology

| Layer | Technologies |
|---|---|
| Frontend | React 19, React Router, Vite |
| Server | Express + TypeScript |
| AI | Google Gemini via `@google/genai` |
| Data / auth | Supabase + Base44 SDK/application functions |
| UI | Tailwind CSS 4, Radix UI, Lucide React |
| State / data fetching | TanStack React Query |
| PWA | `vite-plugin-pwa` |
| Build | Vite + esbuild |
| Utilities | Zod, date-fns, clsx / tailwind-merge |

## Current product surface

| Capability | Current repository |
|---|---|
| Citizen home / onboarding | Implemented |
| AI legal issue intake | Implemented |
| Follow-up question flow | Implemented |
| Preliminary assessment | Implemented |
| Reassessment with new information | Implemented |
| Voice input | Implemented in intake UI |
| Pakistan-law search API | Implemented |
| Precedent/library search | Implemented |
| Legal document upload + analysis | Implemented |
| Document-to-case association | Implemented |
| Saved cases / history | Implemented |
| English + Urdu UX | Implemented |
| Authentication / password flows | Implemented in application |
| Supabase integration | Implemented in application/server layer |
| PWA configuration | Implemented |

## Running locally

### Prerequisites

- Node.js 18+ recommended
- npm
- Gemini API credentials for AI features
- Supabase credentials for connected persistence/authentication flows

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the credentials required by your environment.

### Development

```bash
npm run dev
```

The development script runs `tsx server.ts`; the server is configured for port `3000`.

### Build / production

```bash
npm run build
npm start
```

### Type-check

```bash
npm run lint
```

## Responsible use

LEXAID is a **legal-information and preliminary decision-support prototype**, not a substitute for an advocate, court, government authority, or official legal publication.

For consequential matters, users should verify important provisions and citations against authoritative sources and consult a qualified legal professional.

## Hackathon pitch

> **LEXAID turns “I have a legal problem, but I don't know what it means” into a structured starting point: describe the problem, answer the right questions, understand the preliminary legal position, inspect relevant references, analyze documents in plain language, and keep the case context together.**
