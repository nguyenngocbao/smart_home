import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SensorData {
  temperature: number;
  humidity: number;       // not in current hardware — kept for UI compat
  soilMoisture: number;
  lightIntensity: number;
  isRaining: boolean;
}

export interface DeviceState {
  waterPumpOn: boolean;
  blindsPosition: number; // 0 (closed) to 100 (open)
  light1On: boolean;
  light2On: boolean;
  skylightOpen: boolean;
}

export interface AutomationRules {
  wateringSchedule: string[];
  wateringSensor: { enabled: boolean; dryThreshold: number; wetThreshold: number; stopOnRain: boolean };
  lightingSchedule: { onTime: string; offTime: string; enabled: boolean; lights: string[] };
  skylightRules: { autoOpenTemp: number; closeOnRain: boolean; enabled: boolean };
  blindsAuto: { enabled: boolean; closeThreshold: number; openThreshold: number };
}

interface SmartHomeContextType {
  sensors: SensorData;
  devices: DeviceState;
  rules: AutomationRules;
  hubOnline: boolean;
  rulesSyncStatus: 'synced' | 'pending' | 'offline';
  isLoading: boolean;
  lightActuators: { id: string; label: string }[];
  toggleDevice: (device: keyof DeviceState, value?: any) => void;
  updateRule: (category: keyof AutomationRules, rule: any) => void;
  addWateringTime: (time: string) => void;
  removeWateringTime: (time: string) => void;
}

const DEFAULT_LIGHT_ACTUATORS = [
  { id: 'light1', label: 'Đèn 1' },
  { id: 'light2', label: 'Đèn 2' },
];

function deriveLightActuators(stateData: any): { id: string; label: string }[] {
  const bedroomSensors = stateData?.locations?.bedroom?.sensors ?? {};
  const lights = Object.keys(bedroomSensors)
    .filter(k => k.startsWith('light') && k.endsWith('_state'))
    .sort()
    .map(k => {
      const id = k.replace('_state', '');
      const num = id.replace('light', '');
      return { id, label: `Đèn ${num}` };
    });
  return lights.length > 0 ? lights : DEFAULT_LIGHT_ACTUATORS;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const defaultSensors: SensorData = {
  temperature: 0,
  humidity: 0,
  soilMoisture: 0,
  lightIntensity: 0,
  isRaining: false,
};

const defaultDevices: DeviceState = {
  waterPumpOn: false,
  blindsPosition: 0,
  light1On: false,
  light2On: false,
  skylightOpen: false,
};

const defaultRules: AutomationRules = {
  wateringSchedule: ['06:00', '17:00'],
  wateringSensor: { enabled: true, dryThreshold: 30, wetThreshold: 70, stopOnRain: true },
  lightingSchedule: { onTime: '18:00', offTime: '06:00', enabled: true, lights: ['light1', 'light2'] },
  skylightRules: { autoOpenTemp: 35, closeOnRain: true, enabled: true },
  blindsAuto: { enabled: false, closeThreshold: 80, openThreshold: 20 },
};

// ── Mapping helpers ────────────────────────────────────────────────────────────

// FE device key → hub location + actuator
const DEVICE_MAP: Record<keyof DeviceState, { locationId: string; actuator: string }> = {
  waterPumpOn:    { locationId: 'rooftop', actuator: 'pump' },
  blindsPosition: { locationId: 'bedroom', actuator: 'curtain' },
  light1On:       { locationId: 'bedroom', actuator: 'light1' },
  light2On:       { locationId: 'bedroom', actuator: 'light2' },
  skylightOpen:   { locationId: 'rooftop', actuator: 'skylight' },
};

function mapApiState(data: any): { sensors: SensorData; devices: DeviceState } {
  const locations = data.locations ?? {};
  const bedroom   = locations.bedroom?.sensors ?? {};
  const rooftop   = locations.rooftop?.sensors ?? {};

  return {
    sensors: {
      temperature:    rooftop.temperature?.value    ?? 0,
      humidity:       0,   // no humidity sensor in current hardware
      soilMoisture:   rooftop.soil_moisture?.value  ?? 0,
      lightIntensity: bedroom.light?.value          ?? 0,
      isRaining:      (rooftop.rain?.value ?? 0) === 1,
    },
    devices: {
      waterPumpOn:    (rooftop.pump_state?.value    ?? 0) === 1,
      skylightOpen:   (rooftop.skylight?.value      ?? 0) === 1,
      light1On:       (bedroom.light1_state?.value  ?? 0) === 1,
      light2On:       (bedroom.light2_state?.value  ?? 0) === 1,
      blindsPosition: Math.round(bedroom.curtain?.value ?? 0),
    },
  };
}

function mapApiRules(data: any): AutomationRules {
  return {
    wateringSchedule: data.wateringSchedule ?? defaultRules.wateringSchedule,
    wateringSensor: {
      enabled:      data.wateringSensor?.enabled      ?? defaultRules.wateringSensor.enabled,
      dryThreshold: data.wateringSensor?.dryThreshold ?? defaultRules.wateringSensor.dryThreshold,
      wetThreshold: data.wateringSensor?.wetThreshold ?? defaultRules.wateringSensor.wetThreshold,
      stopOnRain:   data.wateringSensor?.stopOnRain   ?? defaultRules.wateringSensor.stopOnRain,
    },
    lightingSchedule: {
      onTime:  data.lightingSchedule?.onTime  ?? defaultRules.lightingSchedule.onTime,
      offTime: data.lightingSchedule?.offTime ?? defaultRules.lightingSchedule.offTime,
      enabled: data.lightingSchedule?.enabled ?? defaultRules.lightingSchedule.enabled,
      lights:  data.lightingSchedule?.lights  ?? defaultRules.lightingSchedule.lights,
    },
    skylightRules: {
      autoOpenTemp: data.skylightRules?.autoOpenTemp ?? defaultRules.skylightRules.autoOpenTemp,
      closeOnRain:  data.skylightRules?.closeOnRain  ?? defaultRules.skylightRules.closeOnRain,
      enabled:      data.skylightRules?.enabled      ?? defaultRules.skylightRules.enabled,
    },
    blindsAuto: {
      enabled:        data.blindsAuto?.enabled        ?? defaultRules.blindsAuto.enabled,
      closeThreshold: data.blindsAuto?.closeThreshold ?? defaultRules.blindsAuto.closeThreshold,
      openThreshold:  data.blindsAuto?.openThreshold  ?? defaultRules.blindsAuto.openThreshold,
    },
  };
}

// Apply a single state_update socket event onto current state
function applyStateUpdate(
  sensors: SensorData,
  devices: DeviceState,
  locationId: string,
  sensorType: string,
  value: number,
): { sensors: SensorData; devices: DeviceState } {
  const s = { ...sensors };
  const d = { ...devices };

  if (locationId === 'rooftop') {
    if (sensorType === 'temperature')   s.temperature    = value;
    else if (sensorType === 'soil_moisture') s.soilMoisture = value;
    else if (sensorType === 'rain')     s.isRaining      = value === 1;
    else if (sensorType === 'pump_state')   d.waterPumpOn    = value === 1;
    else if (sensorType === 'skylight') d.skylightOpen   = value === 1;
  } else if (locationId === 'bedroom') {
    if (sensorType === 'light')         s.lightIntensity  = value;
    else if (sensorType === 'light1_state') d.light1On    = value === 1;
    else if (sensorType === 'light2_state') d.light2On    = value === 1;
    else if (sensorType === 'curtain')  d.blindsPosition  = Math.round(value);
  }

  return { sensors: s, devices: d };
}

// ── Context ────────────────────────────────────────────────────────────────────

const SmartHomeContext = createContext<SmartHomeContextType | undefined>(undefined);

export const SmartHomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  const [sensors,  setSensors]  = useState<SensorData>(defaultSensors);
  const [devices,  setDevices]  = useState<DeviceState>(defaultDevices);
  const [rules,    setRules]    = useState<AutomationRules>(defaultRules);
  const [hubOnline, setHubOnline]       = useState(false);
  const [rulesSyncStatus, setRulesSyncStatus] = useState<'synced' | 'pending' | 'offline'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [lightActuators, setLightActuators] = useState<{ id: string; label: string }[]>(DEFAULT_LIGHT_ACTUATORS);

  // Keep latest sensors/devices in a ref for use inside socket callbacks
  const stateRef = useRef({ sensors, devices });
  useEffect(() => { stateRef.current = { sensors, devices }; }, [sensors, devices]);

  // ── Initial fetch ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }

    let cancelled = false;

    async function fetchInitial() {
      setIsLoading(true);
      try {
        const [stateRes, rulesRes] = await Promise.all([
          apiFetch('/api/state'),
          apiFetch('/api/rules'),
        ]);

        if (!cancelled && stateRes.ok) {
          const data = await stateRes.json();
          const { sensors: s, devices: d } = mapApiState(data);
          setSensors(s);
          setDevices(d);
          setHubOnline(data.hubOnline ?? false);
          setLightActuators(deriveLightActuators(data));
        }

        if (!cancelled && rulesRes.ok) {
          const data = await rulesRes.json();
          setRules(mapApiRules(data));
          setRulesSyncStatus('synced');
        }
      } catch (e) {
        console.error('Initial fetch failed:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchInitial();
    return () => { cancelled = true; };
  }, [token]);

  // ── Socket.io ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('state_update', ({ locationId, sensorType, value }: any) => {
      const { sensors: s, devices: d } = stateRef.current;
      const next = applyStateUpdate(s, d, locationId, sensorType, value);
      setSensors(next.sensors);
      setDevices(next.devices);
    });

    socket.on('hub_status', ({ online }: any) => {
      setHubOnline(online);
      if (!online) setRulesSyncStatus('offline');
    });

    socket.on('rules_synced', () => {
      setRulesSyncStatus('synced');
    });

    return () => {
      socket.off('state_update');
      socket.off('hub_status');
      socket.off('rules_synced');
      disconnectSocket();
    };
  }, [token]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const toggleDevice = (device: keyof DeviceState, value?: any) => {
    // Optimistic update
    setDevices(prev => ({
      ...prev,
      [device]: value !== undefined ? value : !prev[device as keyof DeviceState],
    }));

    if (!token) return;

    const { locationId, actuator } = DEVICE_MAP[device];
    const currentVal = devices[device];
    const newState   = value !== undefined
      ? (device === 'blindsPosition' ? (value as number) > 0 : Boolean(value))
      : !currentVal;

    const body: Record<string, any> = { state: newState };
    if (device === 'blindsPosition') body.position = value;

    apiFetch(`/api/control/${locationId}/${actuator}`, {
      method: 'POST',
      body:   JSON.stringify(body),
    }).catch(console.error);
  };

  const updateRule = (category: keyof AutomationRules, rule: any) => {
    setRules(prev => ({
      ...prev,
      [category]: { ...(prev[category] as any), ...rule },
    }));
    setRulesSyncStatus('pending');

    if (!token) return;

    const merged = { ...(rules[category] as any), ...rule };
    apiFetch('/api/rules', {
      method: 'PUT',
      body:   JSON.stringify({ [category]: merged }),
    }).catch(console.error);
  };

  const addWateringTime = (time: string) => {
    const next = [...new Set([...rules.wateringSchedule, time])].sort();
    setRules(prev => ({ ...prev, wateringSchedule: next }));
    setRulesSyncStatus('pending');

    if (!token) return;
    apiFetch('/api/rules', {
      method: 'PUT',
      body:   JSON.stringify({ wateringSchedule: next }),
    }).catch(console.error);
  };

  const removeWateringTime = (time: string) => {
    const next = rules.wateringSchedule.filter(t => t !== time);
    setRules(prev => ({ ...prev, wateringSchedule: next }));
    setRulesSyncStatus('pending');

    if (!token) return;
    apiFetch('/api/rules', {
      method: 'PUT',
      body:   JSON.stringify({ wateringSchedule: next }),
    }).catch(console.error);
  };

  return (
    <SmartHomeContext.Provider
      value={{
        sensors, devices, rules,
        hubOnline, rulesSyncStatus, isLoading,
        lightActuators,
        toggleDevice, updateRule, addWateringTime, removeWateringTime,
      }}
    >
      {children}
    </SmartHomeContext.Provider>
  );
};

export const useSmartHome = () => {
  const ctx = useContext(SmartHomeContext);
  if (!ctx) throw new Error('useSmartHome must be used within SmartHomeProvider');
  return ctx;
};
