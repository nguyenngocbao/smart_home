"""
MY_RULES.py — Automation Rules
★ File duy nhất cần sửa khi thêm/bớt quy tắc tự động.

Triết lý: HUB là não — mọi quyết định tập trung tại đây.
  • Dễ chỉnh ngưỡng mà không cần reflash firmware
  • Dễ viết cross-module rules (vd: mưa → vừa tắt bơm, vừa đóng cửa trời)
  • Mọi action được log tập trung
  Firmware giữ auto-control cục bộ chỉ như FALLBACK khi mất WiFi/MQTT.

Thiết bị thực tế (khớp với firmware):
  bedroom : sensors=[light, curtain, light1_state, light2_state]
            actuators=[light1, light2]        ← turn_on/turn_off bình thường
            actuator curtain                  ← mqtt.send_curtain_position(0..100)
  rooftop : sensors=[soil_moisture, pump_state, temperature, rain, skylight]
            actuators=[pump, skylight]        ← turn_on/turn_off bình thường
"""

import logging
from datetime import datetime
import pytz
from simple.device_control import turn_on, turn_off, get_state
from MY_DEVICES import LOCATIONS

logger = logging.getLogger("my_rules")


# ============================================================
# SENSOR RULES — chạy mỗi khi nhận data sensor mới
# ============================================================

def sensor_rules(mqtt, state_store, location_id, sensor_type, value, cfg=None):
    """
    Tham số:
        mqtt        — MQTTService instance
        state_store — đọc state bất kỳ khu vực nào
        location_id — khu vực vừa gửi data ("bedroom", "rooftop")
        sensor_type — loại sensor ("soil_moisture", "light", ...)
        value       — giá trị float
        cfg         — rule parameters từ cloud (dict), fallback về default nếu None
    """
    if cfg is None:
        cfg = {}

    # ──────────────────────────────────────────────────────────
    # MODULE 2: ÁNH SÁNG → RÈM CỬA PHÒNG NGỦ
    # ──────────────────────────────────────────────────────────
    if sensor_type == "light" and location_id == "bedroom":
        ba = cfg.get("blindsAuto", {})
        if not ba.get("enabled", False):
            return

        close_thr = ba.get("closeThreshold", 80)
        open_thr  = ba.get("openThreshold",  20)

        if value > close_thr:
            logger.info(f"☀️ [bedroom] Ánh sáng {value:.0f}% > {close_thr} → đóng rèm")
            mqtt.send_curtain_position(0)
        elif value < open_thr:
            logger.info(f"🌙 [bedroom] Ánh sáng {value:.0f}% < {open_thr} → mở rèm")
            mqtt.send_curtain_position(100)

    # ──────────────────────────────────────────────────────────
    # MODULE 1: ĐỘ ẨM ĐẤT → BƠM (rooftop)
    # ──────────────────────────────────────────────────────────
    if sensor_type == "soil_moisture" and location_id == "rooftop":
        ws = cfg.get("wateringSensor", {})
        if not ws.get("enabled", True):
            return

        dry = ws.get("dryThreshold", 30)
        wet = ws.get("wetThreshold", 70)

        rain_data  = state_store.get_sensor("rooftop", "rain")
        is_raining = rain_data and rain_data["value"] == 1.0

        if is_raining and ws.get("stopOnRain", True):
            logger.info("🌧️ [rooftop] Mưa → tắt bơm (stopOnRain)")
            turn_off(mqtt, "rooftop", "pump", state_store)
        elif value < dry and not is_raining:
            logger.info(f"🌱 [rooftop] Đất khô {value:.0f}% < {dry}% → bật bơm")
            turn_on(mqtt, "rooftop", "pump", state_store)
        elif value > wet:
            logger.info(f"🌱 [rooftop] Đủ ẩm {value:.0f}% > {wet}% → tắt bơm")
            turn_off(mqtt, "rooftop", "pump", state_store)

    # ──────────────────────────────────────────────────────────
    # MODULE 4: NHIỆT ĐỘ → CỬA SỔ TRỜI (rooftop)
    # ──────────────────────────────────────────────────────────
    if sensor_type == "temperature" and location_id == "rooftop":
        sky = cfg.get("skylightRules", {})
        if not sky.get("enabled", True):
            return

        open_temp  = sky.get("autoOpenTemp", 35)
        close_temp = open_temp - 5   # hysteresis cố định 5°C

        rain_data  = state_store.get_sensor("rooftop", "rain")
        is_raining = rain_data and rain_data["value"] == 1.0

        if value > open_temp and not is_raining:
            logger.info(f"🔥 [rooftop] {value:.1f}°C > {open_temp} & không mưa → mở cửa trời")
            turn_on(mqtt, "rooftop", "skylight", state_store)
        elif value < close_temp:
            logger.info(f"❄️ [rooftop] {value:.1f}°C < {close_temp} → đóng cửa trời")
            turn_off(mqtt, "rooftop", "skylight", state_store)

    # ──────────────────────────────────────────────────────────
    # MODULE 1 + 4: MƯA → TẮT BƠM + ĐÓNG CỬA TRỜI (cross-module)
    # ──────────────────────────────────────────────────────────
    if sensor_type == "rain" and location_id == "rooftop":
        if value == 1.0:
            ws  = cfg.get("wateringSensor", {})
            sky = cfg.get("skylightRules",  {})
            logger.info("🌧️ [rooftop] Phát hiện mưa → xử lý cross-module")
            if ws.get("stopOnRain", True):
                turn_off(mqtt, "rooftop", "pump", state_store)
            if sky.get("closeOnRain", True):
                turn_off(mqtt, "rooftop", "skylight", state_store)

    # ──────────────────────────────────────────────────────────
    # THÊM RULE MỚI Ở ĐÂY
    # ──────────────────────────────────────────────────────────
    # if sensor_type == "..." and location_id == "...":
    #     if value > threshold:
    #         turn_on(mqtt, "location", "actuator", state_store)


# ============================================================
# TIME RULES — chạy mỗi phút bởi APScheduler
# ============================================================

def time_rules(mqtt, state_store, cfg=None):
    """Hàm này được gọi MỖI PHÚT."""
    if cfg is None:
        cfg = {}

    now     = datetime.now(pytz.timezone("Asia/Ho_Chi_Minh"))
    hour    = now.hour
    minute  = now.minute
    weekday = now.weekday()

    # ──────────────────────────────────────────────────────────
    # MODULE 3: LỊCH ĐÈN PHÒNG NGỦ
    # ──────────────────────────────────────────────────────────
    ls = cfg.get("lightingSchedule", {})
    if ls.get("enabled", True):
        on_h,  on_m  = map(int, ls.get("onTime",  "18:00").split(":"))
        off_h, off_m = map(int, ls.get("offTime", "06:00").split(":"))

        lights = ls.get("lights", ["light1", "light2"])
        if hour == on_h and minute == on_m:
            logger.info(f"🌆 {ls.get('onTime','18:00')} → Bật đèn: {lights}")
            for light in lights:
                turn_on(mqtt, "bedroom", light, state_store)

        if hour == off_h and minute == off_m:
            logger.info(f"🌅 {ls.get('offTime','06:00')} → Tắt đèn: {lights}")
            for light in lights:
                turn_off(mqtt, "bedroom", light, state_store)

    # ──────────────────────────────────────────────────────────
    # MODULE 1: LỊCH TƯỚI CÂY
    # ──────────────────────────────────────────────────────────
    for t in cfg.get("wateringSchedule", ["06:00", "17:00"]):
        wh, wm = map(int, t.split(":"))
        # Bật bơm đúng giờ (nếu không mưa)
        if hour == wh and minute == wm:
            rain_data  = state_store.get_sensor("rooftop", "rain")
            is_raining = rain_data and rain_data["value"] == 1.0
            if not is_raining:
                logger.info(f"🌱 {t} → Tưới cây")
                turn_on(mqtt, "rooftop", "pump", state_store)
        # Tắt bơm sau 30 phút
        stop_m = wm + 30
        stop_h = wh + stop_m // 60
        stop_m = stop_m % 60
        if hour == stop_h and minute == stop_m:
            logger.info(f"🌱 {stop_h:02d}:{stop_m:02d} → Tắt bơm")
            turn_off(mqtt, "rooftop", "pump", state_store)

    # ──────────────────────────────────────────────────────────
    # THÊM TIME RULE MỚI Ở ĐÂY
    # ──────────────────────────────────────────────────────────
    # if hour == 12 and minute == 0:
    #     turn_on(mqtt, "rooftop", "pump", state_store)
