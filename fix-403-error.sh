#!/bin/bash

# Fix Connection Issues for DocuSlicer
echo "🔧 Fixing Connection Issues for DocuSlicer..."

# Check if we're running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script with sudo"
    exit 1
fi

echo "🔍 Diagnosing server status..."

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running, starting..."
    systemctl start nginx
fi

# Check if ports are open
echo "🔍 Checking port availability..."
netstat -tlnp | grep :80 && echo "✅ Port 80 is open" || echo "❌ Port 80 is not open"
netstat -tlnp | grep :3001 && echo "✅ Port 3001 is open" || echo "❌ Port 3001 is not open"

# Navigate to project directory
cd /var/www/docuslicer || exit 1

echo "📦 Building web application..."
npm run build:web

echo "🔧 Setting proper permissions..."
sudo chown -R www-data:www-data /var/www/docuslicer/apps/web/dist
sudo chmod -R 755 /var/www/docuslicer/apps/web/dist
sudo chmod 644 /var/www/docuslicer/apps/web/dist/index.html

echo "🌐 Configuring nginx..."
sudo cp nginx-docuslicer.conf /etc/nginx/sites-available/docuslicer
sudo ln -sf /etc/nginx/sites-available/docuslicer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "✅ Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid, reloading..."
    sudo systemctl reload nginx
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

echo "🚀 Starting/restarting services..."
pm2 restart all || pm2 start ecosystem.config.js --env production

echo "⏳ Waiting for services to start..."
sleep 10

echo "🏥 Testing endpoints..."
echo "Testing main site..."
curl -I http://localhost/ && echo "✅ Main site OK" || echo "❌ Main site failed"

echo "Testing API..."
curl -I http://localhost/api/health && echo "✅ API OK" || echo "❌ API failed"

echo "📊 PM2 Status:"
pm2 status

echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo "🔥 Checking firewall status..."
ufw status || echo "UFW not configured"

echo "🌐 Testing external connectivity..."
curl -I http://docuslicer.com/ && echo "✅ External access OK" || echo "❌ External access failed"

echo "📋 Final status summary:"
echo "Nginx: $(systemctl is-active nginx)"
echo "PM2 processes:"
pm2 list

echo "🔍 If still having issues, check:"
echo "1. Domain DNS settings (should point to server IP)"
echo "2. Server firewall/security groups"
echo "3. Network connectivity"

echo "✅ Fix complete! DocuSlicer should now be accessible at http://docuslicer.com"
