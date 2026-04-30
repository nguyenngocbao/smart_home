# 05-CLOUD/FE — eco-smart-oasis

**Nhóm:** Trần Kim Phương · Lê Đức Ngọc | **GVHD:** TS. Nguyễn Huỳnh Duy Khang  
**Trạng thái:** ✅ HOÀN THÀNH | **Stack:** React 19 / Vite / TypeScript / Tailwind CSS | **Port:** 5173

---

## Tổng quan

Web Dashboard điều khiển toàn bộ hệ thống Smart Home từ trình duyệt. Kết nối với **Cloud Backend** (port 3000) qua REST API + Socket.io realtime.

```
[eco-smart-oasis — React/Vite :5173]
    │  REST API (JWT Bearer)
    ├─► GET  /api/state          — polling trạng thái
    ├─► POST /api/control/...    — điều khiển actuator
    ├─► GET/PUT /api/rules       — xem/sửa automation rules
    │
    │  Socket.io WebSocket
    └─► "state_update"           — nhận realtime khi sensor thay đổi
        "hub_status"             — trạng thái online/offline của Hub
        "command_ack"            — xác nhận lệnh từ Hub
```

---

## Cấu trúc file

```
eco-smart-oasis/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
│
└── src/
    ├── main.tsx               Entry point — mount App vào #root
    ├── App.tsx                Router: Login → AppShell (tab navigation)
    ├── index.css              Global styles + Tailwind
    │
    ├── context/
    │   ├── AuthContext.tsx    JWT auth — login/logout, lưu token localStorage
    │   └── SmartHomeContext.tsx  State toàn app — socket.io listener, cache sensor/actuator
    │
    ├── lib/
    │   ├── api.ts             apiFetch() — fetch wrapper với JWT + auto-refresh
    │   └── socket.ts          Socket.io client singleton (VITE_SOCKET_URL)
    │
    ├── pages/
    │   └── Login.tsx          Màn hình đăng nhập
    │
    └── components/
        ├── Layout.tsx          Sidebar + tab navigation
        ├── Dashboard.tsx       Tổng quan toàn nhà — cards tất cả sensor/actuator
        ├── FloorTrangTret.tsx  Tầng Trệt — các phòng tầng trệt
        ├── FloorLau1.tsx       Lầu 1 — các phòng lầu 1
        ├── FloorSanThuong.tsx  Sân Thượng — bedroom + rooftop modules
        ├── Automations.tsx     Xem và chỉnh sửa automation rules
        └── Devices.tsx         Danh sách thiết bị
```

---

## Tabs & màn hình

| Tab | Component | Chức năng |
|-----|-----------|-----------|
| Dashboard | `Dashboard.tsx` | Tổng quan toàn nhà, cards tất cả sensor/actuator |
| Tầng Trệt | `FloorTrangTret.tsx` | Các phòng tầng trệt |
| Lầu 1 | `FloorLau1.tsx` | Các phòng lầu 1 |
| Sân Thượng | `FloorSanThuong.tsx` | Bedroom (rèm, đèn) + Rooftop (bơm, cửa trời) |
| Automations | `Automations.tsx` | Xem & chỉnh sửa rule config → PUT /api/rules |

---

## Context & state

### AuthContext
- Login → gọi `POST /auth/login` → lưu `access_token` + `refresh_token` vào localStorage
- Auto-refresh token khi nhận 401 (logic trong `api.ts`)
- Logout → xóa tokens + disconnect socket

### SmartHomeContext
- Kết nối Socket.io khi đăng nhập
- Lắng nghe `"state_update"` → update state React realtime
- Expose `state`, `sendCommand(locationId, actuator, value)`, `updateRules(rules)`

---

## Setup & chạy

```bash
cd 05-CLOUD/FE/eco-smart-oasis
npm install
cp .env.example .env       # điền URL cloud backend
npm run dev                # dev server http://localhost:5173
```

**File `.env` cần thiết lập:**
```ini
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

**Build production:**
```bash
npm run build      # output: dist/
npm run preview    # preview build
```

---

## Dependencies

| Package | Dùng cho |
|---------|---------|
| `react` + `react-dom` v19 | UI framework |
| `vite` + `@vitejs/plugin-react` | Build tool |
| `typescript` ~5.8 | Type safety |
| `tailwindcss` v4 | Utility CSS |
| `socket.io-client` v4.7 | WebSocket realtime |
| `lucide-react` | Icon set |
| `motion` | Animations |
| `@google/genai` | (dependency — không dùng trong production) |

---

## Lưu ý tích hợp

- Tất cả request cần header `Authorization: Bearer <accessToken>`
- `apiFetch()` trong `lib/api.ts` tự động đính kèm token và retry khi 401
- Socket.io connect với `auth: { token }` để server verify
- State realtime qua `SmartHomeContext` — component không cần tự fetch polling
