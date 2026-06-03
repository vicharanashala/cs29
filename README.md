# Vicharanashala FAQ Portal

A crowd-sourced FAQ portal for the Vicharanashala Internship Programme (VINS) at IIT Ropar. Students can browse, search, and bookmark FAQs, raise and track issues, view leaderboards, and receive real-time notifications. An AI assistant (Yaksha) answers questions not covered in the FAQ database using a RAG pipeline and queues unresolved queries for admin review.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + TanStack Router + TanStack Query |
| Backend | NestJS + Mongoose ODM |
| Database | MongoDB Atlas (cloud, replica set) |
| Auth | Firebase Authentication (Email/Password + Google Sign-in) *(prototype bypass in place)* |
| AI | Minimax (primary) → Gemini (fallback) with RAG pipeline |
| Styling | Custom CSS (responsive, theme-aware) + GSAP animations + React Three Fiber 3D |
| Charts | Recharts |

---

## Features

### Public

- **FAQ Browse & Search** — All 168+ FAQs with category filtering, keyword search, and bookmarking
- **AI Chat (Yaksha)** — Floating chat widget with RAG-powered answers; falls back to text search when embedding generation fails; gracefully degrades when AI providers are unavailable
- **Raise Issue** — Students can submit queries not covered by existing FAQs; receives AI-generated answer + similar FAQ hints before submission
- **Track Issues** — Students can track the status of their raised issues (pending, resolved, published)
- **Resolve Question** — Peer-assisted answering flow where students can submit answers to open issues; answers go to admin moderation before being published as official FAQs
- **Leaderboard** — Ranked by SP (Samaga Points) with real-time updates
- **Notifications** — Real-time notification bell with read/unread state and mark-all-read
- **Announcements** — Admin broadcast messages visible to all users
- **User Profile** — View SP balance, activity stats (questions asked, answers given)
- **Register / Login** — Email+password and Google Sign-in

### Admin Panel

- **Analytics Dashboard** — Total FAQs, views, issue counts, weekly activity charts
- **FAQ Management** — Create, edit, delete, and promote FAQs; view per-FAQ metrics
- **Moderation: Pending Queries** — Approve/reject student-raised issues; publish approved issues as official FAQs
- **Moderation: Pending Answers** — Approve/reject peer-submitted answers to open issues; approved answers go live as FAQ responses
- **Announcements** — Create and broadcast system-wide announcements

### Behind the Scenes

- **RAG Pipeline** — Query embedding via Gemini → cosine similarity against FAQ vector store → top-K matched FAQs → LLM synthesises answer
- **Multi-provider AI Fallback** — Primary: Minimax → Secondary: Gemini → Tertiary: text search fallback
- **SP Reward System** — Students earn Samaga Points for raising resolved issues and answering questions that get published; SP awarded idempotently (once per action)
- **Notification Broadcasting** — Admins can broadcast messages to all users
- **Issue Threading** — Students and admins can reply within issue threads

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **MongoDB Atlas account** — [mongodb.com/atlas](https://www.mongodb.com/atlas) (free tier is sufficient, replica set required)
- **Firebase project** — [console.firebase.google.com](https://console.firebase.google.com) (Email/Password + Google auth enabled) — **required for production auth**
- **Gemini API key** — [aistudio.google.com](https://aistudio.google.com) (prepaid credits required)
- **Minimax API key** — [minimax.io](https://minimax.io) (optional, Gemini fallback works without it)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/vicharanashala/cs29.git
cd cs29
```

### 2. Backend setup

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

Start the backend in development mode:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`.

### 3. Seed the FAQ database *(run once only)*

```bash
npx ts-node -r tsconfig-paths/register seed.ts
```

Output: `FAQs seeded successfully!`

> **Note:** This clears and re-inserts all FAQs. Only run again if you want to reset the data.

### 4. Generate FAQ embeddings *(run once after seed)*

Embeddings are required for the RAG similarity search:

```bash
npx ts-node -r tsconfig-paths/register scripts/generate-embeddings.ts
```

> This iterates over all FAQs, generates vector embeddings via Gemini, and stores them in the database. Only needed after a fresh seed.

To re-embed all FAQs after key changes:

```bash
npx ts-node -r tsconfig-paths/register scripts/reembed-faqs.ts
```

### 5. Create the admin user

```bash
npx ts-node -r tsconfig-paths/register src/scripts/create-admin.ts
```

Creates (or resets) the default admin account:

| Field | Value |
|---|---|
| Email | `admin@vicharanashala.in` |
| Password | `Admin@2026` |

> **Note:** This also creates the Firebase user. Ensure Firebase Authentication is configured with Email/Password enabled before running.

### 6. Frontend setup

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

Start the frontend:

```bash
npm run dev
```

### 7. Open the app

| URL | Description |
|---|---|
| `http://localhost:3000` | Public FAQ portal (Vite dev server) |
| `http://localhost:3000/admin` | Admin panel (requires admin login) |
| `http://localhost:3000/login` | Login page |
| `http://localhost:3000/register` | Student registration |
| `http://localhost:3000/chat` | Full-page Yaksha chat |
| `http://localhost:3000/leaderboard` | SP leaderboard |
| `http://localhost:3000/raise-issue` | Raise a new issue |
| `http://localhost:3000/track-issues` | Track your raised issues |

---

## Database Schemas

| Schema | Description |
|---|---|
| `User` | email, name, firstName, lastName, role (STUDENT/ADMIN), reward_points, answered_count, questions_asked |
| `Faq` | question, answer, answer_hi, category, tags, view_count, embedding, createdAt, updatedAt |
| `PendingFaq` | title, description, raisedBy, status (PENDING/APPROVED/REJECTED), spAwarded |
| `Issue` | title, description, raisedBy, status (open/resolved/closed), resolution, replyCount, spAwarded, createdAt |
| `IssueReply` | issueId, repliedBy, content, createdAt |
| `Notification` | userEmail, title, message, type, isRead, createdAt |
| `PendingApproval` | type (QUERY/ANSWER), issueId, content, submittedBy, authorEmail, status, spAwarded, createdAt |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register a new student account |
| POST | `/api/auth/login` | — | Login (returns user object) |
| GET | `/api/users/:email` | — | Get user profile |
| PATCH | `/api/users/:email` | — | Update user profile |
| POST | `/api/auth/sync` | Firebase token | Sync Firebase user to MongoDB *(prototype — not fully wired)* |

### FAQs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/faqs` | All published FAQs |
| GET | `/api/faqs/top` | Top 5 FAQs by view count |
| GET | `/api/faqs/analytics` | `{ totalFaqs, totalViews, topFaqs[], categoryBreakdown[] }` |
| GET | `/api/faqs/categories` | All categories with FAQ counts |
| POST | `/api/faqs` | *(admin)* Create a new FAQ |
| PUT | `/api/faqs/:id` | *(admin)* Update a FAQ |
| DELETE | `/api/faqs/:id` | *(admin)* Delete a FAQ |
| PATCH | `/api/faqs/:id/view` | Increment view count (once per session) |
| POST | `/api/faqs/:id/rate` | Rate a FAQ (helpful / not helpful) |
| POST | `/api/faqs/similar` | Find similar FAQs by text query (RAG embedding → vector search → text search fallback) |

### Chat / AI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | RAG chat — sends `{ question }`, returns `{ answer, matchedFaqs[] }` |

### Issues

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/issues` | All issues (filter by `?status=` or `?raisedBy=`) |
| GET | `/api/issues/:id` | Get single issue with replies |
| POST | `/api/issues` | Raise a new issue |
| PATCH | `/api/issues/:id/status` | Update issue status; award SP to asker and peer responder on first call (idempotent via `spAwarded` flag) |
| POST | `/api/issues/:id/replies` | Add a reply to an issue |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/:email` | Get all notifications for a user |
| PATCH | `/api/notifications/:id/read` | Mark one notification as read |
| PATCH | `/api/notifications/read-all/:email` | Mark all notifications as read |
| POST | `/api/notifications/broadcast` | *(admin)* Broadcast a notification to all users |

### Rewards / Leaderboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rewards/leaderboard` | Top 10 students by SP |
| GET | `/api/rewards/my-points/:email` | Current user's SP balance and stats |
| POST | `/api/rewards/answer/:email` | Award SP to a student for answering a question *(called by admin on approval)* |

### Admin *(requires ADMIN role)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | `{ totalFaqs, pendingCount, resolvedToday }` |
| GET | `/api/admin/pending` | All pending queries and answers for moderation |
| PATCH | `/api/admin/pending/:id/approve` | Approve and publish pending item → creates FAQ + awards SP |
| PATCH | `/api/admin/pending/:id/reject` | Reject pending item |
| GET | `/api/admin/faqs` | All FAQs (admin view) |
| POST | `/api/admin/faqs` | Create a new FAQ directly |
| DELETE | `/api/admin/faqs/:id` | Delete a FAQ |

---

## Project Structure

```
cs29/
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   │   └── ai.service.ts         # RAG pipeline: embedding, text search, LLM calls
│   │   ├── auth/
│   │   │   ├── auth.controller.ts    # Login/signup endpoints
│   │   │   ├── auth.service.ts
│   │   │   ├── firebase-auth.guard.ts
│   │   │   └── firebase.service.ts
│   │   ├── admin/
│   │   │   ├── admin.controller.ts   # Admin-only endpoints
│   │   │   ├── admin.service.ts
│   │   │   └── admin.module.ts
│   │   ├── faqs/
│   │   │   └── schemas/              # FAQ + PendingFaq Mongoose schemas
│   │   ├── users/
│   │   │   └── schemas/              # User schema
│   │   ├── pending-approvals/
│   │   │   └── schemas/              # PendingApproval schema (QUERY + ANSWER types)
│   │   ├── notifications/
│   │   │   └── schemas/              # Notification schema
│   │   ├── faq.controller.ts         # FAQ CRUD + analytics + /chat + /similar
│   │   ├── issue.controller.ts       # Issue CRUD + replies + SP reward logic
│   │   ├── chat.controller.ts        # POST /api/chat (RAG answer)
│   │   ├── notifications.controller.ts
│   │   ├── rewards.controller.ts     # Leaderboard + SP management
│   │   └── main.ts
│   ├── scripts/
│   │   └── create-admin.ts           # Admin seed script
│   ├── seed.ts                       # FAQ seed script (127 FAQs from Samagama)
│   ├── migrate-embeddings.ts         # Migration: add embeddings to existing FAQs
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/                      # Axios client with auth interceptors
│   │   ├── components/
│   │   │   ├── FaqDashboard.tsx      # Main FAQ list with search + category filter
│   │   │   ├── YakshaChat.tsx        # Floating chat widget
│   │   │   ├── Leaderboard.tsx       # SP leaderboard display
│   │   │   ├── SimilarFaqsHint.tsx   # Similar FAQ hints while raising issues
│   │   │   ├── NotificationPanel.tsx # Notification bell + panel
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── AnalyticsDashboard.tsx  # Admin charts + stats
│   │   │   │   │   └── TopFAQsList.tsx
│   │   │   │   ├── faq/
│   │   │   │   │   ├── FAQManagement.tsx       # Admin FAQ list
│   │   │   │   │   └── FAQPromoterCard.tsx
│   │   │   │   ├── moderation/
│   │   │   │   │   ├── QueryModerator.tsx      # Pending query review
│   │   │   │   │   ├── AnswerReviewList.tsx    # Pending answer review
│   │   │   │   │   ├── QueryApprovalCard.tsx
│   │   │   │   │   └── AnswerApprovalCard.tsx
│   │   │   │   └── announcements/
│   │   │   │       └── AnnouncementForm.tsx
│   │   │   ├── auth/
│   │   │   │   ├── GoogleAuthModal.tsx
│   │   │   │   └── OtpVerification.tsx
│   │   │   └── three/
│   │   │       └── CoreScene.tsx     # React Three Fiber 3D hero (optional)
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Public landing page
│   │   │   ├── Dashboard.tsx         # Authenticated home
│   │   │   ├── FaqPage.tsx           # FAQ detail view
│   │   │   ├── ChatPage.tsx          # Full-page Yaksha chat
│   │   │   ├── LeaderboardPage.tsx
│   │   │   ├── RaiseIssuePage.tsx    # Submit a new issue
│   │   │   ├── ResolveQuestionPage.tsx  # Peer answer submission
│   │   │   ├── TrackIssuesPage.tsx   # Track raised issues
│   │   │   ├── AnnouncementsPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ProfilePage.tsx       # User SP stats + profile
│   │   │   ├── AdminPage.tsx         # Admin layout wrapper
│   │   │   └── AdminDashboard.tsx    # Admin home
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Auth state + login/logout
│   │   │   ├── LanguageContext.tsx   # English / Hindi toggle
│   │   │   └── ThemeContext.tsx      # Light / dark mode
│   │   ├── translations/
│   │   │   ├── en.ts                 # English FAQ content
│   │   │   └── hi.ts                 # Hindi FAQ content
│   │   ├── router.tsx                # TanStack Router setup
│   │   ├── firebase.ts               # Firebase initialisation
│   │   └── App.tsx
│   ├── Dockerfile
│   └── nginx.conf                    # SPA fallback + /api proxy to :3001
│
├── deploy/
│   ├── deploy.sh                     # EC2 pull + restart script
│   └── docker-compose.prod.yml       # Production compose (pre-built images)
│
└── docker-compose.yml                # Local Docker Compose (builds from source)
```

---

## CI / CD

GitHub Actions runs on every push to `main`:

| Job | What it does |
|---|---|
| `backend-test` | `npm ci` → `nest build` → `jest` (unit tests) |
| `frontend-build` | `npm ci` → `tsc -b && vite build` |
| `build-and-push` | Builds Docker images and pushes to Docker Hub |

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Deployment

### Prerequisites

- **AWS EC2 instance** (t2.micro free tier is sufficient)
- **Docker Hub account** for storing the built images
- **Docker** and **Docker Compose** installed on the EC2 instance

### GitHub Actions secrets / variables

Set in **Settings → Secrets and variables → Actions**:

| Name | Type | Value |
|---|---|---|
| `DOCKER_USERNAME` | Secret | Your Docker Hub username |
| `DOCKER_PASSWORD` | Secret | Docker Hub password or access token |
| `VITE_FIREBASE_API_KEY` | Secret | Firebase web API key |
| `VITE_API_URL` | Variable | `http://<ec2-ip>:3001` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Variable | `<project_id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Variable | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Variable | `<project_id>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Variable | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Variable | Firebase app ID |

Every push to `main` automatically builds and pushes Docker images. Then on the EC2:

```bash
ssh ubuntu@<ec2-ip>
export DOCKER_USERNAME=yourdockerhubusername
bash /home/ubuntu/deploy.sh
```

### EC2 Security Group — required inbound rules

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | Your IP | SSH access |
| 80 | TCP | 0.0.0.0/0 | Frontend (HTTP) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (optional) |
| 3001 | TCP | 0.0.0.0/0 | Backend API |

---

## Future Work

The following features are planned or partially implemented:

| Feature | Status | Notes |
|---|---|---|
| Real Firebase Auth (Google Sign-in) | ⚠️ Partial | UI wired; Firebase config is placeholder. Backend `FirebaseAuthGuard` uses prototype bypass. |
| Real SMS OTP | ⚠️ Partial | Frontend has OTP step; accepts hardcoded `123456`. Backend has no OTP generation/verification. |
| Production session management | ⚠️ Partial | Uses `localStorage` for user state. No HTTP-only cookies or JWT refresh. |
| Light & Dark mode toggle | ✅ Done | `ThemeContext.tsx` — theme switcher in Header |
| Announcements system | ✅ Done | Admin broadcast + user notification panel |
| SP Badge system | 🔜 Next | Leaderboard + SP rewards already in place; visual badges not yet displayed |
| Email notifications | 🔜 Next | Currently notifications are in-app only |
| "Liquid Glass" UI | 🔜 Next | CSS `backdrop-filter: blur` styling upgrade |
| Password reset email | 🔜 Next | `ForgotPasswordPage.tsx` exists; backend endpoint needs implementing |

---

## FAQ Database

The portal ships with **168 official VINS/Samagama FAQs** across **24 categories**:

About the Internship, Badges, Certificate, Certificates, Co-curricular, Curriculum, Environment Setup, Experience, Financials, Fortnightly Reviews, Holidays, How to Apply, Infrastructure, Miscellaneous, NOC, Placements, Post-VINS, Projects, Rules, Security, Submission, Technical, Time Commitment, Work

Seed script: `backend/seed.ts` (run once, 127 FAQs from Samagama + some VINS-specific additions)

---

## Known Limitations

- **Firebase Auth** is prototype-only. The app uses a hardcoded admin bypass in `FirebaseAuthGuard` and placeholder Firebase credentials. Real Firebase setup is required for production.
- **OTP verification** accepts `123456` regardless of input. Real SMS delivery requires a Twilio or AWS SNS account.
- **Session management** uses `localStorage`. For production, HTTP-only secure cookies with JWT refresh should replace this.
- **Gemini API key** must have prepaid credits. When credits are exhausted, Yaksha chat falls back to text search only.