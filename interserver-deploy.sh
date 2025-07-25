#!/bin/bash

# InterServer Deployment Script for DocuSlicer
echo "🚀 Deploying DocuSlicer on InterServer..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the DocuSlicer root directory"
    exit 1
fi

echo "📋 InterServer Deployment Steps:"

echo "🔧 Step 1: Creating production environment file..."
cat > apps/web/.env << 'EOF'
NODE_ENV=production
VITE_API_URL=https://docuslicer.com/api
VITE_APP_NAME=DocuSlicer
VITE_APP_VERSION=2.0.0

# Supabase Configuration
VITE_SUPABASE_URL=https://phqznzfdrecztrklnetj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocXpuemZkcmVjenRya2xuZXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTI4NDksImV4cCI6MjA2ODQyODg0OX0.JhmRRSfR1bD98QXy3V8uiYQmjGVhQuGuu_QmzCssW4o
EOF

echo "📦 Step 2: Installing dependencies..."
npm install

echo "🔨 Step 3: Building web application..."
NODE_ENV=production npm run build:web

echo "🔨 Step 4: Building API..."
npm run build:api

echo "📁 Step 5: Creating deployment package..."
mkdir -p deployment-package
cp -r apps/web/dist deployment-package/public_html
cp -r apps/api/dist deployment-package/api
cp package.json deployment-package/
cp ecosystem.config.js deployment-package/

echo "🌐 Step 6: Creating .htaccess for React Router..."
cat > deployment-package/public_html/.htaccess << 'EOF'
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
EOF

echo "🔧 Step 7: Creating API configuration..."
cat > deployment-package/api/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.js [QSA,L]

# Enable CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
EOF

echo "📋 Step 8: Creating deployment instructions..."
cat > deployment-package/DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# InterServer Deployment Instructions for DocuSlicer

## Upload Files:
1. Upload contents of `public_html/` to your domain's public_html folder
2. Upload contents of `api/` to a subdirectory called `api/` in public_html

## File Structure on Server:
```
public_html/
├── index.html (React app)
├── assets/ (JS/CSS files)
├── .htaccess (React Router config)
└── api/
    ├── index.js (API server)
    ├── .htaccess (API routing)
    └── ... (other API files)
```

## Domain Configuration:
- Main site: https://docuslicer.com
- API endpoint: https://docuslicer.com/api

## Requirements:
- Node.js support (check with InterServer)
- PHP support (for .htaccess)
- SSL certificate (for HTTPS)

## Testing:
1. Visit https://docuslicer.com
2. Test API: https://docuslicer.com/api/health
EOF

echo "📦 Step 9: Creating deployment archive..."
cd deployment-package
tar -czf ../docuslicer-interserver-deployment.tar.gz .
cd ..

echo "✅ Deployment package created!"
echo ""
echo "📋 Next Steps:"
echo "1. Download: docuslicer-interserver-deployment.tar.gz"
echo "2. Extract and upload to your InterServer hosting"
echo "3. Follow instructions in DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "📁 Package contents:"
ls -la deployment-package/
echo ""
echo "🌐 Expected URLs after deployment:"
echo "- Main site: https://docuslicer.com"
echo "- API: https://docuslicer.com/api"
echo "- Health check: https://docuslicer.com/api/health"
