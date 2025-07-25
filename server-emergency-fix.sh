#!/bin/bash

# Emergency Server Fix for DocuSlicer
echo "🚨 EMERGENCY: Diagnosing and fixing server issues..."

# Check if we're on the server
if [ ! -d "/var/www/docuslicer" ]; then
    echo "❌ This script must be run on the server (162.216.113.89)"
    echo "📋 Manual steps to connect to server:"
    echo "1. SSH into your DigitalOcean droplet:"
    echo "   ssh root@162.216.113.89"
    echo "2. Run this script on the server"
    exit 1
fi

echo "🔍 STEP 1: Checking server status..."

# Check if we're running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash server-emergency-fix.sh"
    exit 1
fi

echo "✅ Running on server as root"

echo "🔍 STEP 2: Checking system resources..."
echo "Memory usage:"
free -h
echo "Disk usage:"
df -h
echo "CPU load:"
uptime

echo "🔍 STEP 3: Checking network connectivity..."
echo "Network interfaces:"
ip addr show
echo "Listening ports:"
netstat -tlnp | grep -E ':80|:443|:3001'

echo "🔍 STEP 4: Checking services..."
echo "Nginx status:"
systemctl status nginx --no-pager -l

echo "PM2 status:"
pm2 status || echo "PM2 not running or not installed"

echo "🔍 STEP 5: Checking firewall..."
ufw status || echo "UFW not configured"
iptables -L -n | head -20

echo "🚀 STEP 6: Emergency restart of all services..."

echo "Starting nginx..."
systemctl start nginx
systemctl enable nginx

echo "Checking if Node.js is installed..."
node --version || echo "Node.js not found"
npm --version || echo "NPM not found"

echo "Checking if PM2 is installed..."
pm2 --version || npm install -g pm2

echo "🔧 STEP 7: Quick deployment..."
cd /var/www/docuslicer || exit 1

echo "Installing dependencies..."
npm install || echo "NPM install failed"

echo "Building web app..."
npm run build:web || echo "Build failed"

echo "Setting permissions..."
chown -R www-data:www-data /var/www/docuslicer/apps/web/dist
chmod -R 755 /var/www/docuslicer/apps/web/dist

echo "Creating simple nginx config..."
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    root /var/www/docuslicer/apps/web/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

echo "Testing nginx config..."
nginx -t

echo "Restarting nginx..."
systemctl restart nginx

echo "Starting API server..."
pm2 stop all || true
pm2 start ecosystem.config.js --env production || echo "PM2 start failed"

echo "🏥 STEP 8: Final tests..."
sleep 5

echo "Testing local nginx..."
curl -I http://localhost/ && echo "✅ Nginx OK" || echo "❌ Nginx failed"

echo "Testing local API..."
curl -I http://localhost/api/health && echo "✅ API OK" || echo "❌ API failed"

echo "Testing external access..."
curl -I http://162.216.113.89/ && echo "✅ External OK" || echo "❌ External failed"

echo "📊 Final status:"
echo "Nginx: $(systemctl is-active nginx)"
echo "PM2 processes:"
pm2 list

echo "🔍 If still not working, check:"
echo "1. DigitalOcean droplet is running in the control panel"
echo "2. Firewall/security groups allow HTTP (port 80)"
echo "3. DNS settings if using domain name"

echo "✅ Emergency fix complete!"
echo "🌐 Try accessing: http://162.216.113.89"
