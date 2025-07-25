#!/bin/bash

# DocuSlicer Supabase Configuration Script
# This script helps configure real Supabase credentials

echo "🔧 DocuSlicer Supabase Configuration"
echo "===================================="
echo ""

# Check if we're running on the server
if [ ! -d "/var/www/docuslicer" ]; then
    echo "❌ This script should be run on the production server"
    echo "Please run this script from /var/www/docuslicer"
    exit 1
fi

echo "📋 You need to provide your Supabase credentials:"
echo ""
echo "1. Supabase Project URL (e.g., https://your-project-id.supabase.co)"
echo "2. Supabase Anon Key (public key for client-side authentication)"
echo "3. Supabase Service Role Key (for server-side operations)"
echo ""

# Prompt for Supabase URL
read -p "Enter your Supabase Project URL: " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Supabase URL is required"
    exit 1
fi

# Prompt for Anon Key
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Supabase Anon Key is required"
    exit 1
fi

# Prompt for Service Role Key
read -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Supabase Service Role Key is required"
    exit 1
fi

echo ""
echo "🔧 Configuring environment files..."

# Update web environment
cat > apps/web/.env << EOF
NODE_ENV=production
VITE_API_URL=https://docuslicer.com/api
VITE_APP_NAME=DocuSlicer
VITE_APP_VERSION=2.0.0

# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

# Update API environment
if [ -f "apps/api/.env" ]; then
    # Backup existing API env
    cp apps/api/.env apps/api/.env.backup.$(date +%Y%m%d_%H%M%S)
fi

cat > apps/api/.env << EOF
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Frontend Configuration
FRONTEND_URL=https://docuslicer.com
CORS_ORIGIN=https://docuslicer.com

# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_DIR=/var/www/docuslicer/uploads
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,tiff

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=$(openssl rand -base64 32)

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/docuslicer/app.log
EOF

echo "✅ Environment files updated"

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads

# Create logs directory
echo "📁 Creating logs directory..."
sudo mkdir -p /var/log/docuslicer
sudo chown $USER:$USER /var/log/docuslicer

echo ""
echo "🔨 Building application with new configuration..."

# Build the web app
npm run build:web

# Build the API
npm run build:api

echo ""
echo "🔄 Restarting services..."

# Restart PM2 processes
pm2 restart all

echo ""
echo "✅ Supabase configuration complete!"
echo ""
echo "🔍 Testing configuration..."

# Wait a moment for services to start
sleep 5

# Test API
echo "Testing API..."
curl -s https://docuslicer.com/api/status

echo ""
echo ""
echo "🎉 Setup complete! Your DocuSlicer application is now configured with real Supabase authentication."
echo ""
echo "📋 Next steps:"
echo "1. Visit https://docuslicer.com/"
echo "2. Try signing up with a real email address"
echo "3. Check your email for the confirmation link"
echo "4. Sign in and start using DocuSlicer!"
echo ""
echo "🔧 If you need to update your Supabase configuration later, run this script again."
