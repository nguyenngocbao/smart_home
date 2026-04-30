require("dotenv").config();

const required = ["MONGODB_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET", "MQTT_BROKER_URL"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

module.exports = {
  port:           parseInt(process.env.PORT || "3000"),
  nodeEnv:        process.env.NODE_ENV || "development",
  mongodbUri:     process.env.MONGODB_URI,

  jwt: {
    secret:              process.env.JWT_SECRET,
    expiresIn:           process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret:       process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn:    process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  },

  mqtt: {
    brokerUrl:  process.env.MQTT_BROKER_URL,
    username:   process.env.MQTT_USERNAME || "",
    password:   process.env.MQTT_PASSWORD || "",
    clientId:   process.env.MQTT_CLIENT_ID || "cloud-be-server",
  },

  hubId:  process.env.HUB_ID || "smarthome-hub-001",

  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map(s => s.trim()),
};
