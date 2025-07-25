#!/bin/bash

# DocuSlicer Server Diagnostic Script
# This script will check all aspects of the server configuration

echo "🔍 DocuSlicer Server Diagnostic Report"
echo "======================================"
echo ""

# Check system info
echo "📊 System Information:"
echo "----------------------"
echo "Hostname: $(hostname)"
echo "IP Address: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to get public IP')"
echo "OS: $(lsb_release -d 2>/dev/null | cut -f2 || echo 'Unknown')"
echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
echo ""

# Check DNS resolution
echo "🌐 DNS Resolution:"
echo "------------------"
echo "Checking docuslicer.com resolution..."
if command -v dig >/dev/null 2>&1; then
    dig +short docuslicer.com A
elif command -v nslookup >/dev/null 2>&1; then
    nslookup docuslicer.com | grep -A1 "Name:" | tail -1
else
    echo "No DNS tools available"
fi
echo ""

# Check network connectivity
echo "🌍 Network Connectivity:"
echo "------------------------"
echo "Testing external connectivity..."
if curl -s --connect-timeout 5 http://google.com >/dev/null; then
    echo "✅ External connectivity: OK"
else
    echo "❌ External connectivity: FAILED"
fi
echo ""

# Check nginx
echo "🌐 Nginx Status:"
echo "----------------"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx service: RUNNING"
    echo "Nginx version: $(nginx -v 2>&1)"
    echo "Nginx processes: $(ps aux | grep -c '[n]ginx')"
else
    echo "❌ Nginx service: NOT RUNNING"
fi

echo ""
echo "Nginx configuration test:"
if nginx -t 2>/dev/null; then
    echo "✅ Nginx config: VALID"
else
    echo "❌ Nginx config: INVALID"
    nginx -t
fi

echo ""
echo "Nginx listening ports:"
netstat -tlnp 2>/dev/null | grep nginx || ss -tlnp | grep nginx

echo ""
echo "Active nginx sites:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites enabled"

echo ""

# Check PM2 and API
echo "🚀 API Server Status:"
echo "---------------------"
if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 processes:"
    pm2 list 2>/dev/null || echo "No PM2 processes"
    
    echo ""
    echo "API server connectivity:"
    if curl -s --connect-timeout 5 http://localhost:3001/api/status >/dev/null; then
        echo "✅ API server: RESPONDING"
        echo "API response: $(curl -s http://localhost:3001/api/status)"
    else
        echo "❌ API server: NOT RESPONDING"
    fi
else
    echo "PM2 not installed"
fi

echo ""
echo "Port 3001 status:"
netstat -tlnp 2>/dev/null | grep :3001 || ss -tlnp | grep :3001 || echo "Port 3001 not listening"

echo ""

# Check web files
echo "📁 Web Files:"
echo "-------------"
if [ -d "/var/www/docuslicer/apps/web/dist" ]; then
    echo "✅ Web dist directory exists"
    echo "Files in dist:"
    ls -la /var/www/docuslicer/apps/web/dist/ | head -10
    
    if [ -f "/var/www/docuslicer/apps/web/dist/index.html" ]; then
        echo "✅ index.html exists"
        echo "File size: $(stat -c%s /var/www/docuslicer/apps/web/dist/index.html) bytes"
    else
        echo "❌ index.html missing"
    fi
else
    echo "❌ Web dist directory missing"
fi

echo ""

# Check firewall
echo "🔥 Firewall Status:"
echo "-------------------"
if command -v ufw >/dev/null 2>&1; then
    echo "UFW status: $(ufw status 2>/dev/null || echo 'inactive')"
else
    echo "UFW not installed"
fi

echo ""
echo "iptables rules:"
iptables -L -n 2>/dev/null | head -10 || echo "Cannot read iptables"

echo ""

# Test local connectivity
echo "🔗 Local Connectivity Tests:"
echo "-----------------------------"
echo "Testing localhost:80..."
if curl -s --connect-timeout 5 http://localhost/ >/dev/null; then
    echo "✅ localhost:80 responding"
else
    echo "❌ localhost:80 not responding"
fi

echo ""
echo "Testing 127.0.0.1:80..."
if curl -s --connect-timeout 5 http://127.0.0.1/ >/dev/null; then
    echo "✅ 127.0.0.1:80 responding"
else
    echo "❌ 127.0.0.1:80 not responding"
fi

echo ""
echo "Testing domain from server..."
if curl -s --connect-timeout 5 http://docuslicer.com/ >/dev/null; then
    echo "✅ docuslicer.com responding from server"
else
    echo "❌ docuslicer.com not responding from server"
fi

echo ""

# Check logs
echo "📋 Recent Nginx Logs:"
echo "---------------------"
echo "Access log (last 5 lines):"
tail -5 /var/log/nginx/access.log 2>/dev/null || echo "No access log"

echo ""
echo "Error log (last 5 lines):"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No error log"

echo ""
echo "DocuSlicer error log (last 5 lines):"
tail -5 /var/log/nginx/docuslicer_error.log 2>/dev/null || echo "No docuslicer error log"

echo ""
echo "======================================"
echo "🏁 Diagnostic Complete"
echo "======================================"
