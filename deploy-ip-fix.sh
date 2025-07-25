#!/bin/bash

# Quick fix for DocuSlicer using IP address
echo "🚀 Quick Fix: Deploying DocuSlicer with IP configuration..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run with sudo: sudo bash deploy-ip-fix.sh"
    exit 1
fi

cd /var/www/docuslicer || exit 1

echo "📦 Installing dependencies..."
npm install

echo "🔧 Creating environment file with IP configuration..."
cat > apps/web/.env << 'EOF'
NODE_ENV=production
VITE_API_URL=http://162.216.113.89/api
VITE_APP_NAME=DocuSlicer
VITE_APP_VERSION=2.0.0

# Supabase Configuration
VITE_SUPABASE_URL=https://phqznzfdrecztrklnetj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocXpuemZkcmVjenRya2xuZXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTI4NDksImV4cCI6MjA2ODQyODg0OX0.JhmRRSfR1bD98QXy3V8uiYQmjGVhQuGuu_QmzCssW4o
EOF

echo "🔨 Building web application..."
npm run build:web

echo "🔧 Setting file permissions..."
chown -R www-data:www-data /var/www/docuslicer/apps/web/dist
chmod -R 755 /var/www/docuslicer/apps/web/dist
chmod 644 /var/www/docuslicer/apps/web/dist/index.html

echo "🌐 Configuring nginx for IP access..."
cp nginx-ip-config.conf /etc/nginx/sites-available/default
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config valid, reloading..."
    systemctl reload nginx
else
    echo "❌ Nginx config error"
    exit 1
fi

echo "🚀 Starting API server..."
pm2 stop all || true
pm2 start ecosystem.config.js --env production

echo "⏳ Waiting for services..."
sleep 10

echo "🏥 Testing services..."
echo "Testing nginx..."
curl -I http://localhost/ && echo "✅ Nginx OK" || echo "❌ Nginx failed"

echo "Testing API..."
curl -I http://localhost/api/health && echo "✅ API OK" || echo "❌ API failed"

echo "Testing external access..."
curl -I http://162.216.113.89/ && echo "✅ External OK" || echo "❌ External failed"

echo "📊 Service status:"
systemctl status nginx --no-pager -l
pm2 status

echo "✅ Deployment complete!"
echo "🌐 Access DocuSlicer at: http://162.216.113.89"
echo "🔧 API endpoint: http://162.216.113.89/api"