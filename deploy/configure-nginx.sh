#!/bin/bash

# Nginx Configuration for DocuSlicer
# Run this script as root (sudo)

set -e

echo "🌐 Configuring Nginx for DocuSlicer..."

# Create Nginx configuration
cat > /etc/nginx/sites-available/docuslicer << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Serve static files (React app)
    location / {
        root /var/www/docuslicer/apps/web/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Handle CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/docuslicer /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx configured successfully!"
echo ""
echo "Remember to:"
echo "1. Replace 'your-domain.com' with your actual domain"
echo "2. Set up SSL certificate (Let's Encrypt recommended)"
echo "3. Update DNS records to point to your VPS IP"
