# DocuSlicer InterServer Deployment Guide

This guide will help you deploy DocuSlicer on an InterServer VPS.

## 🚀 Quick Start

### 1. Purchase InterServer VPS
- Go to [InterServer VPS](https://my.interserver.net/index.php?choice=none.order_vps&platform=kvm&vpsslices=3&coupon=&version=ubuntu)
- **Recommended**: 3 Slices ($9/month) - 2 cores, 6GB RAM, 120GB SSD
- Choose **Ubuntu 22.04 LTS**
- Optional: Add Webuzo control panel (free)

### 2. Initial Server Setup
After your VPS is provisioned:

```bash
# Connect to your VPS via SSH
ssh root@your-vps-ip

# Make setup script executable
chmod +x deploy/interserver-setup.sh

# Run the setup script
./deploy/interserver-setup.sh
```

### 3. Configure Environment Variables
Edit the environment files:

```bash
# API environment
nano apps/api/.env
```

Update with your actual values:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://docuslicer:your_secure_password@localhost:5432/docuslicer
FRONTEND_URL=https://your-domain.com
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
# Web environment
nano apps/web/.env
```

Update with:
```env
VITE_API_URL=https://your-domain.com/api
```

### 4. Configure Nginx
```bash
# Make script executable
chmod +x deploy/configure-nginx.sh

# Run as root
sudo ./deploy/configure-nginx.sh
```

Edit the Nginx config to use your domain:
```bash
sudo nano /etc/nginx/sites-available/docuslicer
# Replace 'your-domain.com' with your actual domain
```

### 5. Start Services
```bash
# Make script executable
chmod +x deploy/start-services.sh

# Start the application
./deploy/start-services.sh
```

### 6. Setup SSL (Optional but Recommended)
```bash
# Make script executable
chmod +x deploy/ssl-setup.sh

# Run as root
sudo ./deploy/ssl-setup.sh
```

## 🔧 Management Commands

### PM2 Process Management
```bash
pm2 status          # Check service status
pm2 logs            # View logs
pm2 restart all     # Restart all services
pm2 stop all        # Stop all services
pm2 monit           # Monitor services
```

### Nginx Management
```bash
sudo systemctl status nginx    # Check Nginx status
sudo systemctl restart nginx   # Restart Nginx
sudo nginx -t                  # Test configuration
```

### Database Management
```bash
sudo -u postgres psql docuslicer  # Connect to database
```

## 📊 Cost Comparison

| Service | InterServer | DigitalOcean |
|---------|-------------|--------------|
| **3 Slices** | $9/month | $18/month |
| **Specs** | 2 cores, 6GB RAM | 2 cores, 4GB RAM |
| **Storage** | 120GB SSD | 80GB SSD |
| **Transfer** | 6TB | 4TB |
| **Support** | 24/7 | Business hours |

**Savings**: $108/year with better specs!

## 🛠️ Troubleshooting

### Check Service Status
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

### View Logs
```bash
pm2 logs docuslicer-api
sudo tail -f /var/log/nginx/error.log
```

### Restart Everything
```bash
pm2 restart all
sudo systemctl restart nginx
```

## 🔄 Updates and Maintenance

### Update Application
```bash
cd /var/www/docuslicer
git pull origin master
npm run build:api
npm run build:web
pm2 restart all
```

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

## 📞 Support

- **InterServer Support**: 24/7 via phone, chat, or ticket
- **Documentation**: Available in `/deploy/` directory
- **Monitoring**: Use `pm2 monit` for real-time monitoring

## 🎯 Next Steps

1. Set up your domain DNS to point to your VPS IP
2. Configure Supabase for authentication and storage
3. Set up automated backups
4. Configure monitoring and alerts
5. Optimize performance settings

Your DocuSlicer application should now be running on InterServer! 🚀
