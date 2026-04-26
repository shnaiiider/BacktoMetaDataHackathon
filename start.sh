#!/bin/bash
# OpenMetadata Dashboard - Local Dev Startup Script

set -e

echo "🚀 Starting OpenMetadata Dashboard..."

# ── Backend ────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Starting FastAPI backend on http://localhost:8000"

cd "$(dirname "$0")/backend"

if [ ! -d ".venv" ]; then
  echo "  Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# ── Frontend ───────────────────────────────────────────────────────────────────
echo ""
echo "▶ Starting React frontend on http://localhost:3000"

cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Installing npm packages..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Dashboard is running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
