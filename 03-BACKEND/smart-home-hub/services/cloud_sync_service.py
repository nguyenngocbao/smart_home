"""
Cloud Sync Service
Kết nối hub lên Cloud MQTT Broker (HiveMQ/EMQX) qua TLS port 8883.
Nhiệm vụ: relay state lên cloud, nhận command từ cloud, đồng bộ rules.
"""

import json
import logging
import os
import threading
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

logger = logging.getLogger("cloud_sync")

# ── Constants ─────────────────────────────────────────────────────────────────

_FLUSH_INTERVAL = 10   # giây — batch state → cloud
_ACK_TIMEOUT    = 10   # giây — sau đó đánh dấu command failed


class CloudSyncService:
    """MQTT client độc lập kết nối lên Cloud Broker."""

    def __init__(self):
        self._client       = None
        self._mqtt_service = None
        self._state_store  = None
        self._hub_id       = None
        self._enabled      = False

        # Pending state buffer: {location_id: {sensor_type: {value, unit, ts}}}
        self._pending: dict = {}
        self._pending_lock  = threading.Lock()

        # Flush timer
        self._flush_timer: threading.Timer | None = None

    # ── App Init ──────────────────────────────────────────────────────────────

    def init_app(self, app, state_store, mqtt_service):
        cfg = app.config
        self._enabled = cfg.get("CLOUD_ENABLED", False)
        if not self._enabled:
            logger.info("☁️  Cloud sync disabled (CLOUD_ENABLED=false)")
            return

        self._hub_id       = cfg.get("CLOUD_HUB_ID", "smarthome-hub-001")
        self._mqtt_service = mqtt_service
        self._state_store  = state_store

        # Đăng ký observer lên StateStore
        state_store.add_change_listener(self._on_state_change)

        self._setup_client(cfg)
        self._schedule_flush()

    def _setup_client(self, cfg):
        broker   = cfg.get("CLOUD_MQTT_BROKER", "")
        port     = int(cfg.get("CLOUD_MQTT_PORT", 8883))
        user     = cfg.get("CLOUD_MQTT_USER", "")
        password = cfg.get("CLOUD_MQTT_PASSWORD", "")

        self._client = mqtt.Client(
            client_id=f"{self._hub_id}-cloud",
            clean_session=True,
            protocol=mqtt.MQTTv311,
        )
        self._client.username_pw_set(user, password)

        # TLS (mặc định verify certs của broker)
        self._client.tls_set()

        # Last Will — broker tự publish khi hub mất kết nối
        will_topic = f"cloud/{self._hub_id}/status"
        self._client.will_set(will_topic, "offline", qos=1, retain=True)

        self._client.on_connect    = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message    = self._on_cloud_message

        try:
            self._client.connect_async(broker, port, keepalive=60)
            self._client.loop_start()
            logger.info(f"☁️  Cloud MQTT connecting → {broker}:{port}")
        except Exception as e:
            logger.error(f"☁️  Cloud MQTT connect failed: {e}")

    # ── MQTT Callbacks ────────────────────────────────────────────────────────

    def _on_connect(self, client, userdata, flags, rc):
        if rc != 0:
            logger.error(f"☁️  Cloud MQTT connect error rc={rc}")
            return

        logger.info("☁️  Connected to Cloud MQTT Broker")

        # Publish status online (retain)
        self._publish(f"cloud/{self._hub_id}/status", "online", retain=True)

        # Publish device config (retain — cloud luôn biết device layout)
        self._publish_config()

        # Subscribe: remote commands + rules sync
        cmd_topic   = f"cloud/{self._hub_id}/cmd/#"
        rules_topic = f"cloud/{self._hub_id}/rules"
        client.subscribe([(cmd_topic, 1), (rules_topic, 1)])
        logger.info(f"☁️  Subscribed: {cmd_topic}, {rules_topic}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"☁️  Cloud MQTT disconnected rc={rc} — paho will reconnect")

    def _on_cloud_message(self, client, userdata, msg):
        topic   = msg.topic
        payload = msg.payload.decode("utf-8").strip()
        logger.debug(f"☁️  [{topic}] {payload[:120]}")

        prefix = f"cloud/{self._hub_id}/"

        if topic.startswith(prefix + "cmd/"):
            self._handle_command(topic[len(prefix + "cmd/"):], payload)
        elif topic == f"cloud/{self._hub_id}/rules":
            self._handle_rules(payload)

    # ── Command Handling ──────────────────────────────────────────────────────

    def _handle_command(self, sub_topic, raw):
        """sub_topic = '{location_id}/{actuator}'"""
        parts = sub_topic.split("/", 1)
        if len(parts) != 2:
            logger.warning(f"☁️  Bad cmd topic: {sub_topic}")
            return

        location_id, actuator = parts
        command_id = "unknown"

        try:
            payload    = json.loads(raw)
            command_id = payload.get("command_id", "unknown")
            state      = payload.get("state")
            position   = payload.get("position")  # curtain

            logger.info(f"☁️  CMD [{command_id}] {location_id}/{actuator} state={state}")

            if actuator == "curtain" and position is not None:
                self._mqtt_service.send_curtain_position(int(position))
            elif state is not None:
                self._mqtt_service.send_command(location_id, actuator, bool(state))
            else:
                raise ValueError("payload missing 'state' or 'position'")

            self._publish_ack(command_id, success=True)

        except Exception as e:
            logger.error(f"☁️  Command error: {e}")
            self._publish_ack(command_id, success=False)

    def _publish_ack(self, command_id: str, success: bool):
        topic = f"cloud/{self._hub_id}/ack/{command_id}"
        self._publish(topic, {
            "command_id": command_id,
            "success":    success,
            "timestamp":  _utcnow(),
        })

    # ── Rules Sync ────────────────────────────────────────────────────────────

    def _handle_rules(self, raw):
        try:
            rules = json.loads(raw)
            # Lưu vào cloud_rules.json và cache
            rule_engine = getattr(self._mqtt_service, "rule_engine", None)
            if rule_engine and hasattr(rule_engine, "load_cloud_rules"):
                rule_engine.load_cloud_rules(rules)
                logger.info("☁️  Cloud rules applied to rule engine")
            else:
                # Không có rule engine — lưu file thủ công
                from simple.rules_simple import reload_rules
                _BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                path  = os.path.join(_BASE, "cloud_rules.json")
                with open(path, "w") as f:
                    json.dump(rules, f, indent=2)
                reload_rules()
                logger.info("☁️  Cloud rules saved to cloud_rules.json")

            # Publish ack
            self._publish(f"cloud/{self._hub_id}/rules_ack", {
                "success":   True,
                "timestamp": _utcnow(),
            })
        except Exception as e:
            logger.error(f"☁️  Rules sync error: {e}")
            self._publish(f"cloud/{self._hub_id}/rules_ack", {
                "success":   False,
                "error":     str(e),
                "timestamp": _utcnow(),
            })

    # ── State Observer & Batching ─────────────────────────────────────────────

    # Actuator key → (sensor_topic_name, unit)
    # Tên topic phải khớp với những gì ESP32 publish và FE map:
    #   pump     → pump_state   (FE: waterPumpOn)
    #   skylight → skylight     (FE: skylightOpen)
    #   light1   → light1_state (FE: light1On)
    #   light2   → light2_state (FE: light2On)
    #   curtain  → curtain      (FE: blindsPosition) — dùng value số, không phải bool
    _ACTUATOR_TOPIC = {
        "pump":     ("pump_state",   ""),
        "skylight": ("skylight",     ""),
        "light1":   ("light1_state", ""),
        "light2":   ("light2_state", ""),
    }

    def _on_state_change(self, location_id, data_type, key, value):
        """Gọi bởi StateStore mỗi khi sensor/actuator thay đổi."""
        if not self._enabled or not self._client:
            return

        if data_type == "sensor":
            sensor_data = self._state_store.get_sensor(location_id, key)
            unit = sensor_data["unit"] if sensor_data else ""
            with self._pending_lock:
                if location_id not in self._pending:
                    self._pending[location_id] = {}
                self._pending[location_id][key] = {
                    "value":     value,
                    "unit":      unit,
                    "timestamp": _utcnow(),
                }

        elif data_type == "actuator":
            if key == "curtain":
                # value là bool; lấy position thật từ state_store
                act = self._state_store.get_actuator(location_id, "curtain")
                position = 0.0
                if act:
                    try:
                        position = float(act.get("value", "0") or "0")
                    except (ValueError, TypeError):
                        position = 0.0
                with self._pending_lock:
                    if location_id not in self._pending:
                        self._pending[location_id] = {}
                    self._pending[location_id]["curtain"] = {
                        "value":     position,
                        "unit":      "%",
                        "timestamp": _utcnow(),
                    }
            elif key in self._ACTUATOR_TOPIC:
                topic_key, unit = self._ACTUATOR_TOPIC[key]
                with self._pending_lock:
                    if location_id not in self._pending:
                        self._pending[location_id] = {}
                    self._pending[location_id][topic_key] = {
                        "value":     1.0 if value else 0.0,
                        "unit":      unit,
                        "timestamp": _utcnow(),
                    }

    def _schedule_flush(self):
        self._flush_timer = threading.Timer(_FLUSH_INTERVAL, self._flush_pending)
        self._flush_timer.daemon = True
        self._flush_timer.start()

    def _flush_pending(self):
        """Publish batched state updates lên cloud, mỗi sensor 1 topic."""
        try:
            with self._pending_lock:
                snapshot = self._pending
                self._pending = {}

            for location_id, sensors in snapshot.items():
                for sensor_type, data in sensors.items():
                    topic = f"cloud/{self._hub_id}/{location_id}/sensors/{sensor_type}"
                    self._publish(topic, data)

            if snapshot:
                total = sum(len(s) for s in snapshot.values())
                logger.debug(f"☁️  Flushed {total} sensor(s) to cloud")

        except Exception as e:
            logger.error(f"☁️  Flush error: {e}")
        finally:
            self._schedule_flush()  # luôn lên lịch lại

    # ── Config Publish ────────────────────────────────────────────────────────

    def _publish_config(self):
        """Publish MY_DEVICES.py → cloud/{hub_id}/config (retain=True)."""
        try:
            from MY_DEVICES import LOCATIONS, ESP32_DEVICES
            config = {
                "hub_id":    self._hub_id,
                "locations": LOCATIONS,
                "devices":   ESP32_DEVICES,
                "version":   "1.0.0",
                "timestamp": _utcnow(),
            }
            self._publish(
                f"cloud/{self._hub_id}/config",
                config,
                retain=True,
            )
            logger.info("☁️  Config published (retain=True)")
        except Exception as e:
            logger.error(f"☁️  Config publish failed: {e}")

    # ── Publish Helper ────────────────────────────────────────────────────────

    def _publish(self, topic: str, payload, qos: int = 1, retain: bool = False):
        if not self._client:
            return
        if isinstance(payload, dict):
            payload = json.dumps(payload, ensure_ascii=False)
        try:
            self._client.publish(topic, payload, qos=qos, retain=retain)
        except Exception as e:
            logger.error(f"☁️  Publish error [{topic}]: {e}")

    # ── Stop ──────────────────────────────────────────────────────────────────

    def stop(self):
        if self._flush_timer:
            self._flush_timer.cancel()
        if self._client:
            self._publish(f"cloud/{self._hub_id}/status", "offline", retain=True)
            self._client.loop_stop()
            self._client.disconnect()
            logger.info("☁️  Cloud sync stopped")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


# Singleton
cloud_sync_service = CloudSyncService()
