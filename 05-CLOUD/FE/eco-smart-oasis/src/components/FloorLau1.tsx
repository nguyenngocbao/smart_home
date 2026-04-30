import React from 'react';
import { useSmartHome } from '../context/SmartHomeContext';
import { Power, Droplet } from 'lucide-react';

export const FloorLau1: React.FC = () => {
  const { devices, toggleDevice } = useSmartHome();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <header className="mb-4">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Lầu 1</h1>
        <p className="text-gray-500 text-lg font-medium">Phòng ngủ & Ban công.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Đèn chiếu sáng */}
        <div className="p-8 rounded-3xl bg-white border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl transition-colors ${devices.light2On ? 'bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100' : 'bg-gray-50 text-gray-400 ring-1 ring-gray-100'}`}>
                <Power className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Đèn chiếu sáng</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Relay 2</p>
              </div>
            </div>
            <button
              onClick={() => toggleDevice('light2On')}
              className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors focus:outline-none ${
                devices.light2On ? 'bg-yellow-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform shadow-md ${devices.light2On ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-gray-800 bg-gray-50/50 p-4 rounded-2xl ring-1 ring-gray-100/50">
            <span className="uppercase text-xs tracking-widest text-gray-400">Trạng Thái</span>
            {devices.light2On ? <span className="text-yellow-600">Đang Bật</span> : <span className="text-gray-500">Đang Tắt</span>}
          </div>
        </div>

        {/* Máy bơm nước — tưới ban công */}
        <div className="p-8 rounded-3xl bg-white border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl transition-colors ${devices.waterPumpOn ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-400 ring-1 ring-gray-100'}`}>
                <Droplet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Máy Bơm Nước</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Tưới Ban Công</p>
              </div>
            </div>
            <button
              onClick={() => toggleDevice('waterPumpOn')}
              className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors focus:outline-none ${
                devices.waterPumpOn ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform shadow-md ${devices.waterPumpOn ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-gray-800 bg-gray-50/50 p-4 rounded-2xl ring-1 ring-gray-100/50">
            <span className="uppercase text-xs tracking-widest text-gray-400">Trạng Thái</span>
            {devices.waterPumpOn ? <span className="text-emerald-600 animate-pulse">Đang Bơm...</span> : <span className="text-gray-500">Đang Chờ</span>}
          </div>
        </div>

      </div>
    </div>
  );
};
