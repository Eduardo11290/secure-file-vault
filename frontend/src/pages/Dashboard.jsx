import React, { useState } from 'react';
import { FileOutput, ShieldAlert, Settings, LogOut, ChevronRight } from 'lucide-react';
import FilesView from '../components/FilesView';
import SettingsView from '../components/SettingsView';
import AuditLogView from '../components/AuditLogView';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';

export default function Dashboard() {
  const [activeView, setActiveView] = useState('Files');
  const dispatch = useDispatch();

  const renderView = () => {
    switch(activeView) {
      case 'Files': return <FilesView />;
      case 'Settings': return <SettingsView />;
      case 'AuditLog': return <AuditLogView />;
      default: return <FilesView />;
    }
  };

  const navItems = [
    { id: 'Files', label: 'My Vault', icon: <FileOutput size={20} /> },
    { id: 'AuditLog', label: 'Audit Log', icon: <ShieldAlert size={20} /> },
    { id: 'Settings', label: 'Account Settings', icon: <Settings size={20} /> }
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Sidebar background gradient element */}
      <div className="absolute top-0 left-0 w-72 h-full bg-gradient-to-b from-indigo-900/10 to-emerald-900/5 pointer-events-none"></div>
      
      {/* Sidebar */}
      <div className="w-72 bg-slate-900/80 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col z-20 shadow-2xl relative">
        <div className="p-7 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)] relative overflow-hidden group hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all">
            <div className="absolute inset-0 bg-emerald-400/10 blur-md group-hover:bg-emerald-400/20 transition-all"></div>
            <ShieldAlert size={22} className="text-emerald-400 relative z-10" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400 tracking-wide">
              SecureVault
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mt-0.5">Enterprise Edition</p>
          </div>
        </div>
        
        <div className="flex-1 py-8 px-4 space-y-2">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>}
                
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                <span className="font-medium tracking-wide">{item.label}</span>
                
                {isActive && (
                   <ChevronRight size={16} className="ml-auto opacity-70" />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
           <button 
             onClick={() => dispatch(logoutUser())} 
             className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 font-medium"
           >
             <LogOut size={18} />
             <span>Sign Out Securely</span>
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/30 via-slate-900 to-slate-950">
        
        {/* Deep ambient glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 w-[800px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>
        
        {/* Top Navbar */}
        <header className="h-20 border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-8 z-10 shadow-sm relative">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-wide">{navItems.find(i => i.id === activeView)?.label}</h2>
          </div>
          <div className="flex justify-end items-center gap-5">
             <div className="px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-[pulse_2s_ease-in-out_infinite]"></div>
               SYSTEM SECURE
             </div>
             
             {/* Simple user avatar corner */}
             <div onClick={() => setActiveView('Settings')} className="w-9 h-9 rounded-full bg-indigo-500 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-lg cursor-pointer hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
                ES
             </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-0 hide-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
