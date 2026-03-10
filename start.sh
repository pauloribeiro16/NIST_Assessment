#!/bin/bash

echo "🚀 Starting NIST CSF 2.0 Assessment Dashboard..."
echo "=================================================="

# 1. Ensure Docker Socket is accessible (Prompt for sudo once if needed)
echo "[1/5] Ensuring Docker accessibility..."
sudo chmod 666 /var/run/docker.sock 2>/dev/null

# 2. Kill any existing backend process on port 5001
echo "[2/5] Cleaning up existing backend process on port 5001..."
PID=$(lsof -t -i:5001 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "      Killing existing process on port 5001 (PID: $PID)"
    kill -9 $PID
fi

# 3. Check and start the MCP Server Docker Container if not running
echo "[3/5] Checking NIST MCP Docker Container..."
if ! docker ps | grep -q "nist-mcp-server"; then
    echo "      Starting 'nist-mcp-server' container..."
    docker start nist-mcp-server 2>/dev/null || echo "      ⚠️  Warning: Could not start docker container. Dashboard will run in knowledge-only mode."
else
    echo "      ✅ Docker container is already running."
fi

# 4. Start the FastAPI backend using the shared virtual environment
echo "[4/5] Starting FastAPI backend on port 5001..."
/home/epmq/Desktop/Projects/shared-venv/bin/python backend/api.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "      ✅ Backend running in background (PID: $BACKEND_PID). Logs in backend.log"

# Wait a second to ensure backend starts
sleep 2

# 5. Start the React Frontend
echo "[5/5] Starting React Frontend..."
echo "      The dashboard will be available at http://localhost:3001"
echo "=================================================="
npm run dev

# Cleanup: If the user stops the frontend (Ctrl+C), kill the backend too
trap "echo 'Shutting down...'; kill $BACKEND_PID; exit" INT TERM EXIT
