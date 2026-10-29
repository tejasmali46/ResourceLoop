# ResourceLoop

> **"Share Smarter. Organize Better. Keep Every Resource Accountable."**

An AI-powered, centralized college resource sharing, event permission, and equipment management platform. Built to eliminate fragmented email threads, manual paperwork, and double-booking conflicts across university venues, labs, and equipment pools.

---

## 1. Problem Statement

Colleges and universities own valuable infrastructure—seminar halls, auditoriums, 4K laser projectors, audio equipment, cameras, robotics maker labs, and high-performance computing clusters. Meanwhile, student clubs and project teams constantly require these resources for hackathons, technical workshops, guest lectures, and cultural events.

In traditional college workflows:
- Students have no real-time visibility into whether a venue or equipment pool is truly available.
- Booking requests require separate paper forms or messages to faculty, department heads, and lab technicians.
- Double bookings occur because reservations are recorded informally.
- Equipment is returned damaged or with missing accessories with zero accountability or condition audit trail.
- Requests remain stuck in pending states with no transparent explanation of who must take the next action.

---

## 2. Our Solution

**ResourceLoop** coordinates the entire campus resource lifecycle into **one unified, auditable application**:
- **Combined Event Request System**: A single 7-step wizard reserves the venue, multiple equipment pool units (projectors, microphones, speaker systems), schedule setup/cleanup buffers, and institutional permissions.
- **Deterministic Scheduling Engine**: Automatically verifies resource operating hours, prevents overlapping reservations, calculates real pooled capacity, and suggests verified alternative slots during conflicts.
- **Multi-Stage Approval Routing Engine**: Automatically routes requests through Faculty Mentors, Department HODs (mandated for events with $\ge 100$ attendees), and Resource Managers.
- **Physical Handover & Condition Auditing**: Check-out records initial condition grades (`EXCELLENT`, `GOOD`, `MINOR_ISSUES`, `DAMAGED`) and accessories checklists. Returns record final condition; any degradation automatically triggers an institutional incident report.
- **Fair Resource Allocation**: Club monthly quotas and explainable priority scores prevent resource hogging.
- **ResourceLoop Intelligence**: Natural-language discovery, workflow transparency, and equipment checklist recommendations backed by live database records with zero requirement for paid API keys.

---

## 3. User Roles & Permissions

| Role | Demo Email | Password | Primary Capabilities |
|------|------------|----------|----------------------|
| **Student / Club Rep** | `student.ecell@resourceloop.edu` | `Password@123` | Discovers resources, checks live capacity, submits multi-resource event requests, views multi-stage approval timelines, tracks equipment custody, reports return receipts. |
| **Faculty Coordinator** | `faculty.ecell@resourceloop.edu` | `Password@123` | First-tier review; verifies academic event objectives, club representation, safety guidelines; approves, rejects with reason, or requests changes. |
| **Department Head (HOD)** | `hod.cse@resourceloop.edu` | `Password@123` | Departmental review; authorizes high-capacity activities ($\ge 100$ attendees) and cross-departmental venue usage. |
| **Resource / Lab Manager** | `manager.av@resourceloop.edu` | `Password@123` | Operational review, conducts physical checkouts with initial condition grading, verifies accessories, processes returns, flags condition discrepancies. |
| **Institution Administrator** | `admin@resourceloop.edu` | `Password@123` | Institution-wide Recharts analytics, immutable audit logs, incident oversight, fair-use policies, department & club verification. |

> **Pro Tip**: Use the **1-Click Demo Persona Switcher** in the top navigation bar to switch between any of these roles instantly!

---

## 4. Technology Stack

### Frontend
- **Framework**: React 18 with Vite and TypeScript
- **Styling**: Tailwind CSS with custom emerald/teal institutional palette
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Charts & Data Visualization**: Recharts
- **Forms & Validation**: Controlled React forms with Zod schema validation

### Backend
- **Runtime & Framework**: Node.js, Express, TypeScript (Target: ES2022)
- **Database & ODM**: MongoDB with Mongoose (Strict schemas, compound indexes, references)
- **Authentication**: Stateless JSON Web Tokens (JWT) with bcrypt password hashing
- **Security**: Helmet, CORS, Express Rate Limiter, server-side role validation

### AI & Intelligence
- **Primary Engine**: ResourceLoop Intelligence deterministic institutional rule engine (works offline with zero paid API keys)
- **Optional Live Provider**: Google Gemini API integration (via `GEMINI_API_KEY` server environment variable)

---

## 5. Folder Structure

```
resourceloop/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── api/client.ts       # Typed REST API client
│   │   ├── components/         # Common UI, Navbar, Footer, StatusBadge
│   │   │   └── assistant/      # ResourceLoop Intelligence Modal
│   │   ├── context/            # AuthContext & 1-Click Role Switcher
│   │   ├── pages/              # Landing, Login, Register, Catalog, Incidents
│   │   │   ├── student/        # Dashboard, Event Wizard, My Requests, Returns
│   │   │   ├── faculty/        # Multi-stage Approval Dashboard
│   │   │   ├── manager/        # Operations Dashboard & Handover Queue
│   │   │   └── admin/          # Live Recharts Analytics & Audit Log Viewer
│   │   ├── types/index.ts      # Shared TypeScript contracts
│   │   ├── App.tsx             # Route definitions
│   │   └── main.tsx            # Application entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Backend API Server
│   ├── src/
│   │   ├── config/             # DB connection & environment variables
│   │   ├── controllers/        # Express request handlers
│   │   ├── middleware/         # Auth, RateLimiter, ErrorHandler
│   │   ├── models/             # Mongoose schemas (Resource, Event, Handover, Incident...)
│   │   ├── routes/             # Versioned REST API endpoints (/api/v1/*)
│   │   ├── services/           # SchedulingEngine, ApprovalService, HandoverService, AI
│   │   ├── scripts/seed.ts     # Realistic institutional seed dataset
│   │   ├── tests/api.test.ts   # 20 Vitest automated integration tests
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # Server bootstrap
│   ├── package.json
│   └── tsconfig.json
├── docs/                       # Comprehensive Technical Documentation
│   ├── architecture.md         # System design, state machine, schedule algorithm
│   ├── api.md                  # REST endpoints specification
│   ├── testing.md              # Test matrix & automated test results
│   ├── deployment.md           # Production deployment & hosting guide
│   └── demo-guide.md           # Step-by-step judge demonstration scenario
├── .env.example                # Sample environment configuration
├── package.json                # Monorepo root runner scripts
└── README.md                   # Master project documentation
```

---

## 6. Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

### Step 1: Clone and Install Dependencies
From the project root:
```bash
npm run install:all
```
*(Or run `npm install` inside both `server` and `client` directories).*

### Step 2: Environment Setup
Copy the example environment configuration into `server/.env`:
```bash
cp .env.example server/.env
```

Ensure `MONGODB_URI=mongodb://127.0.0.1:27017/resourceloop` points to your active database.

### Step 3: Populate Database Seed Data
Run the idempotent seed script to create departments, demo accounts, resources, approval policies, and active events:
```bash
npm run seed
```

### Step 4: Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend API Server on port 5000):**
```bash
npm run dev:server
```

**Terminal 2 (Frontend Client on port 3000):**
```bash
npm run dev:client
```

Open `http://localhost:3000` in your web browser.

---

## 7. Running Automated Tests

Run the complete Vitest integration test suite:
```bash
npm run test:server
```
All **20/20 test cases pass** across authentication, multi-resource reservation locks, role authorization, checkouts, returns with condition degradation, waitlist promotions, and AI discovery.

---

## 8. AI Implementation: ResourceLoop Intelligence

ResourceLoop provides an assistant named **ResourceLoop Intelligence** accessible via the top-right `Sparkles` button on any page.

### Key Capabilities
1. **Natural-Language Discovery**: Extracts event type, attendance, preferred dates, and equipment keywords to query the real database and return verified availability.
2. **Equipment Checklists**: Recommends customized checklists based on event scale (e.g. hackathons receive dual projectors, wireless microphones, PA audio, and camera kits).
3. **Workflow State Explanations**: Resolves queries like *"Why is REQ-2026-0001 pending?"* using actual database records and explains which reviewer holds the next action.
4. **Deterministic Rule Engine (No Paid API required)**: The platform functions completely out-of-the-box without requiring an OpenAI or Gemini API key. If a `GEMINI_API_KEY` is provided, it safely enhances response formatting while grounding all facts in real database results.

---

## 9. Security & Governance Principles

- **Backend Authorization**: Role restrictions (`requireRoles`) protect every privileged action. Frontend button hiding is never used as a substitute for real server authorization.
- **Self-Approval Guard**: The approval engine strictly forbids users from approving their own event requests.
- **Fairness & Quotas**: Prevents dominant clubs from monopolizing scarce resources through monthly club quotas and explainable queue priorities.
- **Tamper-Proof Audit Trail**: Every checkout, return, condition grade, and approval decision is permanently logged in `AuditLog` with actor ID, timestamp, action name, and JSON payload.

---

## 10. License

Developed for the University Resource Management & Hackathon Innovation Track. Released under the MIT License.
