const http = require("http");
const app  = require("./app");
const env  = require("./config/env");
const { connectDB }   = require("./config/db");
const { initSocket }  = require("./socket");
const mqttService     = require("./services/mqttService");

async function main() {
  // 1. Connect MongoDB
  await connectDB();

  // 2. Create HTTP server và attach Socket.io
  const server = http.createServer(app);
  initSocket(server);

  // 3. Start MQTT subscriptions
  mqttService.start();

  // 4. Listen
  server.listen(env.port, () => {
    console.log(`\n🚀 Cloud BE running on http://localhost:${env.port}`);
    console.log(`   ENV: ${env.nodeEnv}`);
    console.log(`   HUB: ${env.hubId}\n`);
  });
}

main().catch((e) => {
  console.error("❌ Startup failed:", e);
  process.exit(1);
});
