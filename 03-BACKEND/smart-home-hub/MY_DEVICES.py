"""
MY_DEVICES.py — Cấu hình thiết bị và khu vực
★ Đây là file duy nhất cần sửa khi thêm/bớt chip ESP32 hoặc khu vực.

Nguyên tắc mapping:
  • LOCATIONS   — khu vực vật lý. location_id phải khớp với segment thứ 2
                  trong MQTT topic mà ESP32 publish/subscribe:
                  smarthome/{location_id}/sensors/{sensor_type}
                  smarthome/cmd/{location_id}/{actuator}

  • ESP32_DEVICES — chip vật lý. device_id dùng cho status/heartbeat:
                  smarthome/status/{device_id}
                  smarthome/heartbeat/{device_id}

⚠️  sensors[] và actuators{} phải khớp CHÍNH XÁC với firmware.
    Không khai báo sensor/actuator nếu hardware không kết nối.
"""


# ============================================================
# LOCATIONS — Khu vực trong nhà
# ============================================================
#
# Mapping với firmware:
#
#  "bedroom"  ←→  esp1-bedroom
#     Module 2: Rèm cửa thông minh  (LDR GPIO34 + Servo GPIO13)
#     Module 3: Đèn chiếu sáng      (Relay GPIO26 + GPIO27)
#
#  "rooftop"  ←→  esp2-rooftop
#     Module 1: Tưới ban công tự động  (Soil GPIO34 + Relay GPIO26)
#     Module 4: Cửa sổ trời            (DHT22 GPIO4 + Rain GPIO35 + Servo GPIO13)
#
# ============================================================

LOCATIONS = {

    # ─────────────────────────────────────────────────────────
    # PHÒNG NGỦ  —  ESP32: esp32-bedroom
    # ─────────────────────────────────────────────────────────
    "bedroom": {
        "name": "Phòng Ngủ",
        "floor": "Tầng 1",

        # Firmware publish (smarthome/bedroom/sensors/...)
        #   light       → độ sáng LDR (%, int 0-100)         [Module 2]
        #   curtain     → vị trí rèm hiện tại (%, int 0-100) [Module 2]
        #   light1_state → trạng thái đèn zone 1 ("0"/"1")   [Module 3]
        #   light2_state → trạng thái đèn zone 2 ("0"/"1")   [Module 3]
        "sensors": ["light", "curtain", "light1_state", "light2_state"],

        # Firmware subscribe (smarthome/cmd/bedroom/...)
        #   light1  → {"state": true/false}   — relay đèn zone 1 [Module 3]
        #   light2  → {"state": true/false}   — relay đèn zone 2 [Module 3]
        #   curtain → {"position": 0–100}     — servo rèm        [Module 2]
        #
        # ⚠️  curtain dùng payload {"position": N}, KHÔNG phải {"state": bool}.
        #     Chỉ điều khiển qua API /devices/bedroom/curtain với field "position".
        #     Không dùng turn_on/turn_off cho curtain.
        "actuators": {
            "light1":  "Đèn zone 1 (Relay GPIO26)",
            "light2":  "Đèn zone 2 (Relay GPIO27)",
            "curtain": "Rèm cửa (Servo GPIO13) — payload: {position: 0-100}",
        },
    },

    # ─────────────────────────────────────────────────────────
    # SÂN THƯỢNG  —  ESP32: esp32-rooftop
    # ─────────────────────────────────────────────────────────
    "rooftop": {
        "name": "Sân Thượng",
        "floor": "Sân Thượng",

        # Firmware publish (smarthome/rooftop/sensors/...)
        #   soil_moisture → độ ẩm đất (%, int 0-100)            [Module 1]
        #   pump_state    → trạng thái bơm ("0"/"1")             [Module 1]
        #   temperature   → nhiệt độ không khí (°C, float)       [Module 4]
        #   rain          → có mưa không ("0"/"1")               [Module 4]
        #   skylight      → trạng thái cửa sổ trời ("open"/"closed") [Module 4]
        "sensors": ["soil_moisture", "pump_state", "temperature", "rain", "skylight"],

        # Firmware subscribe (smarthome/cmd/rooftop/...)
        #   pump     → {"state": true/false}  — relay bơm nước   [Module 1]
        #   skylight → {"state": true/false}  — servo cửa sổ trời [Module 4]
        "actuators": {
            "pump":     "Máy bơm tưới (Relay GPIO26)",
            "skylight": "Cửa sổ trời (Servo GPIO13)",
        },
    },

    # THÊM KHU VỰC MỚI Ở ĐÂY (location_id phải khớp MQTT topic của firmware):
    # "room-id": {
    #     "name": "Tên khu vực",
    #     "floor": "Tầng Trệt",   # Tầng Trệt | Tầng 1 | Sân Thượng
    #     "sensors":   ["temperature", ...],
    #     "actuators": {"light": "Đèn"},
    # },
}


# ============================================================
# ESP32_DEVICES — Chip vật lý
# ============================================================

ESP32_DEVICES = {

    "esp32-bedroom": {
        "name": "ESP32 Phòng Ngủ",
        # Module 2 (Rèm) + Module 3 (Đèn)
        "locations": ["bedroom"],
    },

    "esp32-rooftop": {
        "name": "ESP32 Sân Thượng",
        # Module 1 (Tưới) + Module 4 (Cửa trời)
        "locations": ["rooftop"],
    },

    # THÊM CHIP MỚI Ở ĐÂY:
    # "esp32-xxxx": {
    #     "name": "Tên chip",
    #     "locations": ["room-id"],
    # },
}


# ============================================================
# HÀM TIỆN ÍCH (dùng trong StateStore, API, Rules)
# ============================================================

def get_locations_by_floor(floor: str) -> dict:
    """Lấy tất cả locations thuộc 1 tầng"""
    return {
        loc_id: loc
        for loc_id, loc in LOCATIONS.items()
        if loc["floor"] == floor
    }


def get_device_for_location(location_id: str) -> str | None:
    """Tìm device_id (chip ESP32) quản lý 1 location"""
    for device_id, device in ESP32_DEVICES.items():
        if location_id in device["locations"]:
            return device_id
    return None


def print_summary():
    print("\n" + "=" * 65)
    print("  DANH SÁCH THIẾT BỊ SMART HOME")
    print("=" * 65)
    for device_id, device in ESP32_DEVICES.items():
        print(f"\n  Chip: {device['name']}  [{device_id}]")
        for loc_id in device["locations"]:
            loc = LOCATIONS[loc_id]
            sensors   = ", ".join(loc["sensors"]) if loc["sensors"] else "(không có)"
            actuators = ", ".join(loc["actuators"].keys())
            print(f"    📍 {loc['name']} [{loc_id}] — {loc['floor']}")
            print(f"       Sensors  : {sensors}")
            print(f"       Actuators: {actuators}")
    print(f"\n  Tổng: {len(ESP32_DEVICES)} chip · {len(LOCATIONS)} khu vực")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    print_summary()
