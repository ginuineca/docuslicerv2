#!/bin/bash

echo "🔧 DocuSlicer Production Environment Fix"
echo "======================================="

# Navigate to project directory
cd /var/www/docuslicer || {
    echo "❌ Error: Could not find project directory /var/www/docuslicer"
    exit 1
}

echo "📍 Current directory: $(pwd)"

# Create API environment file
echo "📝 Creating API environment file..."
cat > apps/api/.env << 'EOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://docuslicer.com
CORS_ORIGIN=http://docuslicer.com
EOF

# Create Web environment file
echo "📝 Creating Web environment file..."
cat > apps/web/.env << 'EOF'
NODE_ENV=production
VITE_API_URL=http://docuslicer.com/api
VITE_APP_NAME=DocuSlicer
VITE_APP_VERSION=2.0.0
EOF

# Verify files were created
echo "✅ Environment files created:"
echo "API .env file:"
cat apps/api/.env
echo ""
echo "Web .env file:"
cat apps/web/.env
echo ""

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install --production

# Build applications
echo "🔨 Building API..."
npm run build:api

echo "🔨 Building Web application..."
npm run build:web

# Stop existing services
echo "🛑 Stopping existing services..."
pm2 stop all || echo "No services running"

# Start services with ecosystem config
echo "🚀 Starting services..."
pm2 start ecosystem.config.js --env production

# Wait a moment for services to start
sleep 3

# Check service status
echo "📊 Service Status:"
pm2 status

# Show recent logs
echo "📋 Recent API logs:"
pm2 logs docuslicer-api --lines 10 --nostream

# Test API endpoint
echo "🧪 Testing API endpoint..."
curl -s http://localhost:3001/api/status || echo "API not responding"

# Test workflow endpoint
echo "🧪 Testing workflow endpoint..."
curl -s http://localhost:3001/api/workflow/workflows || echo "Workflow endpoint not responding"

echo ""
echo "✅ Environment fix completed!"
echo "🌐 Try accessing: http://docuslicer.com/dashboard"
echo "📊 Monitor logs with: pm2 logs"
echo "🔄 Restart services with: pm2 restart all"
