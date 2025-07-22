#!/bin/bash

# DocuSlicer Production Update Script
# This script updates the production deployment with the latest code

set -e

echo "🚀 UPDATING DOCUSLICER PRODUCTION DEPLOYMENT"
echo "=============================================="

# Configuration
PROJECT_DIR="/var/www/docuslicer"
BACKUP_DIR="/var/backups/docuslicer"
REPO_URL="https://github.com/ginuineca/docuslicerv2.git"

# Create backup directory if it doesn't exist
echo "📁 Creating backup directory..."
sudo mkdir -p $BACKUP_DIR

# Create backup of current deployment
echo "💾 Creating backup of current deployment..."
BACKUP_NAME="docuslicer-backup-$(date +%Y%m%d-%H%M%S)"
sudo cp -r $PROJECT_DIR $BACKUP_DIR/$BACKUP_NAME
echo "✅ Backup created: $BACKUP_DIR/$BACKUP_NAME"

# Navigate to project directory
echo "📂 Navigating to project directory..."
cd $PROJECT_DIR

# Stop services
echo "🛑 Stopping services..."
pm2 stop all || true

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git reset --hard origin/master
git pull origin master

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install API dependencies
echo "📦 Installing API dependencies..."
cd apps/api
npm install
cd ../..

# Install Web dependencies
echo "📦 Installing Web dependencies..."
cd apps/web
npm install
cd ../..

# Build applications
echo "🔨 Building applications..."
echo "Building API..."
npm run build:api

echo "Building Web..."
npm run build:web

# Update environment configuration
echo "⚙️ Updating environment configuration..."
if [ ! -f apps/api/.env ]; then
    echo "Creating API environment file..."
    cat > apps/api/.env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://docuslicer:your_secure_password@localhost:5432/docuslicer
FRONTEND_URL=http://your-domain.com
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
EOF
fi

# Set proper permissions
echo "🔐 Setting proper permissions..."
sudo chown -R $USER:$USER $PROJECT_DIR
sudo chmod +x deploy/*.sh

# Restart services
echo "🔄 Restarting services..."
pm2 start ecosystem.config.js || pm2 restart all

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    echo "🔄 Attempting to restart API..."
    pm2 restart docuslicer-api
    sleep 5
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ API health check passed after restart"
    else
        echo "❌ API health check still failing"
        echo "📋 PM2 status:"
        pm2 status
        echo "📋 API logs:"
        pm2 logs docuslicer-api --lines 20
    fi
fi

# Check web service
if [ -f apps/web/dist/index.html ]; then
    echo "✅ Web build successful"
else
    echo "❌ Web build failed"
fi

# Show final status
echo ""
echo "📊 DEPLOYMENT STATUS"
echo "===================="
pm2 status

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo "✅ Latest code deployed from GitHub"
echo "✅ Dependencies updated"
echo "✅ Applications built"
echo "✅ Services restarted"
echo ""
echo "🌐 Your DocuSlicer application should now be running with the latest updates!"
echo "📋 Check the application at: http://your-domain.com"
echo "📋 API health check: http://your-domain.com/api/health"
echo ""
echo "📞 If you encounter issues:"
echo "   - Check PM2 logs: pm2 logs"
echo "   - Check service status: pm2 status"
echo "   - Restart services: pm2 restart all"
echo "   - Restore backup: sudo cp -r $BACKUP_DIR/$BACKUP_NAME/* $PROJECT_DIR/"
