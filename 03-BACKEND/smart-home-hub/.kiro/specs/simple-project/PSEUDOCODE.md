# Pseudocode - Simple Project Implementation

## 1. State Store Core Implementation

### StateStore Class

```python
class StateStore:
    """Thread-safe in-memory state storage"""
    
    FUNCTION __init__():
        self._state = {
            "devices": {}
        }
        self._lock = threading.Lock()
        self._access_times = []
        LOG "State Store initialized"
    
    FUNCTION update_sensor(device_id, sensor_type, value, unit):
        """Update sensor reading with thread safety"""
        start_time = current_time()
        
        ACQUIRE self._lock:
            IF device_id NOT IN self._state["devices"]:
                self._state["devices"][device_id] = {
                    "sensors": {},
                    "actuators": {}
                }
            
            self._state["devices"][device_id]["sensors"][sensor_type] = {
                "value": value,
                "timestamp": current_timestamp(),
                "unit": unit
            }
        
        duration = current_time() - start_time
        self._access_times.append(duration)
        
        IF duration > 5ms:
            LOG WARNING "Slow lock: {duration}ms"
    
    FUNCTION get_sensor(device_id, sensor_type):
        """Get specific sensor value"""
        ACQUIRE self._lock:
            IF device_id IN self._state["devices"]:
                IF sensor_type IN self._state["devices"][device_id]["sensors"]:
                    RETURN self._state["devices"][device_id]["sensors"][sensor_type]
        
        RETURN None
    
    FUNCTION get_all_state():
        """Get complete state snapshot"""
        ACQUIRE self._lock:
            RETURN deep_copy(self._state)
```

