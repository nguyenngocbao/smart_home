import React, { useState } from 'react';
import { useSmartHome } from '../context/SmartHomeContext';
import { Settings2, Clock, Trash2, Plus, Thermometer, Sun, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const TimePicker: React.FC<{
  value: string;
  onChange: (v: string) => void;
  accentClass?: string;
}> = ({ value, onChange, accentClass = 'focus:border-yellow-500 focus:ring-yellow-500' }) => {
  const [h, m] = value.split(':');
  const selectClass = `bg-white border border-gray-300 text-gray-900 font-mono font-bold rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 shadow-sm ${accentClass}`;
  return (
    <div className="flex items-center gap-1">
      <select value={h} onChange={e => onChange(`${e.target.value}:${m}`)} className={selectClass}>
        {HOURS.map(hh => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span className="font-bold text-gray-500 text-lg">:</span>
      <select value={m} onChange={e => onChange(`${h}:${e.target.value}`)} className={selectClass}>
        {MINUTES.map(mm => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
};

export const Automations: React.FC = () => {
  const { rules, updateRule, addWateringTime, removeWateringTime, rulesSyncStatus, lightActuators } = useSmartHome();
  const [newTime, setNewTime] = useState('08:00');

  const handleAddWatering = () => {
    if (newTime) addWateringTime(newTime);
  };

  const SyncBadge = () => {
    if (rulesSyncStatus === 'synced')
      return <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />Đã đồng bộ với hub</span>;
    if (rulesSyncStatus === 'offline')
      return <span className="flex items-center gap-1.5 text-xs font-bold text-red-500"><WifiOff className="w-3.5 h-3.5" />Hub offline — sẽ sync khi kết nối lại</span>;
    return <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500"><RefreshCw className="w-3.5 h-3.5 animate-spin" />Đang đồng bộ...</span>;
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Tự Động Hóa (Rules)</h1>
            <p className="text-gray-500">Thiết lập các kịch bản chạy tự động cho hệ thống IoT.</p>
          </div>
          <div className="mt-1"><SyncBadge /></div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Plant Watering Rules */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="bg-emerald-100 p-2 rounded-xl"><Clock className="w-5 h-5 text-emerald-600" /></div>
               <h2 className="text-xl font-bold text-gray-900">Tưới Cây (Module 1)</h2>
             </div>
             <button
               onClick={() => updateRule('wateringSensor', { enabled: !rules.wateringSensor.enabled })}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${rules.wateringSensor.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
             >
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${rules.wateringSensor.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
           </div>

           <div className="space-y-5">
             {/* Sensor thresholds */}
             <div className={`space-y-4 transition-opacity ${rules.wateringSensor.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-sm font-medium text-gray-700">Bật bơm khi độ ẩm đất dưới</label>
                   <span className="font-bold text-emerald-600 text-lg">{rules.wateringSensor.dryThreshold}%</span>
                 </div>
                 <input type="range" min="10" max="50" step="5"
                   value={rules.wateringSensor.dryThreshold}
                   onChange={(e) => updateRule('wateringSensor', { dryThreshold: parseInt(e.target.value) })}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                 />
               </div>
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-sm font-medium text-gray-700">Tắt bơm khi độ ẩm đất trên</label>
                   <span className="font-bold text-emerald-600 text-lg">{rules.wateringSensor.wetThreshold}%</span>
                 </div>
                 <input type="range" min="50" max="90" step="5"
                   value={rules.wateringSensor.wetThreshold}
                   onChange={(e) => updateRule('wateringSensor', { wetThreshold: parseInt(e.target.value) })}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                 />
               </div>
               <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                 <div>
                   <div className="text-sm font-bold text-gray-800">Tắt bơm khi mưa</div>
                   <div className="text-xs text-gray-500">Ưu tiên cao nhất — tắt bơm ngay lập tức.</div>
                 </div>
                 <button
                   onClick={() => updateRule('wateringSensor', { stopOnRain: !rules.wateringSensor.stopOnRain })}
                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rules.wateringSensor.stopOnRain ? 'bg-blue-500' : 'bg-gray-300'}`}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${rules.wateringSensor.stopOnRain ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
               </div>
             </div>

             {/* Time schedule */}
             <div className="pt-4 border-t border-gray-100">
               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lịch tưới cố định</div>
               {rules.wateringSchedule.length === 0 ? (
                 <p className="text-sm text-gray-400 italic">Chưa có lịch tưới.</p>
               ) : (
                 <div className="flex flex-wrap gap-3 mb-3">
                   {rules.wateringSchedule.map((time) => (
                     <div key={time} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                       <span className="font-mono text-gray-700 font-bold text-sm">{time}</span>
                       <button onClick={() => removeWateringTime(time)} className="text-gray-400 hover:text-red-500 transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
               <div className="flex items-center gap-3">
                 <TimePicker
                   value={newTime}
                   onChange={setNewTime}
                   accentClass="focus:border-emerald-500 focus:ring-emerald-500"
                 />
                 <button onClick={handleAddWatering}
                   className="flex items-center gap-2 bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                 >
                   <Plus className="w-4 h-4" /> Thêm lịch
                 </button>
               </div>
             </div>
           </div>
        </div>

        {/* Lighting Rules */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="bg-yellow-100 p-2 rounded-xl"><Clock className="w-5 h-5 text-yellow-600" /></div>
               <h2 className="text-xl font-bold text-gray-900">Hẹn Giờ Đèn (Module 3)</h2>
             </div>
             <button 
                onClick={() => updateRule('lightingSchedule', { enabled: !rules.lightingSchedule.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  rules.lightingSchedule.enabled ? 'bg-yellow-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${rules.lightingSchedule.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
           </div>
           
           <div className={`space-y-4 transition-opacity ${rules.lightingSchedule.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tự bật lúc</label>
                 <TimePicker
                   value={rules.lightingSchedule.onTime}
                   onChange={(v) => updateRule('lightingSchedule', { onTime: v })}
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tự tắt lúc</label>
                 <TimePicker
                   value={rules.lightingSchedule.offTime}
                   onChange={(v) => updateRule('lightingSchedule', { offTime: v })}
                 />
               </div>
             </div>

             <div className="pt-3 border-t border-gray-100">
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Áp dụng cho đèn</label>
               <div className="flex flex-wrap gap-3">
                 {lightActuators.map(({ id, label }) => {
                   const checked = rules.lightingSchedule.lights.includes(id);
                   const toggle = () => {
                     const next = checked
                       ? rules.lightingSchedule.lights.filter(l => l !== id)
                       : [...rules.lightingSchedule.lights, id];
                     updateRule('lightingSchedule', { lights: next });
                   };
                   return (
                     <button key={id} onClick={toggle}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                         checked
                           ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                           : 'bg-gray-50 border-gray-200 text-gray-400'
                       }`}
                     >
                       <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${checked ? 'bg-yellow-400 border-yellow-400' : 'border-gray-300'}`}>
                         {checked && <span className="text-white text-xs">✓</span>}
                       </span>
                       {label}
                     </button>
                   );
                 })}
               </div>
             </div>
           </div>
        </div>

        {/* Skylight Rules */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="bg-sky-100 p-2 rounded-xl"><Thermometer className="w-5 h-5 text-sky-600" /></div>
               <h2 className="text-xl font-bold text-gray-900">Cửa Sổ Trời (Module 4)</h2>
             </div>
             <button 
                onClick={() => updateRule('skylightRules', { enabled: !rules.skylightRules.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  rules.skylightRules.enabled ? 'bg-sky-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${rules.skylightRules.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
           </div>
           
           <div className={`space-y-6 transition-opacity ${rules.skylightRules.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
             <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ngưỡng nhiệt độ mở cửa</label>
                  <span className="font-bold text-sky-600 text-lg">{rules.skylightRules.autoOpenTemp}°C</span>
                </div>
                <input 
                  type="range" 
                  min="25" 
                  max="45" 
                  step="1"
                  value={rules.skylightRules.autoOpenTemp}
                  onChange={(e) => updateRule('skylightRules', { autoOpenTemp: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <p className="text-xs text-gray-500 mt-2">Cửa sổ trời mở tự động để thông gió khi nhiệt độ cao hơn ngưỡng này.</p>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                   <div className="text-sm font-bold text-gray-800">Cảm biến mưa</div>
                   <div className="text-xs text-gray-500">Tự động đóng cửa sổ ngay lập tức nếu trời mưa.</div>
                </div>
                <button 
                  onClick={() => updateRule('skylightRules', { closeOnRain: !rules.skylightRules.closeOnRain })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rules.skylightRules.closeOnRain ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${rules.skylightRules.closeOnRain ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>
           </div>
        </div>

        {/* Blinds Rules */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="bg-amber-100 p-2 rounded-xl"><Sun className="w-5 h-5 text-amber-600" /></div>
               <h2 className="text-xl font-bold text-gray-900">Rèm Tự Động (Module 2)</h2>
             </div>
             <button 
                onClick={() => updateRule('blindsAuto', { enabled: !rules.blindsAuto.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  rules.blindsAuto.enabled ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${rules.blindsAuto.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
           </div>
           
           <div className={`space-y-6 transition-opacity ${rules.blindsAuto.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
             
             <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Đóng rèm nếu ánh sáng vượt</label>
                  <span className="font-bold text-amber-600 text-lg">{rules.blindsAuto.closeThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  step="5"
                  value={rules.blindsAuto.closeThreshold}
                  onChange={(e) => updateRule('blindsAuto', { closeThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-xs text-gray-500 mt-2">Ví dụ: đóng rèm cản nắng trưa.</p>
             </div>

             <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Mở rèm nếu ánh sáng dưới</label>
                  <span className="font-bold text-amber-600 text-lg">{rules.blindsAuto.openThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  step="5"
                  value={rules.blindsAuto.openThreshold}
                  onChange={(e) => updateRule('blindsAuto', { openThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-xs text-gray-500 mt-2">Ví dụ: mở rèm đón ánh sáng nhẹ.</p>
             </div>

           </div>
        </div>

      </div>

    </div>
  );
};
