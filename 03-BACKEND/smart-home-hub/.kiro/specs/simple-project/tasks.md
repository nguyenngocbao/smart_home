# Implementation Plan: Simple Project - State Store Architecture

## Overview

Cải thiện kiến trúc Smart Home Hub bằng cách thay thế database-centric approach bằng in-memory State Store. Hệ thống sẽ nhẹ hơn, nhanh hơn, phù hợp với server yếu (Raspberry Pi) và hỗ trợ rules engine với logic phức tạp.

Key changes:
- In-memory State Store thay thế SQLite database
- Enhanced Rules Engine với full context access
- REST API polling thay thế WebSocket
- Location-based architecture với floor support
- Thread-safe operations

## Tasks

### Phase 1: Core State Store Implementation

- [ ] 1. Create State Store module with thread-safe operations
  - [x] 1.1 Create services/state_store.py with StateStore class
    - Implement __init__ with empty state and threading.Lock
    - Implement data structure: {locations: {location_id: {sensors: {...}, actuators: {...}}}}
    - Add _timed_lock() context manager for lock timing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.4_
  
  - [ ]* 1.2 Write property test for State Store sensor data structure
    - **Property 1: State Store preserves sensor data structure**
    - **Validates: Requirements 1.1, 1.3**
    - Test round-trip: update_sensor() then get_sensor() returns same data
    - Use hypothesis with random location_id, sensor_type, value, unit
  
  - [ ]* 1.3 Write property test for State Store actuator data structure
    - **Property 2: State Store preserves actuator data structure**
    - **Validates: Requirements 1.2, 1.4**
    - Test round-trip: update_actuator() then get_actuator() returns same data
    - Use hypothesis with random location_id, actuator_type, state, value, updated_by

- [ ] 2. Implement State Store CRUD methods
  - [x] 2.1 Implement sensor methods
    - Implement update_sensor(location_id, sensor_type, value, unit)
    - Implement get_sensor(location_id, sensor_type)
    - Implement get_all_sensors(location_id)
    - Add timestamp to sensor data using datetime.utcnow().isoformat()
    - _Requirements: 1.1, 1.3, 1.9, 1.10, 8.5, 8.6_
  
  - [x] 2.2 Implement actuator methods
    - Implement update_actuator(location_id, actuator_type, state, value, updated_by)
    - Implement get_actuator(location_id, actuator_type)
    - Implement get_all_actuators(location_id)
    - Add timestamp to actuator data
    - _Requirements: 1.2, 1.4, 1.9, 1.10, 8.7_
  
  - [x] 2.3 Implement location and floor methods
    - Implement get_location_state(location_id)
    - Implement get_all_state()
    - Implement get_locations_by_floor(floor) using MY_DEVICES.LOCATIONS
    - _Requirements: 1.8, 1.9, 1.11, 8.8, 16.3_
  
  - [ ]* 2.4 Write property test for State Store retrieval methods
    - **Property 6: State Store retrieval methods return complete data**
    - **Validates: Requirements 1.8, 1.9, 1.10**
    - Test get_all_state() includes all locations
    - Test get_location_state() includes all sensors and actuators
    - Test get_sensor() returns specific sensor data

- [ ] 3. Implement thread-safety and performance monitoring
  - [~] 3.1 Add lock timing and performance tracking
    - Track lock acquisition time in _timed_lock()
    - Log warning when lock held > 5ms
    - Implement get_avg_access_time() method
    - Store access times in _access_times list
    - _Requirements: 7.3, 7.6, 12.1, 12.4_
  
  - [ ]* 3.2 Write property test for thread-safety
    - **Property 3: Concurrent State Store access preserves data integrity**
    - **Validates: Requirements 1.5, 7.2, 7.5**
    - Use hypothesis to generate concurrent operations
    - Spawn multiple threads performing updates and reads
    - Verify no data corruption and no errors
    - Verify final state is consistent
  
  - [ ]* 3.3 Write property test for lock performance
    - **Property 14: State Store lock operations complete quickly**
    - **Validates: Requirements 7.3**
    - Test that lock is held for < 10ms
    - Use _timed_lock() and check _access_times
  
  - [ ]* 3.4 Write unit tests for State Store edge cases
    - Test empty State Store returns empty locations dict
    - Test first sensor reading for new location creates location entry
    - Test get_sensor() for non-existent location returns None
    - Test get_locations_by_floor() for non-existent floor returns empty list
    - _Requirements: 11.1, 11.6, 15.10_

- [x] 4. Checkpoint - Verify State Store implementation
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: MQTT Integration with State Store

- [ ] 5. Update MQTT Service to use State Store
  - [x] 5.1 Modify MQTTService initialization
    - Add state_store parameter to __init__()
    - Add state_store parameter to init_app()
    - Pass state_store to SimpleRuleEngine initialization
    - Remove database_service references
    - _Requirements: 1.6, 1.7, 4.7, 4.9_
  
  - [x] 5.2 Update sensor data processing
    - Modify _save_sensor_reading() to call state_store.update_sensor()
    - Remove database save operations
    - Keep sensor value parsing logic (temperature, humidity, light, etc.)
    - _Requirements: 1.6, 4.3, 4.7_
  
  - [x] 5.3 Update actuator command processing
    - Modify send_command() to call state_store.update_actuator()
    - Remove database save operations
    - Keep MQTT publish logic
    - _Requirements: 1.7, 4.4, 4.7_
  
  - [ ]* 5.4 Write property test for MQTT sensor updates
    - **Property 4: MQTT sensor updates immediately reflect in State Store**
    - **Validates: Requirements 1.6**
    - Simulate MQTT message processing
    - Verify state_store.get_sensor() returns new value
  
  - [ ]* 5.5 Write property test for MQTT actuator commands
    - **Property 5: MQTT actuator commands immediately reflect in State Store**
    - **Validates: Requirements 1.7**
    - Simulate actuator command
    - Verify state_store.get_actuator() returns new state
  
  - [ ]* 5.6 Write unit tests for MQTT integration
    - Test MQTT message triggers State Store update
    - Test invalid sensor value is handled gracefully
    - Test MQTT disconnection is handled gracefully
    - _Requirements: 14.1, 15.8_

- [x] 6. Checkpoint - Verify MQTT integration
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Enhanced Rules Engine

- [ ] 7. Update Rules Engine to use State Store
  - [x] 7.1 Modify SimpleRuleEngine initialization
    - Add state_store parameter to __init__()
    - Store state_store as instance variable
    - _Requirements: 2.1, 8.3_
  
  - [x] 7.2 Update check_sensor_rules method
    - Pass state_store to sensor_rules() function
    - Update function signature: sensor_rules(mqtt, state_store, location_id, sensor_type, value)
    - Log when rules access state_store
    - _Requirements: 2.1, 2.3, 2.7, 8.1_
  
  - [x] 7.3 Update check_time_rules method
    - Pass state_store to time_rules() function
    - Update function signature: time_rules(mqtt, state_store)
    - _Requirements: 8.2_
  
  - [ ]* 7.4 Write property test for Rules Engine context
    - **Property 7: Rules Engine receives state_store context**
    - **Validates: Requirements 2.1, 2.3, 8.3**
    - Verify sensor_rules is called with state_store parameter
    - Verify state_store contains current system state
  
  - [ ]* 7.5 Write property test for cross-location queries
    - **Property 8: Rules can query any sensor from state_store**
    - **Validates: Requirements 2.2, 2.4**
    - Test calling state_store.get_sensor() for any valid location
    - Verify no errors occur
  
  - [ ]* 7.6 Write unit tests for Rules Engine
    - Test rules with state_store parameter work correctly
    - Test backward compatibility with rules not using state_store
    - Test rule execution failure is logged and continues
    - _Requirements: 2.6, 14.1, 15.3, 15.9_

- [ ] 8. Update MY_RULES.py with example complex rules
  - [x] 8.1 Update sensor_rules function signature
    - Change signature to: sensor_rules(mqtt, state_store, location_id, sensor_type, value)
    - Add docstring explaining state_store parameter
    - _Requirements: 2.3, 8.1_
  
  - [x] 8.2 Add thermal inversion example rule
    - Check temperature difference between bedroom-1 and living-room
    - Turn on fan if difference > 5°C
    - Use state_store.get_sensor() to query other room temperature
    - _Requirements: 2.2, 2.4, 2.5, 13.2_
  
  - [x] 8.3 Add smart irrigation example rule
    - Check soil_moisture, rain sensor, and time of day
    - Turn on pump only if: soil dry + not raining + daytime
    - Use state_store.get_sensor() for multiple sensors
    - _Requirements: 2.2, 2.4, 2.5, 13.3_
  
  - [x] 8.4 Update time_rules function signature
    - Change signature to: time_rules(mqtt, state_store)
    - Add example evening lights rule checking outdoor light level
    - _Requirements: 8.2, 13.2_

- [ ] 9. Update device control helper functions
  - [x] 9.1 Update helper function signatures
    - Add state_store parameter to turn_on(), turn_off()
    - Add state_store parameter to turn_on_all_lights(), turn_off_all_lights()
    - Update all function calls in MY_RULES.py
    - _Requirements: 8.1, 8.2_
  
  - [x] 9.2 Implement floor-based control functions
    - Implement turn_on_all_lights_on_floor(mqtt, floor, state_store)
    - Implement turn_off_all_lights_on_floor(mqtt, floor, state_store)
    - Use get_locations_by_floor() to get locations on floor
    - Iterate through locations and control lights
    - Log each action taken
    - _Requirements: 8.9, 8.10, 16.4, 16.5, 16.8, 16.9, 16.10_
  
  - [x] 9.3 Add example floor-based rule
    - Add rule to turn on all lights on floor when dark
    - Use state_store to get floor from location
    - Call turn_on_all_lights_on_floor()
    - _Requirements: 13.4, 16.8_
  
  - [ ]* 9.4 Write unit tests for helper functions
    - Test turn_on_all_lights_on_floor() controls all lights on floor
    - Test turn_off_all_lights_on_floor() controls all lights on floor
    - Test floor-based functions log each action
    - _Requirements: 15.11, 16.10_

- [x] 10. Checkpoint - Verify Rules Engine enhancement
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: REST API Endpoints

- [ ] 11. Create new API endpoints for state access
  - [x] 11.1 Create routes/api.py with Blueprint
    - Create api_bp Blueprint
    - Import state_store and mqtt_service
    - _Requirements: 5.1_
  
  - [x] 11.2 Implement GET /api/state endpoint
    - Call state_store.get_all_state()
    - Return JSON: {locations: {...}, timestamp: ...}
    - Handle errors and return 500 on failure
    - _Requirements: 5.1, 5.3, 5.11, 5.12_
  
  - [x] 11.3 Implement GET /api/state/{location_id} endpoint
    - Call state_store.get_location_state(location_id)
    - Return JSON: {sensors: {...}, actuators: {...}, timestamp: ...}
    - Return 404 if location not found
    - _Requirements: 5.2, 5.4, 5.7, 5.12_
  
  - [x] 11.4 Implement GET /api/state/floor/{floor} endpoint
    - Call state_store.get_locations_by_floor(floor)
    - Get state for each location on floor
    - Return JSON: {floor: "...", locations: {...}, timestamp: ...}
    - Return 404 if no locations found on floor
    - _Requirements: 5.3, 5.6, 16.6, 16.7_
  
  - [ ]* 11.5 Write property test for API JSON structure
    - **Property 9: API endpoints return correct JSON structure**
    - **Validates: Requirements 5.3, 5.4**
    - Test GET /api/state returns correct structure
    - Test GET /api/state/{location_id} returns correct structure
  
  - [ ]* 11.6 Write property test for API timestamps
    - **Property 11: API responses include fresh timestamps**
    - **Validates: Requirements 5.10**
    - Test all API responses include timestamp field
    - Verify timestamp is recent (within last second)
  
  - [ ]* 11.7 Write unit tests for API endpoints
    - Test GET /api/state returns all locations
    - Test GET /api/state/{location_id} returns specific location
    - Test GET /api/state/{location_id} returns 404 for non-existent location
    - Test GET /api/state/floor/{floor} returns all locations on floor
    - Test GET /api/state/floor/{floor} returns 404 for non-existent floor
    - _Requirements: 15.4, 15.12_

- [ ] 12. Implement actuator control endpoint
  - [x] 12.1 Implement POST /api/control/{location_id}/{actuator} endpoint
    - Parse JSON body: {state: boolean, value: string}
    - Call state_store.update_actuator()
    - Call mqtt_service.send_command()
    - Return JSON: {ok: true, location_id: ..., actuator: ..., state: ...}
    - Return 400 for missing state field
    - Return 503 if MQTT not connected
    - _Requirements: 5.8, 5.9, 5.10_
  
  - [ ]* 12.2 Write property test for API control
    - **Property 10: API control updates State Store and publishes MQTT**
    - **Validates: Requirements 5.7, 5.8**
    - Test POST /api/control updates state_store
    - Test POST /api/control publishes MQTT command
  
  - [ ]* 12.3 Write unit tests for control endpoint
    - Test POST /api/control with valid state succeeds
    - Test POST /api/control returns 400 for missing state
    - Test POST /api/control returns 503 when MQTT disconnected
    - _Requirements: 15.4_

- [ ] 13. Implement metrics and health endpoints
  - [x] 13.1 Implement GET /api/metrics endpoint
    - Calculate num_locations, num_sensors, num_actuators from state
    - Call state_store.get_avg_access_time()
    - Return JSON with state_store and api metrics
    - _Requirements: 12.3, 12.4, 12.5, 12.6_
  
  - [x] 13.2 Implement GET /api/health endpoint
    - Check if state_store is accessible
    - Check if mqtt_service is connected
    - Return status: "ok" or "degraded"
    - _Requirements: 14.6_
  
  - [ ]* 13.3 Write property test for performance metrics
    - **Property 20: Performance metrics track State Store operations**
    - **Validates: Requirements 12.1**
    - Test state_store records access times
    - Test get_avg_access_time() returns average
  
  - [ ]* 13.4 Write unit tests for metrics endpoint
    - Test GET /api/metrics returns correct structure
    - Test GET /api/health returns ok when services available
    - Test GET /api/health returns degraded when MQTT disconnected

- [x] 14. Checkpoint - Verify API implementation
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Dashboard Polling Implementation

- [ ] 15. Create dashboard polling JavaScript
  - [x] 15.1 Create static/js/dashboard.js with DashboardPoller class
    - Implement constructor with interval parameter (default 2000ms)
    - Implement start() method with setInterval
    - Implement stop() method with clearInterval
    - Implement poll() method calling GET /api/state
    - _Requirements: 6.1, 6.6, 6.7_
  
  - [x] 15.2 Implement UI update logic
    - Implement updateUI() method parsing locations data
    - Implement updateSensorDisplay() updating sensor elements
    - Implement updateActuatorDisplay() updating actuator elements
    - Implement updateTimestamp() showing last updated time
    - _Requirements: 6.2, 6.4_
  
  - [x] 15.3 Implement error handling and retry logic
    - Catch fetch errors in poll()
    - Stop polling and retry after 5 seconds on error
    - Log errors to console
    - _Requirements: 6.3_
  
  - [x] 15.4 Implement stale data highlighting
    - Implement checkStaleData() checking timestamp age
    - Highlight locations with data older than 60 seconds
    - Add 'stale-data' CSS class to stale elements
    - _Requirements: 6.5_
  
  - [x] 15.5 Implement controlActuator function
    - Create async function calling POST /api/control
    - Handle errors and show alert on failure
    - Trigger immediate poll after successful control
    - _Requirements: 5.8_
  
  - [ ]* 15.6 Write property test for dashboard polling
    - **Property 12: Dashboard polling updates UI with latest data**
    - **Validates: Requirements 6.2, 6.4**
    - Mock fetch API
    - Test updateUI() updates all elements
  
  - [ ]* 15.7 Write property test for stale data highlighting
    - **Property 13: Dashboard highlights stale data**
    - **Validates: Requirements 6.5**
    - Test checkStaleData() highlights old timestamps
    - Test threshold of 60 seconds

- [ ] 16. Update dashboard HTML templates
  - [x] 16.1 Update templates/dashboard.html
    - Add <script src="/static/js/dashboard.js"></script>
    - Add data-location-id attributes to location elements
    - Add id attributes for sensor and actuator elements
    - Add last-updated timestamp display element
    - _Requirements: 6.2, 6.4_
  
  - [x] 16.2 Add CSS for stale data highlighting
    - Add .stale-data class to static/css/style.css
    - Style with warning color (e.g., orange border)
    - _Requirements: 6.5_
  
  - [x] 16.3 Update actuator control buttons
    - Add onclick handlers calling controlActuator()
    - Pass location_id and actuator parameters
    - _Requirements: 5.8_

- [x] 17. Checkpoint - Verify dashboard polling
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Remove Database and WebSocket Dependencies

- [ ] 18. Remove database dependencies
  - [x] 18.1 Remove database service module
    - Delete services/database_service.py
    - _Requirements: 4.9_
  
  - [x] 18.2 Remove database models
    - Remove all database models from app/models.py
    - Keep only non-database models if any
    - _Requirements: 4.10_
  
  - [x] 18.3 Update requirements.txt
    - Remove SQLAlchemy dependency
    - Remove flask-sqlalchemy dependency
    - _Requirements: 4.1, 9.2_
  
  - [x] 18.4 Remove database initialization from main.py
    - Remove db.init_app() calls
    - Remove database imports
    - _Requirements: 4.2, 4.7, 4.8_

- [ ] 19. Remove WebSocket dependencies
  - [x] 19.1 Remove socketio from requirements.txt
    - Remove flask-socketio dependency
    - _Requirements: 3.1, 9.2_
  
  - [x] 19.2 Remove socketio from main.py and app/__init__.py
    - Remove socketio initialization
    - Remove socketio.emit() calls
    - Remove socketio imports
    - _Requirements: 3.2, 3.3, 3.7_
  
  - [x] 19.3 Remove WebSocket client code
    - Delete or comment out static/js/websocket.js
    - Remove WebSocket references from HTML templates
    - _Requirements: 3.4_

- [x] 20. Checkpoint - Verify cleanup
  - Ensure all tests pass, ask the user if questions arise.

### Phase 7: Configuration and Initialization

- [ ] 21. Update configuration
  - [x] 21.1 Update app/config.py
    - Add API_POLLING_INTERVAL = 2000 (ms)
    - Remove database-related config options
    - _Requirements: 9.1, 9.2_
  
  - [x] 21.2 Update .env.example
    - Document API_POLLING_INTERVAL
    - Remove database config examples
    - Keep only MQTT broker config
    - _Requirements: 9.3, 9.6_
  
  - [ ]* 21.3 Write property test for configuration validation
    - **Property 16: Configuration validation uses defaults for invalid values**
    - **Validates: Requirements 9.4, 9.5**
    - Test invalid config values trigger error log
    - Test system uses default values instead of crashing

- [ ] 22. Update main.py initialization
  - [x] 22.1 Initialize State Store
    - Create StateStore instance
    - Log initialization completion
    - _Requirements: 11.1, 11.4, 11.5_
  
  - [x] 22.2 Wire State Store to MQTT Service
    - Pass state_store to mqtt_service.init_app()
    - _Requirements: 1.6, 1.7_
  
  - [x] 22.3 Register API Blueprint
    - Import and register api_bp
    - Make state_store accessible to API routes
    - _Requirements: 5.1_
  
  - [ ]* 22.4 Write property test for State Store initialization
    - **Property 18: State Store initializes empty and populates from MQTT**
    - **Validates: Requirements 11.1, 11.2, 11.6**
    - Test State Store starts with empty state
    - Test sensors appear after MQTT messages
  
  - [ ]* 22.5 Write property test for initialization speed
    - **Property 19: State Store initializes quickly**
    - **Validates: Requirements 11.5**
    - Test initialization completes within 100ms

- [x] 23. Checkpoint - Verify initialization
  - Ensure all tests pass, ask the user if questions arise.

### Phase 8: Optional Features

- [ ] 24. Implement State Store persistence (optional)
  - [ ] 24.1 Add save_to_file method
    - Implement save_to_file(filepath) method
    - Save state as JSON with schema_version and saved_at
    - Save to data/state_store.json
    - _Requirements: 10.1, 10.3_
  
  - [ ] 24.2 Add load_from_file method
    - Implement load_from_file(filepath) method
    - Handle missing file gracefully (initialize empty)
    - Handle corrupted file gracefully (log error, initialize empty)
    - _Requirements: 10.2, 10.4, 10.5_
  
  - [ ] 24.3 Add persistence configuration
    - Add STATE_STORE_PERSISTENCE config option
    - Call save_to_file() on shutdown if enabled
    - Call load_from_file() on startup if enabled
    - _Requirements: 10.1, 10.2_
  
  - [ ]* 24.4 Write property test for persistence round-trip
    - **Property 17: State Store persistence round-trip preserves data**
    - **Validates: Requirements 10.1, 10.2**
    - Test save then load produces equivalent state
    - Use hypothesis to generate random state
  
  - [ ]* 24.5 Write unit tests for persistence
    - Test save_to_file creates valid JSON
    - Test load_from_file handles missing file
    - Test load_from_file handles corrupted file
    - _Requirements: 10.4, 10.5, 15.5_

- [ ] 25. Add performance monitoring and logging
  - [ ] 25.1 Add API response time tracking
    - Track response time for each API endpoint
    - Calculate average response time
    - _Requirements: 12.2, 12.5_
  
  - [ ] 25.2 Add performance logging
    - Log State Store access time > 10ms as warning
    - Log API response time for debugging
    - _Requirements: 12.7_
  
  - [ ]* 25.3 Write property test for API response time logging
    - **Property 21: API response times are logged**
    - **Validates: Requirements 12.2**
    - Test each API request logs response time

- [x] 26. Final checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

### Phase 9: Documentation and Testing

- [ ] 27. Update documentation
  - [x] 27.1 Update MY_DEVICES.py with floor field
    - Add "floor" field to each location in LOCATIONS dict
    - Use values: "ground", "first", "second", etc.
    - _Requirements: 13.7, 16.1, 16.2_
  
  - [x] 27.2 Create documentation with examples
    - Document thermal inversion rule example
    - Document smart irrigation rule example
    - Document floor-based control example
    - Document State Store data structure
    - Document new API endpoints
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 27.3 Create migration guide
    - Document migration from device_id to location_id
    - Document migration from WebSocket to polling
    - Document breaking changes
    - Document backward compatibility
    - _Requirements: 13.8, 13.9_
  
  - [x] 27.4 Document performance improvements
    - Compare API response times before/after
    - Compare memory usage before/after
    - Compare CPU usage before/after
    - _Requirements: 13.10_

- [ ] 28. Run comprehensive test suite
  - [ ]* 28.1 Run all property-based tests
    - Run all 21 property tests with minimum 100 iterations
    - Verify all properties pass
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10, 15.11, 15.12_
  
  - [ ]* 28.2 Run all unit tests
    - Verify 80%+ code coverage
    - Test all edge cases and error conditions
    - Test all integration points
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10, 15.11, 15.12_
  
  - [ ]* 28.3 Run performance tests
    - Verify API response time < 50ms
    - Verify State Store lock hold time < 10ms
    - Verify initialization time < 100ms
    - _Requirements: 5.11, 7.3, 11.5_

- [x] 29. Final verification and deployment
  - Ensure all tests pass, verify documentation is complete, ask the user if ready to deploy.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at reasonable breaks
- Property tests validate universal correctness properties (21 properties total)
- Unit tests validate specific examples, edge cases, and integration points
- Implementation uses Python with Flask, MQTT, and threading
- Focus on thread-safety, performance, and simplicity
- All database and WebSocket dependencies will be removed
- Location-based architecture with floor support for grouped control
