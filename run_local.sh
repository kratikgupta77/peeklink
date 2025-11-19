#!/usr/bin/env bash
# ==========================================================
# PeekLink local launcher (Git Bash on Windows / Linux / macOS)
# Starts: Django (8000), FastAPI (9000), React (5173)
# Uses per-service .venv and python -m pip (Windows-safe)
# ==========================================================
set -euo pipefail

trap 'echo; echo "Stopping services..."; kill 0 || true' INT TERM EXIT

ensure_python() {
  if command -v py >/dev/null 2>&1; then
    echo py
  elif command -v python3 >/dev/null 2>&1; then
    echo python3
  else
    echo python
  fi
}

activate_here() {
  if [[ -f ".venv/Scripts/activate" ]]; then
    # Windows venv
    # shellcheck disable=SC1091
    source ".venv/Scripts/activate"
  elif [[ -f ".venv/bin/activate" ]]; then
    # *nix venv
    # shellcheck disable=SC1091
    source ".venv/bin/activate"
  else
    echo "!! venv not found in $(pwd)" >&2
    exit 1
  fi
}

start_django() {
  echo "[1/3] Starting Django API (http://127.0.0.1:8000)..."
  (
    cd backend_drf
    PY=$(ensure_python)
    [[ -d .venv ]] || "$PY" -m venv .venv
    activate_here
    "$PY" -m pip install -q -U pip
    "$PY" -m pip install -q -r requirements.txt
    export DJANGO_USE_SQLITE=1
    "$PY" manage.py migrate
    "$PY" manage.py runserver 127.0.0.1:8000
  ) &
}

start_verdicts() {
  echo "[2/3] Starting FastAPI Verdicts (http://127.0.0.1:9000)..."
  (
    cd verdicts
    PY=$(ensure_python)
    [[ -d .venv ]] || "$PY" -m venv .venv
    activate_here
    "$PY" -m pip install -q -U pip
    "$PY" -m pip install -q -r requirements.txt
    uvicorn main:app --reload --host 127.0.0.1 --port 9000
  ) &
}

start_dashboard() {
  echo "[3/3] Starting React Dashboard (http://127.0.0.1:5173)..."
  (
    cd dashboard
    # Fix Windows EPERM lock issues
    npm cache clean --force >/dev/null 2>&1 || true
    if [[ ! -d node_modules ]]; then
      rm -f package-lock.json 2>/dev/null || true
      npm install
    fi
    npm run dev
  ) &
}

echo ">>> Starting PeekLink local stack..."
start_django
start_verdicts
start_dashboard
wait
