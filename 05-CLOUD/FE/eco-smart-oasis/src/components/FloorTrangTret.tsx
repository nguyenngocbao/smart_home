import React from 'react';
import { useSmartHome } from '../context/SmartHomeContext';
import { Power, Blinds } from 'lucide-react';

export const FloorTrangTret: React.FC = () => {
  const { devices, toggleDevice } = useSmartHome();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <header className="mb-4">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Tầng Trệt</h1>
        <p className="text-gray-500 text-lg font-medium">Phòng khách & Không gian chung.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Đèn Tầng 1 */}
        <div className="p-8 rounded-3xl bg-white border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl transition-colors ${devices.light1On ? 'bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100' : 'bg-gray-50 text-gray-400 ring-1 ring-gray-100'}`}>
                  <Power className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight">Đèn chiếu sáng</h3>
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Relay 1</p>
                </div>
             </div>
             
             <button 
                onClick={() => toggleDevice('light1On')}
                className={`relative inline-flex h-10 w-16 items-center rounded-full transition-colors focus:outline-none ${
                  devices.light1On ? 'bg-yellow-500' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform shadow-md ${devices.light1On ? 'translate-x-7' : 'translate-x-1'}`} />
             </button>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-gray-800 bg-gray-50/50 p-4 rounded-2xl ring-1 ring-gray-100/50">
             <span className="uppercase text-xs tracking-widest text-gray-400">Trạng Thái</span>
             {devices.light1On ? <span className="text-yellow-600">Đang Bật</span> : <span className="text-gray-500">Đang Tắt</span>}
          </div>
        </div>

        {/* Rèm Thông Minh */}
        <div className="p-8 rounded-3xl bg-white border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all">
          <div className="flex items-center gap-5 mb-10">
             <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
               <Blinds className="w-8 h-8" />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Rèm Cửa Thông Minh</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Động Cơ Servo</p>
             </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-2">
             <div className="flex justify-between items-end text-sm text-gray-400 font-bold uppercase tracking-widest mb-6">
                <span>Đóng (0%)</span>
                <span className="text-indigo-600 font-black text-3xl tracking-tight leading-none">{devices.blindsPosition}%</span>
                <span>Mở (100%)</span>
             </div>
             <div className="relative w-full h-8 flex items-center">
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={devices.blindsPosition}
                    onChange={(e) => toggleDevice('blindsPosition', parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600 ring-1 ring-inset ring-gray-200"
                 />
             </div>
             <div className="mt-8 text-xs font-semibold uppercase tracking-widest text-gray-400 text-center">
                Kéo thanh trượt để điều khiển rèm
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
