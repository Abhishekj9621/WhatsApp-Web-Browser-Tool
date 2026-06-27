// ecosystem.config.js  –  PM2 configuration
module.exports = {
  apps: [
    {
      name: 'wa-marketing',
      script: 'server.js',
      cwd: './',

      // Restart policy
      watch: false,              // don't watch for file changes in production
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,

      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        PUPPETEER_SKIP_DOWNLOAD: 'true',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        PUPPETEER_SKIP_DOWNLOAD: 'true',
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
