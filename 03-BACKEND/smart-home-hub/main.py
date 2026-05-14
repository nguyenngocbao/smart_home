import os
import logging
from app import create_app
from services.mqtt_service import mqtt_service
from services.state_store import StateStore
from services.cloud_sync_service import cloud_sync_service
from routes.api import api_bp, init_api

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)

logger = logging.getLogger(__name__)

app = create_app()

with app.app_context():
    # Initialize State Store
    state_store = StateStore()
    logger.info("✅ State Store initialized")
    
    # Initialize MQTT service with State Store
    mqtt_service.init_app(app, state_store)
    logger.info("✅ MQTT Service initialized with State Store")

    # Initialize Cloud Sync (optional — bỏ qua nếu CLOUD_ENABLED=false)
    cloud_sync_service.init_app(app, state_store, mqtt_service)

    # Initialize API with State Store and MQTT Service
    init_api(state_store, mqtt_service)
    
    # Register API Blueprint
    app.register_blueprint(api_bp)
    logger.info("✅ API Blueprint registered")
    
    # Setup time-based rules scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger
        from simple.rules_simple import check_time_rules
        import pytz

        tz = pytz.timezone("Asia/Ho_Chi_Minh")   # GMT+7 — khớp với giờ người dùng cài trên FE
        scheduler = BackgroundScheduler(timezone=tz)
        scheduler.add_job(
            func=lambda: check_time_rules(mqtt_service, state_store),
            trigger=CronTrigger(minute="*", timezone=tz),
            id="time_rules_simple"
        )
        scheduler.start()
        logger.info("✅ Time-based rules scheduler started")
    except ImportError as e:
        logger.warning(f"⚠️ APScheduler not found: {e}")
        logger.warning("⚠️ Time-based rules disabled")
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")

if __name__ == "__main__":
    host = app.config.get("HOST", "0.0.0.0")
    port = app.config.get("PORT", 5000)
    print(f"\n🏠 Smart Home Hub running at http://localhost:{port}")
    print(f"📊 API endpoints:")
    print(f"   - GET  /api/state")
    print(f"   - GET  /api/state/<location_id>")
    print(f"   - GET  /api/state/floor/<floor>")
    print(f"   - POST /api/control/<location_id>/<actuator>")
    print(f"   - GET  /api/metrics")
    print(f"   - GET  /api/health\n")
    app.run(host=host, port=port, debug=app.config.get("DEBUG", True), use_reloader=False)
