# OpenMetadata Dashboard

A full-stack data observability dashboard built on top of OpenMetadata. Shows table freshness, data quality test results, and pipeline status in real time.

---

## Features

| Feature | Details |
|---|---|
| **Table Freshness** | Last updated times, staleness classification (Fresh / Stale / Critical), frequency histogram, sortable table |
| **Data Quality** | Test pass rates, per-test-type breakdown, failed row counts, filterable results |
| **Pipeline Status** | Card-grid view with live running animations, status strip, per-service filters |
| **Overview** | Donut charts, KPI cards, live activity feeds across all three domains |
| **Auto-refresh** | All pages poll every 30 seconds |
| **Demo Mode** | Works out of the box without a real OpenMetadata instance |

---

## Quick Start

### Option 1 — Local Dev (recommended)

```bash
bash start.sh
```

- Frontend → http://localhost:3000  
- Backend API → http://localhost:8000  
- API Docs (Swagger) → http://localhost:8000/docs  

### Option 2 — Docker Compose

```bash
docker-compose up --build
```

Same ports as above.

### Option 3 — Run services separately

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # dev server at :3000
# or
npm run build      # production build → dist/
```

---

## Connecting to a Real OpenMetadata Instance

Edit `backend/.env`:

```env
DEMO_MODE=false
OPENMETADATA_HOST=http://your-om-host:8585
OPENMETADATA_TOKEN=your-jwt-token-here
```

To get a JWT token from OpenMetadata:  
Settings → Bots → Ingestion Bot → Copy Token

---

## Project Structure

```
openmetadata-dashboard/
├── backend/
│   ├── main.py              # FastAPI app — all endpoints
│   ├── requirements.txt
│   ├── .env                 # OpenMetadata connection config
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root component + routing
│   │   ├── components/      # Shared UI (StatCard, StatusBadge, Sidebar, Header, Spinner)
│   │   ├── pages/           # OverviewPage, FreshnessPage, TestsPage, PipelinesPage
│   │   ├── hooks/
│   │   │   └── useData.js   # Data fetching hook with polling
│   │   └── utils/
│   │       └── api.js       # Fetch wrappers + formatting helpers
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── start.sh                 # One-command local startup
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/overview` | Aggregated summary for all sections |
| GET | `/api/tables/freshness` | Table freshness data (`?status=fresh\|stale\|critical&database=...`) |
| GET | `/api/tests/results` | Quality test results (`?status=Success\|Failed\|Aborted`) |
| GET | `/api/pipelines/status` | Pipeline status (`?status=successful\|failed\|running\|queued`) |

Full interactive docs: http://localhost:8000/docs

---

## Freshness Classification

| Status | Condition | Color |
|---|---|---|
| **Fresh** | Updated within last 4 hours | 🟢 Green |
| **Stale** | 4 – 24 hours since update | 🟡 Amber |
| **Critical** | Not updated in 24+ hours | 🔴 Red |
