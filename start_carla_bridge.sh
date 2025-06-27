#!/bin/bash
# CARLA Bridge Startup Script for CARJAN-app

echo "=== CARJAN CARLA Bridge Startup ==="
echo "Starting CARLA WebSocket Bridge..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing Python requirements..."
pip install -r requirements.txt

# Check if CARLA is running
echo "Checking CARLA connection..."
if ! nc -z localhost 2000; then
    echo "Warning: CARLA server not detected on localhost:2000"
    echo "Please make sure CARLA is running before connecting to the bridge"
fi

# Start the bridge
echo "Starting CARLA WebSocket Bridge on localhost:8765..."
echo "Press Ctrl+C to stop the bridge"
echo "=============================================="

python3 carla_bridge.py
