#!/bin/bash

# SSL Certificate Setup with Let's Encrypt
# Run this script as root after configuring your domain

set -e

echo "🔒 Setting up SSL certificate with Let's Encrypt..."

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
echo "🔐 Obtaining SSL certificate..."
echo "Make sure your domain is pointing to this server's IP address!"
read -p "Enter your domain name (e.g., docuslicer.com): " DOMAIN

# Obtain certificate
certbot --nginx -d $DOMAIN -d www.$DOMAIN

# Update Nginx configuration for HTTPS redirect
cat > /etc/nginx/sites-available/docuslicer << EOF
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Serve static files (React app)
    location / {
        root /var/www/docuslicer/apps/web/dist;
        try_files \$uri \$uri/ /index.html;
        
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Handle CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Setup automatic renewal
echo "⏰ Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "✅ SSL certificate setup complete!"
echo ""
echo "Your site is now available at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo "Certificate will auto-renew every 12 hours."
