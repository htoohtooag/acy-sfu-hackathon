
# 📄 Project Overview
**Project:** Myanmar Freelance Marketplace (AI-Native)

## What is this project?
An AI-native freelance marketplace tailored for the Myanmar market. It combines the **Fiverr model** (pre-packaged services) with the **Upwork model** (custom job posts and milestone-based contracts). The platform uses an AI conversational agent (ChatUi-style) as the primary discovery engine and enforces a strict trust system using manual escrow payments.

## Problem Statement
1. **Discovery is hard:** Clients struggle to find reliable local talent using traditional keyword searches. 
2. **Trust is zero:** Freelancers fear not getting paid; clients fear paying for subpar work.
3. **Platform Leakage:** Users take deals offline to Viber/Telegram to avoid fees, risking their security.

## Target Users
- **Clients:** Businesses or individuals hiring talent. They can buy packages or post custom jobs.
- **Freelancers:** Local professionals offering services. They can list packages or apply to jobs.
- **Admins:** Platform operators verifying payments, moderating users, and resolving disputes.
- *Note: A single user can hold both Client and Freelancer roles simultaneously (Dual-Role system).*

## Core Features
- **AI Agent Search:** A Chat-style UI where clients describe their needs. The AI uses Function Calling to query the database for exact matches (skill, budget) and renders interactive Package Cards or Freelancer avator graph directly  based on what user ask in the chat stream.
- **Hybrid Marketplace:** Freelancers create tiered Packages; Clients create open Job Posts.
- **Manual Escrow System:** Clients upload payment proof (e.g., KBZ Pay/Wave Money screenshots). Admins verify funds to activate the order.
- **Real-time Workroom:** Socket.io-powered chat for clients and freelancers to collaborate and share reference files.
- **Tiered Subscriptions:** Free, Gold, and Diamond plans that dictate platform limits (e.g., max job posts, commission rates).


## Tech Stack
- **Frontend:** Next.js (App Router), TailwindCSS, shadcn/ui, React Query, Zustand.
- **Backend:** Node.js, Express, Prisma ORM, Socket.io.
- **Database & Auth:** Supabase (PostgreSQL + pgvector + Supabase Auth).
- **AI:** Vercel AI SDK, Google Gemini (Text, Embeddings, Function Calling).
- **Storage/Processing:** Supabase Storage, Sharp (image watermarking/compression).

## Monorepo Structure
```text
my-marketplace-app/
├── frontend/        # Next.js App Router application
├── backend/         # Node.js/Express API server
└── shared/          # Zod schemas & shared TypeScript types (Single Source of Truth)
```

## Constraints & Rules for AI Agents
*Do not guess or invent patterns outside these constraints:*
1. **State Management:** NEVER use Redux. Use Zustand for UI state and React Query for server state.
2. **Data Fetching:** NEVER use raw SQL unless specifically dealing with `pgvector` similarity searches. Use Prisma Client for all relational data.
3. **Authentication:** NEVER build custom auth. Use Supabase Auth. The `public.users` table is linked 1-to-1 to `auth.users` via a database trigger.
4. **AI Search:** Do NOT rely on pure vector search for the AI Agent. The AI must use Vercel AI SDK Function Calling to extract hard constraints (budget, location) and run strict SQL filters first, then use vectors for semantic sorting.
5. **Validation:** NEVER trust user input. Validate all API payloads using Zod schemas imported from the `/shared` folder.
6. **Rendering:** Default to Next.js Server Components. Only use `"use client"` for interactive components (forms, websockets, AI chat).

## Links to Important Docs
- [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)
- [Backend Architecture](./BACKEND_ARCHITECTURE.md)
- [Database Design](./DATABASE_DESIGN.md)
- [Build Plan](./BUILD_PLAN.md)
