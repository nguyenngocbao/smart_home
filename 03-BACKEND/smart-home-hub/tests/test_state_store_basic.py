"""
Basic Unit Tests for State Store
Tests core functionality without property-based testing
"""

import pytest
import threading
import time
from services.state_store import StateStore


class TestStateStoreBasic:
    """Basic unit tests for State Store"""
    
    def setup_method(self):
        """Setup before each test"""
        self.store = StateStore()
    
    def test_initialization(self):
        """Test State Store initializes with empty state"""
        state = self.store.get_all_state()
        assert "locations" in state
        assert len(state["locations"]) == 0
    
    def test_update_sensor(self):
        """Test updating sensor data"""
        self.store.update_sensor("living-room", "temperature", 28.5, "°C")
        
        sensor = self.store.get_sensor("living-room", "temperature")
        assert sensor is not None
        assert sensor["value"] == 28.5
        assert sensor["unit"] == "°C"
        assert "timestamp" in sensor
    
    def test_update_actuator(self):
        """Test updating actuator state"""
        self.store.update_actuator("living-room", "light", True, "on", "api")
        
        actuator = self.store.get_actuator("living-room", "light")
        assert actuator is not None
        assert actuator["state"] is True
        assert actuator["value"] == "on"
        assert actuator["updated_by"] == "api"
        assert "timestamp" in actuator
    
    def test_get_nonexistent_sensor(self):
        """Test getting sensor that doesn't exist returns None"""
        sensor = self.store.get_sensor("nonexistent", "temperature")
        assert sensor is None
    
    def test_get_nonexistent_actuator(self):
        """Test getting actuator that doesn't exist returns None"""
        actuator = self.store.get_actuator("nonexistent", "light")
        assert actuator is None
    
    def test_get_all_sensors(self):
        """Test getting all sensors for a location"""
        self.store.update_sensor("living-room", "temperature", 28.5, "°C")
        self.store.update_sensor("living-room", "humidity", 65.0, "%")
        
        sensors = self.store.get_all_sensors("living-room")
        assert len(sensors) == 2
        assert "temperature" in sensors
        assert "humidity" in sensors
    
    def test_get_all_actuators(self):
        """Test getting all actuators for a location"""
        self.store.update_actuator("living-room", "light", True, "on", "api")
        self.store.update_actuator("living-room", "fan", False, "off", "api")
        
        actuators = self.store.get_all_actuators("living-room")
        assert len(actuators) == 2
        assert "light" in actuators
        assert "fan" in actuators
    
    def test_get_location_state(self):
        """Test getting complete state of a location"""
        self.store.update_sensor("living-room", "temperature", 28.5, "°C")
        self.store.update_actuator("living-room", "light", True, "on", "api")
        
        state = self.store.get_location_state("living-room")
        assert state is not None
        assert "sensors" in state
        assert "actuators" in state
        assert "temperature" in state["sensors"]
        assert "light" in state["actuators"]
    
    def test_get_all_state(self):
        """Test getting complete state of all locations"""
        self.store.update_sensor("living-room", "temperature", 28.5, "°C")
        self.store.update_sensor("bedroom", "temperature", 26.0, "°C")
        
        state = self.store.get_all_state()
        assert "locations" in state
        assert "living-room" in state["locations"]
        assert "bedroom" in state["locations"]
    
    def test_multiple_locations(self):
        """Test handling multiple locations"""
        locations = ["living-room", "bedroom", "kitchen", "garden"]
        
        for location in locations:
            self.store.update_sensor(location, "temperature", 25.0, "°C")
        
        state = self.store.get_all_state()
        assert len(state["locations"]) == len(locations)
        
        for location in locations:
            assert location in state["locations"]
    
    def test_sensor_overwrite(self):
        """Test that updating sensor overwrites previous value"""
        self.store.update_sensor("living-room", "temperature", 28.5, "°C")
        self.store.update_sensor("living-room", "temperature", 30.0, "°C")
        
        sensor = self.store.get_sensor("living-room", "temperature")
        assert sensor["value"] == 30.0
    
    def test_actuator_overwrite(self):
        """Test that updating actuator overwrites previous state"""
        self.store.update_actuator("living-room", "light", True, "on", "api")
        self.store.update_actuator("living-room", "light", False, "off", "rule")
        
        actuator = self.store.get_actuator("living-room", "light")
        assert actuator["state"] is False
        assert actuator["updated_by"] == "rule"
    
    def test_avg_access_time(self):
        """Test average access time tracking"""
        # Perform some operations
        for i in range(10):
            self.store.update_sensor("living-room", "temperature", 25.0 + i, "°C")
            self.store.get_sensor("living-room", "temperature")
        
        avg_time = self.store.get_avg_access_time()
        assert avg_time >= 0
        assert avg_time < 100  # Should be very fast (< 100ms)


class TestStateStoreThreadSafety:
    """Basic thread-safety tests"""
    
    def setup_method(self):
        """Setup before each test"""
        self.store = StateStore()
        self.errors = []
    
    def test_concurrent_sensor_updates(self):
        """Test concurrent sensor updates don't cause errors"""
        def update_sensor(location_id, value):
            try:
                self.store.update_sensor(location_id, "temperature", value, "°C")
            except Exception as e:
                self.errors.append(e)
        
        threads = []
        for i in range(10):
            t = threading.Thread(target=update_sensor, args=(f"location-{i}", 25.0 + i))
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        assert len(self.errors) == 0
        
        # Verify all updates succeeded
        state = self.store.get_all_state()
        assert len(state["locations"]) == 10
    
    def test_concurrent_read_write(self):
        """Test concurrent reads and writes don't cause errors"""
        self.store.update_sensor("living-room", "temperature", 25.0, "°C")
        
        def read_sensor():
            try:
                for _ in range(100):
                    self.store.get_sensor("living-room", "temperature")
            except Exception as e:
                self.errors.append(e)
        
        def write_sensor():
            try:
                for i in range(100):
                    self.store.update_sensor("living-room", "temperature", 25.0 + i, "°C")
            except Exception as e:
                self.errors.append(e)
        
        readers = [threading.Thread(target=read_sensor) for _ in range(5)]
        writers = [threading.Thread(target=write_sensor) for _ in range(5)]
        
        for t in readers + writers:
            t.start()
        
        for t in readers + writers:
            t.join()
        
        assert len(self.errors) == 0


class TestStateStorePersistence:
    """Test optional persistence features"""
    
    def setup_method(self):
        """Setup before each test"""
        self.store = StateStore()
        self.test_file = "test_state_store.json"
    
    def teardown_method(self):
        """Cleanup after each test"""
        import os
        if os.path.exists(self.test_file):
            os.remove(self.test_file)
    
    def test_save_to_file(self):
        """Test saving state to file"""
        self.store.update_sensor("living-room", "temperature", 28.5, "°C")
        self.store.update_actuator("living-room", "light", True, "on", "api")
        
        self.store.save_to_file(self.test_file)
        
        import os
        assert os.path.exists(self.test_file)
    
    def test_load_from_file(self):
        """Test loading state from file"""
        # Save state
        self.store.update_sensor("living-room", "temperature", 28.5, "°C")
        self.store.save_to_file(self.test_file)
        
        # Create new store and load
        new_store = StateStore()
        new_store.load_from_file(self.test_file)
        
        sensor = new_store.get_sensor("living-room", "temperature")
        assert sensor is not None
        assert sensor["value"] == 28.5
    
    def test_load_nonexistent_file(self):
        """Test loading from nonexistent file doesn't crash"""
        self.store.load_from_file("nonexistent.json")
        
        # Should initialize with empty state
        state = self.store.get_all_state()
        assert len(state["locations"]) == 0
    
    def test_load_corrupted_file(self):
        """Test loading corrupted file doesn't crash"""
        # Create corrupted file
        with open(self.test_file, 'w') as f:
            f.write("invalid json {{{")
        
        self.store.load_from_file(self.test_file)
        
        # Should initialize with empty state
        state = self.store.get_all_state()
        assert len(state["locations"]) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
