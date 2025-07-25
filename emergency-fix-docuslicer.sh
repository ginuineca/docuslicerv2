#!/bin/bash

# Emergency Fix for DocuSlicer - Complete Reset and Deployment
echo "🚨 EMERGENCY FIX: Complete DocuSlicer Reset and Deployment"

# Check if we're on the server
if [ ! -d "/var/www/docuslicer" ]; then
    echo "❌ This script must be run on the InterServer VPS"
    echo "📋 SSH into your server: ssh root@your-server-ip"
    exit 1
fi

cd /var/www/docuslicer || exit 1

echo "🔧 Step 1: Complete service reset..."
# Stop all services
pm2 stop all || true
pm2 delete all || true
sudo systemctl stop nginx || true

echo "🔧 Step 2: Pull latest changes..."
git fetch origin
git reset --hard origin/master
git pull origin master

echo "🔧 Step 3: Install dependencies..."
npm install

echo "🔧 Step 4: Build applications..."
npm run build:web
npm run build:api

echo "🔧 Step 5: Set proper permissions..."
sudo chown -R $USER:$USER /var/www/docuslicer
sudo chown -R www-data:www-data /var/www/docuslicer/apps/web/dist
sudo chmod -R 755 /var/www/docuslicer/apps/web/dist
sudo chmod 644 /var/www/docuslicer/apps/web/dist/index.html

echo "🔧 Step 6: Verify build output..."
if [ ! -f "/var/www/docuslicer/apps/web/dist/index.html" ]; then
    echo "❌ Build failed - index.html missing"
    exit 1
fi

echo "✅ Build files verified:"
ls -la /var/www/docuslicer/apps/web/dist/

echo "🔧 Step 7: Configure nginx..."
sudo cp nginx-docuslicer.conf /etc/nginx/sites-available/docuslicer
sudo ln -sf /etc/nginx/sites-available/docuslicer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "🔧 Step 8: Test and start nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config valid"
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo "❌ Nginx config error"
    sudo nginx -t
    exit 1
fi

echo "🔧 Step 9: Create log directories..."
sudo mkdir -p /var/log/docuslicer
sudo chown -R $USER:$USER /var/log/docuslicer

echo "🔧 Step 10: Start API with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "🔧 Step 11: Wait for services..."
sleep 15

echo "🔧 Step 12: Comprehensive testing..."
echo "Testing nginx status..."
sudo systemctl status nginx --no-pager -l

echo "Testing PM2 status..."
pm2 status

echo "Testing local nginx..."
curl -I http://localhost/ && echo "✅ Local nginx OK" || echo "❌ Local nginx failed"

echo "Testing local API..."
curl -I http://localhost:3001/health && echo "✅ Local API OK" || echo "❌ Local API failed"

echo "Testing API via nginx..."
curl -I http://localhost/api/health && echo "✅ API proxy OK" || echo "❌ API proxy failed"

echo "Testing external access..."
curl -I http://docuslicer.com/ && echo "✅ External docuslicer.com OK" || echo "❌ External docuslicer.com failed"

echo "Testing www subdomain..."
curl -I http://www.docuslicer.com/ && echo "✅ External www.docuslicer.com OK" || echo "❌ External www.docuslicer.com failed"

echo "🔧 Step 13: Diagnostic information..."
echo "Nginx error log (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log

echo "DocuSlicer error log (last 10 lines):"
sudo tail -10 /var/log/nginx/docuslicer_error.log 2>/dev/null || echo "No DocuSlicer error log"

echo "PM2 logs (last 10 lines):"
pm2 logs --lines 10

echo "Listening ports:"
sudo netstat -tlnp | grep -E ':80|:3001'

echo "Disk space:"
df -h /var/www/docuslicer

echo "🔧 Step 14: Final verification..."
if curl -s http://docuslicer.com/ | grep -q "DocuSlicer\|html\|<!DOCTYPE"; then
    echo "✅ SUCCESS: DocuSlicer is working!"
    echo "🌐 Main site: http://docuslicer.com"
    echo "🌐 WWW site: http://www.docuslicer.com"
    echo "🔧 API: http://docuslicer.com/api/health"
else
    echo "❌ FAILED: DocuSlicer is not responding correctly"
    echo "🔍 Checking file contents..."
    head -5 /var/www/docuslicer/apps/web/dist/index.html
    
    echo "🔍 Checking nginx config..."
    sudo nginx -T | grep -A 10 -B 5 "root /var/www/docuslicer"
fi

echo "✅ Emergency fix completed!"
echo ""
echo "📋 Summary:"
echo "- Nginx: $(systemctl is-active nginx)"
echo "- PM2 API: $(pm2 list | grep -c 'online')"
echo "- Build files: $(ls /var/www/docuslicer/apps/web/dist/ | wc -l) files"
echo ""
echo "If still having issues:"
echo "1. Check domain DNS settings"
echo "2. Verify firewall allows HTTP (port 80)"
echo "3. Check server resources (disk space, memory)"
