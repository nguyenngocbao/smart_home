import React from 'react';
import { useSmartHome } from '../context/SmartHomeContext';
import { Thermometer, Droplets, Sun, CloudRain, Sprout, ChevronRight } from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { sensors, devices } = useSmartHome();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <header className="mb-2">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Tổng Quan</h1>
        <p className="text-gray-500 text-lg font-medium">Eco-Smart Oasis — Quận 9, TP. Thủ Đức</p>
      </header>

      {/* ── Môi trường chi tiết ─────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-black text-gray-900 mb-6">Môi trường</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Nhiệt độ */}
          <div className="p-6 rounded-3xl bg-white border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_40px_rgb(0,0,0,0.07)] transition-all">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-rose-50 ring-1 ring-gray-900/5">
              <Thermometer className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nhiệt độ</div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter">{sensors.temperature}°C</div>
              <div className="text-xs text-gray-400 mt-1 font-medium">Sân thượng</div>
            </div>
          </div>

          {/* Độ ẩm đất */}
          <div className="p-6 rounded-3xl bg-white border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_40px_rgb(0,0,0,0.07)] transition-all">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-emerald-50 ring-1 ring-gray-900/5">
              <Sprout className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Độ ẩm đất</div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter">{sensors.soilMoisture}%</div>
              <div className="text-xs text-gray-400 mt-1 font-medium">Ban công / Sân thượng</div>
            </div>
          </div>

          {/* Ánh sáng */}
          <div className="p-6 rounded-3xl bg-white border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_40px_rgb(0,0,0,0.07)] transition-all">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-amber-50 ring-1 ring-gray-900/5">
              <Sun className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ánh sáng</div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter">{sensors.lightIntensity}%</div>
              <div className="text-xs text-gray-400 mt-1 font-medium">Phòng ngủ</div>
            </div>
          </div>

          {/* Thời tiết */}
          <div className={`p-6 rounded-3xl border flex flex-col justify-between hover:shadow-[0_8px_40px_rgb(0,0,0,0.07)] transition-all ${
            sensors.isRaining
              ? 'bg-blue-50 border-blue-100 shadow-[0_8px_30px_rgba(59,130,246,0.08)]'
              : 'bg-white border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-gray-900/5 ${
              sensors.isRaining ? 'bg-blue-100' : 'bg-amber-50'
            }`}>
              {sensors.isRaining
                ? <CloudRain className="w-6 h-6 text-blue-500" />
                : <Sun className="w-6 h-6 text-amber-400" />
              }
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Thời tiết</div>
              <div className={`text-3xl font-black tracking-tighter ${sensors.isRaining ? 'text-blue-700' : 'text-gray-900'}`}>
                {sensors.isRaining ? 'Có Mưa' : 'Trời Nắng'}
              </div>
              <div className="text-xs text-gray-400 mt-1 font-medium">Sân thượng</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Trạng thái thiết bị từng tầng ───────────────────────────── */}
      <section>
        <h2 className="text-xl font-black text-gray-900 mb-6">Trạng thái thiết bị</h2>
        <div className="space-y-4">

          {/* Tầng Trệt */}
          <button
            onClick={() => setActiveTab('floor-trang-tret')}
            className="w-full text-left p-6 rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 text-base uppercase tracking-widest">Tầng Trệt</h3>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                <span className="text-gray-600 font-semibold text-sm">Đèn chiếu sáng</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${devices.light1On ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                  {devices.light1On ? 'Đang Bật' : 'Tắt'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                <span className="text-gray-600 font-semibold text-sm">Rèm thông minh</span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                  {devices.blindsPosition}% Mở
                </span>
              </div>
            </div>
          </button>

          {/* Lầu 1 */}
          <button
            onClick={() => setActiveTab('floor-lau-1')}
            className="w-full text-left p-6 rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 text-base uppercase tracking-widest">Lầu 1</h3>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                <span className="text-gray-600 font-semibold text-sm">Đèn chiếu sáng</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${devices.light2On ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                  {devices.light2On ? 'Đang Bật' : 'Tắt'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                <span className="text-gray-600 font-semibold text-sm">Máy bơm nước</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${devices.waterPumpOn ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {devices.waterPumpOn ? 'Đang Bơm' : 'Chờ'}
                </span>
              </div>
            </div>
          </button>

          {/* Sân Thượng */}
          <button
            onClick={() => setActiveTab('floor-san-thuong')}
            className="w-full text-left p-6 rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 text-base uppercase tracking-widest">Sân Thượng</h3>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                <span className="text-gray-600 font-semibold text-sm">Cửa sổ trời</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${devices.skylightOpen ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
                  {devices.skylightOpen ? 'Đang Mở' : 'Đóng'}
                </span>
              </div>
            </div>
          </button>

        </div>
      </section>
    </div>
  );
};
