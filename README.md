# Alumni Connect — Thapar Ecosystem

A full-stack institutional alumni networking, referral, and mentorship platform.

## 📁 Project Structure

```
Alumni/
├── backend/                  # Node.js + Express + MongoDB Atlas + Socket.io
│   ├── src/
│   │   ├── controllers/      # API Controllers
│   │   ├── models/           # Mongoose Data Models
│   │   ├── routes/           # REST API Routes
│   │   ├── sockets/          # Real-time WebSocket handlers
│   │   ├── db/               # Database connection
│   │   ├── middleware/       # Auth & validation middlewares
│   │   ├── app.js            # Express app configuration
│   │   └── index.js          # Server entry point
│   ├── .env                  # Backend environment variables
│   └── package.json
│
├── frontend/                 # React 18 + Vite + Lucide Icons + Socket.io Client
│   ├── src/
│   │   ├── components/       # UI Components & Views
│   │   ├── services/         # API & WebSocket client
│   │   ├── App.jsx           # Main application router & state
│   │   └── index.css         # Theme styles (Cream & Black)
│   └── package.json
│
└── package.json              # Root workspace orchestration
```

## 🚀 How to Run

### Option 1: Run individually
- **Backend:**
  ```bash
  cd backend
  npm run dev
  ```
  *(Runs on http://localhost:8000)*

- **Frontend:**
  ```bash
  cd frontend
  npm run dev
  ```
  *(Runs on http://localhost:5173)*

### Option 2: Run from Root Directory
```bash
# Run backend only:
npm run dev:backend

# Run frontend only:
npm run dev:frontend

# Run both concurrently:
npm run dev
```
