module.exports = {
  apps: [
    {
      name: 'docuslicer-api',
      script: 'apps/api/dist/index.js',
      cwd: '/var/www/docuslicer',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/var/log/docuslicer/api.log',
      out_file: '/var/log/docuslicer/api-out.log',
      error_file: '/var/log/docuslicer/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'temp'],
      source_map_support: true
    },
    {
      name: 'docuslicer-web',
      script: 'serve',
      args: '-s apps/web/dist -l 3000',
      cwd: '/var/www/docuslicer',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_file: '/var/log/docuslicer/web.log',
      out_file: '/var/log/docuslicer/web-out.log',
      error_file: '/var/log/docuslicer/web-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      autorestart: true,
      watch: false
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: ['your-server-ip'],
      ref: 'origin/master',
      repo: 'https://github.com/ginuineca/docuslicerv2.git',
      path: '/var/www/docuslicer',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:api && npm run build:web && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install -y nodejs npm postgresql nginx',
      'post-setup': 'ls -la'
    }
  }
}
