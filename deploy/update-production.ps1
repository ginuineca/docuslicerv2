# DocuSlicer Production Update Script (PowerShell)
# This script updates the production deployment with the latest code

param(
    [string]$ServerIP = "162.216.113.89",
    [string]$Username = "root",
    [switch]$SkipBackup = $false
)

Write-Host "🚀 UPDATING DOCUSLICER PRODUCTION DEPLOYMENT" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Test server connection
Write-Host "`n🔗 Testing server connection..." -ForegroundColor Yellow
try {
    $connection = Test-NetConnection -ComputerName $ServerIP -Port 22 -InformationLevel Quiet
    if (-not $connection) {
        throw "Cannot connect to server"
    }
    Write-Host "✅ Server connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create deployment script content
$deploymentScript = @"
#!/bin/bash
set -e

echo "🚀 UPDATING DOCUSLICER ON SERVER"
echo "================================"

# Configuration
PROJECT_DIR="/var/www/docuslicer"
BACKUP_DIR="/var/backups/docuslicer"

# Create backup if not skipped
if [ "$1" != "--skip-backup" ]; then
    echo "💾 Creating backup..."
    sudo mkdir -p \$BACKUP_DIR
    BACKUP_NAME="docuslicer-backup-\$(date +%Y%m%d-%H%M%S)"
    sudo cp -r \$PROJECT_DIR \$BACKUP_DIR/\$BACKUP_NAME
    echo "✅ Backup created: \$BACKUP_DIR/\$BACKUP_NAME"
fi

# Navigate to project directory
cd \$PROJECT_DIR

# Stop services
echo "🛑 Stopping services..."
pm2 stop all || true

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin
git reset --hard origin/master
git pull origin master

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..

# Build applications
echo "🔨 Building applications..."
npm run build:api
npm run build:web

# Restart services
echo "🔄 Restarting services..."
pm2 start ecosystem.config.js || pm2 restart all

# Wait and health check
echo "⏳ Waiting for services..."
sleep 10

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    pm2 restart all
    sleep 5
fi

echo "🎉 DEPLOYMENT COMPLETE!"
pm2 status
"@

# Save deployment script to temp file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deploymentScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "`n📤 Uploading deployment script to server..." -ForegroundColor Yellow

# Upload and execute deployment script via SCP and SSH
try {
    # Upload script
    $scpArgs = @(
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        $tempScript,
        "${Username}@${ServerIP}:/tmp/deploy-update.sh"
    )
    
    Write-Host "Uploading script..." -ForegroundColor Gray
    & scp @scpArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload deployment script"
    }
    
    Write-Host "✅ Script uploaded successfully" -ForegroundColor Green
    
    # Execute deployment script
    Write-Host "`n🚀 Executing deployment on server..." -ForegroundColor Yellow
    
    $backupFlag = if ($SkipBackup) { "--skip-backup" } else { "" }
    
    $sshArgs = @(
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "${Username}@${ServerIP}",
        "chmod +x /tmp/deploy-update.sh && /tmp/deploy-update.sh $backupFlag"
    )
    
    & ssh @sshArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "✅ DocuSlicer has been updated on the production server" -ForegroundColor Green
        
        # Test the deployed application
        Write-Host "`n🧪 Testing deployed application..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://$ServerIP" -UseBasicParsing -TimeoutSec 10
            Write-Host "✅ Web application is accessible (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Web application test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        try {
            $apiResponse = Invoke-WebRequest -Uri "http://$ServerIP:3001/health" -UseBasicParsing -TimeoutSec 10
            Write-Host "✅ API is accessible (Status: $($apiResponse.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ API test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "`n❌ DEPLOYMENT FAILED!" -ForegroundColor Red
        Write-Host "Check the server logs for more details" -ForegroundColor Red
    }
    
} catch {
    Write-Host "`n❌ Deployment error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Clean up temp file
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}

Write-Host "`n📋 DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Server: $ServerIP" -ForegroundColor Gray
Write-Host "Repository: https://github.com/ginuineca/docuslicerv2.git" -ForegroundColor Gray
Write-Host "Latest commit deployed to production" -ForegroundColor Gray
Write-Host "`n🌐 Access your application:" -ForegroundColor Yellow
Write-Host "Web: http://$ServerIP" -ForegroundColor Gray
Write-Host "API: http://$ServerIP:3001/health" -ForegroundColor Gray
