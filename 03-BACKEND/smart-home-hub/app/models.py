"""
app/models.py - Data Models

NOTE: This file is kept for backward compatibility but database models
are no longer used. The system now uses State Store (in-memory) instead.

All sensor readings and actuator states are stored in StateStore.
See services/state_store.py for the new architecture.
"""

from datetime import datetime

# ============================================
# DEPRECATED: Database models no longer used
# State Store Architecture uses in-memory storage
# ============================================

# This file is kept for reference only.
# All data is now stored in StateStore (services/state_store.py)

class Alert:
    """
    Simple Alert class (no database)
    For logging purposes only
    """
    def __init__(self, alert_type, message, severity="warning", device_id=None, value=None):
        self.alert_type = alert_type
        self.message = message
        self.severity = severity
        self.device_id = device_id
        self.value = value
        self.timestamp = datetime.utcnow()
        self.is_read = False
    
    def to_dict(self):
        return {
            "alert_type": self.alert_type,
            "message": self.message,
            "severity": self.severity,
            "device_id": self.device_id,
            "value": self.value,
            "is_read": self.is_read,
            "timestamp": self.timestamp.isoformat(),
        }
