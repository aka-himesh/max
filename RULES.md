# RULES.md — Civic Issue Reporting & Tracking System
> **Single source of truth.** Flutter, Web, ML and Backend all obey this file.
> If code and this file disagree, **this file wins** until it is changed through Section 15.
> Place it at the repo root. Every AI-assistant prompt starts with: "Read /RULES.md first."

---

## 0. Instructions for AI coding assistants (Cursor, Copilot, Claude, Gemini…)
Read this whole file before writing any code.
Never invent an endpoint, field, enum value, header, port or env var. Use only what is written here.
If something you need is missing or ambiguous, do not guess. Add `// TODO(contract): <question>` in the code and append the question to `docs/api/CONTRACT_QUESTIONS.md`. Then continue with a clearly isolated placeholder.
Only edit files inside your own folder (Section 2). Never edit another developer's folder.
Never hardcode URLs, keys, secrets or file-system paths. Use the config in Section 3.
Do not rename JSON fields to match language style in the wire format. Map them inside your own model layer (Section 4).
Keep it hackathon-simple: no microservices, no message queues, no extra databases.

---

## 1. Architecture laws (non-negotiable)
```
Flutter App ──HTTPS REST + WebSocket──▶ BACKEND ──▶ Database
Authority Web ─HTTPS REST + WebSocket─▶ BACKEND ──▶ Database
ML Service / Dashcam runner ─HTTPS REST─▶ BACKEND ──▶ Database
BACKEND ─HTTPS REST─▶ ML Service  (inference only)
BACKEND ──▶ Email / Push / Object storage / Maps
```
- **L1.** The Backend is the only component that touches the database.
- **L2.** Flutter, Web and ML never connect to the database, never import backend code, never read each other's files.
- **L3.** Flutter and Web talk only to the Backend. They never call the ML service.
- **L4.** ML never writes to storage or DB. It returns detections or posts reports to the Backend.
- **L5.** The Backend must keep working if the ML service is down (report is created with `ai_result = null`).
- **L6.** Clients (Flutter, Web) must never compute business logic (priority, severity, duplicate, DLP, SLA, routing). They display what the Backend returns.
- **L7.** The wire format is defined only in this file. Folder-local models mirror it.
- **L8.** The database and file storage are Supabase, and only the Backend talks to Supabase, using the server-side key. Flutter, Web and ML must not install the Supabase SDK, must not hold any Supabase URL or key, and must not use Supabase Auth, Realtime, Storage or the auto-generated REST API. Login is the Backend's JWT (Section 7.1) and realtime is the Backend's WebSocket (Section 9).

---

## 2. Ownership and repo layout
| Folder | Owner | May edit |
| --- | --- | --- |
| `mobile/` | Flutter developer | only `mobile/` |
| `web/` | Web developer | only `web/` |
| `ml/` | ML developer | only `ml/` |
| `backend/` | Backend developer | only `backend/` |
| `docs/` and `RULES.md` | Backend developer (owner), others via PR | contract changes follow Section 15 |

```
project/
├── RULES.md
├── mobile/                 # Flutter citizen app
├── web/                    # React + Tailwind authority dashboard
├── backend/
│   ├── routes/ controllers/ models/ services/ middleware/ workers/ server/
├── ml/
│   ├── model/              # best.pt, classes.py, model_info.yaml
│   ├── inference/          # detector.py, dashcam_runner.py
│   ├── preprocessing/
│   ├── api/                # FastAPI app (main.py)
│   └── training/           # main.ipynb (training notebook)
└── docs/
    ├── architecture/ database/
    └── api/
        ├── openapi.yaml
        ├── examples/*.json         # one JSON file per response (mock source for Flutter/Web)
        └── CONTRACT_QUESTIONS.md
```

---

## 3. Environment, ports and config
| Service | Port | Notes |
| --- | --- | --- |
| Backend | `8000` | base path `/api`, WebSocket at `/ws` |
| ML service | `8001` | reachable only by the Backend (and the dashcam runner talks to Backend, not to itself) |
| Web (Vite dev) | `5173` | Backend CORS must allow `http://localhost:5173` |

| Variable | Used by | Meaning |
| --- | --- | --- |
| `API_BASE_URL` | Flutter (`--dart-define`) | e.g. `http://10.0.2.2:8000/api` (Android emulator), `http://<LAN-IP>:8000/api` (real phone) |
| `VITE_API_BASE_URL` | Web | e.g. `http://localhost:8000/api` |
| `VITE_WS_URL` | Web | e.g. `ws://localhost:8000/ws` |
| `BACKEND_URL` | ML dashcam runner | e.g. `http://localhost:8000` |
| `ML_SERVICE_KEY` | Backend and ML runner | shared secret sent as `X-Service-Key` |
| `ML_SERVICE_URL` | Backend | e.g. `http://localhost:8001` |
| `MODEL_PATH` | ML service | path to `best.pt` |
| `JWT_SECRET` | Backend only | never shared |
| `DATABASE_URL` | Backend only | Supabase Postgres connection string (pooler string, see Section 12.1) |
| `SUPABASE_URL` | Backend only | project URL, used for Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only | secret. Never in git, never in any client, never logged |
| `SUPABASE_BUCKET` | Backend only | `report-images` |
| `EMAIL_DRY_RUN` | Backend | default `true`: emails are recorded, not sent |
| `SLA_DEMO_MODE` | Backend | `true` shrinks SLA timers to minutes for the demo |

Real phones and the laptop must be on the same Wi-Fi. The Backend binds to `0.0.0.0`.

---

## 4. Global conventions
| Topic | Rule |
| --- | --- |
| JSON naming | `snake_case` for every field, query param and enum value |
| IDs | opaque strings (backend may use UUID). Clients never parse or assume numeric |
| Time | ISO-8601 UTC with `Z`, e.g. `2026-10-03T09:30:00Z`. Dates only (DLP): `YYYY-MM-DD` |
| Coordinates | `latitude`, `longitude` — floats, WGS84. Never `lat`, `lng`, `lon` |
| Pagination | `page` (1-based, default 1), `page_size` (default 20, max 100) |
| Auth | `Authorization: Bearer <jwt>` for users. `X-Service-Key: <ML_SERVICE_KEY>` for the ML runner |
| Images | field name `image`; JPEG or PNG; max 8 MB; clients resize longest side to ≤ 1600 px |
| Image URLs | absolute URLs returned by the Backend; clients never build them |
| Unknown enum | clients must not crash; show the raw value / "Unknown" |
| Nulls | missing optional values are `null`, never omitted for documented fields |

### Success envelope
```json
{ "data": { }, "meta": { } }
```
Lists: `data` is an array, `meta` = `{ "page": 1, "page_size": 20, "total": 134 }`.

### Error envelope (every non-2xx response)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "latitude is required", "details": { "field": "latitude" } } }
```

| HTTP | `code` |
| --- | --- |
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED` (clients: clear token, go to login) |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `INVALID_TRANSITION` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `VALIDATION_ERROR` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

## 5. Shared enums (exact strings)
```
role:      citizen | officer | admin | contractor      (contractor has NO UI in this hackathon; reserved)
source:    citizen | vehicle_ai
status:    submitted | verified | assigned | in_progress | resolved | rejected | escalated
channel:   in_app | email | push | sms
notification_type: report_received | status_changed | assigned | duplicate_merged | escalated | resolved
```

### Status transitions (Backend enforces, returns 409 `INVALID_TRANSITION` otherwise)
| From | To | Who |
| --- | --- | --- |
| `submitted` | `verified`, `rejected` | officer, admin |
| `verified` | `assigned` (via assign endpoint), `rejected` | officer, admin |
| `assigned` | `in_progress`, `rejected` | officer, admin |
| `in_progress` | `resolved`, `rejected` | officer, admin |
| any open status | `escalated` | system only (SLA breach) |
| `escalated` | `in_progress`, `resolved` | officer, admin |
| `resolved`, `rejected` | none (terminal) | — |

`comment` is required for `rejected` and `resolved`.

### Categories (slugs)
```
damaged_road | pothole | illegal_parking | broken_road_sign | fallen_tree |
garbage | vandalism | dead_animal | damaged_concrete | electric_hazard | other
```
`other` can only come from a citizen. The ML service never emits `other`.
Severity: integer `1`–`5` (5 = worst). `priority_score`: float `0`–`100`. Both are computed by the Backend only.

---

## 6. ML facts taken from the team notebook (`main.ipynb`)
- Framework: Ultralytics YOLOv8, object detection
- Model name / version: `Urban Issues YOLOv8 Detector` / `1.0`
- Input size: `640`
- Inference defaults: `conf=0.25`, `iou=0.45`

### Class table
| `class_id` | `class_name` | `category` slug | Backend dept. (default) | Road lookup + DLP? | Base severity (proposed) |
| --- | --- | --- | --- | --- | --- |
| 0 | Damaged Road Issues | `damaged_road` | Roads | yes | 3 |
| 1 | Pothole Issues | `pothole` | Roads | yes | 3 |
| 2 | Illegal Parking Issues | `illegal_parking` | Traffic | no | 1 |
| 3 | Broken Road Sign Issues | `broken_road_sign` | Roads | yes | 2 |
| 4 | Fallen Trees | `fallen_tree` | Horticulture | no | 4 |
| 5 | Littering/Garbage on Public Places | `garbage` | Sanitation | no | 2 |
| 6 | Vandalism Issues | `vandalism` | Enforcement | no | 1 |
| 7 | Dead Animal Pollution | `dead_animal` | Sanitation | no | 3 |
| 8 | Damaged Concrete Structures | `damaged_concrete` | Roads | yes | 4 |
| 9 | Damaged Electric Wires and Poles | `electric_hazard` | Electricity | no | 5 |

---

## 7. API contract (base path `/api`)

### 7.1 Health and auth
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | none | `{ "data": { "status": "ok" } }` |
| POST | `/auth/register` | none | citizen registration only |
| POST | `/auth/login` | none | all roles |
| POST | `/auth/logout` | any | token is stateless, returns 204. Clients also discard the token |
| GET | `/auth/me` | any | current user |

### 7.2 Reports
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/reports` | C | create a citizen report (multipart) |
| GET | `/reports` | C (own only), O (own department), A (all) | list with filters |
| GET | `/reports/map` | O, A | lightweight points for the map |
| GET | `/reports/{report_id}` | owner C, O, A | detail |
| PATCH | `/reports/{report_id}/status` | O, A | change status |
| PATCH | `/reports/{report_id}/assign` | O, A | assign department and optional officer |
| GET | `/reports/{report_id}/history` | owner C, O, A | status log |
| GET | `/reports/{report_id}/escalations` | O, A | escalation log |

### 7.3 ML ingestion
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/ml/reports` | S | vehicle/dashcam detection becomes a report (`source = vehicle_ai`) |

### 7.4 Reference data, notifications, dashboard, devices
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/departments` | any | `[ { department_id, department_name, department_type, contact_email } ]` |
| GET | `/roads/{road_id}` | O, A | road registry row with DLP dates |
| GET | `/contractors/{contractor_id}` | O, A | contractor row |
| GET | `/notifications` | any (own) | `page`, `page_size`, `unread_only` |
| PATCH | `/notifications/{notification_id}/read` | any (own) | mark read |
| POST | `/devices` | C | push token registration |
| GET | `/dashboard/stats` | O (own department), A | statistics |

---

## 9. Realtime (WebSocket)
`ws://<host>:8000/ws?token=<jwt>`
Event names: `report.created`, `report.status_changed`, `report.escalated`, `notification.created`.

---

## 13. Seed and demo data
| Account | Email | Password | Role |
| --- | --- | --- | --- |
| Citizen | `citizen@demo.com` | `Demo@1234` | citizen |
| Officer | `officer@demo.com` | `Demo@1234` | officer (Roads department) |
| Admin | `admin@demo.com` | `Demo@1234` | admin |
