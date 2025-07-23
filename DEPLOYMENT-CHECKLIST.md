# 🚀 DocuSlicer Deployment Checklist for Interserver

## **📋 Pre-Deployment Checklist**

### **✅ Repository Status**
- [ ] All code committed and pushed to GitHub
- [ ] All tests passing (100% success rate achieved)
- [ ] All performance optimizations implemented
- [ ] All security features active
- [ ] Documentation updated

### **✅ Server Requirements**
- [ ] Ubuntu/Debian Linux server
- [ ] Root or sudo access
- [ ] Minimum 2GB RAM, 20GB disk space
- [ ] Node.js 18+ support
- [ ] PostgreSQL database access
- [ ] Domain name configured (optional)

---

## **🚀 Quick Deployment (Recommended)**

### **Option 1: One-Command Deployment**
```bash
# SSH to your Interserver instance
ssh root@your-server-ip

# Clone repository
git clone https://github.com/ginuineca/docuslicerv2.git
cd docuslicerv2

# Run quick deployment (installs everything)
sudo ./deploy/quick-deploy.sh
```

### **Option 2: Step-by-Step Deployment**
```bash
# 1. Setup environment
sudo ./deploy/production-env-template.sh

# 2. Edit environment variables
nano apps/api/.env
nano apps/web/.env

# 3. Deploy application
sudo ./deploy/update-production.sh

# 4. Verify deployment
./deploy/verify-deployment.sh
```

---

## **⚙️ Manual Deployment Steps**

### **1. System Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm postgresql nginx git curl jq

# Install global packages
sudo npm install -g pm2 serve typescript tsx
```

### **2. Project Setup**
```bash
# Create project directory
sudo mkdir -p /var/www/docuslicer
cd /var/www/docuslicer

# Clone repository
sudo git clone https://github.com/ginuineca/docuslicerv2.git .

# Install dependencies
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### **3. Build Applications**
```bash
# Build API
npm run build:api

# Build Web
npm run build:web

# Verify builds
ls -la apps/api/dist/index.js
ls -la apps/web/dist/index.html
```

### **4. Database Setup**
```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE docuslicer;"
sudo -u postgres psql -c "CREATE USER docuslicer WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE docuslicer TO docuslicer;"
```

### **5. Environment Configuration**
```bash
# Create API environment file
cat > apps/api/.env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://docuslicer:your_secure_password@localhost:5432/docuslicer
FRONTEND_URL=http://your-domain.com
JWT_SECRET=your_very_secure_jwt_secret
UPLOAD_DIR=/var/www/docuslicer/uploads
EOF

# Create Web environment file
cat > apps/web/.env << 'EOF'
NODE_ENV=production
VITE_API_URL=http://your-domain.com/api
VITE_APP_NAME=DocuSlicer
EOF

# Set permissions
sudo chmod 600 apps/api/.env apps/web/.env
```

### **6. PM2 Configuration**
```bash
# Start services
pm2 start ecosystem.config.js --env production

# Save configuration
pm2 save

# Setup startup
pm2 startup systemd
```

### **7. Nginx Configuration**
```bash
# Copy nginx configuration
sudo cp deploy/nginx-config /etc/nginx/sites-available/docuslicer

# Enable site
sudo ln -s /etc/nginx/sites-available/docuslicer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## **🔍 Post-Deployment Verification**

### **✅ Service Status Checks**
```bash
# Check PM2 services
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

### **✅ Application Health Checks**
```bash
# Test API health
curl http://localhost:3001/health

# Test Web service
curl http://localhost:3000

# Test through Nginx
curl http://your-domain.com/api/health
```

### **✅ Log Verification**
```bash
# Check PM2 logs
pm2 logs

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check application logs
tail -f /var/log/docuslicer/*.log
```

---

## **🔧 Configuration Updates**

### **✅ Environment Variables to Update**
- [ ] `DATABASE_URL` - Your PostgreSQL connection string
- [ ] `JWT_SECRET` - Secure random string for JWT tokens
- [ ] `FRONTEND_URL` - Your domain name
- [ ] `SUPABASE_URL` - If using Supabase
- [ ] `SUPABASE_ANON_KEY` - If using Supabase
- [ ] `OPENAI_API_KEY` - If using AI features

### **✅ Domain Configuration**
- [ ] Update Nginx server_name with your domain
- [ ] Configure DNS A record to point to server IP
- [ ] Set up SSL certificate with Let's Encrypt

### **✅ Security Configuration**
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban for SSH protection
- [ ] Configure SSL/TLS certificates
- [ ] Update default passwords

---

## **🚨 Troubleshooting**

### **Common Issues**

#### **Services Not Starting**
```bash
# Check PM2 logs
pm2 logs

# Restart services
pm2 restart all

# Check system resources
htop
df -h
```

#### **Database Connection Issues**
```bash
# Test database connection
psql -h localhost -U docuslicer -d docuslicer

# Check PostgreSQL status
sudo systemctl status postgresql

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### **Nginx Issues**
```bash
# Test configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### **Build Issues**
```bash
# Clean and rebuild
rm -rf node_modules apps/*/node_modules
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
npm run build:api
npm run build:web
```

---

## **📊 Performance Monitoring**

### **✅ Monitoring Commands**
```bash
# System resources
htop
df -h
free -h

# PM2 monitoring
pm2 monit

# Application logs
tail -f /var/log/docuslicer/*.log

# Nginx access logs
tail -f /var/log/nginx/access.log
```

### **✅ Performance Optimization**
- [ ] Enable Nginx gzip compression
- [ ] Configure browser caching headers
- [ ] Set up CDN for static assets
- [ ] Monitor and optimize database queries
- [ ] Set up log rotation

---

## **🔄 Updates and Maintenance**

### **✅ Regular Updates**
```bash
# Update application
cd /var/www/docuslicer
sudo git pull origin master
npm install
npm run build:api
npm run build:web
pm2 restart all
```

### **✅ Backup Strategy**
```bash
# Database backup
pg_dump -h localhost -U docuslicer docuslicer > backup.sql

# File backup
tar -czf docuslicer-backup.tar.gz /var/www/docuslicer/uploads
```

---

## **✅ Deployment Complete Checklist**

- [ ] All services running (PM2 status shows "online")
- [ ] API health check returns 200 OK
- [ ] Web interface loads correctly
- [ ] Database connection working
- [ ] Nginx proxy working correctly
- [ ] SSL certificate installed (if applicable)
- [ ] Firewall configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation updated

---

## **🎉 Success Indicators**

### **✅ Application is Successfully Deployed When:**
- PM2 shows all services as "online"
- API health endpoint returns success
- Web interface loads without errors
- File uploads work correctly
- All features function as expected
- Performance metrics are optimal
- Security measures are active

### **🌐 Access Points**
- **Web Interface**: `http://your-domain.com`
- **API Health**: `http://your-domain.com/api/health`
- **API Documentation**: `http://your-domain.com/api/docs`

---

## **📞 Support**

If you encounter issues during deployment:

1. **Check the logs**: `pm2 logs` and `/var/log/docuslicer/*.log`
2. **Run verification script**: `./deploy/verify-deployment.sh`
3. **Review this checklist** for missed steps
4. **Check system resources**: `htop`, `df -h`, `free -h`

**🎯 DocuSlicer is now ready for production use with maximum performance and reliability!**
