# MyBread

A financial-literacy platform for classrooms. Students learn money basics through short lessons and quizzes, earn XP, and practice investing with a simulated stock portfolio. Teachers create classes, assign work, and track student progress.

## Features

### For Students
- **Lessons and quizzes**: five lessons with quizzes. Passing earns XP.
- **Simulated trading**: buy and sell real stocks with virtual money, with live quotes, symbol search, and price history charts.
- **Portfolio tracking**: portfolio value over time and gain/loss analytics.
- **Progress and rewards**: XP, level ring, achievements, and leaderboards.
- **Classes and assignments**: join a class with a code and complete teacher-assigned work.
- **Shared links**: resources posted by teachers.

### For Teachers
- **Dashboard** with class-wide progress charts.
- **Class management**: create classes and view enrolled students.
- **Student drill-down**: per-student progress and reports.
- **Assignments**: create assignments and review submissions.
- **Stocks view**: see how students are trading.
- **Shared links** for class resources.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | JWT, bcryptjs, express-rate-limit |
| Market data | [Twelve Data](https://twelvedata.com/) API |
| Hosting | Cloudflare Workers (frontend), Render (API) |

## Project Structure

```
MyBread/
├── Backend/
│   ├── server.js          # Express app entry point
│   ├── database.js        # MongoDB connection
│   ├── middleware/        # Auth middleware
│   ├── models/            # Mongoose models (User, Class, Assignment, ...)
│   ├── routes/            # auth, classes, assignments, learning, trading, reports
│   ├── trading/           # Portfolio, buy/sell logic, market data, analytics
│   ├── learning/          # Lesson catalog and grading
│   └── services/          # Assignment rewards
└── frontend/
    ├── src/
    │   ├── student/       # Student app (lessons, quizzes, stocks, leaderboards)
    │   ├── teacher/       # Teacher app (dashboard, classes, students)
    │   └── shared/        # Login, shared styles and helpers
    ├── worker.mjs         # Cloudflare Worker that proxies /api/* to the backend
    └── wrangler.jsonc     # Cloudflare config
```

## API Overview

| Route | Purpose |
|-------|---------|
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Authentication |
| `/api/classes` | Create, join, and view classes |
| `/api/assignments` | Create assignments, submit work, grade |
| `/api/learning` | Lesson and quiz progress |
| `/api/student/portfolio`, `/api/student/trades/buy`, `/api/student/trades/sell` | Simulated trading |
| `/api/student/stocks/:symbol/quote`, `/api/student/stocks/:symbol/history` | Market data |
| `/api/teacher/reports/class/:classId` | Teacher class reports |
| `GET /api/health` | Health check |

## Deployment

- **Backend**: deployed as a Node service on Render, using environment variables for the MongoDB connection, Twelve Data API key, and JWT secret.
- **Frontend**: built with Vite and deployed to Cloudflare Workers. A Worker (`worker.mjs`) forwards `/api/*` requests to the hosted backend.

## Notes

- Trading uses **virtual money only**. No real money or brokerage is involved.
- The free Twelve Data tier is rate limited. The backend backs off automatically when the limit is hit.
