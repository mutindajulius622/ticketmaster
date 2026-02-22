#!/bin/bash

# Palmer Living Reality - Server Startup Script
# This script sets up the database and starts the backend server

set -e  # Exit on error

echo "=========================================="
echo "🏠 Palmer Living Reality - Server Setup"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate virtual environment if it exists
if [ -d "../palmer-living-reality" ]; then
    echo "📦 Activating virtual environment..."
    source ../palmer-living-reality/bin/activate
elif [ -d "../venv" ]; then
    echo "📦 Activating virtual environment..."
    source ../venv/bin/activate
fi

# Check if we're in the server directory, if not, go there
if [ ! -f "main.py" ]; then
    cd server
fi

# Setup database
echo ""
echo "📊 Setting up database..."
python -m server.setup_db

echo ""
echo "=========================================="
echo "🚀 Starting backend server on port 5555..."
echo "=========================================="
echo ""
echo "The server will run on: http://localhost:5555"
echo "API endpoints available at: http://localhost:5555/api/*"
echo ""
echo "To start the frontend (in another terminal):"
echo "  cd client && npm run dev"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="

# Start the Flask server as a module
python -m server.main

