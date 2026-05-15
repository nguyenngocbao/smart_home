// FE device/sensor names → hub location + actuator/sensorType

const DEVICE_MAP = {
  waterPumpOn:    { locationId: "rooftop",  actuator: "pump"     },
  blindsPosition: { locationId: "bedroom",  actuator: "curtain"  },
  light1On:       { locationId: "bedroom",  actuator: "light1"   },  // đèn tầng 1 — esp1 GPIO26
  light2On:       { locationId: "rooftop",  actuator: "light2"   },  // đèn sân thượng — esp2 GPIO27
  skylightOpen:   { locationId: "rooftop",  actuator: "skylight" },
};

const SENSOR_MAP = {
  temperature:    { locationId: "bedroom",  sensorType: "temperature"   },  // DHT22 trên esp1
  soilMoisture:   { locationId: "rooftop",  sensorType: "soil_moisture" },
  isRaining:      { locationId: "rooftop",  sensorType: "rain"          },
  lightIntensity: { locationId: "bedroom",  sensorType: "light"         },
  curtainPos:     { locationId: "bedroom",  sensorType: "curtain"       },
};

module.exports = { DEVICE_MAP, SENSOR_MAP };
