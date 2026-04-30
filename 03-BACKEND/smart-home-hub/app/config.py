import os
from dotenv import load_dotenv

load_dotenv()

# ============================================
# Smart Home Hub - App Configuration
# State Store Architecture (No Database)
# ============================================

class Config:
    # Flask
    SECRET_KEY      = os.getenv("SECRET_KEY", "dev-secret-key")
    DEBUG           = False
    TESTING         = False
    HOST            = os.getenv("HOST", "0.0.0.0")
    PORT            = int(os.getenv("PORT", 5000))

    # MQTT  (local: TLS=false, port 1883 | cloud HiveMQ: TLS=true, port 8883)
    MQTT_BROKER     = os.getenv("MQTT_BROKER", "localhost")
    MQTT_PORT       = int(os.getenv("MQTT_PORT", 1883))
    MQTT_USER       = os.getenv("MQTT_USER", "smarthome")
    MQTT_PASSWORD   = os.getenv("MQTT_PASSWORD", "")
    MQTT_KEEPALIVE  = int(os.getenv("MQTT_KEEPALIVE", 60))
    MQTT_TLS        = os.getenv("MQTT_TLS", "false").lower() == "true"

    # State Store
    STATE_STORE_PERSISTENCE = os.getenv("STATE_STORE_PERSISTENCE", "false").lower() == "true"
    STATE_STORE_FILE = os.getenv("STATE_STORE_FILE", "data/state_store.json")
    
    # API Polling
    API_POLLING_INTERVAL = int(os.getenv("API_POLLING_INTERVAL", 2000))  # milliseconds

    # Alert thresholds
    ALERT_TEMP_HIGH     = float(os.getenv("ALERT_TEMP_HIGH", 35.0))
    ALERT_HUMIDITY_HIGH = float(os.getenv("ALERT_HUMIDITY_HIGH", 80.0))
    ALERT_SOIL_DRY      = int(os.getenv("ALERT_SOIL_DRY", 30))

    # Cloud Sync
    CLOUD_ENABLED       = os.getenv("CLOUD_ENABLED", "false").lower() == "true"
    CLOUD_MQTT_BROKER   = os.getenv("CLOUD_MQTT_BROKER", "")
    CLOUD_MQTT_PORT     = int(os.getenv("CLOUD_MQTT_PORT", 8883))
    CLOUD_MQTT_USER     = os.getenv("CLOUD_MQTT_USER", "")
    CLOUD_MQTT_PASSWORD = os.getenv("CLOUD_MQTT_PASSWORD", "")
    CLOUD_HUB_ID        = os.getenv("CLOUD_HUB_ID", "smarthome-hub-001")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True


config = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
    "testing":     TestingConfig,
    "default":     DevelopmentConfig,
}
