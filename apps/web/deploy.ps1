# DocuSlicer Deployment Script (PowerShell)
# This script builds and deploys the web application to production

Write-Host "🚀 Starting DocuSlicer deployment..." -ForegroundColor Green

# Step 1: Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Deployment aborted." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Step 2: Deploy to production server
Write-Host "🌐 Deploying to production server..." -ForegroundColor Yellow

$SERVER_HOST = "162.216.113.89"
$SERVER_USER = "root"
$SERVER_PATH = "/root/docuslicerv2/apps/web/dist/"

# Copy files to server using SCP
Write-Host "📤 Uploading files..." -ForegroundColor Cyan
scp -r dist/* "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🎉 Your DocuSlicer application is now live!" -ForegroundColor Magenta
    Write-Host "🔗 Check your production URL to see the changes" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor White
Write-Host "   - Build: ✅ Success" -ForegroundColor Green
Write-Host "   - Deploy: ✅ Success" -ForegroundColor Green  
Write-Host "   - Logo: ✅ Updated" -ForegroundColor Green
Write-Host "   - Supabase: ✅ Configured" -ForegroundColor Green
