"""
API Routes - REST API endpoints for State Store access

Provides endpoints for:
- Getting complete state of all locations
- Getting state of specific location
- Getting state of all locations on a floor
- Controlling actuators
- Performance metrics
- Health check
"""

import logging
from flask import Blueprint, jsonify, request
from datetime import datetime

logger = logging.getLogger("api")

# Blueprint
api_bp = Blueprint("api", __name__, url_prefix="/api")

# Global references (will be set in main.py)
state_store = None
mqtt_service = None


def init_api(state_store_instance, mqtt_service_instance):
    """Initialize API with state_store and mqtt_service references"""
    global state_store, mqtt_service
    state_store = state_store_instance
    mqtt_service = mqtt_service_instance
    logger.info("✅ API initialized with state_store and mqtt_service")


@api_bp.route("/state", methods=["GET"])
def get_all_state():
    """
    GET /api/state
    Returns complete state of all locations
    
    Response:
    {
        "locations": {
            "living-room": {
                "sensors": {
                    "temperature": {"value": 28.5, "timestamp": "...", "unit": "°C"},
                    "humidity": {"value": 65, "timestamp": "...", "unit": "%"}
                },
                "actuators": {
                    "light": {"state": true, "value": "on", "timestamp": "...", "updated_by": "api"}
                }
            }
        },
        "timestamp": "2024-01-15T10:30:00Z"
    }
    """
    try:
        state = state_store.get_all_state()
        return jsonify({
            "locations": state["locations"],
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting state: {e}")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/state/<location_id>", methods=["GET"])
def get_location_state(location_id):
    """
    GET /api/state/{location_id}
    Returns state of specific location
    
    Response:
    {
        "sensors": {...},
        "actuators": {...},
        "timestamp": "2024-01-15T10:30:00Z"
    }
    """
    try:
        state = state_store.get_location_state(location_id)
        
        if not state:
            return jsonify({"error": "Location not found"}), 404
        
        return jsonify({
            "sensors": state.get("sensors", {}),
            "actuators": state.get("actuators", {}),
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting location state: {e}")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/state/floor/<floor>", methods=["GET"])
def get_floor_state(floor):
    """
    GET /api/state/floor/{floor}
    Returns state of all locations on a specific floor
    
    Response:
    {
        "floor": "Tầng Trệt",
        "locations": {
            "living-room": {
                "sensors": {...},
                "actuators": {...}
            },
            "kitchen": {
                "sensors": {...},
                "actuators": {...}
            }
        },
        "timestamp": "2024-01-15T10:30:00Z"
    }
    """
    try:
        location_ids = state_store.get_locations_by_floor(floor)
        
        if not location_ids:
            return jsonify({"error": f"No locations found on floor '{floor}'"}), 404
        
        locations_state = {}
        for location_id in location_ids:
            state = state_store.get_location_state(location_id)
            if state:
                locations_state[location_id] = state
        
        return jsonify({
            "floor": floor,
            "locations": locations_state,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting floor state: {e}")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/control/<location_id>/<actuator>", methods=["POST"])
def control_actuator(location_id, actuator):
    """
    POST /api/control/{location_id}/{actuator}
    Control an actuator
    
    Request Body:
    {
        "state": true,
        "value": "on"
    }
    
    Response:
    {
        "ok": true,
        "location_id": "living-room",
        "actuator": "light",
        "state": true
    }
    """
    try:
        body = request.get_json()
        if not body or "state" not in body:
            return jsonify({"error": "Missing 'state' in request body"}), 400
        
        state = bool(body["state"])

        # Send MQTT command (also updates State Store internally)
        if not mqtt_service or not mqtt_service.connected:
            return jsonify({"error": "MQTT not connected"}), 503
        
        success = mqtt_service.send_command(location_id, actuator, state)
        
        if not success:
            return jsonify({"error": "Failed to send MQTT command"}), 500
        
        return jsonify({
            "ok": True,
            "location_id": location_id,
            "actuator": actuator,
            "state": state
        })
    
    except Exception as e:
        logger.error(f"Error controlling actuator: {e}")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/metrics", methods=["GET"])
def get_metrics():
    """
    GET /api/metrics
    Returns performance metrics
    
    Response:
    {
        "state_store": {
            "avg_read_time_ms": 0.5,
            "num_locations": 10,
            "num_sensors": 45,
            "num_actuators": 30
        },
        "api": {
            "avg_response_time_ms": 2.3
        }
    }
    """
    try:
        state = state_store.get_all_state()
        locations = state.get("locations", {})
        
        num_sensors = sum(
            len(d.get("sensors", {})) 
            for d in locations.values()
        )
        num_actuators = sum(
            len(d.get("actuators", {})) 
            for d in locations.values()
        )
        
        return jsonify({
            "state_store": {
                "avg_read_time_ms": state_store.get_avg_access_time(),
                "num_locations": len(locations),
                "num_sensors": num_sensors,
                "num_actuators": num_actuators
            },
            "api": {
                "avg_response_time_ms": 2.0  # TODO: Implement tracking
            }
        })
    
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/devices", methods=["GET"])
def get_devices():
    """GET /api/devices — danh sách locations + ESP32 từ MY_DEVICES.py"""
    try:
        from MY_DEVICES import LOCATIONS, ESP32_DEVICES
        return jsonify({
            "locations": LOCATIONS,
            "devices": ESP32_DEVICES,
        })
    except Exception as e:
        logger.error(f"Error getting devices: {e}")
        return jsonify({"error": str(e)}), 500


@api_bp.route("/rules", methods=["GET"])
def get_rules():
    """GET /api/rules — tóm tắt sensor rules và time rules"""
    sensor_rules = [
        {"location": "bedroom", "sensor": "light",        "condition": "> 80%",           "action": "Đóng rèm (position 0)"},
        {"location": "bedroom", "sensor": "light",        "condition": "< 20%",           "action": "Mở rèm (position 100)"},
        {"location": "rooftop", "sensor": "soil_moisture","condition": "< 30% & không mưa","action": "Bật bơm"},
        {"location": "rooftop", "sensor": "soil_moisture","condition": "> 70% hoặc mưa",  "action": "Tắt bơm"},
        {"location": "rooftop", "sensor": "temperature",  "condition": "> 35°C & không mưa","action": "Mở cửa sổ trời"},
        {"location": "rooftop", "sensor": "temperature",  "condition": "< 30°C",          "action": "Đóng cửa sổ trời"},
        {"location": "rooftop", "sensor": "rain",         "condition": "== 1 (có mưa)",   "action": "Tắt bơm + Đóng cửa sổ trời"},
    ]
    time_rules = [
        {"time": "06:00", "days": "Hàng ngày", "action": "Tắt đèn phòng ngủ + Tưới cây sáng (nếu không mưa)"},
        {"time": "06:30", "days": "Hàng ngày", "action": "Tắt bơm buổi sáng"},
        {"time": "17:00", "days": "Hàng ngày", "action": "Tưới cây chiều (nếu không mưa)"},
        {"time": "17:30", "days": "Hàng ngày", "action": "Tắt bơm buổi chiều"},
        {"time": "17:30", "days": "Cuối tuần", "action": "Bật đèn phòng ngủ sớm"},
        {"time": "18:00", "days": "Hàng ngày", "action": "Bật đèn phòng ngủ"},
    ]
    return jsonify({"sensor_rules": sensor_rules, "time_rules": time_rules})


@api_bp.route("/health", methods=["GET"])
def health():
    """
    GET /api/health
    Health check endpoint
    
    Response:
    {
        "status": "ok",
        "mqtt_connected": true,
        "state_store_ok": true
    }
    """
    try:
        # Check if State Store is accessible
        state_store.get_all_state()
        state_store_ok = True
    except:
        state_store_ok = False
    
    mqtt_connected = mqtt_service and mqtt_service.connected
    
    return jsonify({
        "status": "ok" if state_store_ok and mqtt_connected else "degraded",
        "mqtt_connected": mqtt_connected,
        "state_store_ok": state_store_ok
    })
