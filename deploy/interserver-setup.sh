#!/bin/bash

# DocuSlicer InterServer VPS Setup Script
# Run this script after setting up your InterServer VPS

set -e

echo "🚀 Setting up DocuSlicer on InterServer VPS..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/docuslicer
sudo chown -R $USER:$USER /var/www/docuslicer

# Clone repository
echo "📥 Cloning DocuSlicer repository..."
cd /var/www/docuslicer
git clone https://github.com/ginuineca/docuslicerv2.git .

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Install API dependencies
cd apps/api
npm install
cd ../..

# Install Web dependencies
cd apps/web
npm install
cd ../..

# Build applications
echo "🔨 Building applications..."
npm run build:api
npm run build:web

# Setup PostgreSQL database
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres createdb docuslicer
sudo -u postgres psql -c "CREATE USER docuslicer WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE docuslicer TO docuslicer;"

# Create environment files
echo "⚙️ Creating environment configuration..."
cat > apps/api/.env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://docuslicer:your_secure_password@localhost:5432/docuslicer
FRONTEND_URL=http://your-domain.com
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

cat > apps/web/.env << EOF
VITE_API_URL=http://your-domain.com/api
EOF

echo "✅ Basic setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the environment variables in apps/api/.env and apps/web/.env"
echo "2. Run: sudo ./deploy/configure-nginx.sh"
echo "3. Run: ./deploy/start-services.sh"
echo ""
echo "Your VPS is ready for DocuSlicer deployment!"
