# DevBoard AI — Developer Workspace & Task Intelligence 🚀

[![Live Production App](https://img.shields.io/badge/Live_App-devboard--ai--app.vercel.app-ff5500?style=for-the-badge&logo=vercel&logoColor=white)](https://devboard-ai-app.vercel.app)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**DevBoard AI** is a production-ready, full-stack developer workspace and task management platform engineered for software teams. It unifies project tracking, Kanban backlog management, GitHub repository metrics, and Gemini 2.5 Flash AI assistance into a single responsive dashboard.

---

## ✨ Key Features

- 🤖 **Gemini 2.5 Flash AI Engine**:
  - **Project Health Diagnostics**: Evaluates project risks, health scores (0-100), and actionable recommendations.
  - **Feature Breakdown**: Automatically decomposes feature descriptions into 5–10 structured, prioritized tasks.
  - **Task Suggestion**: Analyzes commit history and task backlog to recommend the exact next task to work on.
  - **30-Min TTL Cache & Heuristic Fallback**: Caches AI responses in `sessionStorage` with manual refresh overrides and heuristic fallbacks during Free Tier API rate limits (15 req/min).

- 📊 **Dynamic Task-Calculated Progress**:
    > **Progress Formula**: `Progress (%) = (Completed Tasks / Total Tasks) × 100`
  - Displays real-time task ratios (e.g. `33% (3/9 tasks)`) across project cards, dashboards, and project detail headers.

- 👥 **Team Collaborators & Access Control**:
  - Invite team members by email address and assign permission roles (`Admin`, `Contributor`, `Viewer`).
  - Displays overlapping avatar stack badges (`[A] [B] + Team`) and modal management wrappers using React `createPortal`.

- 🐙 **GitHub Repository Integration**:
  - Central **Repository Hub** (`/repositories`) with 1-click repository picker.
  - View real-time commit logs, branch activity, and pull request tracking per connected project.

- 🎯 **Responsive Kanban Task Board**:
  - Status columns (`Todo`, `In Progress`, `Completed`), 4-task initial view limits, single-column mobile tabs, and inline description toggles.

- 🔐 **Supabase Auth & Database Security**:
  - Secure email/password authentication, password recovery flows, and Row-Level Security (RLS) data isolation.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 8, React Router v7 |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons, Framer Motion |
| **Form & Validation** | React Hook Form, Zod, Zod-Resolver |
| **Backend & Database** | Supabase (PostgreSQL, Row Level Security, Auth Listener) |
| **AI SDK** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Deployment** | Vercel (Production Client SPA Rewrites) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/devboard-ai.git
cd devboard-ai
npm install
```

### 3. Environment Setup
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Database Setup (Supabase SQL Editor)
Run the following SQL snippet in your **Supabase SQL Editor** to create tables and set up Row Level Security (RLS):

```sql
-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'On Hold')),
    progress INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Completed')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Project Collaborators Table
CREATE TABLE IF NOT EXISTS public.project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Contributor', 'Viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS Policies
CREATE POLICY "Allow authenticated users to read projects" ON public.projects FOR SELECT TO authenticated
USING (auth.uid() = user_id OR id IN (SELECT project_id FROM public.project_collaborators WHERE lower(email) = lower(auth.jwt() ->> 'email')));

CREATE POLICY "Allow authenticated users to read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to write tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read collaborators" ON public.project_collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert collaborators" ON public.project_collaborators FOR INSERT TO authenticated WITH CHECK (true);
```

### 5. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📦 Production Build & Deployment

```bash
# Verify TypeScript & Vite build
npm run build

# Deploy to Vercel
npx vercel --prod
```

---

## 📄 License

This project is open-source under the **MIT License**. Engineered for modern software teams.
