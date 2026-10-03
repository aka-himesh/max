# Authority Web Dashboard (CivicFix)

The Authority Web Dashboard is the administrative interface for the **Civic Issue Reporting & Tracking System**. It allows municipal department officers and city administrators to review incoming citizen reports and vehicle AI detections, manage triage workflows, assign departments, and track SLA compliance in realtime.

---

## 🛠 Technology Stack

- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS v3.4 (Slate & Indigo aesthetic)
- **Routing**: React Router v6
- **State & Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios with interceptors
- **Geospatial & Mapping**: Leaflet + React-Leaflet (OpenStreetMap tiles)
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Backend REST API base URL |
| `VITE_WS_URL` | `ws://localhost:8000/ws` | Backend WebSocket realtime endpoint |
| `VITE_USE_MOCK` | `true` (or `false`) | Toggle offline mock responses without backend |

### 3. Run Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:5173`

---

## 🎭 Mock Mode vs Live Backend

To develop and test when the backend is offline:
- Set `VITE_USE_MOCK=true` in `web/.env`
- Restart the dev server
- All API calls (`/auth/login`, `/dashboard/stats`, `/reports`, `/reports/map`, etc.) will immediately return structured mock data adhering to `RULES.md`.

To switch to the live backend:
- Set `VITE_USE_MOCK=false` in `web/.env`

---

## 🔐 Demo Credentials

| Role | Email | Password | Scope |
| --- | --- | --- | --- |
| **Officer** | `officer@demo.com` | `Demo@1234` | Roads & Infrastructure Department |
| **Administrator** | `admin@demo.com` | `Demo@1234` | All City Departments & System Oversight |

> **Note**: Citizen and contractor logins are blocked on this dashboard with an authorization error.
