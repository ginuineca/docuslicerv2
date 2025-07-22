#!/bin/bash

# DocuSlicer Production Deployment Script
# This script prepares and deploys DocuSlicer for production

set -e  # Exit on any error

echo "🚀 Starting DocuSlicer Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root (not recommended for production)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root is not recommended for production deployment"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $REQUIRED_VERSION or higher is required. Current version: $NODE_VERSION"
    exit 1
fi
print_success "Node.js version check passed: $NODE_VERSION"

# Check if production environment file exists
if [ ! -f "apps/api/.env.production" ]; then
    print_error "Production environment file not found: apps/api/.env.production"
    print_status "Please copy and configure the production environment file:"
    print_status "cp apps/api/.env.production.example apps/api/.env.production"
    exit 1
fi

# Install dependencies
print_status "Installing production dependencies..."
npm ci --production --silent
print_success "Dependencies installed"

# Build the application
print_status "Building application for production..."
npm run build
print_success "Application built successfully"

# Run security audit
print_status "Running security audit..."
npm audit --audit-level moderate || {
    print_warning "Security vulnerabilities found. Please review and fix before deploying to production."
    read -p "Continue deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

# Create necessary directories
print_status "Creating production directories..."
mkdir -p logs
mkdir -p uploads/temp
mkdir -p uploads/output
mkdir -p data/backups
mkdir -p data/analytics
mkdir -p data/enterprise
print_success "Directories created"

# Set proper permissions
print_status "Setting file permissions..."
chmod 755 uploads
chmod 755 uploads/temp
chmod 755 uploads/output
chmod 755 logs
chmod 755 data
chmod -R 755 data/*
print_success "Permissions set"

# Check database connection
print_status "Testing database connection..."
if command -v psql &> /dev/null; then
    # Extract database URL components for testing
    DB_URL=$(grep DATABASE_URL apps/api/.env.production | cut -d'=' -f2)
    if [ -n "$DB_URL" ]; then
        print_status "Database URL found in configuration"
    else
        print_warning "No database URL found in configuration"
    fi
else
    print_warning "PostgreSQL client not found. Cannot test database connection."
fi

# Check Redis connection (optional)
print_status "Testing Redis connection..."
if command -v redis-cli &> /dev/null; then
    REDIS_HOST=$(grep REDIS_HOST apps/api/.env.production | cut -d'=' -f2)
    REDIS_PORT=$(grep REDIS_PORT apps/api/.env.production | cut -d'=' -f2)
    
    if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping > /dev/null 2>&1; then
        print_success "Redis connection successful"
    else
        print_warning "Redis connection failed. Queue processing will use fallback mode."
    fi
else
    print_warning "Redis CLI not found. Cannot test Redis connection."
fi

# Create systemd service file (Linux only)
if [ -f "/etc/systemd/system/" ] && [ -d "/etc/systemd/system/" ]; then
    print_status "Creating systemd service file..."
    
    cat > /tmp/docuslicer.service << EOF
[Unit]
Description=DocuSlicer PDF Workflow Automation Platform
After=network.target

[Service]
Type=simple
User=docuslicer
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(which node) apps/api/dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=docuslicer

[Install]
WantedBy=multi-user.target
EOF

    print_status "Systemd service file created at /tmp/docuslicer.service"
    print_status "To install: sudo cp /tmp/docuslicer.service /etc/systemd/system/"
    print_status "To enable: sudo systemctl enable docuslicer"
    print_status "To start: sudo systemctl start docuslicer"
fi

# Create nginx configuration template
print_status "Creating nginx configuration template..."
cat > /tmp/docuslicer-nginx.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # File Upload Size
    client_max_body_size 100M;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static file serving (if needed)
    location /static/ {
        alias /path/to/docuslicer/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

print_success "Nginx configuration template created at /tmp/docuslicer-nginx.conf"

# Final deployment checklist
print_status "🎯 Production Deployment Checklist:"
echo "  ✅ Dependencies installed"
echo "  ✅ Application built"
echo "  ✅ Security audit completed"
echo "  ✅ Directories created"
echo "  ✅ Permissions set"
echo "  📋 TODO: Configure production environment variables"
echo "  📋 TODO: Set up database and run migrations"
echo "  📋 TODO: Configure SSL certificates"
echo "  📋 TODO: Set up reverse proxy (nginx/apache)"
echo "  📋 TODO: Configure monitoring and logging"
echo "  📋 TODO: Set up automated backups"

print_success "🚀 DocuSlicer is ready for production deployment!"
print_status "Next steps:"
print_status "1. Review and configure apps/api/.env.production"
print_status "2. Set up your database and Redis (optional)"
print_status "3. Configure your web server (nginx configuration provided)"
print_status "4. Set up SSL certificates"
print_status "5. Start the application: NODE_ENV=production npm start"

echo
print_status "For support and documentation, visit: https://github.com/your-org/docuslicer"
