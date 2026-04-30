/**
 * Dashboard Polling Implementation
 * 
 * Polls /api/state every 2 seconds to update UI with latest sensor/actuator data
 * Replaces WebSocket with simple REST API polling
 */

class DashboardPoller {
    constructor(interval = 2000) {
        this.interval = interval;
        this.pollTimer = null;
        this.isPolling = false;
        this.lastUpdate = null;
        this.errorCount = 0;
        this.maxErrors = 3;
    }
    
    /**
     * Start polling
     */
    start() {
        if (this.isPolling) {
            console.log('Polling already started');
            return;
        }
        
        this.isPolling = true;
        this.errorCount = 0;
        this.poll();  // Initial poll
        this.pollTimer = setInterval(() => this.poll(), this.interval);
        
        console.log(`✅ Polling started (interval: ${this.interval}ms)`);
    }
    
    /**
     * Stop polling
     */
    stop() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        this.isPolling = false;
        console.log('⏸️ Polling stopped');
    }
    
    /**
     * Poll API for latest state
     */
    async poll() {
        try {
            const response = await fetch('/api/state');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.lastUpdate = new Date(data.timestamp);
            this.errorCount = 0;  // Reset error count on success
            
            // Update UI with new data
            this.updateUI(data.locations);
            
            // Update last updated timestamp
            this.updateTimestamp();
            
            // Update connection status
            this.updateConnectionStatus(true);
            
        } catch (error) {
            console.error('❌ Polling error:', error);
            this.errorCount++;
            
            // Update connection status
            this.updateConnectionStatus(false);
            
            // Stop and retry after 5 seconds if too many errors
            if (this.errorCount >= this.maxErrors) {
                console.warn(`⚠️ Too many errors (${this.errorCount}), retrying in 5s...`);
                this.stop();
                setTimeout(() => this.start(), 5000);
            }
        }
    }
    
    /**
     * Update UI with new state data
     */
    updateUI(locations) {
        if (!locations) {
            console.warn('No locations data received');
            return;
        }
        
        for (const [locationId, locationState] of Object.entries(locations)) {
            // Update sensors
            const sensors = locationState.sensors || {};
            for (const [sensorType, sensorData] of Object.entries(sensors)) {
                this.updateSensorDisplay(locationId, sensorType, sensorData);
            }
            
            // Update actuators
            const actuators = locationState.actuators || {};
            for (const [actuatorType, actuatorData] of Object.entries(actuators)) {
                this.updateActuatorDisplay(locationId, actuatorType, actuatorData);
            }
            
            // Check for stale data
            this.checkStaleData(locationId, locationState);
        }
    }
    
    /**
     * Update sensor display element
     */
    updateSensorDisplay(locationId, sensorType, data) {
        const elementId = `${locationId}-${sensorType}`;
        const element = document.getElementById(elementId);
        
        if (element) {
            // Update value
            const valueText = `${data.value} ${data.unit}`;
            element.textContent = valueText;
            element.dataset.timestamp = data.timestamp;
            
            // Add/remove stale class
            const timestamp = new Date(data.timestamp);
            const age = Date.now() - timestamp.getTime();
            
            if (age > 60000) {  // 60 seconds
                element.classList.add('stale-data');
            } else {
                element.classList.remove('stale-data');
            }
        }
    }
    
    /**
     * Update actuator display element
     */
    updateActuatorDisplay(locationId, actuatorType, data) {
        const elementId = `${locationId}-${actuatorType}`;
        const element = document.getElementById(elementId);
        
        if (element) {
            // Update state class
            if (data.state) {
                element.classList.add('active');
                element.classList.remove('inactive');
            } else {
                element.classList.add('inactive');
                element.classList.remove('active');
            }
            
            element.dataset.timestamp = data.timestamp;
            element.dataset.state = data.state;
            
            // Update button text if it's a button
            if (element.tagName === 'BUTTON') {
                const icon = data.state ? '🟢' : '⚪';
                const text = data.state ? 'ON' : 'OFF';
                element.innerHTML = `${icon} ${text}`;
            }
        }
    }
    
    /**
     * Check for stale data and highlight
     */
    checkStaleData(locationId, locationState) {
        const now = Date.now();
        const staleThreshold = 60000; // 60 seconds
        let hasStaleData = false;
        
        // Check all sensors
        const sensors = locationState.sensors || {};
        for (const sensorData of Object.values(sensors)) {
            const timestamp = new Date(sensorData.timestamp);
            if (now - timestamp.getTime() > staleThreshold) {
                hasStaleData = true;
                break;
            }
        }
        
        // Highlight location card if has stale data
        const locationCard = document.querySelector(`[data-location-id="${locationId}"]`);
        if (locationCard) {
            if (hasStaleData) {
                locationCard.classList.add('stale-data');
            } else {
                locationCard.classList.remove('stale-data');
            }
        }
    }
    
    /**
     * Update last updated timestamp display
     */
    updateTimestamp() {
        const element = document.getElementById('last-updated');
        if (element && this.lastUpdate) {
            const timeStr = this.lastUpdate.toLocaleTimeString('vi-VN');
            element.textContent = timeStr;
        }
    }
    
    /**
     * Update connection status indicator
     */
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connection-status');
        if (indicator) {
            if (connected) {
                indicator.classList.remove('disconnected');
                indicator.classList.add('connected');
                indicator.textContent = '🟢 Connected';
            } else {
                indicator.classList.remove('connected');
                indicator.classList.add('disconnected');
                indicator.textContent = '🔴 Disconnected';
            }
        }
    }
}

/**
 * Control actuator via API
 */
async function controlActuator(locationId, actuator, state) {
    try {
        console.log(`Controlling ${locationId}/${actuator} = ${state}`);
        
        const response = await fetch(`/api/control/${locationId}/${actuator}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                state: state,
                value: state ? 'on' : 'off'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Control success:', result);
        
        // Trigger immediate poll to update UI
        if (window.poller) {
            window.poller.poll();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Control error:', error);
        alert(`Failed to control device: ${error.message}`);
        return false;
    }
}

/**
 * Toggle actuator state
 */
async function toggleActuator(locationId, actuator) {
    const elementId = `${locationId}-${actuator}`;
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.error(`Element not found: ${elementId}`);
        return;
    }
    
    // Get current state from element
    const currentState = element.dataset.state === 'true';
    const newState = !currentState;
    
    // Control actuator
    await controlActuator(locationId, actuator, newState);
}

/**
 * Initialize dashboard when page loads
 */
let poller;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Dashboard initializing...');
    
    // Create and start poller
    poller = new DashboardPoller(2000);  // Poll every 2 seconds
    window.poller = poller;  // Make globally accessible
    poller.start();
    
    // Setup actuator control buttons
    setupActuatorButtons();
    
    console.log('✅ Dashboard initialized');
});

/**
 * Setup click handlers for actuator buttons
 */
function setupActuatorButtons() {
    const buttons = document.querySelectorAll('[data-actuator-control]');
    
    buttons.forEach(button => {
        const locationId = button.dataset.locationId;
        const actuator = button.dataset.actuator;
        
        if (locationId && actuator) {
            button.addEventListener('click', () => {
                toggleActuator(locationId, actuator);
            });
        }
    });
    
    console.log(`✅ Setup ${buttons.length} actuator buttons`);
}

/**
 * Stop polling when page is hidden (battery saving)
 */
document.addEventListener('visibilitychange', () => {
    if (!poller) return;
    
    if (document.hidden) {
        console.log('📱 Page hidden, stopping polling');
        poller.stop();
    } else {
        console.log('📱 Page visible, resuming polling');
        poller.start();
    }
});

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
    if (poller) {
        poller.stop();
    }
});
