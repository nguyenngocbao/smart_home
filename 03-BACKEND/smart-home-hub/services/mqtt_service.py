import json
import logging
import paho.mqtt.client as mqtt
from datetime import datetime
from flask import current_app

logger = logging.getLogger("mqtt_service")

# ============================================
# MQTT Service - Smart Home Hub
# ============================================

class MQTTService:
    def __init__(self, app=None, state_store=None):
        self.client   = None
        self.app      = app
        self.state_store = state_store
        self.connected = False
        self.rule_engine = None  # Simple rule engine

    def init_app(self, app, state_store):
        self.app      = app
        self.state_store = state_store
        
        # Initialize simple rule engine
        try:
            from simple.rules_simple import SimpleRuleEngine
            self.rule_engine = SimpleRuleEngine(self, state_store)
            logger.info("✅ Simple Rule Engine initialized")
        except ImportError:
            logger.warning("⚠️ Simple Rule Engine not found, rules disabled")
        
        self._setup_client()

    def _setup_client(self):
        cfg = self.app.config
        self.client = mqtt.Client(client_id="smarthome-hub", clean_session=True)
        self.client.username_pw_set(cfg["MQTT_USER"], cfg["MQTT_PASSWORD"])
        self.client.on_connect    = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message    = self._on_message

        if cfg.get("MQTT_TLS"):
            import ssl
            self.client.tls_set(cert_reqs=ssl.CERT_NONE)
            self.client.tls_insecure_set(True)
            logger.info("MQTT TLS enabled (insecure — no cert verify)")

        try:
            self.client.connect(cfg["MQTT_BROKER"], cfg["MQTT_PORT"], cfg["MQTT_KEEPALIVE"])
            self.client.loop_start()
            logger.info(f"MQTT connecting to {cfg['MQTT_BROKER']}:{cfg['MQTT_PORT']}")
        except Exception as e:
            logger.error(f"MQTT connect failed: {e}")

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            logger.info("MQTT Connected to broker")
            # Topic format: smarthome/{device_id}/sensors/{type}
            topics = [
                "smarthome/+/sensors/#",   # sensors từ tất cả devices
                "smarthome/status/#",
                "smarthome/heartbeat/#",
            ]
            for topic in topics:
                client.subscribe(topic)
                logger.info(f"  Subscribed: {topic}")
        else:
            logger.error(f"MQTT connection failed, rc={rc}")

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        logger.warning(f"MQTT disconnected, rc={rc}")

    def _on_message(self, client, userdata, msg):
        topic   = msg.topic
        payload = msg.payload.decode("utf-8").strip()
        logger.debug(f"MQTT [{topic}]: {payload}")

        with self.app.app_context():
            try:
                self._process_message(topic, payload)
            except Exception as e:
                logger.error(f"Error processing [{topic}]: {e}")

    def _process_message(self, topic, payload):
        # Topic formats:
        #   smarthome/{device_id}/sensors/{sensor_type}  — sensor data
        #   smarthome/status/{device_id}
        #   smarthome/heartbeat/{device_id}
        parts = topic.split("/")
        if len(parts) < 3:
            return

        if len(parts) == 4 and parts[2] == "sensors":
            # smarthome/tang-tret/sensors/temperature
            device_id   = parts[1]
            sensor_type = parts[3]
            self._save_sensor_reading(device_id, sensor_type, payload)

        elif parts[1] == "status" and len(parts) == 3:
            device_id = parts[2]
            self._update_device_status(device_id, payload)

        elif parts[1] == "heartbeat" and len(parts) == 3:
            device_id = parts[2]
            self._update_heartbeat(device_id, payload)

    def _save_sensor_reading(self, device_id, sensor_type, payload):
        units = {
            "temperature":   "°C",
            "humidity":      "%",
            "light":         "%",
            "soil_moisture": "%",
            "current":       "A",
            "curtain":       "%",
            "rain":          "",
            "door":          "",
            "skylight":      "",
            "pump_state":    "",
            "light1_state":  "",
            "light2_state":  "",
        }
        try:
            # Các sensor kiểu string: rain, door, skylight
            if sensor_type in ("rain", "door", "skylight"):
                value = 1.0 if payload in ("1", "open") else 0.0
            else:
                value = float(payload)

            # Update State Store instead of database
            self.state_store.update_sensor(
                device_id,
                sensor_type,
                value,
                units.get(sensor_type, "")
            )
            
            logger.debug(f"[{device_id}] {sensor_type}: {value}")
            
            # Check automation rules (SIMPLE VERSION)
            if self.rule_engine:
                try:
                    self.rule_engine.check_sensor_rules(sensor_type, value, device_id)
                except Exception as e:
                    logger.error(f"Rule engine error: {e}")
        except ValueError:
            pass

    def _update_device_status(self, device_id, payload):
        try:
            data = json.loads(payload)
            status = data.get("status", "unknown")
            version = data.get("version", "")
            logger.info(f"Device {device_id} status: {status} (v{version})")
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"Status update error: {e}")

    def _update_heartbeat(self, device_id, payload):
        try:
            data = json.loads(payload)
            logger.debug(f"Heartbeat from {device_id}: uptime={data.get('uptime')}s heap={data.get('heap')} rssi={data.get('rssi')}")
        except Exception as e:
            logger.error(f"Heartbeat parse error: {e}")

    def publish(self, topic, payload, qos=1, retain=False):
        if self.client and self.connected:
            if isinstance(payload, dict):
                payload = json.dumps(payload)
            result = self.client.publish(topic, payload, qos=qos, retain=retain)
            return result.rc == 0
        return False

    def send_command(self, device_id, actuator, state):
        # Topic: smarthome/cmd/{device_id}/{actuator}
        # Payload: {"state": true/false, ...}
        topic = f"smarthome/cmd/{device_id}/{actuator}"
        payload = {"state": state, "source": "hub", "timestamp": datetime.utcnow().isoformat()}

        self.state_store.update_actuator(
            device_id, actuator,
            state, "on" if state else "off", "mqtt_service"
        )
        return self.publish(topic, payload)

    def send_curtain_position(self, position: int):
        # Curtain dùng {"position": N} thay vì {"state": bool}
        # Topic: smarthome/cmd/bedroom/curtain
        position = max(0, min(100, position))
        topic = "smarthome/cmd/bedroom/curtain"
        payload = {"position": position, "source": "hub", "timestamp": datetime.utcnow().isoformat()}

        self.state_store.update_actuator(
            "bedroom", "curtain",
            position > 0, str(position), "mqtt_service"
        )
        return self.publish(topic, payload)


mqtt_service = MQTTService()
