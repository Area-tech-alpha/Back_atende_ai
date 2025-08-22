module.exports = {
  apps: [
    {
      name: "atende-ai-backend",
      script: "server.js",
      cwd: "/root/atende_ai/backend/",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        SUPABASE_URL: "https://qbezqfbovuyiphkvvnen.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZXpxZmJvdnV5aXBoa3Z2bmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5ODEzOCwiZXhwIjoyMDY4ODc0MTM4fQ.CqGJvsNQ-n8cw3Kej6dNTUznrdagWYSl3rGeHbZqKa0",
        PORT: 3000,
      },
    },
    {
      name: "atende-ai-worker",
      script: "./utils/processScheduledMessages.js",
      cwd: "/root/atende_ai/backend/",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        SUPABASE_URL: "https://qbezqfbovuyiphkvvnen.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZXpxZmJvdnV5aXBoa3Z2bmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5ODEzOCwiZXhwIjoyMDY4ODc0MTM4fQ.CqGJvsNQ-n8cw3Kej6dNTUznrdagWYSl3rGeHbZqKa0",
      },
    },
  ],
};
