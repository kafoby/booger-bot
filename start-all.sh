#!/bin/bash

# Start the Discord bot in the background
echo "Starting Discord bot..."
python main.py &

# Start the Node.js server
echo "Starting web server..."
npm run dev
