<<<<<<< HEAD
# Vicharanashala FAQ Portal

A crowd-sourced FAQ portal for the Vicharanashala Internship Programme (VINS) at IIT Ropar. Students can browse, search, and bookmark FAQs. An AI assistant (Yaksha-mini) answers questions not covered by the FAQ database and queues them for admin review.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + TanStack Router + TanStack Query |
| Backend | NestJS + Mongoose |
| Database | MongoDB Atlas (cloud) |
| Auth | Firebase Authentication (Email/Password + Google Sign-in) |
| AI | Minimax (primary) → Gemini (fallback) with RAG pipeline |

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **MongoDB Atlas account** — [mongodb.com/atlas](https://www.mongodb.com/atlas) (free tier is sufficient)
- **Firebase project** — [console.firebase.google.com](https://console.firebase.google.com) (Email/Password + Google auth enabled)
- **Minimax API key** — [minimax.io](https://www.minimax.io) (optional — Gemini fallback works without it)
- **Gemini API key** — [aistudio.google.com](https://aistudio.google.com)

---

## Local Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd vicharanashala-faq-portal
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
MINIMAX_API_KEY=<your_minimax_api_key>
GEMINI_API_KEY=<your_gemini_api_key>
FIREBASE_PROJECT_ID=<your_firebase_project_id>
FIREBASE_CLIENT_EMAIL=<your_firebase_admin_client_email>
FIREBASE_PRIVATE_KEY="<your_firebase_admin_private_key>"
```

Start the backend in development mode:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`.

### 3. Seed the FAQ database

Run this once to load the 100+ official VINS FAQs into MongoDB:

```bash
npx ts-node -r tsconfig-paths/register seed.ts
```

Output: `FAQs seeded successfully!`

> **Note:** This clears and re-inserts all FAQs. Only run again if you want to reset the data.

### 4. Create the admin user

```bash
npx ts-node -r tsconfig-paths/register src/scripts/create-admin.ts
```

This creates (or resets) the default admin account in Firebase **and** MongoDB:

| Field | Value |
|---|---|
| Email | `admin@vicharanashala.in` |
| Password | `Admin@2026` |

### 5. Frontend setup

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

### 6. Open the app

| URL | Description |
|---|---|
| `http://localhost:5173` | Public FAQ portal |
| `http://localhost:5173/admin` | Admin panel (requires admin login) |
| `http://localhost:5173/login` | Login page |
| `http://localhost:5173/register` | Student registration |

Log in to the admin panel with `admin@vicharanashala.in` / `Admin@2026`.

---

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── admin/              # Admin panel endpoints
│   │   ├── ai/                 # RAG pipeline (Minimax → Gemini fallback)
│   │   ├── auth/               # Firebase auth guard + sync service
│   │   ├── faqs/schemas/       # FAQ + PendingFaq schemas
│   │   ├── scripts/
│   │   │   └── create-admin.ts # Admin seed script (Firebase + MongoDB)
│   │   ├── users/schemas/      # User schema
│   │   ├── app.module.ts
│   │   ├── chat.controller.ts  # POST /api/chat
│   │   └── faq.controller.ts   # GET /api/faqs, PATCH /api/faqs/:id/view
│   ├── Dockerfile
│   └── seed.ts                 # FAQ seed script
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Typed API client (axios + Firebase token interceptor)
│   │   ├── components/
│   │   │   ├── FaqDashboard.tsx
│   │   │   └── YakshaChat.tsx
│   │   ├── pages/
│   │   │   ├── AdminPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── firebase.ts         # Firebase app initialisation
│   │   ├── App.tsx             # Home route + onAuthStateChanged
│   │   ├── router.tsx          # TanStack Router setup
│   │   └── queryClient.ts      # TanStack Query config
│   ├── Dockerfile
│   └── nginx.conf              # nginx config (SPA fallback + /api proxy)
│
├── deploy/
│   ├── deploy.sh               # EC2 deploy script
│   └── docker-compose.prod.yml # Production compose (pre-built images)
│
└── docker-compose.yml          # Local Docker Compose (builds from source)
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/sync` | Firebase token | Upsert user in MongoDB after Firebase sign-in |

### FAQs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/faqs` | — | All FAQs |
| GET | `/api/faqs/top` | — | Top 10 by view count |
| GET | `/api/faqs/category/:category` | — | FAQs filtered by category |
| PATCH | `/api/faqs/:id/view` | — | Increment view count |
| POST | `/api/chat` | — | AI chat (RAG pipeline) |

### Admin (requires `ADMIN` role)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/pending` | All pending questions |
| PATCH | `/api/admin/pending/:id/approve` | Approve → publish to FAQs |
| PATCH | `/api/admin/pending/:id/reject` | Reject and remove |
| GET | `/api/admin/stats` | `{ totalFaqs, pendingCount, resolvedToday }` |
| GET | `/api/admin/faqs` | All FAQs (admin view) |
| POST | `/api/admin/faqs` | Create a new FAQ |
| DELETE | `/api/admin/faqs/:id` | Delete a FAQ |

---

## CI

GitHub Actions runs on every push and pull request to `main`:

- **`backend-test`** — `npm ci` → `nest build` → `jest`
- **`frontend-build`** — `npm ci` → `tsc -b && vite build`
- **`build-and-push`** — builds Docker images and pushes to Docker Hub (push to `main` only)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Deployment

### Prerequisites

- **AWS account** with an EC2 instance (t2.micro free tier is sufficient)
- **Docker Hub account** for storing the built images
- **Docker** and **Docker Compose** installed on the EC2 instance

### GitHub Actions secrets / variables

Set these in your repository **Settings → Secrets and variables → Actions**:

| Name | Type | Value |
|---|---|---|
| `DOCKER_USERNAME` | Secret | Your Docker Hub username |
| `DOCKER_PASSWORD` | Secret | Your Docker Hub password or access token |
| `VITE_FIREBASE_API_KEY` | Secret | Firebase web API key |
| `VITE_API_URL` | Variable | Your EC2 public URL e.g. `http://<ec2-ip>:3001` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Variable | `<project_id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Variable | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Variable | `<project_id>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Variable | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Variable | Firebase app ID |

Every push to `main` will automatically build and push the Docker images.

### EC2 instance setup

SSH into your EC2 instance and run:

```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow running Docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker
```

### Environment variables on EC2

Create `/home/ubuntu/backend.env` on the EC2 instance:

```env
PORT=3001
MONGO_URI=<your_mongodb_atlas_connection_string>
MINIMAX_API_KEY=<your_minimax_api_key>
GEMINI_API_KEY=<your_gemini_api_key>
FIREBASE_PROJECT_ID=<your_firebase_project_id>
FIREBASE_CLIENT_EMAIL=<your_firebase_admin_client_email>
FIREBASE_PRIVATE_KEY="<your_firebase_admin_private_key>"
```

Copy the production compose file to the instance:

```bash
scp deploy/docker-compose.prod.yml ubuntu@<ec2-ip>:/home/ubuntu/docker-compose.prod.yml
scp deploy/deploy.sh ubuntu@<ec2-ip>:/home/ubuntu/deploy.sh
chmod +x /home/ubuntu/deploy.sh
```

### Deploy

```bash
ssh ubuntu@<ec2-ip>
export DOCKER_USERNAME=yourdockerhubusername
bash /home/ubuntu/deploy.sh
```

The script pulls the latest images from Docker Hub and restarts the containers with `restart: always`.

### EC2 Security Group — required inbound rules

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | Your IP | SSH access |
| 80 | TCP | 0.0.0.0/0 | Frontend (HTTP) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (if you add TLS) |
| 3001 | TCP | 0.0.0.0/0 | Backend API (direct access) |

### Local Docker test

Before deploying, verify both images build correctly on your local machine:

```bash
docker-compose build
```

Then start the full stack locally:

```bash
docker-compose up
```

Open `http://localhost` — the frontend is served by nginx on port 80, with `/api/*` proxied to the backend on port 3001.
=======
# Vicharanashala FAQ Portal Prototype 🚀

Welcome to the FAQ Portal! If you are new to this project, don't worry. This guide is written so that anyone can understand it, even if you are just starting out with coding.

Think of this app like a restaurant:
* **The Database (MongoDB):** This is the pantry where we store all our food (the FAQ questions).
* **The Backend (NestJS):** This is the waiter and kitchen. It takes requests from the customers and fetches the right food from the pantry.
* **The Frontend (React):** This is the beautiful dining room where the customer sits, reads the menu (the FAQs), and talks to the staff.

---

## 🌟 What We Have Built So Far (Phase 1)

1.  **The Brain is Filled (Database Seeding):** We created a script that automatically takes 127 official Samagama FAQs and neatly organizes them into our MongoDB database. 
2.  **The Waiter is Ready (NestJS Backend):** We built a backend server that safely connects to the database. It has a special "route" (like a door) that allows the frontend to ask for the FAQ questions.
3.  **The Dining Room is Open (React Frontend):** We built a beautiful website where users can view all the questions. It has a working search bar and category buttons that filter the questions instantly!

---

## 🛠️ How to Run the App on Your Computer

Follow these steps exactly to see the app working on your screen. You will need to open **three different terminal windows**.

### Step 1: Wake Up the Database
Our app needs a place to store data. If you are using a local database on a Mac, open your terminal and type:
`brew services start mongodb-community`
*(If your team is using a cloud database like MongoDB Atlas, you can skip this step!)*

### Step 2: Feed the Database (Only do this ONCE!)
We need to put the 127 questions into the database. 
1. Open a terminal and go into the `backend` folder.
2. Type: `npm install` (to download the tools we need).
3. Type: `MONGO_URI="mongodb://localhost:27017/vicharanashala" npx ts-node seed.ts`
*(When it says "FAQs seeded successfully!", you are done. Never run this again unless you want to erase everything and start over).*

### Step 3: Start the Backend (The Waiter)
Keep the database running in the background. Now let's turn on the backend.
1. Open a **new** terminal window and go into the `backend` folder.
2. Type: `npm run start:dev`
*(Wait until it says the Nest application successfully started. It is now running on port 3000).*

### Step 4: Start the Frontend (The Dining Room)
Now let's turn on the beautiful website.
1. Open a **third** terminal window and go into the `frontend` folder.
2. Type: `npm install` (to download the tools for the website).
3. Type: `npm run dev`
4. It will give you a link (usually `http://localhost:5173/`). Click it or type it into your browser!

---

## 🔮 Future Work (What we are building next)

We have some amazing features planned. If you want to help, here is what we are building and where the code will go:

### 1. The Yaksha-mini AI Chatbot (Phase 2)
* **What it is:** A floating chat window where users can ask questions. If the answer isn't in the FAQs, an AI will answer it! We have a super-smart system that tries the Minimax AI first, and if that fails, it instantly switches to Gemini AI so it never breaks.
* **Where it belongs:** * Frontend: `frontend/src/YakshaChat.tsx` (to connect the "Send" button to the real API).
    * Backend: `backend/src/ai.service.ts` (this file is already built, we just need to link it to a controller!).

### 2. Admin Maker-Checker Panel
* **What it is:** A secret page for team members. When students suggest new answers, they go into a "Pending" queue. An admin must read them and click "Approve" before the public can see them.
* **Where it belongs:** * Backend: `backend/src/pending-approvals.schema.ts` (the database rules for pending items).
    * Frontend: A new file we will create called `frontend/src/AdminPanel.tsx`.

### 3. Light & Dark Mode Toggle
* **What it is:** A simple switch at the top of the screen so users can change the website from dark mode (night) to light mode (day).
* **Where it belongs:** * Frontend: `frontend/src/style.css` (we will add light mode colors) and a new toggle button in `frontend/src/FaqDashboard.tsx`.

### 4. "Liquid Glass" UI Design
* **What it is:** Upgrading the look of our buttons and chat widget so they look slightly see-through and shiny, exactly like the premium glass icons you see on Apple devices or Telegram.
* **Where it belongs:** * Frontend: `frontend/src/style.css`. We will use CSS properties like `backdrop-filter: blur(10px)` to make things look like frosted glass!
>>>>>>> upstream/main
