# File Structure - Simple Project Implementation

## New Files

```
services/
  └── state_store.py          # NEW: In-memory State Store implementation

static/js/
  └── dashboard.js            # NEW: Polling implementation for dashboard
```

## Modified Files

```
services/
  └── mqtt_service.py         # MODIFIED: Integrate with State Store, remove database

simple/
  ├── rules_simple.py         # MODIFIED: Pass state_store to rules
  └── device_control.py       # MODIFIED: Remove database dependencies

routes/
  └── api.py                  # MODIFIED: Add new endpoints, remove database

app/
  ├── config.py               # MODIFIED: Add API_POLLING_INTERVAL, remove DB config
  └── models.py               # MODIFIED: Remove database models

main.py                       # MODIFIED: Initialize State Store, remove database

MY_RULES.py                   # MODIFIED: Update function signatures

requirements.txt              # MODIFIED: Remove flask-socketio, SQLAlchemy
```

## Removed Files

```
services/
  └── database_service.py     # REMOVED: No longer needed

static/js/
  └── websocket.js            # REMOVED: Replaced by polling

instance/
  └── smarthome.db            # REMOVED: No database file
```

## Complete Project Structure

```
smart-home-hub/
├── .env.example
├── .kiro/
│   └── specs/
│       └── simple-project/
│           ├── .config.kiro
│           ├── requirements.md
│           ├── design.md
│           └── FILE_STRUCTURE.md
├── app/
│   ├── __init__.py
│   ├── config.py              # Updated config
│   └── models.py              # Simplified (no DB models)
├── data/
│   └── state_store.json       # Optional persistence file
├── logs/
│   └── app.log
├── routes/
│   └── api.py                 # New REST API endpoints
├── services/
│   ├── mqtt_service.py        # Updated with State Store
│   └── state_store.py         # NEW: Core State Store
├── simple/
│   ├── device_control.py      # Updated (no DB)
│   └── rules_simple.py        # Updated with state_store
├── static/
│   ├── css/
│   │   ├── style.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── dashboard.js       # NEW: Polling implementation
│   │   ├── main.js
│   │   └── chart.js
│   └── images/
├── templates/
│   ├── base.html
│   ├── dashboard.html         # Updated (no WebSocket)
│   ├── devices.html
│   ├── automation.html
│   ├── settings.html
│   └── login.html
├── DATABASE_STATE.md
├── DEVICE_MANAGEMENT.md
├── FILES.md
├── HOW_TO_CUSTOMIZE.md
├── MY_DEVICES.py
├── MY_RULES.py                # Updated function signatures
├── README.md
├── SIMPLE_ARCHITECTURE.md
├── START_HERE.md
├── SUMMARY.md
├── main.py                    # Updated initialization
└── requirements.txt           # Updated dependencies
```

## File Sizes (Estimated)

| File | Lines of Code | Description |
|------|--------------|-------------|
| services/state_store.py | ~300 | State Store implementation |
| services/mqtt_service.py | ~200 | Updated MQTT service |
| routes/api.py | ~250 | REST API endpoints |
| static/js/dashboard.js | ~200 | Polling implementation |
| simple/rules_simple.py | ~150 | Updated rules engine |
| simple/device_control.py | ~250 | Device control functions |

**Total New/Modified Code**: ~1,350 lines

## Dependencies Changes

### Removed Dependencies
```
flask-socketio
python-socketio
SQLAlchemy
```

### Kept Dependencies
```
Flask
paho-mqtt
python-dotenv
```

### New Dependencies (Testing)
```
pytest
hypothesis
pytest-cov
pytest-timeout
```

## Configuration Files

### .env.example
```bash
# MQTT Configuration
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USER=smarthome
MQTT_PASSWORD=your_password
MQTT_KEEPALIVE=60

# API Configuration
API_POLLING_INTERVAL=2000

# State Store Configuration (Optional)
STATE_STORE_PERSISTENCE=false
STATE_STORE_FILE=data/state_store.json

# Logging
LOG_LEVEL=INFO
```

### app/config.py
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MQTT Settings
    MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
    MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
    MQTT_USER = os.getenv("MQTT_USER", "smarthome")
    MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")
    MQTT_KEEPALIVE = int(os.getenv("MQTT_KEEPALIVE", 60))
    
    # API Settings
    API_POLLING_INTERVAL = int(os.getenv("API_POLLING_INTERVAL", 2000))
    
    # State Store Settings
    STATE_STORE_PERSISTENCE = os.getenv("STATE_STORE_PERSISTENCE", "false").lower() == "true"
    STATE_STORE_FILE = os.getenv("STATE_STORE_FILE", "data/state_store.json")
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
```

## Data Files

### data/state_store.json (Optional Persistence)
```json
{
    "schema_version": "1.0",
    "saved_at": "2024-01-15T10:30:00.123456",
    "devices": {
        "living-room": {
            "sensors": {
                "temperature": {
                    "value": 28.5,
                    "timestamp": "2024-01-15T10:30:00.123456",
                    "unit": "°C"
                }
            },
            "actuators": {
                "light": {
                    "state": true,
                    "value": "on",
                    "timestamp": "2024-01-15T10:25:00.123456",
                    "updated_by": "api"
                }
            }
        }
    }
}
```

## Testing Files

```
tests/
├── __init__.py
├── conftest.py                # Pytest fixtures
├── test_state_store.py        # State Store unit tests
├── test_state_store_properties.py  # Property-based tests
├── test_mqtt_integration.py   # MQTT integration tests
├── test_api_endpoints.py      # API tests
├── test_rules_engine.py       # Rules tests
└── test_performance.py        # Performance tests
```

## Documentation Files

```
docs/
├── API.md                     # API documentation
├── RULES.md                   # Rules writing guide
├── MIGRATION.md               # Migration guide
├── PERFORMANCE.md             # Performance benchmarks
└── TROUBLESHOOTING.md         # Common issues
```

