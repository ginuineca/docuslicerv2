#!/bin/bash

# Fix 403 Forbidden Error for DocuSlicer
echo "🔧 Fixing 403 Forbidden Error for DocuSlicer..."

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

echo "✅ Fix complete! DocuSlicer should now be accessible."
