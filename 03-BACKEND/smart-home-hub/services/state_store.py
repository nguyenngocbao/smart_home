"""
State Store Module

In-memory thread-safe storage for sensor and actuator states.
Replaces database for lightweight, high-performance state management.
"""

import threading
import logging
from datetime import datetime
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class StateStore:
    """
    Thread-safe in-memory storage for device states
    
    Data Structure:
    {
        "locations": {
            "location_id": {
                "sensors": {
                    "sensor_type": {
                        "value": float,
                        "timestamp": str (ISO format),
                        "unit": str
                    }
                },
                "actuators": {
                    "actuator_type": {
                        "state": bool,
                        "value": str,
                        "timestamp": str (ISO format),
                        "updated_by": str
                    }
                }
            }
        }
    }
    """
    
    def __init__(self):
        """Initialize empty state store with thread lock"""
        self._state = {"locations": {}}
        self._lock = threading.Lock()
        self._access_times = []  # For performance monitoring
        self._listeners = []     # Observer callbacks for cloud sync
        logger.info("StateStore initialized with empty state")

    def add_change_listener(self, callback):
        """Register a callback invoked on every sensor/actuator update.

        callback(location_id, data_type, key, value)
          data_type: "sensor" | "actuator"
        """
        self._listeners.append(callback)

    def _notify(self, location_id, data_type, key, value):
        for cb in self._listeners:
            try:
                cb(location_id, data_type, key, value)
            except Exception as e:
                logger.error(f"Change listener error: {e}")
    
    @contextmanager
    def _timed_lock(self):
        """
        Context manager for lock acquisition with timing
        
        Logs warning if lock is held for more than 5ms
        """
        start = datetime.now()
        self._lock.acquire()
        try:
            yield
        finally:
            duration = (datetime.now() - start).total_seconds() * 1000
            self._access_times.append(duration)
            if duration > 5:
                logger.warning(f"Lock held for {duration:.2f}ms")
            self._lock.release()

    def update_sensor(self, location_id: str, sensor_type: str, 
                     value: float, unit: str) -> None:
        """
        Update sensor reading (thread-safe)
        
        Args:
            location_id: Location identifier (e.g., "living-room", "bedroom-1")
            sensor_type: Type of sensor (e.g., "temperature", "humidity")
            value: Sensor value
            unit: Unit of measurement (e.g., "°C", "%")
        """
        with self._timed_lock():
            if location_id not in self._state["locations"]:
                self._state["locations"][location_id] = {
                    "sensors": {},
                    "actuators": {}
                }
            
            self._state["locations"][location_id]["sensors"][sensor_type] = {
                "value": value,
                "timestamp": datetime.utcnow().isoformat(),
                "unit": unit
            }
            
            logger.debug(f"Updated sensor: {location_id}/{sensor_type} = {value} {unit}")
        self._notify(location_id, "sensor", sensor_type, value)
    
    def update_actuator(self, location_id: str, actuator_type: str,
                       state: bool, value: str, updated_by: str) -> None:
        """
        Update actuator state (thread-safe)
        
        Args:
            location_id: Location identifier
            actuator_type: Type of actuator (e.g., "light", "fan")
            state: Boolean state (True=on, False=off)
            value: String representation of state
            updated_by: Source of update (e.g., "api", "rule", "mqtt_service")
        """
        with self._timed_lock():
            if location_id not in self._state["locations"]:
                self._state["locations"][location_id] = {
                    "sensors": {},
                    "actuators": {}
                }
            
            self._state["locations"][location_id]["actuators"][actuator_type] = {
                "state": state,
                "value": value,
                "timestamp": datetime.utcnow().isoformat(),
                "updated_by": updated_by
            }
            
            logger.debug(f"Updated actuator: {location_id}/{actuator_type} = {state} (by {updated_by})")
        self._notify(location_id, "actuator", actuator_type, state)
    
    def get_sensor(self, location_id: str, sensor_type: str) -> dict:
        """
        Get specific sensor value
        
        Args:
            location_id: Location identifier
            sensor_type: Type of sensor
        
        Returns:
            Dictionary with sensor data or None if not found
        """
        with self._timed_lock():
            location = self._state["locations"].get(location_id)
            if not location:
                return None
            
            return location.get("sensors", {}).get(sensor_type)
    
    def get_actuator(self, location_id: str, actuator_type: str) -> dict:
        """
        Get specific actuator state
        
        Args:
            location_id: Location identifier
            actuator_type: Type of actuator
        
        Returns:
            Dictionary with actuator data or None if not found
        """
        with self._timed_lock():
            location = self._state["locations"].get(location_id)
            if not location:
                return None
            
            return location.get("actuators", {}).get(actuator_type)
    
    def get_all_sensors(self, location_id: str) -> dict:
        """
        Get all sensors for a location
        
        Args:
            location_id: Location identifier
        
        Returns:
            Dictionary of all sensors or empty dict if location not found
        """
        with self._timed_lock():
            location = self._state["locations"].get(location_id)
            if not location:
                return {}
            
            return location.get("sensors", {})
    
    def get_all_actuators(self, location_id: str) -> dict:
        """
        Get all actuators for a location
        
        Args:
            location_id: Location identifier
        
        Returns:
            Dictionary of all actuators or empty dict if location not found
        """
        with self._timed_lock():
            location = self._state["locations"].get(location_id)
            if not location:
                return {}
            
            return location.get("actuators", {})
    
    def get_location_state(self, location_id: str) -> dict:
        """
        Get complete state of a location
        
        Args:
            location_id: Location identifier
        
        Returns:
            Dictionary with sensors and actuators or None if not found
        """
        with self._timed_lock():
            location = self._state["locations"].get(location_id)
            if not location:
                return None
            
            return {
                "sensors": location.get("sensors", {}),
                "actuators": location.get("actuators", {})
            }
    
    def get_all_state(self) -> dict:
        """
        Get complete state of all locations
        
        Returns:
            Dictionary with all locations and their states
        """
        with self._timed_lock():
            # Return a deep copy to prevent external modifications
            import copy
            return copy.deepcopy(self._state)
    
    def get_locations_by_floor(self, floor: str) -> list:
        """
        Get all location_ids on a specific floor

        Args:
            floor: Floor name (e.g., "Tầng Trệt", "Tầng 1", "Sân Thượng", "Ngoài Trời")

        Returns:
            List of location_ids on that floor
        """
        try:
            from MY_DEVICES import LOCATIONS
        except ImportError:
            logger.warning("MY_DEVICES.py not found, cannot filter by floor")
            return []

        with self._timed_lock():
            return [
                location_id
                for location_id, location_data in LOCATIONS.items()
                if location_data.get("floor") == floor
            ]
    
    def get_avg_access_time(self) -> float:
        """
        Get average State Store access time in milliseconds
        
        Returns:
            Average access time or 0.0 if no operations recorded
        """
        with self._timed_lock():
            if not self._access_times:
                return 0.0
            
            return sum(self._access_times) / len(self._access_times)
    
    def save_to_file(self, filepath: str) -> None:
        """
        Save state to JSON file (optional persistence)
        
        Args:
            filepath: Path to save file
        """
        import json
        
        with self._timed_lock():
            try:
                data = {
                    "schema_version": "1.0",
                    "saved_at": datetime.utcnow().isoformat(),
                    "locations": self._state["locations"]
                }
                
                with open(filepath, 'w') as f:
                    json.dump(data, f, indent=2)
                
                logger.info(f"State saved to {filepath}")
            
            except Exception as e:
                logger.error(f"Failed to save state to {filepath}: {e}")
    
    def load_from_file(self, filepath: str) -> None:
        """
        Load state from JSON file (optional persistence)
        
        Args:
            filepath: Path to load file
        """
        import json
        import os
        
        if not os.path.exists(filepath):
            logger.info(f"State file {filepath} does not exist, starting with empty state")
            return
        
        with self._timed_lock():
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                
                # Validate schema version
                schema_version = data.get("schema_version")
                if schema_version != "1.0":
                    logger.warning(f"Unknown schema version: {schema_version}, loading anyway")
                
                # Load locations
                self._state["locations"] = data.get("locations", {})
                
                logger.info(f"State loaded from {filepath} (saved at {data.get('saved_at')})")
            
            except json.JSONDecodeError as e:
                logger.error(f"Corrupted state file {filepath}: {e}, starting with empty state")
                self._state = {"locations": {}}
            
            except Exception as e:
                logger.error(f"Failed to load state from {filepath}: {e}, starting with empty state")
                self._state = {"locations": {}}
