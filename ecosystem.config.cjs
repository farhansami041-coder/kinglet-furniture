/**
 * PM2 Application Configuration for Kinglet Furniture & Interior
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload ecosystem.config.cjs --env production
 *   pm2 status
 *   pm2 logs kinglet-api
 */

module.exports = {
  apps: [
    {
      name: "kinglet-api",
      script: "server.js",
      cwd: "./server",
      instances: "max", // Run in cluster mode utilizing all available CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./server/logs/pm2-error.log",
      out_file: "./server/logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};

