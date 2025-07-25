#!/bin/bash

# Setup SSL Certificate for DocuSlicer
# This script will install Let's Encrypt SSL certificate

set -e

echo "🔒 Setting up SSL certificate for DocuSlicer..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install Certbot and Nginx plugin
echo "🔧 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily to avoid conflicts
echo "⏸️ Stopping nginx temporarily..."
sudo systemctl stop nginx

# Get SSL certificate for both domains
echo "🔐 Obtaining SSL certificate..."
echo "This will get certificates for docuslicer.com and www.docuslicer.com"

# Use standalone mode to avoid conflicts
sudo certbot certonly --standalone \
    --email admin@docuslicer.com \
    --agree-tos \
    --no-eff-email \
    -d docuslicer.com \
    -d www.docuslicer.com

# Create new nginx configuration with SSL
echo "📝 Creating SSL-enabled nginx configuration..."
sudo tee /etc/nginx/sites-available/docuslicer > /dev/null << 'EOF'
# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name docuslicer.com www.docuslicer.com;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name docuslicer.com www.docuslicer.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/docuslicer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/docuslicer.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Increase client body size for file uploads
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types 
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;
    
    # Root directory for static files
    root /var/www/docuslicer/apps/web/dist;
    index index.html index.htm;
    
    # Handle static assets with long cache times
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API proxy - forward all /api requests to the Node.js server
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "https://docuslicer.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # API proxy without trailing slash
    location /api {
        proxy_pass http://127.0.0.1:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Handle React Router - serve index.html for all routes that don't match files
    location / {
        try_files $uri $uri/ @fallback;
    }
    
    # Fallback for React Router
    location @fallback {
        rewrite ^.*$ /index.html last;
    }
    
    # Security - deny access to sensitive files
    location ~ /\. {
        deny all;
        return 404;
    }
    
    location ~ ^/(\.user.ini|\.htaccess|\.htpasswd|\.sh|\.bak|\.swp|\.swo)$ {
        deny all;
        return 404;
    }
    
    # Deny access to sensitive directories
    location ~ ^/(node_modules|\.git|logs|temp|uploads)/ {
        deny all;
        return 404;
    }
    
    # Logging
    access_log /var/log/nginx/docuslicer_access.log;
    error_log /var/log/nginx/docuslicer_error.log;
}
EOF

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Start nginx
echo "🚀 Starting nginx..."
sudo systemctl start nginx

# Enable automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test certificate renewal
echo "🧪 Testing certificate renewal..."
sudo certbot renew --dry-run

echo ""
echo "✅ SSL certificate has been successfully installed!"
echo ""
echo "🔒 Your site is now secure and accessible at:"
echo "   - https://docuslicer.com/"
echo "   - https://www.docuslicer.com/"
echo ""
echo "🔄 HTTP requests will automatically redirect to HTTPS"
echo ""
echo "📋 Certificate details:"
sudo certbot certificates

echo ""
echo "🎉 Setup complete! Your site is now secure with HTTPS!"
