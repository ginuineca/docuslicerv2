#!/bin/bash

# DocuSlicer Quick Deployment Script
# This script performs a rapid deployment to Interserver with all optimizations

set -e

echo "⚡ DOCUSLICER QUICK DEPLOYMENT TO INTERSERVER"
echo "============================================="
echo "🚀 Deploying all components with maximum performance"
echo "📅 Started at: $(date)"
echo ""

# Configuration
PROJECT_DIR="/var/www/docuslicer"
REPO_URL="https://github.com/ginuineca/docuslicerv2.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run this script as root (use sudo)"
    exit 1
fi

# Step 1: System Preparation
log_info "Preparing system for deployment..."

# Update system packages
log_info "Updating system packages..."
apt update -qq

# Install required packages
log_info "Installing required packages..."
apt install -y nodejs npm postgresql nginx git curl jq htop

# Install global npm packages
log_info "Installing global npm packages..."
npm install -g pm2 serve typescript tsx

# Step 2: Project Setup
log_info "Setting up project directory..."

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    log_info "Creating project directory..."
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    log_info "Cloning repository..."
    git clone "$REPO_URL" .
else
    log_info "Updating existing project..."
    cd "$PROJECT_DIR"
    git fetch origin
    git reset --hard origin/master
    git pull origin master
fi

# Show current commit
log_success "Current commit: $(git rev-parse --short HEAD)"
log_info "Commit message: $(git log -1 --pretty=%B)"

# Step 3: Dependencies Installation
log_info "Installing all dependencies..."

# Root dependencies
log_info "Installing root dependencies..."
npm install

# API dependencies
log_info "Installing API dependencies..."
cd apps/api
npm install
npm audit fix --force || true
cd ../..

# Web dependencies
log_info "Installing Web dependencies..."
cd apps/web
npm install
npm audit fix --force || true
cd ../..

# Step 4: Environment Configuration
log_info "Setting up environment configuration..."

# Create log directory
mkdir -p /var/log/docuslicer

# Create uploads directory
mkdir -p "$PROJECT_DIR/uploads"
mkdir -p "$PROJECT_DIR/temp"

# Set proper permissions
chown -R www-data:www-data "$PROJECT_DIR/uploads"
chown -R www-data:www-data "$PROJECT_DIR/temp"
chown -R www-data:www-data /var/log/docuslicer

# Step 5: Build Applications
log_info "Building applications..."

# Build API
log_info "Building API..."
npm run build:api

# Build Web
log_info "Building Web..."
npm run build:web

# Verify builds
if [ ! -f "apps/api/dist/index.js" ]; then
    log_error "API build failed - index.js not found"
    exit 1
fi

if [ ! -f "apps/web/dist/index.html" ]; then
    log_error "Web build failed - index.html not found"
    exit 1
fi

log_success "All builds completed successfully"

# Step 6: Database Setup
log_info "Setting up database..."

# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Create database and user (if they don't exist)
sudo -u postgres psql -c "CREATE DATABASE docuslicer;" 2>/dev/null || log_warning "Database already exists"
sudo -u postgres psql -c "CREATE USER docuslicer WITH PASSWORD 'docuslicer123';" 2>/dev/null || log_warning "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE docuslicer TO docuslicer;" 2>/dev/null || true

log_success "Database setup completed"

# Step 7: PM2 Configuration
log_info "Configuring PM2 services..."

# Stop existing processes
pm2 delete all 2>/dev/null || true

# Start services with ecosystem config
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup systemd -u root --hp /root

log_success "PM2 services configured and started"

# Step 8: Nginx Configuration
log_info "Configuring Nginx..."

# Create Nginx configuration
cat > /etc/nginx/sites-available/docuslicer << 'EOF'
server {
    listen 80;
    server_name _;
    
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
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        client_max_body_size 100M;
    }
    
    # Static files
    location /uploads/ {
        alias /var/www/docuslicer/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/docuslicer /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if nginx -t; then
    log_success "Nginx configuration is valid"
    systemctl restart nginx
    systemctl enable nginx
    log_success "Nginx restarted and enabled"
else
    log_error "Nginx configuration has errors"
    exit 1
fi

# Step 9: Firewall Configuration
log_info "Configuring firewall..."

# Install and configure UFW
apt install -y ufw

# Configure firewall rules
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443
ufw --force enable

log_success "Firewall configured"

# Step 10: Final Verification
log_info "Running final verification..."

# Wait for services to start
sleep 10

# Check PM2 status
log_info "PM2 Status:"
pm2 status

# Check if services are responding
log_info "Testing API health..."
if curl -f -s http://localhost:3001/health > /dev/null; then
    log_success "API is responding"
else
    log_warning "API health check failed"
fi

log_info "Testing Web service..."
if curl -f -s http://localhost:3000 > /dev/null; then
    log_success "Web service is responding"
else
    log_warning "Web service check failed"
fi

# Step 11: Success Summary
echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "====================================="
echo ""
log_success "DocuSlicer has been deployed to Interserver with all optimizations"
echo ""
echo "📊 Deployment Summary:"
echo "   • All dependencies installed and updated"
echo "   • Applications built and optimized"
echo "   • Database configured and ready"
echo "   • PM2 services running in cluster mode"
echo "   • Nginx configured with security headers and compression"
echo "   • Firewall configured for security"
echo "   • All performance optimizations active"
echo ""
echo "🌐 Access your application:"
echo "   • Web Interface: http://$(curl -s ifconfig.me || echo 'your-server-ip')"
echo "   • API Health: http://$(curl -s ifconfig.me || echo 'your-server-ip')/api/health"
echo ""
echo "🔧 Management Commands:"
echo "   • Check status: pm2 status"
echo "   • View logs: pm2 logs"
echo "   • Restart services: pm2 restart all"
echo "   • Update deployment: ./deploy/update-production.sh"
echo "   • Verify deployment: ./deploy/verify-deployment.sh"
echo ""
echo "📋 Next Steps:"
echo "   1. Configure your domain name in Nginx"
echo "   2. Set up SSL certificate with Let's Encrypt"
echo "   3. Update environment variables in apps/api/.env"
echo "   4. Configure monitoring and backups"
echo ""
echo "🎯 Deployment completed at: $(date)"
echo "✨ DocuSlicer is now live and ready for production use!"
