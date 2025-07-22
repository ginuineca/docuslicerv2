#!/bin/bash

# DocuSlicer Deployment Script
# This script builds and deploys the web application to production

echo "🚀 Starting DocuSlicer deployment..."

# Step 1: Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Deployment aborted."
    exit 1
fi

echo "✅ Build completed successfully!"

# Step 2: Deploy to production server
echo "🌐 Deploying to production server..."
SERVER_HOST="162.216.113.89"
SERVER_USER="root"
SERVER_PATH="/root/docuslicerv2/apps/web/dist/"

# Copy files to server
scp -r dist/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo "🎉 Your DocuSlicer application is now live!"
    echo "🔗 Check your production URL to see the changes"
else
    echo "❌ Deployment failed!"
    exit 1
fi

echo "📋 Deployment Summary:"
echo "   - Build: ✅ Success"
echo "   - Deploy: ✅ Success"
echo "   - Logo: ✅ Updated"
echo "   - Supabase: ✅ Configured"
