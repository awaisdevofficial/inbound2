// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'inbound-genie-backend',
    script: './backend/server.js',
    cwd: './',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3031
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3031
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--experimental-modules'
  }]
};
