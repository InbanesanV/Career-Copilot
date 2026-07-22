# 🚀 Career Copilot — AI Resume Analyzer & ATS Gap Coach

> **Hackathon Theme:** Sustainability & Social Impact — Skill Development / Education

An AI-powered career assistant designed for students and job seekers — especially those from tier-2/3 colleges with limited placement support. Career Copilot analyzes your resume against any target job description using Google Gemini, computes an instant ATS match score, highlights precise skill gaps, and generates a concrete learning roadmap to close those gaps.

With full **User Authentication (Local + Google Sign-In)**, your progress and history are securely saved and tracked over time, allowing you to compare past analyses side-by-side to measure real growth.

---

## ✨ Key Features

- **🔐 Secure Dual Authentication** — Sign up/login via traditional Username/Password (secured with `bcrypt` & JWT) or official **Google Sign-In** (`gsi/client`). All analyses and history are strictly private and scoped to your account (`userId`).
- **🎯 ATS Match Score** — Instant 0–100 score evaluating how well your resume matches the target job description.
- **⚡ Skill Gap Breakdown** — Clear visual categorization of skills you matched versus critical skills missing from your resume.
- **🗺️ AI-Powered Roadmap** — 4–6 specific, skill-linked learning steps and actionable tasks tailored to close your exact gaps.
- **📄 Recommended Format Suggestion** — AI domain-level recommendation on the best resume layout and formatting style (`templateSuggestion`) for the target role along with detailed rationale.
- **📈 Progress Comparison (`/compare`)** — Side-by-side comparison between any two past analyses. Automatically computes score deltas (`+X pts`), highlights **✅ Closed Gaps**, **⚠️ Persistent Gaps**, and **🆕 New Gaps**.
- **📊 Chronological History Tracking (`/history`)** — Interactive chart (`recharts`) visualizing your match score progression over time across all submitted applications.
- **📁 Drag-and-Drop Parsing** — Support for both PDF (`pdf-parse`) and DOCX (`mammoth`) resume uploads up to 10 MB.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, Tailwind CSS, React Router v6, Recharts, Lucide Icons |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcrypt`), Google Identity Services (`gsi/client`), Google Auth Library |
| **AI / ML** | Google Gemini API (`gemini-2.0-flash`) via `@google/genai` |
| **File Parsing** | `multer` (in-memory uploads), `pdf-parse` (PDF extraction), `mammoth` (DOCX extraction) |
| **Security & Rate Limiting** | `express-rate-limit` (brute-force defense on auth and analysis endpoints), `cors` with dynamic local origin matching |

---

## 📁 Folder Structure

```
career-copilot/
├── client/                              # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                # Axios instance with JWT request/response interceptors
│   │   ├── components/
│   │   │   ├── GoogleSignInButton.jsx   # Official GIS Google Sign-In button
│   │   │   ├── ProtectedRoute.jsx       # Route guard requiring valid auth
│   │   │   ├── RoadmapChecklist.jsx     # Interactive learning steps checklist
│   │   │   ├── ScoreGauge.jsx           # Circular ATS match score gauge
│   │   │   ├── SkillTags.jsx            # Matched & missing skills tags
│   │   │   └── UploadForm.jsx           # Resume & JD upload form
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Global authentication state provider
│   │   ├── pages/
│   │   │   ├── CompleteGoogleProfile.jsx # College & registration profile completion for new Google users
│   │   │   ├── Compare.jsx              # Side-by-side historical analysis comparison
│   │   │   ├── History.jsx              # Chronological history chart and list view
│   │   │   ├── Home.jsx                 # Main upload & analysis page
│   │   │   ├── Login.jsx                # Username/password & Google login
│   │   │   ├── Register.jsx             # Account registration with per-field validation
│   │   │   └── Results.jsx              # Detailed analysis breakdown & format suggestions
│   │   ├── App.jsx                      # App navigation & routes
│   │   ├── main.jsx                     # Application entry point
│   │   └── index.css                    # Tailwind design system & animations
│   ├── index.html                       # Base HTML (includes Google Identity script)
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── server/                              # Express backend
    ├── models/
    │   ├── Analysis.js                  # Mongoose schema (userId, jobTitle, matchScore, roadmap, etc.)
    │   └── User.js                      # Mongoose schema (userName, passwordHash, googleId, collegeName, etc.)
    ├── routes/
    │   ├── analyze.js                   # POST /api/analyze (protected AI gap analysis endpoint)
    │   ├── auth.js                      # POST /api/auth/register, /login, /google, /google/complete-profile
    │   └── history.js                   # GET /api/history, /api/history/compare (user-scoped endpoints)
    ├── utils/
    │   ├── auth.js                      # JWT signing & requireAuth middleware
    │   └── parseResume.js               # PDF & DOCX text extraction utilities
    ├── index.js                         # Server setup, MongoDB retry connection, rate limiters
    └── package.json
```

---

## ⚙️ Setup & Local Development

### Prerequisites
- **Node.js** 18 or higher
- A free **MongoDB Atlas** cluster (`MONGO_URI`)
- A **Google AI Studio** API key for Gemini (`GEMINI_API_KEY`)
- *(Optional)* A **Google Cloud Console** OAuth 2.0 Client ID for Google Sign-In (`GOOGLE_CLIENT_ID`)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/career-copilot.git
cd career-copilot
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

#### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env` and fill in your details:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/career-copilot?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
ALLOWED_ORIGIN=http://localhost:3000,http://localhost:5173
JWT_SECRET=your_long_random_jwt_secret_hex_string
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

#### Frontend (`client/.env`)
Create or copy `client/.env.example` to `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```
*(Note: If `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` is left blank during local testing, the Google Sign-In buttons automatically hide without affecting the username/password registration workflow).*

---

### 4. Run Both Dev Servers

Open two terminal windows:

```bash
# Terminal 1 — Backend API Server (Port 5000)
cd server
npm run dev
```

```bash
# Terminal 2 — Frontend Dev Server (Port 3000 or 5173)
cd client
npm run dev
```

Open `http://localhost:3000` (or `http://localhost:5173`) in your web browser.

---

## 🧪 End-to-End Workflow

1. **Sign Up / Login**: Navigate to `/register` to create a new account with your College Name and Register Number, or use **Sign in with Google**.
2. **Submit Resume**: On the Home page (`/`), enter your **Target Job Title**, upload your PDF/DOCX resume, and paste the full job description.
3. **Review Results**: Click **Analyze My Resume** to view your match score, missing skills, customized learning roadmap, and recommended formatting style.
4. **Track Progress**: Go to **History** (`/history`) to inspect your historical scores and performance chart.
5. **Compare Growth**: Run another analysis and click **Compare** (`/compare`) to select two past analyses and view your exact score delta (`+X pts`) along with gaps you successfully closed!

---

## 🚀 Deployment

### Client (Vercel)
1. Connect the `client/` folder to Vercel.
2. Set environment variables:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://career-copilot-api.onrender.com`)
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID

### Server (Render / Heroku / Fly.io)
1. Deploy the `server/` directory as a Node.js Web Service.
2. Build Command: `npm install`
3. Start Command: `node index.js`
4. Set environment variables: `MONGO_URI`, `GEMINI_API_KEY`, `PORT`, `ALLOWED_ORIGIN`, `JWT_SECRET`, and `GOOGLE_CLIENT_ID`.

---

## 🔮 Future Enhancements

- **📄 PDF Export of Reports** — Download the complete analysis report (`score`, `gaps`, and `roadmap`) as a beautifully formatted PDF.
- **✍️ AI Resume Bullet Rewriter** — Automated suggestions rewriting weak resume bullet points to naturally incorporate missing keywords while maintaining quantifiable impact.
- **🎙️ Interview Question Generator** — Tailored technical and behavioral interview questions generated based on your exact skill gaps and the target job description.
- **🌐 Multi-language Support** — Full analysis and roadmap translation for non-English job descriptions and regional placements.

---

## 📄 License

MIT — Built with ❤️ for students who deserve better placement support and actionable career guidance.
