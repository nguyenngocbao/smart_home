import React, { useState } from 'react';
import { Home, Sofa, Bed, TreePine, Leaf, Settings2, Bell, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSmartHome } from '../context/SmartHomeContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, user } = useAuth();
  const { hubOnline } = useSmartHome();

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home },
    { id: 'floor-trang-tret', label: 'Tầng Trệt', icon: Sofa },
    { id: 'floor-lau-1', label: 'Lầu 1', icon: Bed },
    { id: 'floor-san-thuong', label: 'Sân Thượng', icon: TreePine },
    { id: 'automations', label: 'Tự động', icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-gray-800 font-sans selection:bg-emerald-200 selection:text-emerald-900 flex overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-gray-900 tracking-tight">
          <Leaf className="w-6 h-6 text-emerald-500" />
          Oasis
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-600">
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 z-40 transform transition-transform duration-200 ease-in-out px-4 py-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 px-4 mb-10 font-black text-2xl tracking-tighter text-gray-900">
           <div className="p-2 bg-emerald-500 rounded-xl">
             <Leaf className="w-6 h-6 text-white" />
           </div>
           Eco-Smart
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-4 mt-2">Hệ thống Nhà</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : 'opacity-70'}`} />
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-6 px-4 space-y-3">
          {/* Hub status */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${hubOnline ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
            {hubOnline ? (
              <>
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-emerald-800">Hub Online</span>
                  <span className="text-xs text-emerald-600 font-medium">MQTT đã kết nối</span>
                </div>
                <Wifi className="w-4 h-4 text-emerald-500 ml-auto" />
              </>
            ) : (
              <>
                <div className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-gray-700">Hub Offline</span>
                  <span className="text-xs text-gray-400 font-medium">Chờ kết nối...</span>
                </div>
                <WifiOff className="w-4 h-4 text-gray-400 ml-auto" />
              </>
            )}
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-black text-emerald-700">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-800 truncate">{user?.email}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{user?.role}</div>
            </div>
            <button onClick={logout} title="Đăng xuất" className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto pt-20 pb-28 md:pt-0 md:pb-0 h-screen scroll-smooth">
        <div className="max-w-6xl mx-auto p-4 md:p-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Dễ dàng chuyển đổi tầng cho điện thoại */}
      <nav className="md:hidden fixed bottom-6 inset-x-4 bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl flex items-center justify-around px-2 py-3 z-50">
         {navItems.map((item) => {
           const Icon = item.icon;
           const isActive = activeTab === item.id;
           return (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                 isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               {isActive && (
                 <span className="absolute inset-0 bg-emerald-50 rounded-2xl scale-110 -z-10 transition-transform duration-300" />
               )}
               <Icon className={`w-6 h-6 mb-1 ${isActive ? 'translate-y-0.5' : ''} transition-transform`} />
               <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-0 h-0'} transition-all`}>
                 {item.label}
               </span>
             </button>
           );
         })}
      </nav>
    </div>
  );
};
