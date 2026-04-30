// FE device/sensor names → hub location + actuator/sensorType

const DEVICE_MAP = {
  waterPumpOn:    { locationId: "rooftop",  actuator: "pump"     },
  blindsPosition: { locationId: "bedroom",  actuator: "curtain"  },
  light1On:       { locationId: "bedroom",  actuator: "light1"   },
  light2On:       { locationId: "bedroom",  actuator: "light2"   },
  skylightOpen:   { locationId: "rooftop",  actuator: "skylight" },
};

const SENSOR_MAP = {
  temperature:    { locationId: "rooftop",  sensorType: "temperature"   },
  soilMoisture:   { locationId: "rooftop",  sensorType: "soil_moisture" },
  isRaining:      { locationId: "rooftop",  sensorType: "rain"          },
  lightIntensity: { locationId: "bedroom",  sensorType: "light"         },
  curtainPos:     { locationId: "bedroom",  sensorType: "curtain"       },
};

module.exports = { DEVICE_MAP, SENSOR_MAP };
