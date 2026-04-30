"""
RULES ĐƠN GIẢN - Dễ hiểu, dễ chỉnh sửa

📝 VIẾT RULES CỦA BẠN: Xem file MY_RULES.py
📝 DANH SÁCH THIẾT BỊ: Xem file MY_DEVICES.py
📝 THAM SỐ RULES: cloud_rules.json (từ cloud) hoặc default_rules.json
"""

import json
import logging
import os
from datetime import datetime

logger = logging.getLogger("rules")

# Import rules từ MY_RULES.py
try:
    from MY_RULES import sensor_rules as _my_sensor_rules, time_rules as _my_time_rules
    logger.info("✅ Loaded rules from MY_RULES.py")
    USE_MY_RULES = True
except ImportError:
    logger.warning("⚠️ MY_RULES.py not found, using default rules")
    USE_MY_RULES = False

# ── Rule Parameters (đọc từ JSON) ────────────────────────────────────────────

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_CLOUD_RULES_PATH   = os.path.join(_BASE_DIR, "cloud_rules.json")
_DEFAULT_RULES_PATH = os.path.join(_BASE_DIR, "default_rules.json")

_cached_rules = None


def load_rules() -> dict:
    """Đọc rule parameters. Ưu tiên: cloud_rules.json > default_rules.json."""
    global _cached_rules

    for path in (_CLOUD_RULES_PATH, _DEFAULT_RULES_PATH):
        if os.path.exists(path):
            try:
                with open(path) as f:
                    _cached_rules = json.load(f)
                logger.debug(f"Rules loaded from {os.path.basename(path)}")
                return _cached_rules
            except Exception as e:
                logger.error(f"Failed to load {path}: {e}")

    # Absolute fallback nếu cả 2 file đều không có
    _cached_rules = {
        "wateringSchedule": ["06:00", "17:00"],
        "wateringSensor":   {"enabled": True, "dryThreshold": 30, "wetThreshold": 70, "stopOnRain": True},
        "lightingSchedule": {"enabled": True, "onTime": "18:00", "offTime": "06:00"},
        "skylightRules":    {"enabled": True, "autoOpenTemp": 35, "closeOnRain": True},
        "blindsAuto":       {"enabled": False, "closeThreshold": 80, "openThreshold": 20},
    }
    return _cached_rules


def reload_rules():
    """Buộc đọc lại file (gọi sau khi cloud_rules.json được ghi)."""
    global _cached_rules
    _cached_rules = None
    return load_rules()


def get_rules() -> dict:
    """Trả về cached rules, load nếu chưa có."""
    return _cached_rules if _cached_rules is not None else load_rules()


# ── Rule Engine ───────────────────────────────────────────────────────────────

class SimpleRuleEngine:
    """Rule Engine đơn giản — logic trong Python, parameters từ JSON."""

    def __init__(self, mqtt_service, state_store):
        self.mqtt        = mqtt_service
        self.state_store = state_store
        self.rules_enabled = True
        load_rules()

    def load_cloud_rules(self, rules: dict):
        """Gọi từ cloud_sync_service khi nhận rules mới từ cloud."""
        global _cached_rules
        try:
            with open(_CLOUD_RULES_PATH, "w") as f:
                json.dump(rules, f, indent=2)
            _cached_rules = rules
            logger.info("✅ Cloud rules applied and saved to cloud_rules.json")
        except Exception as e:
            logger.error(f"Failed to save cloud rules: {e}")

    def check_sensor_rules(self, sensor_type, value, location_id):
        if not self.rules_enabled:
            return
        logger.info(f"Checking rules for {location_id}/{sensor_type}={value}")

        if USE_MY_RULES:
            try:
                cfg = get_rules()
                _my_sensor_rules(self.mqtt, self.state_store, location_id, sensor_type, value, cfg)
            except TypeError:
                # MY_RULES.py cũ chưa nhận cfg — gọi không có tham số đó
                _my_sensor_rules(self.mqtt, self.state_store, location_id, sensor_type, value)
            except Exception as e:
                logger.error(f"Error in MY_RULES.sensor_rules: {e}")
        else:
            self._default_sensor_rules(sensor_type, value, location_id)

    def _default_sensor_rules(self, sensor_type, value, location_id):
        from simple.device_control import turn_on, turn_off
        cfg = get_rules()

        # Rèm: đóng/mở theo ánh sáng
        if sensor_type == "light" and location_id == "bedroom":
            ba = cfg.get("blindsAuto", {})
            if ba.get("enabled"):
                if value > ba.get("closeThreshold", 80):
                    logger.info(f"☀️ [bedroom] Ánh sáng {value}% > {ba['closeThreshold']} → đóng rèm")
                    self.mqtt.send_curtain_position(0)
                elif value < ba.get("openThreshold", 20):
                    logger.info(f"🌙 [bedroom] Ánh sáng {value}% < {ba['openThreshold']} → mở rèm")
                    self.mqtt.send_curtain_position(100)

        # Bơm: theo độ ẩm đất
        if sensor_type == "soil_moisture" and location_id == "rooftop":
            ws = cfg.get("wateringSensor", {})
            if not ws.get("enabled", True):
                return
            dry = ws.get("dryThreshold", 30)
            wet = ws.get("wetThreshold", 70)
            rain_data  = self.state_store.get_sensor("rooftop", "rain")
            is_raining = rain_data and rain_data["value"] == 1.0
            if is_raining and ws.get("stopOnRain", True):
                logger.info("🌧️ [rooftop] Mưa → tắt bơm (wateringSensor.stopOnRain)")
                turn_off(self.mqtt, "rooftop", "pump", self.state_store)
            elif value < dry and not is_raining:
                logger.info(f"🌱 [rooftop] Đất khô {value}% < {dry}% → bật bơm")
                turn_on(self.mqtt, "rooftop", "pump", self.state_store)
            elif value > wet:
                logger.info(f"🌱 [rooftop] Đủ ẩm {value}% > {wet}% → tắt bơm")
                turn_off(self.mqtt, "rooftop", "pump", self.state_store)

        # Cửa sổ trời: theo nhiệt độ
        if sensor_type == "temperature" and location_id == "rooftop":
            sky = cfg.get("skylightRules", {})
            if sky.get("enabled"):
                rain_data  = self.state_store.get_sensor("rooftop", "rain")
                is_raining = rain_data and rain_data["value"] == 1.0
                if value > sky.get("autoOpenTemp", 35) and not is_raining:
                    logger.info(f"🔥 [rooftop] {value}°C > {sky['autoOpenTemp']} → mở cửa trời")
                    turn_on(self.mqtt, "rooftop", "skylight", self.state_store)
                elif value < sky.get("autoOpenTemp", 35) - 2:
                    logger.info(f"❄️ [rooftop] {value}°C → đóng cửa trời")
                    turn_off(self.mqtt, "rooftop", "skylight", self.state_store)

        # Mưa: tắt bơm + đóng cửa trời
        if sensor_type == "rain" and location_id == "rooftop":
            sky = cfg.get("skylightRules", {})
            if value == 1.0:
                logger.info("🌧️ [rooftop] Mưa → tắt bơm + đóng cửa trời")
                turn_off(self.mqtt, "rooftop", "pump",     self.state_store)
                if sky.get("closeOnRain", True):
                    turn_off(self.mqtt, "rooftop", "skylight", self.state_store)


# ── Time-based Rules ──────────────────────────────────────────────────────────

def check_time_rules(mqtt_service, state_store):
    """Gọi mỗi phút bởi APScheduler."""
    if USE_MY_RULES:
        try:
            cfg = get_rules()
            _my_time_rules(mqtt_service, state_store, cfg)
        except TypeError:
            _my_time_rules(mqtt_service, state_store)
        except Exception as e:
            logger.error(f"Error in MY_RULES.time_rules: {e}")
    else:
        _default_time_rules(mqtt_service, state_store)


def _default_time_rules(mqtt_service, state_store):
    from simple.device_control import turn_on, turn_off
    cfg = get_rules()
    now     = datetime.now()
    hour    = now.hour
    minute  = now.minute
    weekday = now.weekday()

    # Lịch đèn
    ls = cfg.get("lightingSchedule", {})
    if ls.get("enabled"):
        on_h,  on_m  = map(int, ls.get("onTime",  "18:00").split(":"))
        off_h, off_m = map(int, ls.get("offTime",  "06:00").split(":"))
        if hour == on_h and minute == on_m:
            logger.info(f"💡 {ls['onTime']} → Bật đèn phòng ngủ")
            turn_on(mqtt_service, "bedroom", "light1", state_store)
            turn_on(mqtt_service, "bedroom", "light2", state_store)
        if hour == off_h and minute == off_m:
            logger.info(f"🌙 {ls['offTime']} → Tắt đèn phòng ngủ")
            turn_off(mqtt_service, "bedroom", "light1", state_store)
            turn_off(mqtt_service, "bedroom", "light2", state_store)

    # Lịch tưới
    for t in cfg.get("wateringSchedule", []):
        wh, wm = map(int, t.split(":"))
        if hour == wh and minute == wm:
            rain_data  = state_store.get_sensor("rooftop", "rain")
            is_raining = rain_data and rain_data["value"] == 1.0
            if not is_raining:
                logger.info(f"🌱 {t} → Tưới cây")
                turn_on(mqtt_service, "rooftop", "pump", state_store)

    # Tắt bơm 30 phút sau mỗi lịch tưới
    for t in cfg.get("wateringSchedule", []):
        wh, wm = map(int, t.split(":"))
        stop_m = wm + 30
        stop_h = wh + stop_m // 60
        stop_m = stop_m % 60
        if hour == stop_h and minute == stop_m:
            logger.info(f"🌱 {stop_h:02d}:{stop_m:02d} → Tắt bơm")
            turn_off(mqtt_service, "rooftop", "pump", state_store)
