import React from 'react';
import { useSmartHome } from '../context/SmartHomeContext';
import { Droplet, Sun, Lightbulb, Blinds, Power } from 'lucide-react';

export const Devices: React.FC = () => {
  const { devices, toggleDevice } = useSmartHome();

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-white mb-2">Device Control</h1>
        <p className="text-slate-400">Manual override and control for the IoT acting devices.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Module 1: Water Pump */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
             <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${devices.waterPumpOn ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                  <Droplet className={`w-6 h-6 transition-colors ${devices.waterPumpOn ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <div>
                   <h3 className="text-lg font-medium text-slate-200">Water Pump</h3>
                   <p className="text-sm text-slate-500">Module 1</p>
                </div>
             </div>
             
             <button 
                onClick={() => toggleDevice('waterPumpOn')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  devices.waterPumpOn ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${devices.waterPumpOn ? 'translate-x-7' : 'translate-x-1'}`} />
             </button>
          </div>
          <div className="text-sm font-mono text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
             Status: {devices.waterPumpOn ? <span className="text-cyan-400">Pumping Water...</span> : 'Idle'}
          </div>
        </div>

         {/* Module 4: Skylight */}
         <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
             <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${devices.skylightOpen ? 'bg-sky-500/20' : 'bg-slate-800'}`}>
                  <Sun className={`w-6 h-6 transition-colors ${devices.skylightOpen ? 'text-sky-400' : 'text-slate-500'}`} />
                </div>
                <div>
                   <h3 className="text-lg font-medium text-slate-200">Skylight Motor</h3>
                   <p className="text-sm text-slate-500">Module 4</p>
                </div>
             </div>
             
             <button 
                onClick={() => toggleDevice('skylightOpen')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  devices.skylightOpen ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${devices.skylightOpen ? 'translate-x-7' : 'translate-x-1'}`} />
             </button>
          </div>
          <div className="text-sm font-mono text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
             Status: {devices.skylightOpen ? <span className="text-sky-400">Open (Ventilating)</span> : 'Closed'}
          </div>
        </div>

        {/* Module 3: Lighting */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4 mb-8">
             <div className={`p-3 rounded-xl ${devices.light1On || devices.light2On ? 'bg-yellow-500/20' : 'bg-slate-800'}`}>
               <Lightbulb className={`w-6 h-6 ${devices.light1On || devices.light2On ? 'text-yellow-400' : 'text-slate-500'}`} />
             </div>
             <div>
                <h3 className="text-lg font-medium text-slate-200">Remote Lighting</h3>
                <p className="text-sm text-slate-500">Module 3 (2 Relays)</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={() => toggleDevice('light1On')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
                  devices.light1On ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
             >
                <Power className="w-8 h-8 mb-3" />
                <span className="font-medium text-sm text-slate-200">Light / Tầng 1</span>
                <span className="text-xs opacity-70 mt-1">{devices.light1On ? 'On' : 'Off'}</span>
             </button>

             <button 
                onClick={() => toggleDevice('light2On')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
                  devices.light2On ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
             >
                <Power className="w-8 h-8 mb-3" />
                <span className="font-medium text-sm text-slate-200">Light / Tầng 2</span>
                <span className="text-xs opacity-70 mt-1">{devices.light2On ? 'On' : 'Off'}</span>
             </button>
          </div>
        </div>

        {/* Module 2: Smart Blinds */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4 mb-8">
             <div className={`p-3 rounded-xl bg-amber-500/20`}>
               <Blinds className={`w-6 h-6 text-amber-500`} />
             </div>
             <div>
                <h3 className="text-lg font-medium text-slate-200">Smart Blinds Position</h3>
                <p className="text-sm text-slate-500">Module 2 (Servo Motor)</p>
             </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-2">
             <div className="flex justify-between text-sm text-slate-400 font-mono mb-4">
                <span>0% (Closed)</span>
                <span className="text-amber-400 font-bold">{devices.blindsPosition}%</span>
                <span>100% (Open)</span>
             </div>
             <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={devices.blindsPosition}
                onChange={(e) => toggleDevice('blindsPosition', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
             />
             <div className="mt-8 text-xs text-slate-500 flex justify-center">
                Drag slider to manually control blind position
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
