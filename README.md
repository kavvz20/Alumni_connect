# 🎓 Alumni Connect — Institutional Networking, Mentorship & Referral Platform

<div align="center">

![Alumni Connect Banner](https://img.shields.io/badge/Platform-Alumni_Connect-black?style=for-the-badge&logo=mortarboard)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js_Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io_Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)

<p align="center">
  <b>A full-stack institutional web ecosystem designed to bridge the gap between students, alumni, and administrators through real-time communication, structured 1-on-1 mentorship, verified internal job referrals, and community engagement.</b>
</p>

[Key Features](#-key-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [API Reference](#-api-reference) • [Role Capabilities](#-role-based-access-control-rbac)

</div>

---

## 🌟 Key Features

### 👥 1. Alumni Directory & Profile Discovery
- **Multi-Faceted Search:** Search and filter verified alumni by graduation year, current company, domain skills, and industry.
- **Custom Profile Editor:** Edit bio, skills chips, LinkedIn/GitHub links, and upload canvas-compressed profile photos.
- **Dynamic Avatars:** Fallback initials with role-differentiated gradients if no avatar is uploaded.

### 🤝 2. Structured Mentorship Lifecycle
- **1-on-1 Mentorship Booking:** Students can submit structured mentorship requests directly to alumni with meeting agendas and preferred timelines.
- **Session Management:** Mentors can accept, decline, or complete requests while logging session notes.

### 💼 3. Opportunities & Verified Referral Portal
- **Opportunities Board:** Alumni post verified internships, full-time roles, and research openings.
- **1-Click Referral Requests:** Students can request referrals directly on specific job listings with portfolio/resume links and pitch notes.
- **Referral Tracker:** Tracks submitted referral requests and candidate review statuses in real time.

### 💬 4. Real-Time Chat & Direct Messaging
- **Low-Latency WebSockets:** Powered by Socket.io for instantaneous message delivery ($< 50$ms).
- **Conversation Threads:** 1-on-1 chatting between students and alumni with online indicators and unread message counters.

### 🏛️ 5. Administrative Command Center
- **Verification Queue:** Review pending alumni credentials (degree proofs, LinkedIn profiles) before granting verified alumni badges.
- **Provisioned User Directory:** Search, view, and safely delete student or alumni accounts with confirmation dialogs and administrative self-protection guards.
- **Analytics & Metrics:** View aggregate metrics on registered students, verified alumni, active referrals, and mentorship sessions.

### 🌐 6. Community Hub & Institutional Events
- **Discussion Forums:** Topic-based threads, questions, and upvotes across domains (Software, Core Engg, Higher Studies, Interviews).
- **Events & Webinars:** Institutional webinars, alumni meetups, and workshops with RSVP tracking.
- **Success Stories:** Showcase notable career milestones, research breakthroughs, and startup journeys of distinguished alumni.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `v19.2` | Modern declarative UI component library |
| **Vite** | `v8.2` | Ultra-fast build tool and local dev server |
| **React Router DOM** | `v7.18` | Declarative client-side routing & navigation |
| **Socket.io Client** | `v4.8` | Real-time bi-directional WebSocket client |
| **Lucide React** | `v1.39` | High-quality, lightweight SVG icon suite |
| **HTML5 Canvas API** | Native | In-browser client-side image compression & optimization |
| **Vanilla CSS Design System** | Native | Tailored cream & obsidian aesthetic, glassmorphism, responsive grid |

### Backend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0` | JavaScript runtime environment |
| **Express.js** | `v5.2` | High-performance RESTful API micro-framework |
| **MongoDB Atlas + Mongoose** | `v9.9` | Cloud NoSQL database with schema-level validation |
| **Socket.io** | `v4.8` | WebSocket server for direct messaging & notifications |
| **BcryptJS** | `v3.0` | Salted cryptographic password hashing |
| **CORS & Dotenv** | Latest | Cross-origin resource sharing & environment orchestration |

---

## 📁 Project Structure

```
Alumni/
├── backend/                          # Node.js + Express REST API & WebSocket Server
│   ├── src/
│   │   ├── controllers/              # Business logic & request handlers
│   │   │   ├── alumni.controller.js
│   │   │   ├── chat.controller.js
│   │   │   ├── event.controller.js
│   │   │   ├── forum.controller.js
│   │   │   ├── mentorship-request.controller.js
│   │   │   ├── opportunity.controller.js
│   │   │   ├── referral-request.controller.js
│   │   │   ├── report.controller.js
│   │   │   ├── success-story.controller.js
│   │   │   └── user.controller.js
│   │   ├── db/                       # MongoDB connection lifecycle
│   │   │   └── index.js
│   │   ├── middleware/               # Auth guards & error handlers
│   │   │   └── auth.middleware.js
│   │   ├── models/                   # Mongoose data schemas
│   │   │   ├── Chat.js
│   │   │   ├── Event.js
│   │   │   ├── Forum.js
│   │   │   ├── MentorshipRequest.js
│   │   │   ├── Opportunity.js
│   │   │   ├── ReferralRequest.js
│   │   │   ├── SuccessStory.js
│   │   │   └── user.model.js
│   │   ├── routes/                   # Express endpoint routers
│   │   ├── sockets/                  # Real-time WebSocket handlers
│   │   │   └── chat.socket.js
│   │   ├── app.js                    # Express app middleware & route wiring
│   │   └── index.js                  # HTTP + WebSocket server bootstrap
│   ├── .env.example                  # Backend environment template
│   └── package.json
│
├── frontend/                         # React 19 + Vite SPA
│   ├── src/
│   │   ├── components/               # Modular UI views & widgets
│   │   │   ├── AdminCenterView.jsx   # Admin moderation & user management
│   │   │   ├── AlumniDirectoryView.jsx# Filterable alumni directory
│   │   │   ├── AuthModal.jsx         # Login & registration modal
│   │   │   ├── AuthView.jsx          # Dedicated login/signup view
│   │   │   ├── Avatar.jsx            # Dynamic profile photo & initials component
│   │   │   ├── ChatView.jsx          # Real-time WebSocket messaging UI
│   │   │   ├── EventsView.jsx        # Institutional events & webinars
│   │   │   ├── ForumView.jsx         # Discussion forum & Q&A
│   │   │   ├── MentorshipView.jsx    # Mentorship scheduling & sessions
│   │   │   ├── Modals.jsx            # Create post, referral, & request modals
│   │   │   ├── Navbar.jsx            # Dynamic responsive navbar & role switcher
│   │   │   ├── OpportunitiesView.jsx # Job board & referral launcher
│   │   │   ├── ProfileView.jsx       # User profile editor & photo compressor
│   │   │   ├── ReferralHubView.jsx   # Referral pipeline tracker
│   │   │   └── SuccessStoriesView.jsx# Alumni spotlights
│   │   ├── services/                 # API client & WebSocket singleton
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx                   # Root application router & state store
│   │   ├── main.jsx                  # React DOM entrypoint
│   │   └── index.css                 # Global CSS design system
│   ├── .env.example                  # Frontend environment template
│   └── package.json
│
└── package.json                      # Workspace orchestration script
```

---

## ⚡ Getting Started

### 📋 Prerequisites
- **Node.js**: `v18.0.0` or higher ([Download](https://nodejs.org/))
- **npm**: `v9.0.0` or higher
- **MongoDB**: A free MongoDB Atlas cluster ([MongoDB Atlas](https://www.mongodb.com/atlas)) or local MongoDB instance

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/kavvz20/Alumni_connect.git
cd Alumni_connect
```

---

### 2️⃣ Configure Environment Variables

#### Backend (`backend/.env`):
Create a `.env` file in the `backend/` directory:
```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/alumni_connect?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:5173

ADMIN_EMAIL=your.admin@gmail.com        # the ONLY account with admin rights
JWT_SECRET=<long random string>         # signs session tokens
ALLOWED_STUDENT_DOMAIN=thapar.edu       # students may self-register only with this domain
FIREBASE_PROJECT_ID=<firebase project id>  # verifies Google sign-in tokens
LINKEDIN_URL_FETCH=false                # server-side LinkedIn page fetching (off: LinkedIn terms)
```
See `backend/.env.example` for all options.

#### Frontend (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project id>
VITE_FIREBASE_APP_ID=...
```

#### Enabling Google sign-in
1. Create a Firebase project → **Authentication → Sign-in method → Google → Enable**.
2. **Authentication → Settings → Authorized domains**: add `localhost` and your deployed frontend domain.
3. **Project settings → Your apps → Web app**: copy the config into the `VITE_FIREBASE_*` variables.
4. Put the same project ID in the backend's `FIREBASE_PROJECT_ID`.

#### How sign-in works
- Everyone can use **Continue with Google** or **email + password**. Both log into the same account (matched by email), and the backend issues one session token (`Authorization: Bearer …`).
- **Admin** access is granted only to `ADMIN_EMAIL`, checked on the server. Selecting "Admin" on the login page grants nothing by itself.
- **Students** must be registered by the admin or use an `@thapar.edu` account. **Alumni** can self-register and start as *Pending verification*, as do alumni added by the admin.

#### Alumni profiles (one record per alumnus)
- **Admin-created** (manual form or CSV) and **self-registered** alumni use the same `User` record. An admin-created alumnus is linked automatically when they first sign in with the same email.
- Alumni fill their profile by uploading their own **LinkedIn PDF** (LinkedIn → More → Save to PDF). The server parses it and stores its own copy of the result as verification evidence. Users can still edit the visible profile fields.
- The CSV accepts optional `batch`, `branch` and `degree` columns. They are kept as the institution's record for verification.
- A LinkedIn profile can belong to only one account. Admin onboarding refuses duplicates, and a self-registration that reuses one is flagged **Needs manual review**.
- After upgrading an existing database, run once: `cd backend && npm run migrate`.

#### Alumni verification & confidence score
- Every alumni save recomputes a **confidence score** with **match / mismatch / missing checks**. The checks compare the LinkedIn PDF evidence, the admin's institutional record and the self-reported profile on: institute in education, degree, graduation year, course duration, department, name, PDF-vs-URL, institutional email, and duplicate accounts.
- Until a model is trained this is a **rule-based evidence score** and is labelled as such. It is not a machine-learning prediction.
- A hard mismatch moves a profile from *Pending* to *Needs manual review*. Only an admin can set *Verified* or *Rejected*; a high score never verifies anyone automatically.
- Each admin decision is stored in `VerificationDecision` with the features as they were at that moment. Verified and rejected decisions become the labelled training data for the ML model.
- **ML model:** once enough real decisions exist, `npm run ml:export` (backend) followed by `python train.py` (ml/) trains a calibrated Random Forest / Logistic Regression model. The backend then shows "ML vN" scores instead. Full method and limitations: [ml/README.md](ml/README.md).

---

### 3️⃣ Install Dependencies

#### Install all root, backend, and frontend packages:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root
cd ..
```

---

### 4️⃣ Run the Application

#### Option A: Run Both Concurrently (Recommended)
From the root directory:
```bash
npm run dev
```

#### Option B: Run Individually
- **Terminal 1 (Backend):**
  ```bash
  cd backend
  npm run dev
  ```
  *Backend runs on `http://localhost:8000`*

- **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```
  *Frontend runs on `http://localhost:5173`*

---

## 🔒 Role-Based Access Control (RBAC)

| Feature | Student | Alumni | Administrator |
| :--- | :---: | :---: | :---: |
| **Browse Alumni Directory** | ✅ | ✅ | ✅ |
| **Request 1-on-1 Mentorship** | ✅ | ❌ | ❌ |
| **Accept / Manage Mentorship** | ❌ | ✅ | ✅ |
| **Browse Opportunities** | ✅ | ✅ | ✅ |
| **Post Job / Internship Opening** | ❌ | ✅ | ✅ |
| **Submit Referral Request** | ✅ | ✅ | ✅ |
| **Review / Refer Candidates** | ❌ | ✅ | ✅ |
| **Real-Time Direct Messaging** | ✅ | ✅ | ✅ |
| **Create Forum Posts & Comments**| ✅ | ✅ | ✅ |
| **Profile Photo Upload & Edit** | ✅ | ✅ | ✅ |
| **Alumni Verification Approvals** | ❌ | ❌ | ✅ |
| **Provisioned User Account Deletion**| ❌ | ❌ | ✅ |
| **System Analytics Dashboard** | ❌ | ❌ | ✅ |

---

## 📡 API Reference Overview

### Authentication (`/api/v1/auth`)
- `POST /google` — `{ idToken, requestedRole }` → verify Google sign-in, link or create the account, return `{ user, token }`
- `POST /login` — `{ email, password }` → `{ user, token }`
- `POST /register` — Self-register a student (`@thapar.edu`) or alumni with a password → `{ user, token }`
- `GET /me` — Current user for the session token

### Verification (`/api/v1/verification`)
- `GET /` — Admin queue (`status=open|pending|needs_manual_review|verified|rejected|all`, `search`)
- `GET /:userId` — Admin review details (evidence, institution record, checks, decision history)
- `PATCH /:userId` — Admin decision `{ decision, note }` (a note is required to reject)
- `POST /:userId/rescore`, `POST /rescore-all` — Recompute scores
- `GET /me` — The alumnus's own status, score and checks

### Users (`/api/v1/users`)
- `GET /` — List provisioned users (with role filters, signed-in users only)
- `GET /:id` — Fetch complete profile details by user ID
- `PATCH /:id` — Update user profile (skills, bio, company, profile picture)
- `DELETE /:id` — Delete user account (Admin only)

### Mentorship (`/api/v1/mentorship-requests`)
- `POST /` — Submit a mentorship request to an alumnus
- `GET /` — Fetch mentorship requests for the authenticated user
- `PATCH /:id` — Update status (`pending`, `accepted`, `rejected`, `completed`)

### Opportunities & Referrals (`/api/v1/opportunities` & `/api/v1/referral-requests`)
- `POST /api/v1/opportunities` — Post an internship or full-time opportunity
- `GET /api/v1/opportunities` — Fetch active opportunity listings
- `POST /api/v1/referral-requests` — Submit an internal referral application
- `GET /api/v1/referral-requests` — Fetch referral submissions with candidate details
- `PATCH /api/v1/referral-requests/:id` — Update referral review status

### Real-Time WebSocket Events (`Socket.io`)
- `join_room` — Join a private user conversation room
- `send_message` — Dispatch direct message to a recipient
- `receive_message` — Listen for incoming real-time messages
- `typing_indicator` — Broadcast typing status to active chat participants

---

## 🛡️ Security & Performance Highlights

1. **Client-Side Image Optimization:** Profile images uploaded by users are downscaled client-side through HTML5 Canvas into ultra-compact, crisp JPEG/WebP formats before payload transmission, ensuring ultra-fast load times and sub-30KB network footprints.
2. **Cryptographic Protection:** Passwords securely hashed using standard BcryptJS salt rounds.
3. **Server-side identity:** Every request is identified only by a signed session token (REST and Socket.io). User IDs sent in headers or request bodies are ignored, and admin rights are tied to `ADMIN_EMAIL`.
4. **Admin Self-Protection:** Multi-step safeguards prevent accidental administrative account removal.
5. **Resilient Real-Time Sync:** WebSockets operate with automatic reconnect polling fallbacks.

---

## 📜 License & Contribution
This project is developed for institutional alumni networking and student mentorship. Licensed under the [ISC License](LICENSE).
