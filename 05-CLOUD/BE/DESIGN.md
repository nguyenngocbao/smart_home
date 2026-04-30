# Cloud Backend — Architecture Design

**Stack:** Node.js + Express + MongoDB + MQTT (mqtt.js) + Socket.io  
**Ngày:** 2026-04-28

---

## 1. Tổng quan vai trò

```
[Hub - Raspberry Pi]
      │ paho-mqtt TLS :8883
      ▼
[Cloud MQTT Broker]  ← HiveMQ Free / EMQX Cloud
      │ mqtt.js TLS :8883
      ▼
[Cloud BE - Node.js]  ←── REST + Socket.io
  ├─ mqttService       subscribe/publish cloud broker
  ├─ Express REST API  cho FE gọi
  ├─ Socket.io         push realtime xuống browser
  └─ MongoDB           lưu lịch sử + auth + hub config
      │
      │ REST + WebSocket
      ▼
[FE - React / Vite]
```

BE **không tự xử lý automation logic** — relay lệnh, lưu dữ liệu, và **chuyển tiếp rule config từ user xuống hub**. Hub mới là nơi thực thi rules.

---

## 2. Folder Structure

```
05-CLOUD/BE/
├── src/
│   ├── config/
│   │   ├── db.js          MongoDB connection (mongoose)
│   │   ├── mqtt.js        Cloud MQTT client singleton
│   │   └── env.js         Load + validate .env
│   │
│   ├── models/
│   │   ├── User.js        Auth users
│   │   ├── Hub.js         Hub registry + config_json
│   │   ├── SensorHistory.js  Time-series sensor data
│   │   ├── CommandLog.js  Command + ack tracking
│   │   └── Rules.js       Rule config per hub (sync với hub)
│   │
│   ├── services/
│   │   ├── mqttService.js    Subscribe cloud broker, dispatch messages
│   │   ├── hubService.js     Update hub state, parse config_json
│   │   ├── commandService.js Publish command, wait ack (Promise + timeout)
│   │   ├── rulesService.js   Save rules to DB, publish xuống hub
│   │   └── socketService.js  Push realtime events xuống browser
│   │
│   ├── routes/
│   │   ├── auth.js        POST /auth/login, /auth/refresh, /auth/logout
│   │   ├── state.js       GET /api/state, /api/state/:locationId
│   │   ├── control.js     POST /api/control/:locationId/:actuator
│   │   ├── history.js     GET /api/history
│   │   ├── rules.js       GET /api/rules, PUT /api/rules
│   │   └── hub.js         GET /api/hub/status, /api/hub/devices
│   │
│   ├── middleware/
│   │   └── auth.js        Verify JWT, attach req.user
│   │
│   ├── socket/
│   │   └── index.js       Socket.io setup, room management
│   │
│   ├── app.js             Express app setup, route mount
│   └── server.js          HTTP server + Socket.io attach + MQTT start
│
├── .env.example
├── package.json
└── README.md
```

---

## 3. MongoDB Schemas

### 3.1 `users`
```js
{
  _id:          ObjectId,
  email:        String, unique, required,
  passwordHash: String,               // bcrypt
  role:         String,               // "admin" | "viewer"
  createdAt:    Date
}
```

### 3.2 `hubs`
```js
{
  _id:        String,                 // hub_id = "smarthome-hub-001"
  configJson: Object,                 // Nội dung MY_DEVICES.py locations
                                      // Cập nhật từ topic cloud/{hub_id}/config
  online:     Boolean,                // Cập nhật từ topic cloud/{hub_id}/status
  lastSeen:   Date,                   // Cập nhật mỗi lần nhận message bất kỳ
  createdAt:  Date
}

// configJson example:
// {
//   "locations": {
//     "bedroom":  { "name": "Phòng Ngủ",  "floor": "Tầng 1", "sensors": [...], "actuators": {...} },
//     "rooftop":  { "name": "Sân Thượng", "floor": "Sân Thượng", ... }
//   },
//   "version": "1.0.0"
// }
```

### 3.3 `sensor_history`
```js
{
  _id:        ObjectId,
  hubId:      String,                 // FK → hubs._id
  locationId: String,                 // "bedroom", "rooftop"
  sensorType: String,                 // "temperature", "light", ...
  value:      Number,
  unit:       String,
  recordedAt: Date                    // index: { hubId, locationId, sensorType, recordedAt }
}
```
> TTL index: tự xóa sau 30 ngày

### 3.4 `rules`
```js
{
  _id:    String,                     // hub_id = "smarthome-hub-001"
  hubId:  String,                     // FK → hubs._id (same value)

  wateringSchedule: [String],         // ["06:00", "17:00"]

  lightingSchedule: {
    enabled: Boolean,
    onTime:  String,                  // "18:00"
    offTime: String,                  // "06:00"
  },

  skylightRules: {
    enabled:       Boolean,
    autoOpenTemp:  Number,            // °C, mở cửa trời khi nhiệt độ vượt ngưỡng
    closeOnRain:   Boolean,           // đóng ngay khi có mưa
  },

  blindsAuto: {
    enabled:        Boolean,
    closeThreshold: Number,           // % ánh sáng, đóng rèm khi vượt ngưỡng
    openThreshold:  Number,           // % ánh sáng, mở rèm khi dưới ngưỡng
  },

  updatedAt: Date,                    // lần cuối user chỉnh
  syncedAt:  Date | null,             // lần cuối hub ack nhận được rules
}
```

> Khi BE nhận `PUT /api/rules` → lưu DB → publish MQTT `cloud/{hub_id}/rules` → hub apply.  
> `syncedAt` cập nhật khi nhận ack từ hub qua topic `cloud/{hub_id}/rules_ack`.

### 3.5 `command_logs`
```js
{
  _id:        String,                 // command_id = UUID, do FE hoặc BE tạo
  hubId:      String,
  locationId: String,
  actuator:   String,
  state:      Boolean,
  issuedBy:   ObjectId,              // FK → users._id
  issuedAt:   Date,
  ackedAt:    Date | null,
  success:    Boolean | null         // null = chưa ack
}
```

---

## 4. MQTT Topics & Handlers

### 4.1 BE Subscribe (Cloud Broker → BE)

| Topic | Handler | Hành động |
|-------|---------|-----------|
| `cloud/+/config` | `hubService.onConfig()` | Upsert `hubs.configJson`, update `lastSeen` |
| `cloud/+/status` | `hubService.onStatus()` | Update `hubs.online`, `lastSeen` + socket push |
| `cloud/+/+/sensors/+` | `hubService.onSensorData()` | Insert `sensor_history` + socket push `state_update` |
| `cloud/+/ack/+` | `commandService.onAck()` | Update `command_logs.ackedAt/success` + socket push `command_ack` |
| `cloud/+/rules_ack` | `rulesService.onRulesAck()` | Update `rules.syncedAt` + socket push `rules_synced` |

### 4.2 BE Publish (BE → Cloud Broker → Hub)

**Rules push** — mỗi khi user `PUT /api/rules`:
```
Topic:   cloud/{hub_id}/rules
Payload: {
  "wateringSchedule": ["06:00", "17:00"],
  "lightingSchedule": { "enabled": true, "onTime": "18:00", "offTime": "06:00" },
  "skylightRules":    { "enabled": true, "autoOpenTemp": 35, "closeOnRain": true },
  "blindsAuto":       { "enabled": false, "closeThreshold": 80, "openThreshold": 20 },
  "updatedAt": "ISO8601"
}
QoS: 1, retain: true   ← hub nhận được ngay cả khi connect muộn hơn
```

**Command push** — khi user điều khiển thiết bị:

```
Topic:   cloud/{hub_id}/cmd/{location_id}/{actuator}
Payload: {
  "state":      true | false,
  "command_id": "uuid-v4",
  "issued_by":  "user@email.com",
  "timestamp":  "ISO8601"
}
QoS: 1
```

### 4.3 Mapping: FE model → MQTT topic

FE dùng tên ngắn gọn (`waterPumpOn`, `light1On`...). BE cần map sang location + actuator của hub:

```js
// src/config/deviceMap.js
const DEVICE_MAP = {
  waterPumpOn:    { locationId: "rooftop",  actuator: "pump"     },
  blindsPosition: { locationId: "bedroom",  actuator: "curtain"  }, // value = position 0-100
  light1On:       { locationId: "bedroom",  actuator: "light1"   },
  light2On:       { locationId: "bedroom",  actuator: "light2"   },
  skylightOpen:   { locationId: "rooftop",  actuator: "skylight" },
};

const SENSOR_MAP = {
  temperature:    { locationId: "rooftop", sensorType: "temperature"   },
  humidity:       { locationId: "rooftop", sensorType: "humidity"      },
  soilMoisture:   { locationId: "rooftop", sensorType: "soil_moisture" },
  lightIntensity: { locationId: "bedroom", sensorType: "light"         },
  isRaining:      { locationId: "rooftop", sensorType: "rain"          },
};
```

> ⚠️ Map này giữ FE ổn định. Khi hub thêm device mới → chỉ cần cập nhật file này.

---

## 5. REST API

Tất cả route `/api/*` yêu cầu JWT (middleware `auth.js`).  
Trả về JSON, lỗi theo format: `{ "error": "message" }`.

### Auth
```
POST /auth/login
  body:    { email, password }
  returns: { accessToken, refreshToken, user: { id, email, role } }

POST /auth/refresh
  body:    { refreshToken }
  returns: { accessToken }

POST /auth/logout
  body:    { refreshToken }
  returns: { ok: true }
```

### State
```
GET /api/state
  returns: state snapshot mới nhất của tất cả locations
  {
    "hubOnline": true,
    "lastSeen": "ISO8601",
    "locations": {
      "bedroom": {
        "sensors":   { "light": { "value": 72, "unit": "%", "timestamp": "..." }, ... },
        "actuators": { "light1": { "state": true, "timestamp": "..." }, ... }
      },
      ...
    }
  }

GET /api/state/:locationId
  returns: state của 1 location cụ thể
```

### Control
```
POST /api/control/:locationId/:actuator
  body:    { "state": true }           // actuator bình thường
           { "state": true, "position": 75 }  // curtain
  returns: { "commandId": "uuid", "status": "pending" }
  — publish MQTT → chờ ack tối đa 10s
  — nếu ack: returns { "commandId": "uuid", "status": "success" }
  — nếu timeout: returns { "commandId": "uuid", "status": "timeout" } (HTTP 504)

GET /api/control/:commandId
  returns: { commandId, status, issuedAt, ackedAt, success }
```

### Rules
```
GET /api/rules
  returns: rule config hiện tại đang lưu trên cloud
  {
    "wateringSchedule": ["06:00", "17:00"],
    "lightingSchedule": { "enabled": true, "onTime": "18:00", "offTime": "06:00" },
    "skylightRules":    { "enabled": true, "autoOpenTemp": 35, "closeOnRain": true },
    "blindsAuto":       { "enabled": false, "closeThreshold": 80, "openThreshold": 20 },
    "updatedAt": "ISO8601",
    "syncedAt":  "ISO8601" | null    // null = hub chưa nhận được
  }

PUT /api/rules
  body:    { wateringSchedule?, lightingSchedule?, skylightRules?, blindsAuto? }
  → merge với config hiện tại → lưu DB → publish MQTT cloud/{hub_id}/rules
  returns: { ok: true, syncStatus: "pending" }
  — syncedAt sẽ được cập nhật khi hub ack qua socket event "rules_synced"
```

### History
```
GET /api/history?locationId=rooftop&sensorType=temperature&hours=24
  returns: [{ value, unit, recordedAt }, ...]
  — mặc định: 24h, tối đa 168h (7 ngày)
```

### Hub
```
GET /api/hub/status
  returns: { hubId, online, lastSeen }

GET /api/hub/devices
  returns: configJson của hub (locations + sensors + actuators)
  — FE dùng để render dynamic layout
```

---

## 6. Socket.io Events

BE dùng Socket.io để push realtime xuống browser. FE connect sau khi login.

### Connection
```
// FE kết nối với accessToken
const socket = io(CLOUD_URL, {
  auth: { token: accessToken }
});
```

### Events BE → FE
```
"state_update"    payload: { locationId, sensorType, value, unit, timestamp }
                  — push mỗi khi hub gửi sensor data mới lên cloud broker

"hub_status"      payload: { hubId, online, lastSeen }
                  — push khi hub connect / disconnect

"command_ack"     payload: { commandId, success, ackedAt }
                  — push khi hub ack lệnh

"rules_synced"    payload: { syncedAt }
                  — push khi hub ack đã nhận và apply rules mới
```

### Events FE → BE  
```
(không có — FE dùng REST để gửi command/rules, không gửi qua socket)
```

---

## 7. FE Integration — Thay thế Simulation

Context `SmartHomeContext.tsx` hiện đang simulate data. Cần thay bằng:

### 7.1 Lấy state ban đầu
```ts
// Khi app mount: GET /api/state
useEffect(() => {
  fetch('/api/state', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => {
      setSensors(mapApiToSensors(data.locations));
      setDevices(mapApiToDevices(data.locations));
      setHubOnline(data.hubOnline);
    });
}, []);
```

### 7.2 Nhận realtime update
```ts
// Socket.io thay cho setInterval simulation
useEffect(() => {
  socket.on('state_update', ({ locationId, sensorType, value }) => {
    setSensors(prev => updateSensor(prev, locationId, sensorType, value));
  });
  socket.on('hub_status', ({ online }) => setHubOnline(online));
}, [socket]);
```

### 7.3 Đồng bộ rules

```ts
// Mount: GET /api/rules
useEffect(() => {
  fetch('/api/rules', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => setRules(mapApiToRules(data)));
}, []);

// updateRule gọi PUT /api/rules
const updateRule = async (category: keyof AutomationRules, rule: any) => {
  const updated = { ...rules, [category]: { ...rules[category], ...rule } };
  setRules(updated);                          // optimistic update
  await fetch('/api/rules', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ [category]: rule }),
  });
  // syncedAt sẽ tự cập nhật qua socket event "rules_synced"
};

// Nhận xác nhận hub đã apply
socket.on('rules_synced', ({ syncedAt }) => {
  setRulesSyncStatus('synced');
});
```

### 7.4 Gửi lệnh điều khiển
```ts
// toggleDevice gọi REST thay vì setDevices trực tiếp
const toggleDevice = async (device: keyof DeviceState, value?: any) => {
  const { locationId, actuator } = DEVICE_MAP[device];
  const state = value !== undefined ? value > 0 : !devices[device];
  const body = actuator === 'curtain' ? { state, position: value } : { state };

  const res = await fetch(`/api/control/${locationId}/${actuator}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  // Optimistic update — không đợi ack, socket sẽ đồng bộ lại
  setDevices(prev => ({ ...prev, [device]: value ?? !prev[device] }));
};
```

### 7.5 Tab Automations — Fully interactive trên cloud

FE giữ nguyên toàn bộ UI edit (slider, time picker, toggle).  
`updateRule` / `addWateringTime` / `removeWateringTime` → gọi `PUT /api/rules` → BE push xuống hub qua MQTT.

**Hiển thị sync status** để user biết hub đã nhận rule chưa:
```ts
// Thêm vào UI mỗi card trong Automations
{syncStatus === 'pending' && <span className="text-yellow-500 text-xs">⏳ Đang đồng bộ...</span>}
{syncStatus === 'synced'  && <span className="text-green-500  text-xs">✅ Đã đồng bộ với hub</span>}
{syncStatus === 'offline' && <span className="text-red-500    text-xs">⚠️ Hub offline, sẽ sync khi kết nối lại</span>}
```

**Khi hub offline:** BE vẫn lưu rules vào DB. Khi hub reconnect → hub subscribe topic `cloud/{hub_id}/rules` với retain=true → nhận rules mới nhất ngay lập tức.

---

## 8. Authentication Flow

```
Login  → POST /auth/login → { accessToken (15m), refreshToken (7d) }
         FE lưu accessToken vào memory, refreshToken vào localStorage

API    → Header: Authorization: Bearer <accessToken>

Hết hạn → FE tự động POST /auth/refresh → lấy accessToken mới

Logout → POST /auth/logout → BE invalidate refreshToken trong DB
```

---

## 9. Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smarthome

# JWT
JWT_SECRET=<random 64 chars>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<random 64 chars>
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloud MQTT Broker
MQTT_BROKER_URL=mqtts://your-broker.hivemq.cloud:8883
MQTT_USERNAME=cloud-be
MQTT_PASSWORD=<password>
MQTT_CLIENT_ID=cloud-be-server

# Hub
HUB_ID=smarthome-hub-001
```

---

## 10. Thứ tự implement

```
Module 1 — Foundation
  ├─ src/config/db.js      MongoDB connect
  ├─ src/config/mqtt.js    Cloud MQTT client
  ├─ src/models/           4 schemas
  └─ src/app.js + server.js

Module 2 — MQTT Core
  ├─ src/services/mqttService.js   subscribe + dispatch
  ├─ src/services/hubService.js    onConfig, onStatus, onSensorData
  └─ src/services/commandService.js onAck + publish command

Module 3 — REST API
  ├─ src/middleware/auth.js
  ├─ src/routes/auth.js
  ├─ src/routes/state.js
  ├─ src/routes/control.js
  ├─ src/routes/history.js
  └─ src/routes/hub.js

Module 4 — Socket.io
  └─ src/socket/index.js   setup + push events

Module 5 — FE Integration
  └─ Cập nhật SmartHomeContext.tsx
     • Thay simulation → REST + Socket.io
     • Thêm DEVICE_MAP, SENSOR_MAP
     • Thêm hubOnline state + badge
```

---

## 11. Hub Side — Nhận và apply rules từ cloud

`cloud_sync_service.py` cần xử lý thêm:

**Subscribe topic rules:**
```python
# Trong _on_connect:
client.subscribe(f"cloud/{HUB_ID}/rules")
```

**Handler nhận rules:**
```python
def _on_cloud_rules(self, payload):
    rules = json.loads(payload)
    # Lưu vào file để persist qua restart
    with open("cloud_rules.json", "w") as f:
        json.dump(rules, f)
    # Apply vào rule engine ngay lập tức
    self.rule_engine.load_cloud_rules(rules)
    # Ack lại cloud
    self.client.publish(f"cloud/{HUB_ID}/rules_ack",
        json.dumps({"synced": True, "timestamp": datetime.utcnow().isoformat()}))
```

**Rule engine đọc cloud rules:**  
`simple/rules_simple.py` khi check rules, ưu tiên `cloud_rules.json` nếu tồn tại.  
File `MY_RULES.py` vẫn là fallback khi không có cloud rules.

```
Ưu tiên: cloud_rules.json > MY_RULES.py
```

---

## 12. Những gì KHÔNG làm trong BE này

- **Tự xử lý automation logic** — BE chỉ relay rules, hub mới thực thi
- **Lưu sensor data qua REST** — chỉ nhận qua MQTT từ hub
- **Multi-hub UI** — DB đã có hub_id nhưng FE chưa cần
- **Push notification** (email/SMS) — mở rộng sau
