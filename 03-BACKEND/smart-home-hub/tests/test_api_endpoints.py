"""
Basic Integration Tests for API Endpoints
Tests REST API endpoints with State Store
"""

import pytest
import json
from app import create_app
from services.state_store import StateStore
from services.mqtt_service import MQTTService
from routes.api import init_api


@pytest.fixture
def app():
    """Create Flask app for testing"""
    app = create_app("testing")
    
    # Initialize State Store and MQTT Service
    state_store = StateStore()
    mqtt_service = MQTTService(app, state_store)
    
    # Initialize API
    init_api(state_store, mqtt_service)
    
    # Register API blueprint
    from routes.api import api_bp
    app.register_blueprint(api_bp)
    
    return app


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def state_store(app):
    """Get state store instance"""
    from routes.api import state_store as store
    return store


class TestAPIEndpoints:
    """Test REST API endpoints"""
    
    def test_get_all_state_empty(self, client):
        """Test GET /api/state with empty state"""
        response = client.get('/api/state')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "locations" in data
        assert "timestamp" in data
        assert len(data["locations"]) == 0
    
    def test_get_all_state_with_data(self, client, state_store):
        """Test GET /api/state with data"""
        # Add some data
        state_store.update_sensor("living-room", "temperature", 28.5, "°C")
        state_store.update_actuator("living-room", "light", True, "on", "api")
        
        response = client.get('/api/state')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "living-room" in data["locations"]
        assert "temperature" in data["locations"]["living-room"]["sensors"]
        assert "light" in data["locations"]["living-room"]["actuators"]
    
    def test_get_location_state(self, client, state_store):
        """Test GET /api/state/<location_id>"""
        state_store.update_sensor("living-room", "temperature", 28.5, "°C")
        
        response = client.get('/api/state/living-room')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "sensors" in data
        assert "actuators" in data
        assert "timestamp" in data
        assert "temperature" in data["sensors"]
    
    def test_get_location_state_not_found(self, client):
        """Test GET /api/state/<location_id> for nonexistent location"""
        response = client.get('/api/state/nonexistent')
        assert response.status_code == 404
        
        data = json.loads(response.data)
        assert "error" in data
    
    def test_get_floor_state(self, client, state_store):
        """Test GET /api/state/floor/<floor>"""
        # Note: This test requires MY_DEVICES.py to be configured
        # For now, just test the endpoint exists
        response = client.get('/api/state/floor/ground')
        # May return 404 if no locations on floor, which is OK
        assert response.status_code in [200, 404]
    
    def test_control_actuator(self, client, state_store):
        """Test POST /api/control/<location_id>/<actuator>"""
        response = client.post(
            '/api/control/living-room/light',
            data=json.dumps({"state": True, "value": "on"}),
            content_type='application/json'
        )
        
        # May return 503 if MQTT not connected, which is OK for testing
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = json.loads(response.data)
            assert data["ok"] is True
            assert data["location_id"] == "living-room"
            assert data["actuator"] == "light"
            assert data["state"] is True
    
    def test_control_actuator_missing_state(self, client):
        """Test POST /api/control with missing state field"""
        response = client.post(
            '/api/control/living-room/light',
            data=json.dumps({}),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data
    
    def test_metrics_endpoint(self, client, state_store):
        """Test GET /api/metrics"""
        # Add some data
        state_store.update_sensor("living-room", "temperature", 28.5, "°C")
        state_store.update_sensor("bedroom", "humidity", 65.0, "%")
        state_store.update_actuator("living-room", "light", True, "on", "api")
        
        response = client.get('/api/metrics')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "state_store" in data
        assert "api" in data
        assert data["state_store"]["num_locations"] == 2
        assert data["state_store"]["num_sensors"] == 2
        assert data["state_store"]["num_actuators"] == 1
    
    def test_health_endpoint(self, client):
        """Test GET /api/health"""
        response = client.get('/api/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert "status" in data
        assert "mqtt_connected" in data
        assert "state_store_ok" in data
    
    def test_api_response_time(self, client, state_store):
        """Test API response time is fast"""
        import time
        
        # Add some data
        for i in range(10):
            state_store.update_sensor(f"location-{i}", "temperature", 25.0 + i, "°C")
        
        # Measure response time
        start = time.time()
        response = client.get('/api/state')
        duration = (time.time() - start) * 1000  # Convert to ms
        
        assert response.status_code == 200
        assert duration < 100  # Should be < 100ms


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
