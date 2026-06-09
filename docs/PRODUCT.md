# PRODUCT.md — Vicharanashala FAQ Portal
## Complete File Reference · Team CS29

This document describes every source file in the project — what it is, what it owns, and why it exists. Use it as a map when navigating the codebase for the first time.

---

## Table of Contents

1. [Root](#1-root)
2. [Backend — Entry & Configuration](#2-backend--entry--configuration)
3. [Backend — AI / RAG Module](#3-backend--ai--rag-module)
4. [Backend — Authentication Module](#4-backend--authentication-module)
5. [Backend — Admin Module](#5-backend--admin-module)
6. [Backend — Controllers](#6-backend--controllers)
7. [Backend — Database Schemas](#7-backend--database-schemas)
8. [Backend — Scripts & Utilities](#8-backend--scripts--utilities)
9. [Frontend — Entry & Core](#9-frontend--entry--core)
10. [Frontend — API Layer](#10-frontend--api-layer)
11. [Frontend — Context Providers](#11-frontend--context-providers)
12. [Frontend — Pages](#12-frontend--pages)
13. [Frontend — Components: Core](#13-frontend--components-core)
14. [Frontend — Components: Admin](#14-frontend--components-admin)
15. [Frontend — Components: Auth](#15-frontend--components-auth)
16. [Frontend — Components: 3D Scene](#16-frontend--components-3d-scene)
17. [Frontend — Styles](#17-frontend--styles)
18. [Frontend — Hooks](#18-frontend--hooks)
19. [Frontend — Translations](#19-frontend--translations)
20. [Infrastructure & DevOps](#20-infrastructure--devops)

---

## 1. Root

| File | Description |
|---|---|
| `README.md` | Project overview, feature table, setup guide, full API reference, file structure, team table, and known limitations. The primary entry point for anyone new to the repository. |
| `project_spec.md` | Original project blueprint written at kick-off: defines the three core pages, the database schema requirements, and the AI fallback rule ("Try Minimax, catch → Gemini"). Used as the guiding spec during development. |
| `docker-compose.yml` | Local development Docker Compose file. Builds both the backend and frontend images from source and starts them together — backend on `:3001`, frontend served via Nginx on `:80`. |
| `.gitignore` | Tells Git to ignore `node_modules/`, `.env` files, `dist/` build output, macOS `.DS_Store` files, and other generated artifacts. |

---

## 2. Backend — Entry & Configuration

**Path:** `backend/`

| File | Description |
|---|---|
| `backend/src/main.ts` | The NestJS bootstrap file. Enables CORS so the frontend can call the API, sets the global route prefix to `/api`, and starts the HTTP server on the `PORT` environment variable (defaults to 3001). This is the first file Node.js executes. |
| `backend/src/app.module.ts` | The root NestJS module. Registers every feature module (Auth, Admin, AI, FAQs, Issues, Notifications, Rewards), connects to MongoDB via `MongooseModule.forRoot()`, and loads environment variables via `ConfigModule`. Everything that exists in the app is wired together here. |
| `backend/src/app.controller.ts` | Exposes a single `GET /` health-check endpoint that returns `"OK"`. Used by Docker health checks and load balancers to confirm the service is alive. |
| `backend/src/app.service.ts` | Minimal root service injected into `AppController`. Returns the health-check string. Has no business logic of its own. |
| `backend/src/app.controller.spec.ts` | Jest unit test for the root controller. Verifies the health-check endpoint returns the expected string. Runs as part of the `backend-test` CI job. |
| `backend/nest-cli.json` | NestJS CLI configuration. Tells the CLI where the source root is (`src/`) and which file patterns should be treated as non-TypeScript assets during compilation. |
| `backend/tsconfig.json` | Root TypeScript configuration for the backend workspace. Sets strict mode, module resolution, and decorator metadata emission (required for NestJS decorators to work). |
| `backend/tsconfig.build.json` | A tighter TypeScript config used only during the production build (`nest build`). Extends the root config and additionally excludes test files so they don't end up in `dist/`. |
| `backend/package.json` | Backend package manifest. Lists all NestJS packages, the MongoDB/Mongoose driver, Firebase Admin SDK, Gemini SDK, Axios, and Jest as dependencies. Also defines the `start:dev`, `build`, and `test` npm scripts. |
| `backend/.prettierrc` | Prettier formatting config shared across the backend. Enforces consistent code style (single quotes, trailing commas, print width). |
| `backend/eslint.config.mjs` | ESLint flat config for the backend. Extends the NestJS recommended rule set and TypeScript ESLint rules to catch common NestJS-specific mistakes at lint time. |
| `backend/Dockerfile` | Multi-stage Docker build for the backend. Stage 1 installs dependencies and compiles TypeScript with `nest build`. Stage 2 copies only `dist/` and `node_modules` into a minimal Node Alpine image, keeping the production image small. |

---

## 3. Backend — AI / RAG Module

**Path:** `backend/src/ai/`

| File | Description |
|---|---|
| `backend/src/ai/ai.service.ts` | The most important file in the entire backend. Contains the full RAG pipeline in one self-contained service. Responsibilities (in order of execution): (1) `onModuleInit` — checks whether a MongoDB Atlas Vector Search index named `vector_index` exists, and creates it if not (3072-dim, cosine similarity); (2) `generateEmbedding` — calls the Gemini REST API to convert text into a 3072-dimensional float vector; (3) `vectorSearchFaqs` — runs `$vectorSearch` aggregation against the `faqs` collection to retrieve the top-3 semantically closest FAQs; (4) `textSearchFaqs` — a pure-MongoDB keyword fallback using `$regex` on the question and answer fields, used when embeddings are unavailable; (5) `getDirectFaqMatches` — public method for similar-FAQ lookup: tries vector search, falls back to text search, never throws; (6) `findSimilarFaqs` — used by the `/api/faqs/similar` endpoint; returns vector-scored results or text-search results; (7) `getAnswer` — the main RAG answer method: embeds the query, retrieves context, builds the Yaksha prompt, calls Gemini (3 retries) then Minimax (fallback), parses the response, auto-queues unknown questions to `pending_faqs`, and returns the final answer with matched FAQ citations. |

---

## 4. Backend — Authentication Module

**Path:** `backend/src/auth/`

| File | Description |
|---|---|
| `backend/src/auth/auth.module.ts` | NestJS module definition for the auth domain. Imports the Mongoose schemas for `User` and wires `AuthService`, `FirebaseService`, and the Passport JWT strategy together. Exports `AuthService` so other modules can use it. |
| `backend/src/auth/auth.service.ts` | Core authentication business logic. Handles: signup (hashes password with bcrypt, creates MongoDB user), login (validates credentials, returns user document), and user profile fetch/update operations. Does not issue JWTs directly — Firebase handles token issuance for the production flow. |
| `backend/src/auth/auth.controller.ts` | *(inside `auth/` module)* Thin REST wrapper that maps HTTP routes to `AuthService` methods. Handles `POST /api/auth/signup`, `POST /api/auth/login`, and the Firebase sync endpoint. |
| `backend/src/auth/firebase.service.ts` | Wraps the Firebase Admin SDK. Its single job is `verifyIdToken(token)` — it calls Firebase's token verification endpoint and returns the decoded user payload. Used by `FirebaseAuthGuard` to authenticate incoming requests. |
| `backend/src/auth/firebase-auth.guard.ts` | NestJS guard that protects endpoints requiring a valid Firebase ID token. In the current prototype, it contains a bypass that accepts a hardcoded dev token — this must be removed before production. When a real token is present, it calls `FirebaseService.verifyIdToken()`. |
| `backend/src/auth/jwt.guard.ts` | Passport-based guard for local-session endpoints. Delegates to the JWT strategy to validate the `Authorization: Bearer` header token. Applied to routes that use the internal JWT flow rather than Firebase. |
| `backend/src/auth/jwt.strategy.ts` | Passport strategy that extracts the JWT from the `Authorization` header, verifies it with the `JWT_SECRET` environment variable, and attaches the decoded payload to `req.user`. Used by `JwtGuard`. |
| `backend/src/auth/roles.decorator.ts` | Defines the `@Roles(...roles)` decorator. Attaches role metadata to a route handler using NestJS's `SetMetadata`. Used in combination with `RolesGuard` to implement role-based access control. |
| `backend/src/auth/roles.guard.ts` | Reads the `@Roles()` metadata from the route handler and compares it against the `role` field in the decoded JWT payload. Returns 403 if the roles don't match. Protects all admin-only endpoints. |
| `backend/src/auth/dto/` | Data Transfer Object definitions for auth payloads (signup body, login body). Provide TypeScript types and optional class-validator decorators for request shape validation. |

---

## 5. Backend — Admin Module

**Path:** `backend/src/admin/`

| File | Description |
|---|---|
| `backend/src/admin/admin.module.ts` | NestJS module for the admin domain. Imports the Mongoose models for `Faq`, `PendingFaq`, `PendingApproval`, `Notification`, and `User` so `AdminService` can operate on all of them. |
| `backend/src/admin/admin.service.ts` | Admin business logic. Key operations: `getStats()` — returns aggregate counts (total FAQs, pending moderation items, resolved today); `approve(id)` — approves a pending query or answer, creates the FAQ document, marks `spAwarded = true`, and fires the SP reward call (idempotent); `reject(id)` — marks a pending item as rejected; `deleteFaq(id)` — removes a FAQ from the canonical collection. |
| `backend/src/admin/admin.controller.ts` | REST controller for all admin-only routes under `/api/admin/*`. Protected by `RolesGuard` with the `ADMIN` role. Exposes stats, the pending moderation list, approve/reject actions, and FAQ CRUD. |

---

## 6. Backend — Controllers

These controllers live directly in `backend/src/` rather than in a feature subdirectory.

| File | Description |
|---|---|
| `backend/src/auth.controller.ts` | Top-level auth controller at `/api/auth/*`. Handles signup, login, user profile GET/PATCH, and the Firebase sync route. Works alongside (but is separate from) `auth/auth.controller.ts` inside the auth module — one handles the module-internal routes, this one the top-level ones. |
| `backend/src/chat.controller.ts` | Handles `POST /api/chat`. Receives `{ question }` in the request body, calls `AiService.getAnswer(question)`, and returns `{ answer, matchedFaqs[] }`. On AI failure it catches the error and calls `AiService.getDirectFaqMatches()` to serve at least the keyword-matched FAQs as a graceful degradation. |
| `backend/src/faq.controller.ts` | Handles all FAQ-related routes. Key routes: `GET /api/faqs` (all FAQs), `GET /api/faqs/top` (top 5 by view count), `GET /api/faqs/analytics` (aggregate stats + category breakdown), `GET /api/faqs/categories` (category list), `POST /api/faqs/similar` (semantic search via `AiService`), `PATCH /api/faqs/:id/view` (view-count increment), `POST /api/faqs/:id/rate` (helpful/not-helpful rating), and admin CRUD routes (POST/PUT/DELETE). |
| `backend/src/issue.controller.ts` | Handles the entire issue lifecycle. `POST /api/issues` creates a new issue. `GET /api/issues` lists all issues with optional `?status=` and `?raisedBy=` filters. `GET /api/issues/:id` returns the full issue plus all reply threads. `PATCH /api/issues/:id/status` transitions status and, on the first resolution, awards SP to the asker (idempotent via the `spAwarded` flag). `POST /api/issues/:id/replies` appends a reply to the thread. |
| `backend/src/notifications.controller.ts` | Manages the notification system. `GET /api/notifications/:email` returns all notifications for a user (unread first). `PATCH /api/notifications/:id/read` marks one notification read. `PATCH /api/notifications/read-all/:email` bulk-marks all as read. `POST /api/notifications/broadcast` (admin only) creates a notification document for every registered user simultaneously. |
| `backend/src/rewards.controller.ts` | Manages Spurti Points. `GET /api/rewards/leaderboard` returns the top-10 students ordered by `reward_points`. `GET /api/rewards/my-points/:email` returns the calling user's current SP balance and contribution stats. `POST /api/rewards/answer/:email` increments `reward_points` by the configured answer-reward amount — called by the admin service when an answer is approved. |

---

## 7. Backend — Database Schemas

All schemas use Mongoose's `@Schema()` / `@Prop()` decorator pattern from `@nestjs/mongoose`.

| File | Description |
|---|---|
| `backend/src/faqs/schemas/faq.schema.ts` | Defines the `Faq` Mongoose document. Fields: `question` (string), `answer` (string), `answer_hi` (Hindi translation, optional), `category` (string), `tags` (string array), `view_count` (number, default 0), `embedding` (array of numbers — the 3072-dim Gemini vector, stored as a plain float array). The `embedding` field is what MongoDB Atlas Vector Search indexes. |
| `backend/src/faqs/schemas/pending-faq.schema.ts` | Defines `PendingFaq` — the auto-queue for questions Yaksha cannot answer. Fields: `question`, `suggestedAnswer` (Yaksha's best-effort draft), `category` (suggested by the LLM), `createdAt`. Admin can review these in the moderation queue and promote them to canonical FAQs. |
| `backend/src/users/schemas/user.schema.ts` | Defines the `User` document. Fields: `email` (unique), `name`, `firstName`, `lastName`, `role` (enum: STUDENT / ADMIN), `reward_points` (number, default 0), `answered_count` (number), `questions_asked` (number), `passwordHash` (string). Role is set at creation and only changeable by an admin. |
| `backend/src/notifications/schemas/notification.schema.ts` | Defines the `Notification` document. Fields: `userEmail` (the recipient), `title`, `message`, `type` (e.g. BROADCAST / ISSUE_UPDATE), `isRead` (boolean, default false), `createdAt`. One document per notification per user — broadcast creates N documents for N users. |
| `backend/src/pending-approvals/schemas/pending-approval.schema.ts` | Defines `PendingApproval` — items in the admin moderation queue. Fields: `type` (enum: QUERY / ANSWER), `issueId` (optional, for answer approvals), `content` (the text to be approved), `submittedBy` (user name), `authorEmail`, `status` (enum: PENDING / APPROVED / REJECTED), `spAwarded` (boolean — ensures SP is only awarded once). |

---

## 8. Backend — Scripts & Utilities

| File | Description |
|---|---|
| `backend/src/scripts/create-admin.ts` | One-shot setup script. Creates the admin user in Firebase Authentication (using the Admin SDK) and simultaneously creates the corresponding MongoDB `User` document with `role: ADMIN`. Run once per fresh environment. Credentials: `admin@vicharanashala.in` / `Admin@2026`. |
| `backend/src/scripts/generate-embeddings.ts` | Iterates over every FAQ document in MongoDB that has no `embedding` field, calls `AiService.generateEmbedding()` for each, and saves the 3072-dim vector back to the document. Run once after a fresh `seed.ts`. Progress is logged to console. |
| `backend/seed.ts` | The main database seeding script. Drops the entire `faqs` collection and re-inserts all 168 official VINS/Samagama FAQs across 24 categories from a hardcoded dataset. Safe to re-run — it always starts clean. Run with `npx ts-node -r tsconfig-paths/register seed.ts`. |
| `backend/migrate-embeddings.ts` | A one-off migration helper written for FAQ documents that were created before the embedding feature was added. Finds all FAQs where `embedding` is null/missing and calls the Gemini API to fill them in. Not needed for fresh installs but preserved for environments upgraded mid-development. |

---

## 9. Frontend — Entry & Core

**Path:** `frontend/src/`

| File | Description |
|---|---|
| `frontend/src/main.tsx` | React application entry point. Calls `ReactDOM.createRoot()` on the `#root` div in `index.html` and renders `<App />`. Also imports global CSS reset styles. This is the first file Vite loads. |
| `frontend/src/App.tsx` | Root component. Wraps the entire app in the context provider stack: `AuthContext` → `ThemeContext` → `LanguageContext` → `QueryClientProvider`. Then renders the TanStack Router outlet. All pages are descendants of this component. |
| `frontend/src/router.tsx` | Defines every route in the application using TanStack Router. Maps URL paths to page components, defines auth guards (unauthenticated users are redirected to `/login`, non-admins are redirected away from `/admin`), and sets the root layout. |
| `frontend/src/firebase.ts` | Initialises the Firebase SDK using the `VITE_FIREBASE_*` environment variables. Exports the `auth` object (Firebase Auth instance) used by `AuthContext` for sign-in, sign-out, and `onAuthStateChanged`. |
| `frontend/src/queryClient.ts` | Creates and exports the TanStack Query `QueryClient` singleton. Configured with sensible defaults: 5-minute stale time, 2 retry attempts, and window-focus refetch enabled. Shared across the entire app via the `QueryClientProvider` in `App.tsx`. |
| `frontend/src/App.css` | Application-level CSS: layout reset for `#root`, global font application, and base spacing utilities used across multiple pages. |
| `frontend/src/index.css` | CSS reset and CSS custom property (`--var`) root declarations. Defines the base colour tokens, font stack, and box-sizing reset inherited by every component. |
| `frontend/src/mobile.css` | All responsive breakpoint overrides for screens below 768px. Imported globally — adjusts navigation, card layouts, font sizes, and padding for mobile users. |
| `frontend/src/reference.css` | A design reference stylesheet that was used during UI development to prototype styles. **Not imported at runtime** — it is a scratch file preserved for reference. Has no effect on the running application. |

---

## 10. Frontend — API Layer

**Path:** `frontend/src/api/`

| File | Description |
|---|---|
| `frontend/src/api/client.ts` | Creates the shared Axios instance with `baseURL` set to `VITE_API_URL`. Attaches a request interceptor that reads the current user's token from `localStorage` and adds it as an `Authorization: Bearer` header on every outgoing request. All other API files import from this module — nothing calls Axios directly. |
| `frontend/src/api/auth.ts` | Authentication API functions: `login(email, password)`, `signup(email, name, password)`, `getUser(email)`, `updateUser(email, data)`. All call the shared Axios client and return typed response objects. |
| `frontend/src/api/faqs.ts` | FAQ API functions: `getAllFaqs()`, `getTopFaqs()`, `getFaqCategories()`. Used by the FAQ dashboard and category filter components via TanStack Query hooks. |
| `frontend/src/api/admin.ts` | Admin API functions: `getAdminStats()`, `getPendingItems()`, `approveItem(id)`, `rejectItem(id)`. Used exclusively by admin panel components — other pages never import from this file. |

---

## 11. Frontend — Context Providers

**Path:** `frontend/src/context/`

| File | Description |
|---|---|
| `frontend/src/context/AuthContext.tsx` | Manages global authentication state. Sets up an `onAuthStateChanged` listener on the Firebase `auth` object and stores the current user in React state. Exposes `user`, `login()`, `loginWithGoogle()`, `logout()`, and `loading` to any component that calls `useAuth()`. The router uses `loading` to avoid flashing the wrong page before the auth state resolves. |
| `frontend/src/context/ThemeContext.tsx` | Manages the light/dark mode preference. Reads the initial preference from `localStorage`, applies it as a `data-theme` attribute on `<html>`, and re-persists whenever it changes. Exposes `theme` and `toggleTheme()` via the `useTheme()` hook. CSS variables in `index.css` respond to the `data-theme` attribute, so the entire UI switches without any JS-driven class toggling per component. |
| `frontend/src/context/LanguageContext.tsx` | Manages the selected language (English or Hindi). Exposes `language` and `setLanguage()` via `useLanguage()`. Components that display translatable content import from `translations/` and select the right string based on the current language value. |

---

## 12. Frontend — Pages

**Path:** `frontend/src/pages/`

| File | Description |
|---|---|
| `LandingPage.tsx` | The public-facing marketing page shown to unauthenticated visitors. The largest page file (26 KB). Contains the animated hero section with the React Three Fiber 3D scene, a scrolling feature overview, and CTA buttons for login/register. Uses GSAP for scroll-triggered entrance animations. |
| `LoginPage.tsx` | Email/password login form. On successful authentication calls `AuthContext.login()`, which invokes Firebase Auth. Also renders the Google Sign-in button that opens `GoogleAuthModal`. Redirects to `/dashboard` on success. |
| `RegisterPage.tsx` | Student registration form. Collects name, email, and password. Calls the backend `/api/auth/signup` endpoint to create the MongoDB user record, then signs in automatically. |
| `SignupPage.tsx` | An alternative signup flow that emphasises Google Sign-in first. Shown on a slightly different route for A/B design purposes. Contains its own OTP verification step. |
| `ForgotPasswordPage.tsx` | Password reset request form. Accepts an email and calls Firebase Auth's password reset email method. The backend endpoint for custom reset flows is not yet implemented — currently relies on Firebase's built-in email. |
| `Dashboard.tsx` | The main authenticated home page. Displays a personalised greeting, SP balance summary, quick-action cards (Raise Issue, Browse FAQs, Leaderboard), and a recent-announcements widget. Fetches data via TanStack Query. |
| `FaqPage.tsx` | Individual FAQ detail view. Fetches the FAQ by ID, renders the question, the full answer, and a list of semantically related FAQs fetched from `/api/faqs/similar`. Fires a `PATCH /api/faqs/:id/view` call once per page load to increment the view counter. |
| `ChatPage.tsx` | A thin wrapper page that renders `YakshaChat.tsx` in full-page (non-floating) mode. Accessible at `/chat`. Provides a full-screen conversational interface for students who prefer it over the floating widget. |
| `RaiseIssuePage.tsx` | Multi-step issue submission flow. As the user types, `SimilarFaqsHint` fires debounced calls to `/api/faqs/similar` and displays matching FAQs inline. If the user proceeds, the page calls `/api/chat` to show Yaksha's AI-generated draft answer as a preview before final submission. On submit, POSTs to `/api/issues`. |
| `ResolveQuestionPage.tsx` | Peer-answer submission page. Shows the full open issue and a Markdown-capable text editor for the answer. On submit, POSTs the answer to `/api/admin/pending` as a `QUERY`-type pending approval for admin review before it can be published. |
| `TrackIssuesPage.tsx` | The user's personal issue tracker. Fetches all issues where `raisedBy` matches the current user's email, displays them in a filterable list with status pills (Open / Answered / Resolved), and allows expanding each to view the full reply thread. |
| `LeaderboardPage.tsx` | Renders the `Leaderboard` component inside a full page layout. Fetches data from `/api/rewards/leaderboard`. |
| `AnnouncementsPage.tsx` | Lists all active admin announcements fetched from `/api/notifications/broadcast`. Displays each with a timestamp and the admin author. |
| `ProfilePage.tsx` | User profile page. Shows the user's SP balance, number of questions asked, answers given, and account settings. Calls `/api/rewards/my-points/:email` for stats and `/api/users/:email` for profile data. Allows updating name via `/api/users/:email` PATCH. |
| `AdminPage.tsx` | Route wrapper that applies the `AdminLayout` shell to any `/admin/*` child route. Also enforces the ADMIN role guard — non-admins are redirected to `/dashboard` from the router before reaching this component. |
| `AdminDashboard.tsx` | The admin panel's home page. Renders `AnalyticsDashboard` inside the admin layout. Serves as the landing page after an admin logs in. |
| `PlaceholderPage.tsx` | A minimal "coming soon" page used as a stand-in for routes that are declared in the router but whose full UI is not yet built. |

---

## 13. Frontend — Components: Core

**Path:** `frontend/src/components/`

| File | Description |
|---|---|
| `Header.tsx` | The persistent top navigation bar. Contains the Vicharanashala logo, main navigation links, the `NotificationPanel` bell icon with unread-count badge, the theme toggle switch, and the user avatar dropdown (shows name, SP balance, and logout button). Responsive — collapses to a hamburger menu on mobile. |
| `Footer.tsx` | Site-wide footer with the programme branding, quick links to key pages, and attribution. Rendered by `Layout.tsx` on all authenticated pages. |
| `Layout.tsx` | The authenticated page shell. Wraps every page that requires login with `Header` at the top, `Footer` at the bottom, and a `max-width` centred content area in between. Also renders the floating `YakshaChat` widget so it is available on every page without each page importing it individually. |
| `FaqDashboard.tsx` | The main FAQ browsing interface (24 KB). Manages: (1) fetching all FAQs from the backend, (2) a debounced keyword search input that filters the list client-side, (3) a category sidebar that shows FAQ counts per category and allows single-category filtering, (4) a "Most Asked" section that shows the top-5 FAQs by view count, and (5) FAQ cards with category badge, question preview, and bookmark action. |
| `YakshaChat.tsx` | The floating AI chat widget — the largest component in the entire frontend (33 KB). Manages: conversation history as a list of `{ role, text }` messages; **voice input** via the Web Speech API (`SpeechRecognition`); debounced typing to avoid rapid API calls; streaming-style character-by-character display of the incoming answer using a typewriter effect; citation cards rendered below each AI answer showing the matched FAQ sources; and the open/close state of the floating chat bubble. On submit, calls `POST /api/chat`. |
| `Leaderboard.tsx` | The Spurti Points leaderboard table. Fetches from `/api/rewards/leaderboard`, renders ranks 1–10 with trophy/medal icons for the top 3, and highlights the current user's row if they appear in the top 10. |
| `SimilarFaqsHint.tsx` | A utility component used inside `RaiseIssuePage`. Watches the question text as a prop, debounces it by 400 ms, and fires `POST /api/faqs/similar` on each change. Renders the top matching FAQ titles as clickable chips inline below the input — clicking one redirects to that FAQ page, preventing duplicate submissions. |
| `NotificationPanel.tsx` | The slide-in notification drawer triggered by the bell icon in `Header`. Fetches notifications from `/api/notifications/:email`, sorts unread first, renders each with a read/unread dot, and exposes per-notification mark-read and a global mark-all-read button. The unread count shown on the bell updates reactively via TanStack Query. |

---

## 14. Frontend — Components: Admin

**Path:** `frontend/src/components/admin/`

| File | Description |
|---|---|
| `AdminLayout.tsx` | The admin panel shell. Provides a left sidebar with links to Dashboard, FAQ Management, Pending Queries, Pending Answers, and Announcements. Wraps all admin sub-pages. Hides the student-facing `Header` and `Footer` — admin has its own navigation. |
| `dashboard/AnalyticsDashboard.tsx` | The admin home dashboard. Renders: four stat cards (total FAQs, total views, open issues, pending moderation count) fetched from `/api/admin/stats` and `/api/faqs/analytics`; a `BarChart` from Recharts showing weekly question + resolution activity; and the `TopFAQsList` component. All data is auto-refreshed every 60 seconds via TanStack Query. |
| `dashboard/TopFAQsList.tsx` | A table showing the top 5 FAQs by view count, fetched from `/api/faqs/top`. Displays rank, question truncated to 60 characters, category badge, and view count. Used inside `AnalyticsDashboard`. |
| `faq/FAQManagement.tsx` | The admin FAQ list with full CRUD. Fetches all FAQs from `/api/admin/faqs`, renders them in a table with columns for question, category, view count, and actions. Inline edit opens a form that PATCHes to `/api/faqs/:id`. Delete calls `DELETE /api/faqs/:id` with a confirmation dialog. Also includes a "Create FAQ" button that opens a modal form. |
| `faq/FAQPromoterCard.tsx` | A card component used inside the pending query review flow. When an admin decides to promote an approved answer directly into the FAQ database, this card provides the category/tag confirmation form before calling the promote endpoint. |
| `moderation/QueryModerator.tsx` | The pending query review page (7.9 KB). Fetches all items from `/api/admin/pending` where `type === "QUERY"`. Displays each as a `QueryApprovalCard`. Handles loading states, empty states, and error states. Re-fetches after each approve/reject action. |
| `moderation/AnswerReviewList.tsx` | Same structure as `QueryModerator` but for `type === "ANSWER"` pending items. Renders `AnswerApprovalCard` components. |
| `moderation/QueryApprovalCard.tsx` | An individual moderation card for a student-raised issue. Shows the question title, description, raising student's email, submission date, and the AI-generated suggested answer. Provides Approve (publishes as FAQ + awards SP) and Reject buttons that call the admin service endpoints. |
| `moderation/AnswerApprovalCard.tsx` | Same as `QueryApprovalCard` but for peer-submitted answers. Shows the original question context alongside the answer text so the admin can review both together. |
| `announcements/AnnouncementForm.tsx` | A rich form for composing admin broadcast announcements (9.5 KB). Includes a title input, a multi-line message body, and a preview panel. On submit, POSTs to `/api/notifications/broadcast`, which creates a notification document for every registered user. |

---

## 15. Frontend — Components: Auth

**Path:** `frontend/src/components/auth/`

| File | Description |
|---|---|
| `GoogleAuthModal.tsx` | A modal dialog that handles the Google Sign-in OAuth flow. Calls `signInWithPopup(auth, googleProvider)` from Firebase, receives the Google credential, and then syncs the Firebase user to the MongoDB backend via `POST /api/auth/sync`. Closes on success or error. |
| `OtpVerification.tsx` | The OTP entry step shown after email registration. Presents a 6-digit code input. **In the current prototype**, accepts the hardcoded value `123456` for demo purposes. In production this would validate against a code generated and sent by Twilio or AWS SNS. |

---

## 16. Frontend — Components: 3D Scene

**Path:** `frontend/src/components/three/`

| File | Description |
|---|---|
| `CoreScene.tsx` | A React Three Fiber scene component rendered in the hero section of `LandingPage`. Contains an animated 3D geometric shape (a custom mesh with shader-like material) that rotates and reacts to mouse position. Uses `useFrame` for the animation loop and `OrbitControls` for optional user interaction. Wrapped in a `<Suspense>` boundary so the page loads even if the 3D context initialises slowly. |

---

## 17. Frontend — Styles

**Path:** `frontend/src/styles/`

All CSS files in this directory are **page-scoped stylesheets** imported by their corresponding page or component. They use CSS custom properties from `index.css` for colours and spacing, keeping component styles consistent with the global design system.

| File | Description |
|---|---|
| `admin.css` | Styles for the entire admin panel (25 KB — the largest stylesheet). Covers the `AdminLayout` sidebar, stat cards, the Recharts chart wrapper, the FAQ management table, all moderation cards, and the announcement form. |
| `auth.css` | Styles for `LoginPage`, `RegisterPage`, `SignupPage`, and `ForgotPasswordPage`. Includes the centred card layout, input field styles, the Google button, and the OTP digit-input grid. |
| `chat.css` | Styles for `YakshaChat.tsx` and `ChatPage.tsx` (21 KB). Covers the floating bubble button, the chat drawer slide-in animation, the message bubbles (user vs. Yaksha), the citation cards, the voice input indicator, and the full-page chat layout. |
| `landing.css` | Styles for `LandingPage.tsx` (15 KB). Covers the hero section, the 3D canvas container, the feature cards, the scroll-reveal animation classes applied by GSAP, and the CTA section. |
| `portal.css` | Styles for the main authenticated portal pages: `Dashboard`, `FaqDashboard`, `FaqPage`, `TrackIssuesPage`, `RaiseIssuePage`, `ResolveQuestionPage`, and `AnnouncementsPage`. The shared portal design — cards, tables, status pills, category badges. |
| `profile.css` | Styles for `ProfilePage`. Covers the profile header, the stats grid, and the account settings form. |

---

## 18. Frontend — Hooks

**Path:** `frontend/src/hooks/`

| File | Description |
|---|---|
| `useScrollProgress.ts` | A custom React hook that tracks vertical scroll position as a normalised value between 0 and 1. Used by `LandingPage` to drive progress-bar indicators and parallax offsets on scroll. |
| `useScrollReveal.ts` | A custom React hook that registers an `IntersectionObserver` on a given element ref. When the element enters the viewport, it adds a CSS class that triggers a GSAP or CSS-keyframe entrance animation. Used across `LandingPage` for the scroll-reveal feature cards. |

---

## 19. Frontend — Translations

**Path:** `frontend/src/translations/`

| File | Description |
|---|---|
| `en.ts` | English content strings for every user-facing label, button, heading, and message in the application. Exported as a typed object — components import individual keys from here rather than hardcoding strings. Also contains the English FAQ content used for static rendering. |
| `hi.ts` | Hindi translations of the same string keys. Partially complete — some keys fall back to English. Used by components that call `useLanguage()` when the user switches to Hindi. |

---

## 20. Infrastructure & DevOps

| File | Description |
|---|---|
| `.github/workflows/ci.yml` | GitHub Actions pipeline definition. Three jobs: (1) `backend-test` — checks out the repo, installs Node 24, runs `npm ci`, `npm run build`, and `npm test` with mock environment variables; (2) `frontend-build` — same setup, runs `npm ci` and `vite build` with placeholder Firebase vars to confirm the TypeScript and bundler pass; (3) `build-and-push` — runs only on pushes to `main` after both prior jobs succeed: logs into Docker Hub, builds the backend image, builds the frontend image (injecting real Firebase secrets as build args), and pushes both to Docker Hub. |
| `docker-compose.yml` | Local development Compose. Defines two services: `backend` (builds from `./backend/Dockerfile`, exposes port 3001, injects `.env`) and `frontend` (builds from `./frontend/Dockerfile`, exposes port 80). Both share a bridge network so the Nginx proxy can reach the backend by service name. |
| `frontend/Dockerfile` | Two-stage build for the frontend. Stage 1 (`node:20-alpine`) runs `npm ci` and `vite build` — accepts Firebase config as `ARG` build arguments so they're baked into the static bundle. Stage 2 (`nginx:alpine`) copies the `dist/` folder into the Nginx web root and adds `nginx.conf`. The resulting image has no Node.js — just Nginx serving static files. |
| `frontend/nginx.conf` | Nginx server configuration. Serves the Vite SPA from `/`: any path not matching a real file is rewritten to `index.html` (enabling client-side routing). All requests to `/api/*` are proxied to the backend service on port 3001, removing the `/api` prefix before forwarding. |
| `backend/Dockerfile` | Two-stage build for the backend. Stage 1 (`node:20-alpine`) installs dependencies and compiles TypeScript with `nest build`. Stage 2 copies `dist/` and production `node_modules` into a clean image and sets the entrypoint to `node dist/main`. Keeps the image small by excluding dev dependencies and source files. |
| `deploy/docker-compose.prod.yml` | Production Compose file used on the EC2 instance. Identical in structure to the local compose but references pre-built images from Docker Hub (`$DOCKER_USERNAME/vicharanashala-backend:latest`, `$DOCKER_USERNAME/vicharanashala-frontend:latest`) instead of building from source — so the server never needs the source code. |
| `deploy/deploy.sh` | The one-command deployment script executed on the EC2 instance after CI pushes new images. Pulls the latest backend and frontend images from Docker Hub, stops the running containers, and starts them again with `docker-compose up -d`. Designed to be called over SSH from a CI/CD trigger or manually. |

---

*Maintained by Team CS29 — Vicharanashala Internship Programme, IIT Ropar · June 2026*
