#!/bin/bash

# DocuSlicer Production Environment Configuration Template
# This script sets up the production environment variables

echo "⚙️ CONFIGURING PRODUCTION ENVIRONMENT"
echo "====================================="

# API Environment Configuration
echo "📝 Creating API environment configuration..."
cat > apps/api/.env << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://docuslicer:your_secure_password@localhost:5432/docuslicer

# Frontend Configuration
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Supabase Configuration (if using)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_DIR=/var/www/docuslicer/uploads
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,tiff

# Redis Configuration (if using)
REDIS_URL=redis://localhost:6379

# Email Configuration (if using)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@your-domain.com

# OpenAI Configuration (if using AI features)
OPENAI_API_KEY=your_openai_api_key

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your_session_secret_key

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/docuslicer/app.log

# Performance Configuration
MAX_CONCURRENT_UPLOADS=10
WORKER_THREADS=4
CACHE_TTL=3600

# Monitoring Configuration
ENABLE_METRICS=true
METRICS_PORT=9090
EOF

# Web Environment Configuration
echo "📝 Creating Web environment configuration..."
cat > apps/web/.env << 'EOF'
# Production Web Environment
NODE_ENV=production
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=DocuSlicer
VITE_APP_VERSION=2.0.0

# Supabase Configuration (if using)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Analytics Configuration (if using)
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
VITE_HOTJAR_ID=your_hotjar_id

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_COLLABORATION=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CLOUD_STORAGE=true

# Performance Configuration
VITE_ENABLE_PWA=true
VITE_ENABLE_SERVICE_WORKER=true
EOF

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod 600 apps/api/.env
chmod 600 apps/web/.env

echo "✅ Environment configuration created!"
echo ""
echo "⚠️  IMPORTANT: Please update the following values in the .env files:"
echo "   - Database credentials and connection string"
echo "   - Domain name and URLs"
echo "   - JWT secret keys"
echo "   - Third-party API keys (Supabase, OpenAI, etc.)"
echo "   - Email configuration"
echo "   - Security secrets"
echo ""
echo "📋 Environment files created:"
echo "   - apps/api/.env"
echo "   - apps/web/.env"
echo ""
echo "🔧 Next steps:"
echo "   1. Edit the .env files with your actual configuration values"
echo "   2. Run the deployment script: ./deploy/update-production.sh"
echo "   3. Configure nginx with: ./deploy/configure-nginx.sh"
echo "   4. Set up SSL with: ./deploy/ssl-setup.sh"
