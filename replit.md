# AI Studio School Management System

## Overview
A comprehensive school management platform built with React, TypeScript, and Vite. It supports multiple user roles (Super Admin, Admin, Teacher, Student) and integrates AI capabilities via Google Gemini for generating student reports and quizzes from images.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS 4
- **Backend**: Express.js server (`server.ts`) serving Vite in dev mode and static files in production
- **Database**: Supabase (PostgreSQL) for data storage and authentication
- **AI**: Google Gemini API for report generation and quiz creation from images
- **SMS**: BulkSMS API proxied through the Express server

## Project Structure
```
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Integrations (supabase.ts, gemini.ts, utils.ts)
│   ├── pages/          # Application views and dashboards
│   ├── App.tsx         # Main app with routing
│   ├── main.tsx        # Entry point
│   └── types.ts        # TypeScript interfaces
├── server.ts           # Express server (dev + production)
├── vite.config.ts      # Vite configuration
├── supabase-schema.sql # Database schema
└── index.html          # HTML template
```

## Environment Variables
See `.env.example` for required variables:
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `APP_URL` - Application URL (auto-injected in production)

## Running the App
- **Development**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Key Notes
- Server listens on `0.0.0.0:5000` in development
- Vite `allowedHosts: true` is set for Replit proxy compatibility
- The Express server handles API proxy routes for SMS and serves Vite middleware in dev mode

## Feature Highlights
- **Responsive Sidebars**: Collapsible icon-only mode on desktop; full overlay on mobile across all dashboards
- **Mark Color Scheme**: 0-39% RED, 40-59% BLUE, 60-79% GREEN, 80-100% GOLD
- **Learner List Report**: Admin and Teacher can filter by grade/subject/level/term/year to view a printable list of learners with scores, levels, and pass/fail status. Print button triggers `window.print()` with `@media print` CSS that hides navigation and shows only the report.
- **Subject Pass Mark**: `getSubjectPassMark()` uses a hardcoded lookup — no `pass_mark` column in Supabase
- **Result Visibility**: Controlled via `result_publications` table
- **Subject Ranking Report**: Admin and Teacher dashboards — filter by subject/grade/term/year; shows ranked table with medals, summary stats (avg, high, low, pass rate), printable PDF with school branding and EMIS
- **EMIS Number**: Stored in `timetable_config.emis` JSONB key (no schema change required with anon key). Editable via Admin School Info form. Appears in all printed report headers. To migrate to a proper column when service-role key is available: `ALTER TABLE schools ADD COLUMN IF NOT EXISTS emis TEXT DEFAULT ''`
- **Supabase Pagination**: Any query that may exceed 1000 rows must use `.range()` pagination (e.g., `fetchStatsResults` uses a loop with `PAGE_SIZE = 500`)
- **Curriculum Stats Grade Filter**: Charts, tables, and PDF downloads all respect the grade filter and the hide-empty-subjects toggle
