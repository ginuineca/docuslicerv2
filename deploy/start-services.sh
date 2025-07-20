#!/bin/bash

# Start DocuSlicer services with PM2
# Run this script from the project root directory

set -e

echo "🚀 Starting DocuSlicer services..."

# Navigate to project root
cd /var/www/docuslicer

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'docuslicer-api',
      script: './apps/api/dist/index.js',
      cwd: '/var/www/docuslicer',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs

# Stop any existing PM2 processes
pm2 delete all || true

# Start the API service
echo "🔄 Starting API service..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo "✅ Services started successfully!"
echo ""
echo "Service status:"
pm2 status

echo ""
echo "Useful PM2 commands:"
echo "  pm2 status          - Check service status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all services"
echo "  pm2 stop all        - Stop all services"
echo "  pm2 monit           - Monitor services"
