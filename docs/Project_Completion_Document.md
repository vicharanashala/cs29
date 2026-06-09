# Project Completion Document
## Vicharanashala Crowdsource FAQ Portal
**Team:** CS29 | **Programme:** Vicharanashala Internship Programme (VINS), IIT Ropar  
**Submission Week:** Week 4  
**GitHub Repository:** https://github.com/vicharanashala/cs29

---

## 1. Project Overview

The **Vicharanashala FAQ Portal** is a full-stack, crowd-sourced FAQ management system built for the VINS internship programme at IIT Ropar. Students can browse, search, and bookmark FAQs; raise queries not answered in the database; peer-answer open questions; and interact with **Yaksha Mini** — an AI assistant powered by a Retrieval-Augmented Generation (RAG) pipeline.

The project was built entirely from scratch by Team CS29 over the course of the internship, going well beyond the base specification to include a gamification system, real-time notifications, an admin analytics dashboard, automated CI/CD pipelines, and containerised cloud deployment.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + TypeScript + TanStack Router + TanStack Query |
| **Backend** | NestJS (Node.js framework) + Mongoose ODM |
| **Database** | MongoDB Atlas (cloud, replica set) |
| **Authentication** | Firebase Authentication (Email/Password + Google Sign-in) |
| **AI / RAG** | Google Gemini (primary) → Minimax (fallback) + Vector Search |
| **Styling** | Custom CSS + GSAP animations + React Three Fiber (3D hero) |
| **Charts** | Recharts |
| **Containerisation** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Hosting** | AWS EC2 (Docker) + MongoDB Atlas |

---

## 3. All Implemented Features

### 3.1 Student-Facing Features

| Feature | Description |
|---|---|
| **FAQ Browse & Search** | 168+ official VINS FAQs across 24 categories with keyword search, category filter, and "Most Asked" section sorted by view count |
| **Bookmarking** | Students can bookmark FAQs for quick personal reference |
| **Yaksha Mini (AI Chat)** | Floating chat widget powered by full RAG pipeline — asks questions, gets AI-synthesised answers with matched FAQ references; includes a **voice input feature** so students can speak their question directly |
| **Full Chat Page** | Dedicated full-page chat interface at `/chat` |
| **Raise Issue** | Students submit queries not covered by FAQs; they receive an AI-generated draft answer + similar FAQ hints *before* submitting |
| **Similar FAQ Hints** | While typing a new issue, the system shows semantically similar existing FAQs to avoid duplicate submissions |
| **Track Issues** | Students can view the live status of their raised issues (Pending / Approved / Rejected / Published as FAQ) |
| **Peer Answer (Resolve Question)** | Students can submit answers to open community issues; accepted answers are promoted to official FAQs |
| **Leaderboard** | Ranked by Spurti Points (SP) with real-time updates |
| **Notifications Bell** | Real-time notification panel with read/unread state and mark-all-read action |
| **Announcements** | Admin-broadcast messages visible to all users |
| **User Profile** | SP balance, questions asked, answers given |
| **Light / Dark Mode** | Persistent theme toggle available system-wide |
| **Register & Login** | Email+password and Google Sign-in flows with OTP verification step |

### 3.2 Admin Panel Features

| Feature | Description |
|---|---|
| **Analytics Dashboard** | Total FAQs, total views, pending issue count, weekly activity bar charts, top FAQ list |
| **FAQ Management** | Full CRUD — Create, Edit, Delete, and promote FAQs; per-FAQ view metrics |
| **Pending Query Moderation** | Review student-raised issues; Approve → published as FAQ; Reject → closed |
| **Pending Answer Moderation** | Review peer-submitted answers; Approve → answer published as FAQ response with SP award |
| **Broadcast Announcements** | Create and push system-wide announcements to all users |
| **Admin FAQ Promoter** | Directly promote any pending query into an official FAQ |

### 3.3 Behind-the-Scenes / Technical Features

| Feature | Description |
|---|---|
| **RAG Pipeline** | Query → Gemini embedding (3072-dim vector) → MongoDB Atlas Vector Search → Top-K matched FAQs → LLM synthesises contextual answer |
| **Multi-Provider AI Fallback Chain** | Gemini (primary, 3-retry with exponential back-off) → Minimax via Samagama proxy (secondary) → Pure text/keyword search (tertiary, always available) |
| **Unknown Query Queuing** | When the AI cannot find an answer, it automatically queues the question to `pending_faqs` for admin review — *no dead-ends for students* |
| **SP (Spurti Points) Reward System** | Idempotent SP awards: students earn points when their raised issue gets published as a FAQ, and when their peer answer is accepted by admin |
| **Issue Threading** | Full reply thread on each issue between students and admins |
| **Notification Broadcasting** | Admin can push notifications to all registered users at once |
| **FAQ Embedding Generation** | Seed script + re-embed script to generate and store 3072-dim Gemini embeddings for all 168 FAQs |
| **MongoDB Atlas Vector Index** | Auto-created on startup via `createSearchIndex` with cosine similarity — gracefully degrades to text search if cluster tier doesn't support it |
| **Graceful Degradation** | Every AI feature degrades gracefully; the app is fully functional for browsing and issue management even without any API keys |
| **Docker & Docker Compose** | Separate Dockerfiles for frontend (Nginx + SPA fallback) and backend (NestJS); local compose builds from source; prod compose uses pre-built images |
| **GitHub Actions CI/CD** | On every push to `main`: backend tests → frontend build → Docker image build + push to Docker Hub → ready for EC2 pull-and-restart |
| **Seed Script** | 168 official VINS/Samagama FAQs across 24 categories seeded into MongoDB |
| **Admin Creation Script** | `create-admin.ts` script to bootstrap the admin user in both Firebase Auth and MongoDB |
| **Nginx Reverse Proxy** | SPA fallback routing + `/api` proxy from port 80 → backend on port 3001 |
| **GSAP Animations** | Smooth page transitions and micro-animations throughout the UI |
| **React Three Fiber** | Optional 3D animated hero scene on the landing page |

---

## 4. Architecture Highlights

### 4.1 The RAG Pipeline — A Standout Feature

The Retrieval-Augmented Generation (RAG) pipeline is the centrepiece of Yaksha Mini. Here is exactly how it works:

```
Student Question
      │
      ▼
[1] Gemini Embedding API
    → Converts the question to a 3072-dimensional vector
      │
      ▼
[2] MongoDB Atlas Vector Search
    → Cosine similarity search against 168 embedded FAQs
    → Returns Top-3 semantically closest FAQs
      │
      ▼
[3] RAG Prompt Construction
    → Yaksha persona + context FAQs + student question
      │
      ▼
[4] LLM Call (Gemini → Minimax fallback)
    → Synthesises a natural-language answer
      │
      ▼
[5] Response Parsing
    → Detects "unknown" JSON → queues to pending_faqs for admin
    → Returns answer + matched FAQ references to student
```

**Why this is impressive:** The pipeline is fully self-healing. If the embedding API fails, it falls back to MongoDB keyword search for context. If the primary LLM fails, it retries with exponential back-off, then tries Minimax. If all LLM providers fail, the text-search results are returned directly. The student never hits a broken page.

### 4.2 Multi-Provider AI Fallback Chain

```
Gemini (3 retries, 429/503 retryable)
   ↓ fails
Minimax via Samagama proxy
   ↓ fails
Text/Keyword Search (always available)
```

### 4.3 CI/CD Pipeline

```
Git Push → main
   ↓
GitHub Actions:
  1. backend-test   (npm ci → nest build → jest)
  2. frontend-build (npm ci → vite build)
  3. build-and-push (Docker → Docker Hub)
   ↓
EC2: docker pull + docker-compose up -d
```

---

## 5. Database Schema Summary

| Collection | Key Fields |
|---|---|
| `User` | email, name, role (STUDENT/ADMIN), reward_points, answered_count, questions_asked |
| `Faq` | question, answer, answer_hi (Hindi), category, tags, view_count, embedding (3072-dim), createdAt |
| `PendingFaq` | question, suggestedAnswer, category, createdAt |
| `Issue` | title, description, raisedBy, status (open/resolved/closed), spAwarded |
| `IssueReply` | issueId, repliedBy, content |
| `Notification` | userEmail, title, message, isRead |
| `PendingApproval` | type (QUERY/ANSWER), content, submittedBy, status (PENDING/APPROVED/REJECTED), spAwarded |

---

## 6. API Surface (Key Endpoints)

| Category | Endpoint | Description |
|---|---|---|
| Auth | `POST /api/auth/signup` | Register student |
| Auth | `POST /api/auth/login` | Login |
| FAQs | `GET /api/faqs` | All 168+ published FAQs |
| FAQs | `POST /api/faqs/similar` | Semantic similar FAQ search (RAG) |
| FAQs | `GET /api/faqs/analytics` | Analytics: totals, top FAQs, category breakdown |
| Chat | `POST /api/chat` | RAG chat — question → AI answer + matched FAQs |
| Issues | `POST /api/issues` | Raise a new issue |
| Issues | `PATCH /api/issues/:id/status` | Update status + idempotent SP award |
| Notifications | `POST /api/notifications/broadcast` | Admin broadcast |
| Rewards | `GET /api/rewards/leaderboard` | Top 10 by SP |
| Admin | `PATCH /api/admin/pending/:id/approve` | Approve + publish + award SP |

---

## 7. Team Contributions

All team members contributed to the Vicharanashala FAQ Portal project. The breakdown below reflects the primary areas of responsibility.

---

### Rohit B Lakshmanan — Team Lead
**Email:** 23f1001156@ds.study.iitm.ac.in  
**Role:** Full-Stack Integration, Database Architecture, Project Management

- **Led the overall project architecture** and made all key technical decisions
- **Connected the frontend to the backend** — wired all API calls, auth flows, TanStack Query hooks, and ensured end-to-end data flow
- **Designed and implemented the MongoDB database** schemas, indexing strategy, and the Atlas Vector Search integration for the RAG pipeline
- Implemented the **SP (Spurti Points) reward system** with idempotency guarantees
- Managed the **GitHub repository** — branch strategy, code reviews, merge management
- **Primary debugger** — triaged all bugs reported by the QA team and applied fixes using OpenClaw
- Wrote the seed script integration and embedding generation pipeline
- Participated in **QA verification** — tested end-to-end flows and validated fixes after each bug resolution

---

### Adnan Zeya — DevOps & Backend Engineer
**Email:** az1513@srmist.edu.in  
**Role:** Deployment, Docker, CI/CD, Backend

- **Designed and set up the entire Docker infrastructure** — Dockerfiles for both frontend (Nginx + SPA) and backend (NestJS), Docker Compose for local and production environments
- **Built the GitHub Actions CI/CD pipeline** from scratch — the three-stage workflow (test → build → push to Docker Hub) that runs on every push to `main`
- Set up the **AWS EC2 deployment** and the pull-and-restart deploy script
- Contributed significantly to the **backend architecture** and database layer — co-designed the MongoDB schema and Atlas Vector Search setup alongside Rohit
- Was the only team member with Docker/CI expertise and was instrumental in making the project deployable

---

### Lagan Gupta — Frontend Developer
**Email:** guptalagan43@gmail.com  
**Role:** Frontend UI/UX Development

- **Built and designed the entire frontend** — all pages, components, and layouts
- Implemented the **custom CSS design system** with dark/light mode, responsive layouts, and theme-aware styling
- Created **GSAP animations** and micro-interactions for a premium user experience
- Built the **React Three Fiber 3D hero scene** on the landing page
- Implemented all major UI components: YakshaChat widget, FAQ Dashboard, Leaderboard, Notification Panel, Admin Panel layouts, Analytics Dashboard (Recharts), and all moderation cards
- Set up the **complete routing architecture** using TanStack Router
- **Co-led debugging efforts** — identified and resolved multiple UI-side bugs alongside Rohit and Lakshya

---

### Lakshya Agarwal — QA & Bug Fixes
**Email:** agarwallakshya561@gmail.com  
**Role:** Quality Assurance, Bug Reporting & Fixing

- Conducted extensive **end-to-end testing** of the application
- **Identified and documented 3–4 critical bugs** that were blocking core user flows
- Went beyond just reporting — **directly fixed several bugs** in the codebase, making him a dual-role QA + developer contributor
- Part of the **debugging taskforce** alongside Rohit and Lagan

---

### Nishita Singh — QA Documentation Lead
**Email:** nishitasingh150@gmail.com  
**Role:** Bug Tracking, Documentation

- **Compiled all reported bugs** from the QA team into a structured, trackable format
- Maintained a living bug tracker — marking issues as open, in-progress, or resolved as fixes were applied
- **Contributed to backend testing** by verifying API responses and reporting inconsistencies
- Ensured the team never lost track of any bug through systematic documentation

---

### Jasvinder Kaur — QA & Backend Testing
**Email:** kaurdetaur9718@gmail.com  
**Role:** QA, Bug Reporting, Backend Verification

- Identified a **large volume of bugs** across both frontend and backend flows
- Focused heavily on backend API testing — validating endpoint responses, edge cases, and error states
- Bug reports were directly acted upon by Rohit and Lakshya for fixes

---

### Sahil — Frontend QA & Testing
**Email:** sahilgarg3101@gmail.com  
**Role:** Frontend Testing, Bug Reporting

- Contributed to **frontend testing** — validating UI behaviour across different flows
- Reported UI/UX issues that were incorporated into Lagan's frontend fixes
- Part of the broader QA effort that ensured a polished final product

---

### Bhavya Agarwal — Database Support
**Email:** bhavyaagarwal97300@gmail.com  
**Role:** Database Assistance

- Participated in the **database design discussions** and helped with schema exploration
- Provided support during the MongoDB setup phase

---

### Deepak Thakur — Database Support
**Email:** deepu14112005@gmail.com  
**Role:** Database Assistance

- Assisted with **database-related tasks** during the early phases of the project
- Contributed to initial schema planning discussions

---

### Nandini Raj Srivastava — Frontend Support
**Email:** nandinirajsrivastava@gmail.com  
**Role:** Frontend Assistance

- Assisted with **frontend exploration and initial UI testing**
- Contributed to early-stage discussions on page layout and structure

---

## 8. Summary of Contributions Matrix

| Team Member | Frontend | Backend | Database | DevOps/CI-CD | Debugging | QA/Testing | Docs |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Rohit B Lakshmanan (Lead) | ✅ | ✅✅ | ✅✅ | | ✅✅ | ✅ | |
| Adnan Zeya | | ✅✅ | ✅✅ | ✅✅ | ✅ | | |
| Lagan Gupta | ✅✅ | | | | ✅✅ | ✅✅ | |
| Lakshya Agarwal | ✅ | ✅ | | | ✅✅ | ✅✅ | |
| Nishita Singh | | ✅ | | | | ✅✅ | ✅✅ |
| Jasvinder Kaur | | ✅ | | | | ✅✅ | |
| Sahil | ✅ | | | | | ✅ | |
| Bhavya Agarwal | | | ✅ | | | | |
| Deepak Thakur | | | ✅ | | | | |
| Nandini Raj Srivastava | ✅ | | | | | | |

*(✅✅ = primary contributor, ✅ = contributor)*

---

## 9. What We're Most Proud Of

1. **The RAG Pipeline** — A production-grade AI retrieval system using real vector embeddings and MongoDB Atlas Vector Search. This is far beyond a standard student project.
2. **The Fallback Architecture** — Three layers of graceful degradation ensure the app never fully breaks, even when API keys run out (which has happened in testing, and the fallback saved us).
3. **CI/CD from Day One** — Every commit to `main` is automatically tested, built into Docker images, and pushed to Docker Hub. This is professional DevOps practice.
4. **The Gamification System** — Spurti Points rewards, leaderboards, and peer-answering create a real incentive loop for student engagement.
5. **The Admin Moderation Workflow** — A proper maker-checker flow where student submissions go through admin review before becoming official FAQs. This mirrors real enterprise content workflows.
6. **Volume and Quality of FAQs** — 168 official FAQs seeded across 24 categories, all with vector embeddings for semantic search.

---

## 10. Known Limitations / Future Work

| Area | Status | Notes |
|---|---|---|
| Firebase Auth (Google Sign-in) | ⚠️ Partial | UI wired; backend guard uses prototype bypass for demo |
| OTP Verification | ⚠️ Partial | UI step implemented; accepts `123456` for demo |
| Gemini API Credits | ⚠️ Exhausted | App currently uses Minimax fallback → text search fallback |
| Session Management | ⚠️ localStorage | Production should use HTTP-only JWT cookies |
| Email Notifications | 🔜 Planned | Currently in-app only |
| SP Badge Visuals | 🔜 Planned | Points system in place; visual badges not yet rendered |

---

*Submitted by: Rohit B Lakshmanan (Team Lead, CS29)*  
*Date: June 2026*
