# Vicharanashala FAQ Portal

> A knowledge base that works for you — not the other way around.

**Ask. Raise. Resolve. Promote.** — the complete student-support lifecycle on a single platform, powered by a real RAG (Retrieval-Augmented Generation) AI pipeline, a three-tier fallback so it never breaks, and a gamified reputation system built on Spurti Points.

Built as part of the Vicharanashala Internship Programme (VINS) at IIT Ropar by **Team CS29**.

---

## 📁 Documentation (`docs/`)

Three reference documents live in the [`docs/`](docs/) folder:

| Document | What it covers |
|---|---|
| [`Project_Report.md`](docs/Project_Report.md) | **Full project report** — title page, executive summary, system architecture diagrams, tech stack justification, feature breakdown, challenges, and future enhancements. The formal submission document for the VINS programme. |
| [`PRODUCT.md`](docs/PRODUCT.md) | **Every single file in the codebase explained** — what each file owns, why it exists, and how it fits into the architecture. Start here if you're reading the code for the first time. |
| [`Project_Completion_Document.md`](docs/Project_Completion_Document.md) | **Full team report** — features implemented, architecture breakdown, individual contribution details per team member, and the contribution matrix. Written as the Week 4 programme deliverable. |
| [`README_original.md`](docs/README_original.md) | **The original README** preserved for reference — the quick-start version written at the start of the project before the feature set was fully built out. |

---

## What is the Vicharanashala FAQ Portal?

Students joining the VINS programme face hundreds of recurring questions — about certificates, NOCs, timelines, submission deadlines, and more. Instead of answers living in a scattered mix of Samagama threads, WhatsApp groups, and word-of-mouth, this platform centralises everything:

- A **curated FAQ database** of 168 official VINS questions, semantically indexed and always up to date
- **Yaksha Mini** — an AI chatbot that answers from the FAQ first, with voice input support, and never returns a dead-end
- A **raise-and-resolve pipeline** so unanswered questions become future FAQs through peer contribution and admin moderation
- A **Spurti Points leaderboard** that rewards students who contribute good answers
- A **full admin control panel** with analytics, moderation, and one-click FAQ promotion

The big idea: instead of a static FAQ that goes stale, this is a living knowledge base — community answers get promoted back into the canonical FAQ, and the AI gets smarter over time as more content is embedded.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + TypeScript |
| **Routing** | TanStack Router v1 |
| **Data Fetching** | TanStack Query v5 |
| **Backend** | NestJS (Express adapter) |
| **ORM** | Mongoose (MongoDB ODM) |
| **Database** | MongoDB Atlas (cloud, replica set) |
| **Authentication** | Firebase Authentication (Email/Password + Google Sign-in) |
| **AI — Chat** | Google Gemini 2.5 Flash (primary) → Minimax M2.7 via Samagama proxy (fallback) |
| **AI — Embeddings** | `gemini-embedding-001` (3072-dim vectors) |
| **Vector Search** | MongoDB Atlas Vector Search (cosine similarity) |
| **3D Graphics** | React Three Fiber + Three.js |
| **Animations** | GSAP (GreenSock) |
| **Charts** | Recharts |
| **Containerisation** | Docker + Docker Compose |
| **CI / CD** | GitHub Actions (3-stage: test → build → push) |
| **Hosting** | AWS EC2 + Docker Hub + MongoDB Atlas |

---

## Feature Overview

### For Students

| Feature | What it does |
|---|---|
| **FAQ Browse & Search** | 168+ official VINS FAQs across 24 categories — keyword search, category filter, and a "Most Asked" section sorted live by view count |
| **Bookmarking** | Save FAQs for quick personal reference |
| **Yaksha Mini (AI Chat)** | Floating chat widget backed by the full RAG pipeline; answers from the FAQ database first; includes **voice input** so you can speak your question |
| **Full Chat Page** | Dedicated full-page Yaksha chat at `/chat` |
| **Raise Issue** | Submit a question not covered by existing FAQs; the system serves an AI-generated draft answer plus similar FAQ hints _before_ you post — to prevent duplicates |
| **Similar FAQ Hints** | While typing, the system shows semantically similar existing FAQs in real time |
| **Track Issues** | See the live status of your raised issues: Pending → Approved → Published as FAQ / Rejected |
| **Peer Answer** | Submit answers to open community questions; accepted answers are promoted to official FAQs by admins |
| **Spurti Points Leaderboard** | Ranked by SP earned for answered questions and published contributions, with real-time updates |
| **Notifications Bell** | Real-time notification panel with read/unread state, mark-all-read, and admin-broadcast support |
| **Announcements** | Admin-broadcast messages visible to all users |
| **User Profile** | SP balance, number of questions asked, and answers given |
| **Light / Dark Mode** | Persistent theme toggle across the entire application |
| **Register & Login** | Email/password and Google Sign-in with OTP verification step |

### For Admins

| Feature | What it does |
|---|---|
| **Analytics Dashboard** | Live KPIs: total FAQs, total views, open issues, weekly activity chart, top FAQ list |
| **FAQ Management** | Full CRUD on the FAQ database — create, edit, delete, and view per-FAQ view metrics |
| **Pending Query Moderation** | Review student-raised issues; approve (auto-published as FAQ) or reject |
| **Pending Answer Moderation** | Review peer-submitted answers; approve (published as FAQ response + SP awarded to author) or reject |
| **Broadcast Announcements** | Push system-wide announcements; all users receive a notification instantly |
| **FAQ Promoter** | Promote any resolved community issue directly into the canonical FAQ database |

### Under the Hood

| Feature | What it does |
|---|---|
| **RAG Pipeline** | Query → Gemini embedding (3072-dim vector) → MongoDB Atlas Vector Search → Top-3 matched FAQs → LLM synthesises a contextual, persona-driven answer |
| **Three-Tier AI Fallback** | Gemini (3 retries, exponential back-off on 429/503) → Minimax via Samagama proxy → MongoDB keyword text search — the app never returns a blank response |
| **Unknown Query Auto-Queuing** | When the AI cannot confidently answer, it queues the question into `pending_faqs` for admin review — students always get Yaksha's best-effort draft, not a dead end |
| **SP (Spurti Points) Reward System** | Idempotent SP awards: students earn points exactly once per accepted answer and per published FAQ contribution — no double-counting |
| **Issue Threading** | Full reply thread on every issue, supporting conversation between students and admins |
| **Notification Broadcasting** | Admins can send notifications to every registered user in one action |
| **FAQ Embedding Generation** | CLI scripts generate and store 3072-dim Gemini embeddings for all 168 seeded FAQs, enabling semantic search from day one |
| **MongoDB Atlas Vector Index** | Auto-created at startup via `createSearchIndex` with cosine similarity; gracefully degrades to keyword text search if the cluster tier doesn't support it |
| **Graceful Degradation** | Every AI feature degrades cleanly; the app is fully usable for browsing and issue management with zero API keys |
| **Docker & Docker Compose** | Separate Dockerfiles for frontend (Nginx + SPA fallback) and backend (NestJS); local compose builds from source; production compose uses pre-built Docker Hub images |
| **GitHub Actions CI/CD** | Three-stage pipeline on every push to `main`: backend tests → frontend type-check + build → Docker image build + push to Docker Hub |
| **FAQ Seed Script** | 168 official VINS/Samagama FAQs across 24 categories, seeded into MongoDB in a single command |
| **Nginx Reverse Proxy** | SPA fallback routing + `/api` proxy from port 80 → backend port 3001; no cross-origin issues in production |
| **GSAP Animations** | Smooth page-entry transitions and micro-interactions for a premium feel |
| **React Three Fiber 3D Scene** | An animated 3D hero on the landing page, rendered entirely in the browser using Three.js |

---

## How Yaksha Mini Works

Yaksha is the AI assistant embedded in the platform. It is not a generic chatbot — it is a **domain-specific, FAQ-grounded assistant** that always answers from curated content first.

```
Student types or speaks a question
         │
         ▼
  ┌─ Step 1: Gemini Embedding ──────────────────────┐
  │  The question is converted to a 3072-dim vector  │
  └──────────────────────────────────────────────────┘
         │
         ▼
  ┌─ Step 2: MongoDB Atlas Vector Search ───────────┐
  │  Cosine similarity search across all 168 FAQs   │
  │  → Top-3 semantically closest FAQs retrieved    │
  └──────────────────────────────────────────────────┘
         │
         ▼
  ┌─ Step 3: RAG Prompt Construction ───────────────┐
  │  Yaksha persona + top-3 FAQs + student question  │
  └──────────────────────────────────────────────────┘
         │
         ▼
  ┌─ Step 4: LLM Call ──────────────────────────────┐
  │  Primary:  Gemini 2.5 Flash (3 retries)          │
  │  Fallback: Minimax M2.7 via Samagama proxy       │
  └──────────────────────────────────────────────────┘
         │
         ▼
  ┌─ Step 5: Response Parsing ──────────────────────┐
  │  "unknown" JSON → auto-queued to pending_faqs    │
  │  Answer + matched FAQ sources returned to user   │
  └──────────────────────────────────────────────────┘
```

**The fallback chain ensures the app never breaks:**

```
Gemini  (429 / 503 retryable, 3 attempts, exponential back-off)
   ↓ fails
Minimax via Samagama proxy  (20 s timeout)
   ↓ fails
MongoDB keyword text search  (zero AI dependency — always available)
```

When the Gemini API key is exhausted (as it currently is), the app automatically falls back to Minimax, and if that fails too, it serves keyword-matched FAQ results directly. Students never see an error screen.

---

## Raise Issue → FAQ: The Promotion Pipeline

Every unresolved question a student raises can eventually become an official FAQ entry. Here is how:

```
Student raises issue
       │
       ▼
AI generates draft answer + shows similar existing FAQs
       │
       ├─ Student sees a match → no duplicate posted
       │
       └─ No match → issue posted (Open)
                │
                ▼
         Community peer answer submitted
                │
                ▼
         Admin reviews in moderation queue
                │
                ├─ Approved → answer published, SP awarded to author
                │
                └─ Promoted → becomes a new canonical FAQ entry
```

---

## CI / CD Pipeline

```
git push → main
     │
     ├─ Job 1 · backend-test
     │         npm ci → nest build → jest (in-memory test DB)
     │
     ├─ Job 2 · frontend-build
     │         npm ci → tsc --build → vite build
     │
     └─ Job 3 · build-and-push  (only on main push, after Jobs 1+2 pass)
               Docker build backend  → push to Docker Hub
               Docker build frontend → push to Docker Hub
                        │
                        ▼
                   EC2 server
            bash deploy.sh  (docker pull + docker-compose up -d)
```

---

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| Node.js | v20 or later |
| npm | v10 or later (bundled with Node 20) |
| MongoDB | Atlas account (free M0 tier is fine; M10+ required for Atlas Vector Search) |
| Firebase project | Email/Password + Google auth enabled |
| Gemini API key | [aistudio.google.com](https://aistudio.google.com) — prepaid credits needed for production |
| Minimax API key | Optional — Gemini fallback works without it |

---

## Local Setup

### 1. Clone

```bash
git clone https://github.com/vicharanashala/cs29.git
cd cs29
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3001
MONGO_URI=<your_mongodb_atlas_connection_string>
GEMINI_API_KEY=<your_gemini_api_key>
MINIMAX_API_KEY=<your_minimax_api_key>
FIREBASE_PROJECT_ID=<your_firebase_project_id>
FIREBASE_CLIENT_EMAIL=<your_firebase_admin_client_email>
FIREBASE_PRIVATE_KEY="<your_firebase_admin_private_key>"
```

Start in development mode:

```bash
npm run start:dev
```

Backend API available at `http://localhost:3001`.

### 3. Seed the FAQ database *(once)*

```bash
npx ts-node -r tsconfig-paths/register seed.ts
```

Clears and re-inserts all 168 FAQs. Run again only if you want to reset data.

### 4. Generate FAQ embeddings *(once, after seed)*

```bash
npx ts-node -r tsconfig-paths/register scripts/generate-embeddings.ts
```

Calls Gemini to generate 3072-dim vectors for every FAQ and stores them in MongoDB. Required for the RAG pipeline to work.

To re-embed after key rotation:

```bash
npx ts-node -r tsconfig-paths/register scripts/reembed-faqs.ts
```

### 5. Create the admin account *(once)*

```bash
npx ts-node -r tsconfig-paths/register src/scripts/create-admin.ts
```

| Field | Value |
|---|---|
| Email | `admin@vicharanashala.in` |
| Password | `Admin@2026` |

Creates the user in both Firebase Auth and MongoDB.

### 6. Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=<your_firebase_web_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<project_id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your_firebase_project_id>
VITE_FIREBASE_STORAGE_BUCKET=<project_id>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<your_messaging_sender_id>
VITE_FIREBASE_APP_ID=<your_firebase_app_id>
```

```bash
npm run dev
```

### 7. Open the app

| URL | Description |
|---|---|
| `http://localhost:3000` | Public portal (Vite dev server) |
| `http://localhost:3000/admin` | Admin panel |
| `http://localhost:3000/login` | Login |
| `http://localhost:3000/register` | Student registration |
| `http://localhost:3000/chat` | Full-page Yaksha chat |
| `http://localhost:3000/leaderboard` | Spurti Points leaderboard |
| `http://localhost:3000/raise-issue` | Raise a new issue |
| `http://localhost:3000/track-issues` | Track your issues |

---

## Running with Docker

```bash
# Local — builds from source
docker compose up --build

# Production — uses pre-built images from Docker Hub
cd deploy
docker compose -f docker-compose.prod.yml up -d
```

---

## Project Structure — File by File

```
cs29/
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   │   └── ai.service.ts           # The entire RAG pipeline lives here:
│   │   │                               # embedding generation, vector search,
│   │   │                               # text-search fallback, Gemini + Minimax
│   │   │                               # LLM calls with retry + backoff, response
│   │   │                               # parsing, and unknown-query auto-queuing.
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts      # Thin REST wrapper — delegates to auth.service
│   │   │   ├── auth.module.ts          # NestJS module wiring for the auth domain
│   │   │   ├── auth.service.ts         # Login / signup business logic; password hashing
│   │   │   ├── firebase-auth.guard.ts  # Guards endpoints that require a Firebase ID token;
│   │   │   │                           # uses prototype bypass in dev (no real Firebase needed)
│   │   │   ├── firebase.service.ts     # Firebase Admin SDK wrapper — verifies ID tokens
│   │   │   ├── jwt.guard.ts            # Passport-JWT guard for local-session endpoints
│   │   │   ├── jwt.strategy.ts         # Extracts and validates the JWT from Authorization header
│   │   │   ├── roles.decorator.ts      # @Roles() metadata decorator for RBAC
│   │   │   └── roles.guard.ts          # Checks the decoded JWT role against @Roles() metadata
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.controller.ts     # Admin-only REST endpoints (stats, pending list,
│   │   │   │                           # approve/reject, FAQ CRUD)
│   │   │   ├── admin.module.ts         # NestJS module for the admin domain
│   │   │   └── admin.service.ts        # Admin business logic — approve/reject with SP award,
│   │   │                               # FAQ promotion, delete
│   │   │
│   │   ├── faqs/
│   │   │   └── schemas/
│   │   │       ├── faq.schema.ts       # Mongoose schema for the canonical FAQ collection:
│   │   │       │                       # question, answer, answer_hi, category, tags,
│   │   │       │                       # view_count, embedding (3072-dim Float32 array)
│   │   │       └── pending-faq.schema.ts  # Schema for questions auto-queued by Yaksha
│   │   │                                  # when it cannot answer (status: PENDING)
│   │   │
│   │   ├── users/
│   │   │   └── schemas/
│   │   │       └── user.schema.ts      # User schema: email, name, role (STUDENT/ADMIN),
│   │   │                               # reward_points, answered_count, questions_asked
│   │   │
│   │   ├── notifications/
│   │   │   └── schemas/
│   │   │       └── notification.schema.ts  # Per-user notification: title, message,
│   │   │                                    # type, isRead flag, createdAt
│   │   │
│   │   ├── pending-approvals/
│   │   │   └── schemas/
│   │   │       └── pending-approval.schema.ts  # Items waiting for admin moderation:
│   │   │                                        # type (QUERY or ANSWER), content,
│   │   │                                        # submittedBy, status, spAwarded flag
│   │   │
│   │   ├── app.module.ts               # Root NestJS module — registers all feature
│   │   │                               # modules, MongooseModule connections, and
│   │   │                               # the global ConfigModule
│   │   ├── app.controller.ts           # Health-check endpoint (GET /)
│   │   ├── app.service.ts              # Minimal root service
│   │   ├── auth.controller.ts          # Top-level auth routes (/api/auth/*)
│   │   ├── chat.controller.ts          # POST /api/chat — receives {question}, calls
│   │   │                               # AiService.getAnswer(), returns {answer, matchedFaqs}
│   │   ├── faq.controller.ts           # All FAQ routes: CRUD, /analytics, /top, /categories,
│   │   │                               # /similar (RAG), PATCH /:id/view, POST /:id/rate
│   │   ├── issue.controller.ts         # Issue CRUD, replies, status transitions, and
│   │   │                               # idempotent SP award on first resolution
│   │   ├── notifications.controller.ts # GET/PATCH notifications per user,
│   │   │                               # POST /broadcast for admin
│   │   ├── rewards.controller.ts       # Leaderboard, per-user SP balance, award SP
│   │   └── main.ts                     # NestJS bootstrap: CORS, global prefix (/api),
│   │                                   # listen on PORT env var
│   │
│   ├── scripts/
│   │   ├── create-admin.ts             # One-shot script: creates admin in Firebase Auth
│   │   │                               # and MongoDB — run once per environment
│   │   ├── generate-embeddings.ts      # Iterates all FAQs, calls Gemini embedding API,
│   │   │                               # stores 3072-dim vectors — run once after seed
│   │   └── reembed-faqs.ts             # Re-runs embedding for all FAQs (use after
│   │                                   # API key rotation or model changes)
│   │
│   ├── seed.ts                         # Drops and re-inserts all 168 VINS FAQs
│   │                                   # across 24 categories — idempotent if run again
│   ├── migrate-embeddings.ts           # Migration helper: adds embedding fields to
│   │                                   # existing FAQ documents that predate the RAG feature
│   ├── Dockerfile                      # Multi-stage Node.js build → production image
│   └── nest-cli.json                   # NestJS CLI config (source root, assets)
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts               # Axios instance with base URL from VITE_API_URL;
│   │   │   │                           # request interceptor attaches the user's auth token
│   │   │   ├── auth.ts                 # Auth API calls: login, signup, get/update user profile
│   │   │   ├── faqs.ts                 # FAQ API calls: fetch all, fetch top, fetch by category
│   │   │   └── admin.ts                # Admin API calls: stats, pending list, approve/reject
│   │   │
│   │   ├── components/
│   │   │   ├── FaqDashboard.tsx        # Main FAQ list view: search input, category sidebar,
│   │   │   │                           # "Most Asked" section, FAQ cards with view-count badge
│   │   │   ├── YakshaChat.tsx          # The floating AI chat widget — the largest component
│   │   │   │                           # (33 KB): manages conversation state, voice input via
│   │   │   │                           # Web Speech API, streaming-style display, and the
│   │   │   │                           # matched-FAQ citation cards below each answer
│   │   │   ├── Leaderboard.tsx         # Top-10 SP leaderboard table with rank badges and
│   │   │   │                           # animated row highlights
│   │   │   ├── SimilarFaqsHint.tsx     # Shown inside RaiseIssuePage: fires /api/faqs/similar
│   │   │   │                           # as the user types; displays matching FAQs inline to
│   │   │   │                           # discourage duplicate submissions
│   │   │   ├── NotificationPanel.tsx   # Slide-in notification drawer: lists unread first,
│   │   │   │                           # per-notification mark-read, and mark-all-read button
│   │   │   ├── Header.tsx              # Top navigation bar: logo, nav links, notification bell
│   │   │   │                           # with unread badge, theme toggle, user avatar + menu
│   │   │   ├── Footer.tsx              # Site-wide footer with links and programme branding
│   │   │   ├── Layout.tsx              # Page shell: wraps every authenticated page with
│   │   │   │                           # Header + Footer and a max-width content container
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.tsx         # Admin-section shell with its own sidebar nav
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── AnalyticsDashboard.tsx  # Admin home: Recharts bar chart (weekly
│   │   │   │   │   │                            # activity), stat cards, category breakdown
│   │   │   │   │   └── TopFAQsList.tsx          # Table of top-5 FAQs by view count
│   │   │   │   ├── faq/
│   │   │   │   │   ├── FAQManagement.tsx        # Admin FAQ list with inline edit/delete
│   │   │   │   │   └── FAQPromoterCard.tsx       # Card UI for promoting an issue to FAQ
│   │   │   │   ├── moderation/
│   │   │   │   │   ├── QueryModerator.tsx        # Pending query review list (approve/reject)
│   │   │   │   │   ├── AnswerReviewList.tsx      # Pending answer review list (approve/reject)
│   │   │   │   │   ├── QueryApprovalCard.tsx     # Single pending-query card with action buttons
│   │   │   │   │   └── AnswerApprovalCard.tsx    # Single pending-answer card with action buttons
│   │   │   │   └── announcements/
│   │   │   │       └── AnnouncementForm.tsx      # Rich text form to compose + broadcast
│   │   │   │                                     # a system-wide announcement
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── GoogleAuthModal.tsx    # Modal for Google Sign-in flow
│   │   │   │   └── OtpVerification.tsx    # OTP entry step shown after email registration
│   │   │   │
│   │   │   └── three/
│   │   │       └── CoreScene.tsx          # React Three Fiber scene: animated 3D geometry
│   │   │                                  # rendered in the landing page hero section
│   │   │
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx         # Public-facing hero page with 3D scene, feature
│   │   │   │                           # highlights, and CTA buttons — shown to unauthenticated
│   │   │   │                           # visitors; the largest page component (26 KB)
│   │   │   ├── Dashboard.tsx           # Authenticated home: user greeting, quick-action cards,
│   │   │   │                           # recent FAQs, and notification summary
│   │   │   ├── FaqPage.tsx             # Individual FAQ detail view: question, answer, related
│   │   │   │                           # FAQs fetched via /similar, and view-count increment
│   │   │   ├── ChatPage.tsx            # Wrapper page that renders YakshaChat in full-page mode
│   │   │   ├── LeaderboardPage.tsx     # Full Spurti Points leaderboard page
│   │   │   ├── RaiseIssuePage.tsx      # Multi-step issue submission: text input, AI hint
│   │   │   │                           # display (SimilarFaqsHint), AI draft answer preview,
│   │   │   │                           # category select, and confirm submit
│   │   │   ├── ResolveQuestionPage.tsx # Peer-answer submission page: shows the open issue,
│   │   │   │                           # answer text editor, and submits for admin moderation
│   │   │   ├── TrackIssuesPage.tsx     # Issue tracking dashboard: filterable list of the
│   │   │   │                           # user's raised issues with status pills and reply view
│   │   │   ├── AnnouncementsPage.tsx   # Lists all active admin announcements
│   │   │   ├── LoginPage.tsx           # Email/password login + Google Sign-in
│   │   │   ├── RegisterPage.tsx        # Student registration form
│   │   │   ├── SignupPage.tsx          # Alternative signup flow (Google-first)
│   │   │   ├── ForgotPasswordPage.tsx  # Password-reset request form
│   │   │   ├── ProfilePage.tsx         # User profile: SP stats, questions asked,
│   │   │   │                           # answers given, and account settings
│   │   │   ├── AdminPage.tsx           # Route wrapper that renders the admin layout
│   │   │   ├── AdminDashboard.tsx      # Admin panel home — renders AnalyticsDashboard
│   │   │   └── PlaceholderPage.tsx     # Generic placeholder for routes under construction
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.tsx         # Global auth state: current user object, login(),
│   │   │   │                           # logout(), and the Firebase onAuthStateChanged listener
│   │   │   ├── ThemeContext.tsx         # Light/dark mode state + toggle; persisted to
│   │   │   │                           # localStorage and applied as a data-theme attribute
│   │   │   └── LanguageContext.tsx      # Language preference context (en/hi); used by
│   │   │                               # translations/ for content switching
│   │   │
│   │   ├── translations/
│   │   │   ├── en.ts                   # English content strings and FAQ data
│   │   │   └── hi.ts                   # Hindi content strings (partial, in progress)
│   │   │
│   │   ├── styles/                     # Shared CSS modules and design tokens
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── App.tsx                     # Root component: wraps everything in context providers
│   │   │                               # (Auth, Theme, Language, QueryClient) and renders router
│   │   ├── router.tsx                  # TanStack Router definition: all route → page mappings,
│   │   │                               # auth guards (redirect unauthenticated to /login,
│   │   │                               # redirect non-admins away from /admin)
│   │   ├── firebase.ts                 # Firebase app initialisation using VITE_FIREBASE_* env vars
│   │   ├── queryClient.ts              # TanStack Query client configuration (stale times, retries)
│   │   ├── main.tsx                    # React DOM mount point — renders <App /> into #root
│   │   ├── App.css                     # Global app-level styles
│   │   ├── index.css                   # CSS reset and root variables
│   │   ├── mobile.css                  # Responsive breakpoint overrides for small screens
│   │   └── reference.css               # Design reference sheet (not imported at runtime)
│   │
│   ├── Dockerfile                      # Multi-stage build: Vite build → Nginx Alpine image
│   │                                   # with nginx.conf for SPA routing + API proxy
│   └── nginx.conf                      # Nginx config: serves the Vite SPA from /,
│                                       # proxies /api/* to backend:3001, and redirects
│                                       # all unknown paths back to index.html
│
├── deploy/
│   ├── deploy.sh                       # Shell script run on the EC2 instance: pulls the
│   │                                   # latest Docker images from Docker Hub and restarts
│   │                                   # containers via docker-compose
│   └── docker-compose.prod.yml         # Production Compose file: uses pre-built images
│                                       # from Docker Hub (no build step on the server)
│
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions pipeline: three jobs
│                                       # (backend-test, frontend-build, build-and-push)
│                                       # triggered on every push or PR to main
│
├── docs/
│   ├── diagrams/                       # Rendered PNG exports of all architecture diagrams
│   │   ├── system-architecture.png     # System component architecture (client, server, DB, AI)
│   │   ├── rag-pipeline.png            # Yaksha Mini RAG pipeline flowchart
│   │   └── moderation-workflow.png     # Maker-checker crowdsourced FAQ workflow
│   ├── README_original.md              # The original README (preserved)
│   ├── Project_Report.md               # Full formal project report (VINS submission)
│   └── Project_Completion_Document.md  # Full team report: features, contributions, architecture
│
├── docker-compose.yml                  # Local development Compose: builds both services
│                                       # from source; backend on :3001, frontend on :80
├── project_spec.md                     # Original project blueprint and agent instructions
│                                       # used during development
└── .gitignore                          # Ignores node_modules, .env, dist, .DS_Store
```

---

## Database Schemas

| Collection | Key Fields |
|---|---|
| `User` | `email`, `name`, `firstName`, `lastName`, `role` (STUDENT / ADMIN), `reward_points`, `answered_count`, `questions_asked` |
| `Faq` | `question`, `answer`, `answer_hi`, `category`, `tags[]`, `view_count`, `embedding` (3072-dim Float32 array), `createdAt`, `updatedAt` |
| `PendingFaq` | `question`, `suggestedAnswer`, `category`, `createdAt` |
| `Issue` | `title`, `description`, `raisedBy`, `status` (open / resolved / closed), `resolution`, `replyCount`, `spAwarded`, `createdAt` |
| `IssueReply` | `issueId`, `repliedBy`, `content`, `createdAt` |
| `Notification` | `userEmail`, `title`, `message`, `type`, `isRead`, `createdAt` |
| `PendingApproval` | `type` (QUERY / ANSWER), `issueId`, `content`, `submittedBy`, `authorEmail`, `status` (PENDING / APPROVED / REJECTED), `spAwarded`, `createdAt` |

---

## Full API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register a new student account |
| POST | `/api/auth/login` | — | Login — returns user object |
| GET | `/api/users/:email` | — | Fetch user profile |
| PATCH | `/api/users/:email` | — | Update user profile |
| POST | `/api/auth/sync` | Firebase token | Sync a Firebase user into MongoDB |

### FAQs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/faqs` | All 168+ published FAQs |
| GET | `/api/faqs/top` | Top 5 FAQs by view count |
| GET | `/api/faqs/analytics` | `{ totalFaqs, totalViews, topFaqs[], categoryBreakdown[] }` |
| GET | `/api/faqs/categories` | All categories with FAQ counts |
| POST | `/api/faqs` | *(admin)* Create a new FAQ |
| PUT | `/api/faqs/:id` | *(admin)* Update an existing FAQ |
| DELETE | `/api/faqs/:id` | *(admin)* Delete a FAQ |
| PATCH | `/api/faqs/:id/view` | Increment view count (once per session) |
| POST | `/api/faqs/:id/rate` | Rate a FAQ (helpful / not helpful) |
| POST | `/api/faqs/similar` | Find similar FAQs — RAG embedding → vector search → text search fallback |

### Chat / AI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | RAG chat — `{ question }` → `{ answer, matchedFaqs[] }` |

### Issues

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/issues` | All issues (filter by `?status=` or `?raisedBy=`) |
| GET | `/api/issues/:id` | Single issue with all replies |
| POST | `/api/issues` | Raise a new issue |
| PATCH | `/api/issues/:id/status` | Update status — awards SP idempotently on first resolution |
| POST | `/api/issues/:id/replies` | Add a reply to an issue thread |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/:email` | All notifications for a user |
| PATCH | `/api/notifications/:id/read` | Mark one notification as read |
| PATCH | `/api/notifications/read-all/:email` | Mark all as read |
| POST | `/api/notifications/broadcast` | *(admin)* Broadcast to all users |

### Rewards / Leaderboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rewards/leaderboard` | Top 10 students by SP |
| GET | `/api/rewards/my-points/:email` | User's current SP balance and stats |
| POST | `/api/rewards/answer/:email` | Award SP for an accepted answer |

### Admin *(requires ADMIN role)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | `{ totalFaqs, pendingCount, resolvedToday }` |
| GET | `/api/admin/pending` | All pending items for moderation |
| PATCH | `/api/admin/pending/:id/approve` | Approve → publish as FAQ + award SP |
| PATCH | `/api/admin/pending/:id/reject` | Reject pending item |
| GET | `/api/admin/faqs` | All FAQs (admin view with full metadata) |
| POST | `/api/admin/faqs` | Create a new FAQ directly |
| DELETE | `/api/admin/faqs/:id` | Delete a FAQ |

---

## Deployment

### GitHub Actions Secrets & Variables

Configure in **Settings → Secrets and variables → Actions**:

| Name | Type | Value |
|---|---|---|
| `DOCKER_USERNAME` | Secret | Docker Hub username |
| `DOCKER_PASSWORD` | Secret | Docker Hub access token |
| `VITE_FIREBASE_API_KEY` | Secret | Firebase web API key |
| `VITE_API_URL` | Variable | `http://<ec2-ip>:3001` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Variable | `<project_id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Variable | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Variable | `<project_id>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Variable | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Variable | Firebase app ID |

### EC2 Security Group — Required Inbound Rules

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | Your IP | SSH access |
| 80 | TCP | 0.0.0.0/0 | Frontend (HTTP via Nginx) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (optional) |
| 3001 | TCP | 0.0.0.0/0 | Backend API |

### Deploying to EC2

```bash
ssh ubuntu@<ec2-ip>
export DOCKER_USERNAME=yourdockerhubusername
bash /home/ubuntu/deploy.sh
```

---

## FAQ Database

The portal ships with **168 official VINS/Samagama FAQs** across **24 categories**:

About the Internship · Badges · Certificate · Co-curricular · Curriculum · Environment Setup · Experience · Financials · Fortnightly Reviews · Holidays · How to Apply · Infrastructure · Miscellaneous · NOC · Placements · Post-VINS · Projects · Rules · Security · Submission · Technical · Time Commitment · Work

All 168 FAQs are pre-embedded (3072-dim Gemini vectors) and stored in MongoDB, so semantic search and the RAG chatbot work from day one — no live AI calls needed for browsing.

---

## Known Limitations

| Area | Status | Notes |
|---|---|---|
| Firebase Auth (Google Sign-in) | ⚠️ Partial | UI fully wired; backend `FirebaseAuthGuard` uses a prototype bypass for dev. Real Firebase config needed for production. |
| OTP verification | ⚠️ Partial | Frontend OTP step exists; accepts `123456` for demo. Real SMS delivery requires Twilio or AWS SNS. |
| Gemini API credits | ⚠️ Exhausted | App is running on Minimax → keyword-search fallback. Graceful degradation is working as designed. |
| Session management | ⚠️ Dev-only | Uses `localStorage`. Production should use HTTP-only secure cookies with JWT refresh. |
| Email notifications | 🔜 Planned | Notifications are in-app only. |
| SP badge visuals | 🔜 Planned | Spurti Points system is in place; visual badge icons on profiles not yet rendered. |
| Password reset | 🔜 Planned | `ForgotPasswordPage.tsx` exists; backend endpoint not yet implemented. |

---

## Team — CS29

| Name | Email | Primary Role |
|---|---|---|
| **Rohit B Lakshmanan** *(Team Lead)* | 23f1001156@ds.study.iitm.ac.in | Full-stack integration, database, RAG pipeline, debugging, GitHub |
| **Adnan Zeya** | az1513@srmist.edu.in | Docker, CI/CD, AWS deployment, backend architecture |
| **Lagan Gupta** | guptalagan43@gmail.com | Frontend UI/UX, GSAP animations, 3D scene, routing |
| **Lakshya Agarwal** | agarwallakshya561@gmail.com | QA + direct bug fixes, debugging taskforce |
| **Nishita Singh** | nishitasingh150@gmail.com | Bug tracking, QA documentation, backend testing |
| **Jasvinder Kaur** | kaurdetaur9718@gmail.com | QA, backend API testing, bug reporting |
| **Sahil** | sahilgarg3101@gmail.com | Frontend testing, UI bug reporting |
| **Bhavya Agarwal** | bhavyaagarwal97300@gmail.com | Database support |
| **Deepak Thakur** | deepu14112005@gmail.com | Database support |
| **Nandini Raj Srivastava** | nandinirajsrivastava@gmail.com | Frontend support |

---

## Future Work

- Full Firebase Auth integration (remove prototype bypass)
- Real SMS OTP via Twilio / AWS SNS
- Production-grade session management (HTTP-only JWT cookies)
- Email notifications alongside in-app ones
- SP badge visuals on user profiles
- Password-reset email flow
- Liquid Glass UI upgrade (`backdrop-filter: blur`)

---

## Documentation

The [`docs/`](docs/) folder contains four reference documents:

- [`docs/Project_Report.md`](docs/Project_Report.md) — the formal project report: title page, executive summary, system architecture diagrams, tech stack justification, feature breakdown, challenges, and future enhancements
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — every file in the codebase explained with a short description (what it does and why it exists)
- [`docs/Project_Completion_Document.md`](docs/Project_Completion_Document.md) — the full team completion report: features, architecture, and individual contribution breakdown
- [`docs/README_original.md`](docs/README_original.md) — the original quick-start README preserved for reference

---

## License

MIT © 2026 Vicharanashala / Team CS29