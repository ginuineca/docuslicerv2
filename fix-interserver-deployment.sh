#!/bin/bash

# Fix InterServer VPS Deployment for DocuSlicer
echo "🔧 Fixing InterServer VPS deployment issues..."

# Check if we're on the server
if [ ! -d "/var/www/docuslicer" ]; then
    echo "❌ This script must be run on the InterServer VPS"
    echo "📋 SSH into your server first: ssh root@your-server-ip"
    exit 1
fi

cd /var/www/docuslicer || exit 1

echo "🔍 Checking current status..."
echo "Git status:"
git status --porcelain

echo "🔧 Step 1: Ensuring proper file permissions..."
sudo chown -R $USER:$USER /var/www/docuslicer
sudo chown -R www-data:www-data /var/www/docuslicer/apps/web/dist
sudo chmod -R 755 /var/www/docuslicer/apps/web/dist

echo "🔧 Step 2: Configuring nginx properly..."
sudo cp nginx-docuslicer.conf /etc/nginx/sites-available/docuslicer
sudo ln -sf /etc/nginx/sites-available/docuslicer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "✅ Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config valid, reloading..."
    sudo systemctl reload nginx
    sudo systemctl enable nginx
    sudo systemctl status nginx --no-pager -l
else
    echo "❌ Nginx configuration error"
    sudo nginx -t
    exit 1
fi

echo "🔧 Step 3: Checking and starting PM2 services..."
# Create log directory
sudo mkdir -p /var/log/docuslicer
sudo chown -R $USER:$USER /var/log/docuslicer

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Stop and restart services
echo "🔄 Restarting PM2 services..."
pm2 stop all || true
pm2 delete all || true
pm2 start ecosystem.config.js --env production
pm2 save

echo "📊 PM2 Status:"
pm2 status

echo "🔧 Step 4: Testing services..."
sleep 10

echo "Testing nginx..."
curl -I http://localhost/ && echo "✅ Nginx OK" || echo "❌ Nginx failed"

echo "Testing API..."
curl -I http://localhost/api/health && echo "✅ API OK" || echo "❌ API failed"

echo "Testing external access..."
curl -I http://docuslicer.com/ && echo "✅ External OK" || echo "❌ External failed"

echo "🔍 Step 5: Diagnostic information..."
echo "Nginx status:"
sudo systemctl status nginx --no-pager -l

echo "Nginx error log (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log

echo "DocuSlicer error log (last 10 lines):"
sudo tail -10 /var/log/nginx/docuslicer_error.log 2>/dev/null || echo "No DocuSlicer error log found"

echo "PM2 logs (last 10 lines):"
pm2 logs --lines 10

echo "Listening ports:"
sudo netstat -tlnp | grep -E ':80|:3001'

echo "🔧 Step 6: Final checks..."
if curl -s http://docuslicer.com/ | grep -q "DocuSlicer"; then
    echo "✅ DocuSlicer is working correctly!"
else
    echo "❌ DocuSlicer is not responding correctly"
    echo "🔍 Checking if index.html exists..."
    ls -la /var/www/docuslicer/apps/web/dist/index.html
    
    echo "🔍 Checking nginx document root..."
    sudo nginx -T | grep "root /var/www/docuslicer"
fi

echo "✅ Fix script completed!"
echo ""
echo "📋 Summary:"
echo "- Nginx: $(systemctl is-active nginx)"
echo "- PM2 processes: $(pm2 list | grep -c 'online')"
echo "- Site URL: http://docuslicer.com"
echo "- API URL: http://docuslicer.com/api"
echo ""
echo "If issues persist, check:"
echo "1. Domain DNS points to this server IP"
echo "2. Firewall allows HTTP (port 80)"
echo "3. PM2 processes are running correctly"
