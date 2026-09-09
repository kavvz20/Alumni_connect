# 🎓 Alumni Connect — Institutional Networking, Mentorship & Referral Platform

<div align="center">

![Alumni Connect Banner](https://img.shields.io/badge/Platform-Alumni_Connect-black?style=for-the-badge&logo=mortarboard)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js_Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io_Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)

<p align="center">
  <b>A full-stack institutional web ecosystem designed to bridge the gap between students, alumni, and administrators through real-time communication, intelligent mentor matching, verified internal job referrals, and community engagement.</b>
</p>

[Key Features](#-key-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [API Reference](#-api-reference) • [Role Capabilities](#-role-based-access-control-rbac)

</div>

---

## 🌟 Key Features

### 🤝 1. Intelligent Mentorship Lifecycle
- **AI-Powered Mentor Matching:** Recommends relevant mentors based on domain interest, skills, target companies, and career aspirations.
- **Mentorship Request Hub:** Students can schedule 1-on-1 mentorship requests with custom agendas; mentors can accept, decline, or provide notes.

### 💼 2. Opportunities & Verified Referral Portal
- **Opportunities Board:** Alumni post verified internships, full-time roles, and research openings.
- **1-Click Referral Requests:** Students can request referrals directly on specific job listings with portfolio/resume links and pitch notes.
- **Referral Tracker:** Tracks submitted referral requests and candidate statuses in real time.

### 💬 3. Real-Time Chat & Direct Messaging
- **Low-Latency WebSockets:** Powered by Socket.io for instantaneous message delivery.
- **Conversation Threads:** 1-on-1 chatting between students and alumni with online indicators and unread indicators.

### 👥 4. Alumni Directory & Profile Customization
- **Multi-Faceted Search:** Search and filter alumni by graduation year, current company, industry, skill tags, and location.
- **Profile Photo Uploads:** Integrated client-side HTML5 canvas compression (automatically downscales high-res photos to ~25KB WebP/JPEG data URLs) for instantaneous avatar updates.
- **Dynamic Avatars:** Fallback initials with role-differentiated gradients if no avatar is uploaded.

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
| **Firebase Client SDK** | `v12.18` | Client authentication and security |
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
| **Firebase Admin** | `v14.3` | Server-side identity validation |
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
│   │   │   ├── AIMentorMatchView.jsx # AI-based mentorship matching
│   │   │   ├── AdminCenterView.jsx   # Admin moderation & user management
│   │   │   ├── AlumniDirectoryView.jsx# Filterable alumni directory
│   │   │   ├── AuthModal.jsx         # Login & registration modal
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
```

#### Frontend (`frontend/.env`):
Create a `.env` file in the `frontend/` directory (optional for custom ports):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

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
| **AI Mentor Match Search** | ✅ | ✅ | ✅ |
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

### User & Authentication (`/api/v1/users`)
- `POST /register` — Register a new student or alumni account
- `POST /login` — Authenticate user and retrieve session token
- `GET /` — List provisioned users (with role filters)
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
3. **Admin Self-Protection:** Multi-step safeguards prevent accidental administrative account removal.
4. **Resilient Real-Time Sync:** WebSockets operate with automatic reconnect polling fallbacks.

---

## 📜 License & Contribution
This project is developed for institutional alumni networking and student mentorship. Licensed under the [ISC License](LICENSE).
