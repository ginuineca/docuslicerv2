#!/bin/bash

# DocuSlicer Deployment Verification Script
# This script verifies that all components are properly deployed and functional

set -e

echo "🔍 DOCUSLICER DEPLOYMENT VERIFICATION"
echo "====================================="
echo "📅 Verification started at: $(date)"
echo ""

# Configuration
PROJECT_DIR="/var/www/docuslicer"
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"
LOG_FILE="/var/log/docuslicer/verification-$(date +%Y%m%d-%H%M%S).log"

# Start logging
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

# Verification functions
verify_files() {
    echo "📁 Verifying file structure..."
    
    local required_files=(
        "$PROJECT_DIR/ecosystem.config.js"
        "$PROJECT_DIR/apps/api/dist/index.js"
        "$PROJECT_DIR/apps/web/dist/index.html"
        "$PROJECT_DIR/apps/api/.env"
        "$PROJECT_DIR/package.json"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        echo "✅ All required files present"
    else
        echo "❌ Missing files:"
        printf '   - %s\n' "${missing_files[@]}"
        return 1
    fi
}

verify_services() {
    echo "🔄 Verifying PM2 services..."
    
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 not installed"
        return 1
    fi
    
    local pm2_status=$(pm2 jlist)
    
    if echo "$pm2_status" | grep -q "docuslicer-api"; then
        local api_status=$(echo "$pm2_status" | jq -r '.[] | select(.name=="docuslicer-api") | .pm2_env.status')
        if [ "$api_status" = "online" ]; then
            echo "✅ DocuSlicer API service is running"
        else
            echo "❌ DocuSlicer API service status: $api_status"
            return 1
        fi
    else
        echo "❌ DocuSlicer API service not found"
        return 1
    fi
    
    if echo "$pm2_status" | grep -q "docuslicer-web"; then
        local web_status=$(echo "$pm2_status" | jq -r '.[] | select(.name=="docuslicer-web") | .pm2_env.status')
        if [ "$web_status" = "online" ]; then
            echo "✅ DocuSlicer Web service is running"
        else
            echo "❌ DocuSlicer Web service status: $web_status"
            return 1
        fi
    else
        echo "❌ DocuSlicer Web service not found"
        return 1
    fi
}

verify_api_health() {
    echo "🏥 Verifying API health..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "   Attempt $attempt/$max_attempts..."
        
        if curl -f -s "$API_URL/health" > /dev/null; then
            echo "✅ API health check passed"
            
            # Get detailed health info
            local health_response=$(curl -s "$API_URL/health")
            echo "📊 API Health Details:"
            echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
            return 0
        fi
        
        echo "   Health check failed, waiting 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    echo "❌ API health check failed after $max_attempts attempts"
    return 1
}

verify_web_service() {
    echo "🌐 Verifying Web service..."
    
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "   Attempt $attempt/$max_attempts..."
        
        if curl -f -s "$WEB_URL" > /dev/null; then
            echo "✅ Web service is responding"
            return 0
        fi
        
        echo "   Web service check failed, waiting 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    echo "❌ Web service check failed after $max_attempts attempts"
    return 1
}

verify_database() {
    echo "🗄️ Verifying database connection..."
    
    # Try to connect to PostgreSQL
    if command -v psql &> /dev/null; then
        if psql -h localhost -U docuslicer -d docuslicer -c "SELECT 1;" &> /dev/null; then
            echo "✅ Database connection successful"
        else
            echo "⚠️ Database connection failed (may need manual setup)"
        fi
    else
        echo "⚠️ PostgreSQL client not installed, skipping database check"
    fi
}

verify_nginx() {
    echo "🌐 Verifying Nginx configuration..."
    
    if command -v nginx &> /dev/null; then
        if nginx -t &> /dev/null; then
            echo "✅ Nginx configuration is valid"
            
            if systemctl is-active --quiet nginx; then
                echo "✅ Nginx service is running"
            else
                echo "⚠️ Nginx service is not running"
            fi
        else
            echo "❌ Nginx configuration has errors"
            nginx -t
        fi
    else
        echo "⚠️ Nginx not installed"
    fi
}

verify_ssl() {
    echo "🔒 Verifying SSL configuration..."
    
    if [ -f "/etc/nginx/sites-available/docuslicer" ]; then
        if grep -q "ssl_certificate" /etc/nginx/sites-available/docuslicer; then
            echo "✅ SSL configuration found in Nginx"
        else
            echo "⚠️ SSL not configured in Nginx"
        fi
    else
        echo "⚠️ Nginx site configuration not found"
    fi
}

verify_logs() {
    echo "📋 Verifying log files..."
    
    local log_files=(
        "/var/log/docuslicer/api.log"
        "/var/log/docuslicer/web.log"
        "/var/log/docuslicer/api-error.log"
    )
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            echo "✅ Log file exists: $log_file"
            echo "   Last 3 lines:"
            tail -n 3 "$log_file" | sed 's/^/     /'
        else
            echo "⚠️ Log file not found: $log_file"
        fi
    done
}

show_system_info() {
    echo "💻 System Information:"
    echo "   OS: $(lsb_release -d 2>/dev/null | cut -f2 || uname -s)"
    echo "   Kernel: $(uname -r)"
    echo "   Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "   NPM: $(npm --version 2>/dev/null || echo 'Not installed')"
    echo "   PM2: $(pm2 --version 2>/dev/null || echo 'Not installed')"
    echo "   Nginx: $(nginx -v 2>&1 | grep -o 'nginx/[0-9.]*' || echo 'Not installed')"
    echo "   PostgreSQL: $(psql --version 2>/dev/null | grep -o 'PostgreSQL [0-9.]*' || echo 'Not installed')"
    echo ""
    echo "💾 Disk Usage:"
    df -h "$PROJECT_DIR" 2>/dev/null || echo "   Project directory not found"
    echo ""
    echo "🧠 Memory Usage:"
    free -h
    echo ""
    echo "⚡ CPU Load:"
    uptime
}

# Main verification process
main() {
    echo "🚀 Starting comprehensive deployment verification..."
    echo ""
    
    local failed_checks=0
    
    # Run all verification checks
    verify_files || ((failed_checks++))
    echo ""
    
    verify_services || ((failed_checks++))
    echo ""
    
    verify_api_health || ((failed_checks++))
    echo ""
    
    verify_web_service || ((failed_checks++))
    echo ""
    
    verify_database || ((failed_checks++))
    echo ""
    
    verify_nginx || ((failed_checks++))
    echo ""
    
    verify_ssl || ((failed_checks++))
    echo ""
    
    verify_logs
    echo ""
    
    show_system_info
    echo ""
    
    # Final summary
    echo "📊 VERIFICATION SUMMARY"
    echo "======================"
    
    if [ $failed_checks -eq 0 ]; then
        echo "🎉 ALL CHECKS PASSED!"
        echo "✅ DocuSlicer is successfully deployed and running"
        echo ""
        echo "🌐 Access your application:"
        echo "   - Web Interface: http://your-domain.com"
        echo "   - API Health: http://your-domain.com/api/health"
        echo "   - API Documentation: http://your-domain.com/api/docs"
        echo ""
        echo "📊 Monitoring:"
        echo "   - PM2 Status: pm2 status"
        echo "   - PM2 Logs: pm2 logs"
        echo "   - System Logs: tail -f /var/log/docuslicer/*.log"
    else
        echo "⚠️ $failed_checks CHECK(S) FAILED"
        echo "❌ Please review the issues above and fix them"
        echo ""
        echo "🔧 Common fixes:"
        echo "   - Restart services: pm2 restart all"
        echo "   - Check logs: pm2 logs"
        echo "   - Rebuild applications: npm run build:api && npm run build:web"
        echo "   - Check environment configuration: cat apps/api/.env"
    fi
    
    echo ""
    echo "📋 Verification log saved to: $LOG_FILE"
    echo "📅 Verification completed at: $(date)"
}

# Run main function
main
