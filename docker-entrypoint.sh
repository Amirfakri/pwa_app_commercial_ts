#!/bin/sh

echo "🚀 Starting PWA Application..."

# شروع backend
echo "📡 Starting backend server..."
cd /app/backend
node dist/server.js &

# کمی صبر برای بالا اومدن backend
sleep 5

# شروع frontend
echo "🎨 Starting frontend server..."
cd /app/frontend
npx serve -s dist -l 5173