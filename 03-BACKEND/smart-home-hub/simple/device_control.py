"""
Device Control — Điều khiển thiết bị theo location_id (phòng/khu vực)

Dùng location_id (tên phòng) chứ không phải device_id (chip ESP32).
Một chip ESP32 có thể quản lý nhiều phòng — xem ESP32_DEVICES trong MY_DEVICES.py.

MQTT command topic: smarthome/cmd/{location_id}/{actuator}
"""

import logging

logger = logging.getLogger("device_control")

try:
    from MY_DEVICES import LOCATIONS
    logger.info(f"✅ Loaded {len(LOCATIONS)} locations from MY_DEVICES.py")
except ImportError:
    logger.warning("⚠️ MY_DEVICES.py not found, using fallback")
    LOCATIONS = {
        "living-room": {
            "name": "Phòng Khách",
            "floor": "Tầng Trệt",
            "actuators": {"light-main": "Đèn chính", "fan": "Quạt trần"},
        }
    }


# ──────────────────────────────────────────────
# ĐIỀU KHIỂN CƠ BẢN — 1 thiết bị
# ──────────────────────────────────────────────

def turn_on(mqtt_service, location_id: str, actuator: str, state_store=None) -> bool:
    """
    Bật 1 actuator trong 1 phòng.

    Args:
        mqtt_service: MQTTService instance
        location_id:  ID phòng (vd: "living-room", "garden")
        actuator:     ID actuator (vd: "light-main", "fan", "pump")
        state_store:  StateStore instance (không bắt buộc, send_command tự update)

    Returns:
        True nếu gửi lệnh thành công
    """
    loc = LOCATIONS.get(location_id)
    if not loc:
        logger.error(f"❌ Location không tồn tại: {location_id}")
        return False

    if actuator not in loc["actuators"]:
        logger.error(f"❌ Actuator '{actuator}' không có trong {location_id}")
        return False

    success = mqtt_service.send_command(location_id, actuator, True)
    if success:
        logger.info(f"✅ Bật [{loc['name']}] {loc['actuators'][actuator]}")
    return success


def turn_off(mqtt_service, location_id: str, actuator: str, state_store=None) -> bool:
    """
    Tắt 1 actuator trong 1 phòng.

    Args:
        mqtt_service: MQTTService instance
        location_id:  ID phòng
        actuator:     ID actuator
        state_store:  StateStore instance (không bắt buộc)

    Returns:
        True nếu gửi lệnh thành công
    """
    loc = LOCATIONS.get(location_id)
    if not loc:
        logger.error(f"❌ Location không tồn tại: {location_id}")
        return False

    if actuator not in loc["actuators"]:
        logger.error(f"❌ Actuator '{actuator}' không có trong {location_id}")
        return False

    success = mqtt_service.send_command(location_id, actuator, False)
    if success:
        logger.info(f"✅ Tắt [{loc['name']}] {loc['actuators'][actuator]}")
    return success


# ──────────────────────────────────────────────
# ĐIỀU KHIỂN THEO PHÒNG — tất cả đèn / quạt
# ──────────────────────────────────────────────

def turn_on_all_lights(mqtt_service, location_id: str, state_store=None) -> bool:
    """Bật tất cả đèn trong 1 phòng"""
    loc = LOCATIONS.get(location_id)
    if not loc:
        return False
    for actuator in loc["actuators"]:
        if "light" in actuator:
            turn_on(mqtt_service, location_id, actuator, state_store)
    return True


def turn_off_all_lights(mqtt_service, location_id: str, state_store=None) -> bool:
    """Tắt tất cả đèn trong 1 phòng"""
    loc = LOCATIONS.get(location_id)
    if not loc:
        return False
    for actuator in loc["actuators"]:
        if "light" in actuator:
            turn_off(mqtt_service, location_id, actuator, state_store)
    return True


def turn_on_all_fans(mqtt_service, location_id: str, state_store=None) -> bool:
    """Bật tất cả quạt trong 1 phòng"""
    loc = LOCATIONS.get(location_id)
    if not loc:
        return False
    for actuator in loc["actuators"]:
        if "fan" in actuator:
            turn_on(mqtt_service, location_id, actuator, state_store)
    return True


def turn_off_all_fans(mqtt_service, location_id: str, state_store=None) -> bool:
    """Tắt tất cả quạt trong 1 phòng"""
    loc = LOCATIONS.get(location_id)
    if not loc:
        return False
    for actuator in loc["actuators"]:
        if "fan" in actuator:
            turn_off(mqtt_service, location_id, actuator, state_store)
    return True


# ──────────────────────────────────────────────
# ĐIỀU KHIỂN THEO TẦNG
# ──────────────────────────────────────────────

def turn_on_all_lights_on_floor(mqtt_service, floor: str, state_store) -> bool:
    """
    Bật tất cả đèn trên 1 tầng.

    Args:
        floor: Tên tầng — "Tầng Trệt" | "Tầng 1" | "Sân Thượng" | "Ngoài Trời"
    """
    logger.info(f"💡 Bật đèn tầng: {floor}")
    location_ids = state_store.get_locations_by_floor(floor)
    if not location_ids:
        logger.warning(f"⚠️ Không có location nào trên tầng '{floor}'")
        return False
    for location_id in location_ids:
        turn_on_all_lights(mqtt_service, location_id, state_store)
    return True


def turn_off_all_lights_on_floor(mqtt_service, floor: str, state_store) -> bool:
    """Tắt tất cả đèn trên 1 tầng."""
    logger.info(f"🌙 Tắt đèn tầng: {floor}")
    location_ids = state_store.get_locations_by_floor(floor)
    if not location_ids:
        logger.warning(f"⚠️ Không có location nào trên tầng '{floor}'")
        return False
    for location_id in location_ids:
        turn_off_all_lights(mqtt_service, location_id, state_store)
    return True


def turn_on_all_fans_on_floor(mqtt_service, floor: str, state_store) -> bool:
    """Bật tất cả quạt trên 1 tầng."""
    logger.info(f"🌀 Bật quạt tầng: {floor}")
    location_ids = state_store.get_locations_by_floor(floor)
    if not location_ids:
        return False
    for location_id in location_ids:
        turn_on_all_fans(mqtt_service, location_id, state_store)
    return True


def turn_off_all_fans_on_floor(mqtt_service, floor: str, state_store) -> bool:
    """Tắt tất cả quạt trên 1 tầng."""
    logger.info(f"🌀 Tắt quạt tầng: {floor}")
    location_ids = state_store.get_locations_by_floor(floor)
    if not location_ids:
        return False
    for location_id in location_ids:
        turn_off_all_fans(mqtt_service, location_id, state_store)
    return True


# ──────────────────────────────────────────────
# ĐIỀU KHIỂN TOÀN NHÀ
# ──────────────────────────────────────────────

def turn_on_all_lights_in_house(mqtt_service, state_store=None) -> None:
    """Bật tất cả đèn trong nhà"""
    logger.info("💡 Bật đèn toàn nhà")
    for location_id in LOCATIONS:
        turn_on_all_lights(mqtt_service, location_id, state_store)


def turn_off_all_lights_in_house(mqtt_service, state_store=None) -> None:
    """Tắt tất cả đèn trong nhà"""
    logger.info("🌙 Tắt đèn toàn nhà")
    for location_id in LOCATIONS:
        turn_off_all_lights(mqtt_service, location_id, state_store)


def turn_on_all_fans_in_house(mqtt_service, state_store=None) -> None:
    """Bật tất cả quạt trong nhà"""
    logger.info("🌀 Bật quạt toàn nhà")
    for location_id in LOCATIONS:
        turn_on_all_fans(mqtt_service, location_id, state_store)


def turn_off_all_fans_in_house(mqtt_service, state_store=None) -> None:
    """Tắt tất cả quạt trong nhà"""
    logger.info("🌀 Tắt quạt toàn nhà")
    for location_id in LOCATIONS:
        turn_off_all_fans(mqtt_service, location_id, state_store)


# ──────────────────────────────────────────────
# ĐỌC / ĐẢO TRẠNG THÁI TỪ STATE STORE
# ──────────────────────────────────────────────

def get_state(state_store, location_id: str, actuator: str):
    """
    Lấy trạng thái hiện tại của actuator từ State Store.

    Returns:
        True (bật) | False (tắt) | None (chưa có dữ liệu)
    """
    data = state_store.get_actuator(location_id, actuator)
    return data.get("state") if data else None


def toggle(mqtt_service, location_id: str, actuator: str, state_store) -> bool:
    """
    Đảo trạng thái actuator (bật→tắt hoặc tắt→bật).

    Requires state_store để biết trạng thái hiện tại.
    """
    current = get_state(state_store, location_id, actuator)
    if current:
        return turn_off(mqtt_service, location_id, actuator, state_store)
    else:
        return turn_on(mqtt_service, location_id, actuator, state_store)


# ──────────────────────────────────────────────
# TIỆN ÍCH
# ──────────────────────────────────────────────

def get_all_locations() -> dict:
    """Trả về toàn bộ LOCATIONS dict"""
    return LOCATIONS


def get_location_info(location_id: str) -> dict | None:
    """Lấy thông tin 1 phòng"""
    return LOCATIONS.get(location_id)


def get_actuators(location_id: str) -> dict:
    """Lấy dict actuators của 1 phòng"""
    loc = LOCATIONS.get(location_id)
    return loc["actuators"] if loc else {}
