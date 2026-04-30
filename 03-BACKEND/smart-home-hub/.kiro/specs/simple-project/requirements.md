# Requirements Document

## Introduction

Hệ thống Smart Home Hub hiện tại sử dụng SQLite database để lưu trữ sensor readings và actuator states, dẫn đến performance thấp trên server yếu (Raspberry Pi). Rules engine hiện tại chỉ có thể xử lý một sensor tại một thời điểm, không thể viết logic phức tạp cần nhiều sensors (ví dụ: đảo nhiệt giữa các phòng). WebSocket được sử dụng nhưng không cần thiết cho use case đơn giản.

Feature này cải thiện kiến trúc bằng cách:
- Thêm in-memory state store để lưu trạng thái latest của tất cả sensors/actuators
- Nâng cấp rules engine để nhận full context (tất cả sensors trong nhà)
- Loại bỏ WebSocket, chuyển sang REST API polling
- Làm database optional (có thể tắt hoàn toàn)

Mục tiêu: Hệ thống đơn giản hơn, nhẹ hơn, performance cao hơn, phù hợp server yếu.

## Glossary

- **State_Store**: In-memory data structure lưu trạng thái latest của tất cả sensors và actuators
- **Hub**: Smart Home Hub server (Flask application)
- **MQTT_Service**: Service xử lý MQTT communication với ESP32 devices
- **Rules_Engine**: Component xử lý automation rules
- **ESP32**: Microcontroller device gửi sensor data và nhận actuator commands
- **Sensor**: Thiết bị đo (temperature, humidity, light, soil_moisture, rain, etc.)
- **Actuator**: Thiết bị điều khiển (light, fan, pump, door, etc.)
- **Location_ID**: Unique identifier cho mỗi phòng/khu vực logic (living-room, bedroom-1, garden, etc.) - 1 ESP32 có thể điều khiển nhiều locations
- **Floor**: Tầng của ngôi nhà (ground, first, second, etc.) - dùng để nhóm các locations theo tầng
- **State_Store**: In-memory storage only, no persistent database
- **Dashboard**: Web interface hiển thị trạng thái và điều khiển thiết bị
- **Thread-Safe**: An toàn khi truy cập từ nhiều threads đồng thời

## Requirements

### Requirement 1: In-Memory State Store

**User Story:** As a developer, I want an in-memory state store, so that the system can access latest sensor/actuator states instantly without database queries.

#### Acceptance Criteria

1. THE State_Store SHALL store the latest value, timestamp, and unit for each sensor of each location
2. THE State_Store SHALL store the latest state, value, timestamp, and updated_by for each actuator of each location
3. THE State_Store SHALL use the structure {location_id: {sensor_type: {value, timestamp, unit}}} for sensors
4. THE State_Store SHALL use the structure {location_id: {actuator_type: {state, value, timestamp, updated_by}}} for actuators
5. THE State_Store SHALL be thread-safe for concurrent access from MQTT callbacks and API requests
6. WHEN new sensor data arrives via MQTT, THE MQTT_Service SHALL update the State_Store immediately
7. WHEN an actuator command is sent, THE MQTT_Service SHALL update the State_Store immediately
8. THE State_Store SHALL provide a method to retrieve the complete state of all locations
9. THE State_Store SHALL provide a method to retrieve the state of a specific location
10. THE State_Store SHALL provide a method to retrieve a specific sensor value from any location
11. THE State_Store SHALL provide a method to retrieve all locations on a specific floor

### Requirement 2: Enhanced Rules Engine with Full Context

**User Story:** As a user, I want rules to access all sensors in the house, so that I can write complex automation logic like thermal inversion between rooms.

#### Acceptance Criteria

1. THE Rules_Engine SHALL receive the State_Store object when processing sensor rules
2. THE Rules_Engine SHALL provide access to any sensor value from any location within rule functions
3. THE sensor_rules function signature SHALL be sensor_rules(mqtt, state_store, location_id, sensor_type, value)
4. WHEN a rule needs data from multiple sensors, THE Rules_Engine SHALL allow querying the State_Store
5. THE Rules_Engine SHALL support complex rules comparing sensors across different locations
6. THE Rules_Engine SHALL maintain backward compatibility with existing simple rules that do not use state_store
7. THE Rules_Engine SHALL log when rules access state_store for debugging purposes
8. THE Rules_Engine SHALL support floor-based control operations

### Requirement 3: Remove WebSocket Dependencies

**User Story:** As a developer, I want to remove WebSocket complexity, so that the system is simpler and lighter for weak servers.

#### Acceptance Criteria

1. THE Hub SHALL remove flask-socketio dependency from requirements.txt
2. THE Hub SHALL remove all socketio.emit() calls from the codebase
3. THE Hub SHALL remove socketio initialization from main.py and app/__init__.py
4. THE Hub SHALL remove WebSocket client code from static/js/websocket.js
5. THE Dashboard SHALL use REST API polling every 2-3 seconds instead of WebSocket
6. THE Dashboard SHALL call GET /api/state endpoint to retrieve current states
7. THE Hub SHALL remove socketio parameter from MQTT_Service initialization

### Requirement 4: No Database Dependencies

**User Story:** As a user, I want the hub to run without a database, so that the system is lightweight and simple for weak servers.

#### Acceptance Criteria

1. THE Hub SHALL NOT use SQLAlchemy or any database ORM
2. THE Hub SHALL NOT create or maintain database tables
3. THE Hub SHALL NOT save sensor readings to persistent storage
4. THE Hub SHALL NOT save actuator states to persistent storage
5. THE Hub SHALL store all state purely in-memory using State_Store
6. THE Rules_Engine SHALL function using only State_Store without database queries
7. THE Hub SHALL remove all database-related imports and dependencies
8. THE Hub SHALL remove SQLite database file creation
9. THE Hub SHALL remove database_service.py module
10. THE Hub SHALL remove all database models from app/models.py

### Requirement 5: REST API for State Access

**User Story:** As a frontend developer, I want REST API endpoints to access location states, so that the dashboard can display current status efficiently.

#### Acceptance Criteria

1. THE Hub SHALL provide GET /api/state endpoint returning complete state from State_Store
2. THE Hub SHALL provide GET /api/state/{location_id} endpoint returning state of specific location
3. THE Hub SHALL provide GET /api/state/floor/{floor} endpoint returning state of all locations on a floor
4. THE GET /api/state endpoint SHALL return JSON with structure {locations: {location_id: {sensors: {...}, actuators: {...}}}}
5. THE GET /api/state/{location_id} endpoint SHALL return JSON with structure {sensors: {...}, actuators: {...}}
6. THE GET /api/state/floor/{floor} endpoint SHALL return JSON with structure {floor: "...", locations: {...}}
7. WHEN a location_id does not exist, THE GET /api/state/{location_id} endpoint SHALL return 404 status code
8. THE Hub SHALL provide POST /api/control/{location_id}/{actuator} endpoint for actuator control
9. THE POST /api/control/{location_id}/{actuator} endpoint SHALL accept JSON body with {state: boolean, value: string}
10. WHEN actuator control succeeds, THE POST endpoint SHALL update State_Store and return 200 status code
11. THE API endpoints SHALL respond within 50ms by reading from State_Store
12. THE API endpoints SHALL include timestamp in response to indicate data freshness

### Requirement 6: Dashboard Polling Implementation

**User Story:** As a user, I want the dashboard to automatically refresh, so that I can see current location states without WebSocket.

#### Acceptance Criteria

1. THE Dashboard SHALL implement JavaScript polling function calling GET /api/state every 2 seconds
2. THE Dashboard SHALL update UI elements with new state data from polling response
3. WHEN polling request fails, THE Dashboard SHALL retry after 5 seconds
4. WHEN polling request succeeds, THE Dashboard SHALL update the last_updated timestamp display
5. THE Dashboard SHALL highlight locations with stale data (timestamp older than 60 seconds)
6. THE Dashboard SHALL stop polling when user navigates away from the page
7. THE Dashboard SHALL resume polling when user returns to the page

### Requirement 7: Thread-Safe State Store Implementation

**User Story:** As a developer, I want thread-safe state storage, so that concurrent MQTT callbacks and API requests do not cause data corruption.

#### Acceptance Criteria

1. THE State_Store SHALL use threading.Lock for all read and write operations
2. WHEN multiple threads access State_Store simultaneously, THE State_Store SHALL serialize access using locks
3. THE State_Store SHALL release locks within 10ms to prevent blocking
4. THE State_Store SHALL use context managers (with statement) for lock acquisition
5. THE State_Store SHALL not deadlock under concurrent access from MQTT thread and Flask request threads
6. THE State_Store SHALL log lock acquisition time when it exceeds 5ms

### Requirement 8: Clean Rules Interface

**User Story:** As a user, I want a clean rules interface with state_store, so that I can write complex automation logic easily.

#### Acceptance Criteria

1. THE sensor_rules function signature SHALL be sensor_rules(mqtt, state_store, location_id, sensor_type, value)
2. THE time_rules function signature SHALL be time_rules(mqtt, state_store)
3. THE Rules_Engine SHALL always pass state_store to rule functions
4. THE Rules_Engine SHALL provide helper methods on state_store for common queries
5. THE state_store SHALL provide get_sensor(location_id, sensor_type) method
6. THE state_store SHALL provide get_all_sensors(location_id) method
7. THE state_store SHALL provide get_actuator(location_id, actuator_type) method
8. THE state_store SHALL provide get_locations_by_floor(floor) method
9. THE helper functions SHALL include turn_on_all_lights_on_floor(mqtt, floor, state_store)
10. THE helper functions SHALL include turn_off_all_lights_on_floor(mqtt, floor, state_store)

### Requirement 9: Simplified Configuration

**User Story:** As a developer, I want minimal configuration options, so that the system is easy to set up.

#### Acceptance Criteria

1. THE Hub SHALL add API_POLLING_INTERVAL configuration to app/config.py with default 2000ms
2. THE Hub SHALL remove all database-related configuration options
3. THE Hub SHALL document configuration options in .env.example
4. THE Hub SHALL validate configuration values at startup
5. WHEN invalid configuration is detected, THE Hub SHALL log error and use default values
6. THE Hub SHALL require only MQTT broker configuration to run

### Requirement 10: State Store Persistence (Optional)

**User Story:** As a user, I want to optionally persist state store to disk, so that device states are restored after server restart.

#### Acceptance Criteria

1. WHERE STATE_STORE_PERSISTENCE is enabled, THE State_Store SHALL save state to JSON file on shutdown
2. WHERE STATE_STORE_PERSISTENCE is enabled, THE State_Store SHALL load state from JSON file on startup
3. THE State_Store SHALL save to file data/state_store.json
4. WHEN state file does not exist on startup, THE State_Store SHALL initialize with empty state
5. WHEN state file is corrupted, THE State_Store SHALL log error and initialize with empty state
6. THE State_Store SHALL include schema version in persisted file for future compatibility

### Requirement 11: State Store Initialization

**User Story:** As a developer, I want State_Store to initialize cleanly, so that the system starts quickly without dependencies.

#### Acceptance Criteria

1. THE State_Store SHALL initialize with empty state on startup
2. THE State_Store SHALL populate state as sensor data arrives via MQTT
3. THE State_Store SHALL not require any external data source for initialization
4. THE State_Store SHALL log initialization completion
5. THE State_Store SHALL be ready to accept updates within 100ms of startup
6. THE State_Store SHALL handle first sensor reading for each location gracefully

### Requirement 12: Performance Monitoring

**User Story:** As a developer, I want performance metrics, so that I can verify State_Store improves response times.

#### Acceptance Criteria

1. THE Hub SHALL log State_Store access time for each operation
2. THE Hub SHALL log API endpoint response time
3. THE Hub SHALL provide GET /api/metrics endpoint returning performance statistics
4. THE GET /api/metrics endpoint SHALL return average State_Store read time
5. THE GET /api/metrics endpoint SHALL return average API response time
6. THE GET /api/metrics endpoint SHALL return State_Store size (number of locations, sensors, actuators)
7. WHEN State_Store access time exceeds 10ms, THE Hub SHALL log a warning

### Requirement 13: Documentation Updates

**User Story:** As a user, I want updated documentation, so that I understand how to use the new State_Store and enhanced rules.

#### Acceptance Criteria

1. THE documentation SHALL include examples of rules using state_store parameter
2. THE documentation SHALL include example of thermal inversion rule comparing two room temperatures
3. THE documentation SHALL include example of smart irrigation rule checking soil moisture, rain sensor, and time of day
4. THE documentation SHALL include example of floor-based control (turn on/off all lights on a floor)
5. THE documentation SHALL document the State_Store data structure with location_id
6. THE documentation SHALL document the new API endpoints including floor endpoint
7. THE documentation SHALL document MY_DEVICES.py structure with floor field
8. THE documentation SHALL provide migration guide from device_id to location_id terminology
9. THE documentation SHALL provide migration guide from WebSocket to polling
10. THE documentation SHALL provide performance comparison before/after State_Store implementation

### Requirement 14: Error Handling for State Store

**User Story:** As a developer, I want robust error handling, so that State_Store failures do not crash the system.

#### Acceptance Criteria

1. WHEN State_Store update fails, THE MQTT_Service SHALL log error and continue processing
2. WHEN State_Store read fails, THE API endpoint SHALL return 500 status code with error message
3. WHEN State_Store lock acquisition times out, THE system SHALL log error and retry once
4. WHEN State_Store is corrupted, THE Hub SHALL reinitialize with empty state
5. THE Hub SHALL log all State_Store errors with context for debugging
6. THE Hub SHALL emit health check failure when State_Store is unavailable

### Requirement 15: Testing Requirements

**User Story:** As a developer, I want comprehensive tests, so that I can verify State_Store correctness and thread-safety.

#### Acceptance Criteria

1. THE test suite SHALL include unit tests for State_Store thread-safety
2. THE test suite SHALL include tests for concurrent read/write operations
3. THE test suite SHALL include tests for rules using state_store parameter
4. THE test suite SHALL include integration tests for API endpoints reading from State_Store
5. THE test suite SHALL include tests for State_Store persistence (save/load)
6. THE test suite SHALL verify State_Store does not leak memory over time
7. THE test suite SHALL include performance tests measuring State_Store access time
8. THE test suite SHALL include tests for MQTT integration with State_Store
9. THE test suite SHALL include tests for complex rules using multiple sensors
10. THE test suite SHALL verify State_Store handles missing locations gracefully
11. THE test suite SHALL include tests for floor-based operations
12. THE test suite SHALL include tests for get_locations_by_floor() method

### Requirement 16: Floor-Based Control

**User Story:** As a user, I want to control devices by floor, so that I can easily manage all devices on a specific floor at once.

#### Acceptance Criteria

1. THE MY_DEVICES.py SHALL include a "floor" field for each location
2. THE floor field SHALL accept values like "ground", "first", "second", etc.
3. THE State_Store SHALL provide get_locations_by_floor(floor) method
4. THE helper functions SHALL include turn_on_all_lights_on_floor(mqtt, floor, state_store)
5. THE helper functions SHALL include turn_off_all_lights_on_floor(mqtt, floor, state_store)
6. THE API SHALL provide GET /api/state/floor/{floor} endpoint
7. WHEN floor does not exist, THE GET /api/state/floor/{floor} endpoint SHALL return 404
8. THE rules SHALL be able to control all locations on a floor using floor-based functions
9. THE floor-based functions SHALL iterate through all locations on that floor
10. THE floor-based functions SHALL log each action taken on each location
