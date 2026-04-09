import React, { useState } from 'react';
import { KeyRound, Smartphone, Monitor, LogOut } from 'lucide-react';

export default function SettingsView() {
  const [faEnabled, setFaEnabled] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRevoke = (device) => {
    showToast(`Access revoked for ${device}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">
      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white px-4 py-3 border border-emerald-400/50 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] z-50 flex items-center space-x-2">
           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
           <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      <div className="backdrop-blur-md bg-white/5 border border-slate-700/60 rounded-2xl p-8 shadow-2xl flex items-center gap-6 transition-all hover:bg-white/10">
        <div className="shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          ES
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-slate-100">Eduard Stefoni</h2>
          <p className="text-slate-400 font-mono text-base mt-1">edystefoni2005@gmail.com</p>
        </div>
      </div>

      <div className="backdrop-blur-md bg-white/5 border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-700/50">
          <KeyRound className="text-emerald-400" size={22} />
          <h3 className="text-xl font-medium text-slate-200">Password Security</h3>
        </div>
        <form className="space-y-5 max-w-md" onSubmit={(e) => { e.preventDefault(); showToast('Password updated successfully!'); }}>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Old Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" />
          </div>
          <div className="pt-3">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center space-x-2">
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      <div className="backdrop-blur-md bg-white/5 border border-slate-700/60 rounded-2xl p-8 shadow-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Smartphone className="text-emerald-400" size={22} />
            <h3 className="text-xl font-medium text-slate-200">Two-Factor Authentication (2FA)</h3>
          </div>
          <p className="text-slate-400 mt-1">Add an extra layer of security using Google Authenticator.</p>
        </div>
        <button 
          onClick={() => setFaEnabled(!faEnabled)}
          className={`shrink-0 w-16 h-8 rounded-full relative transition-all duration-500 focus:outline-none ${faEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-slate-700 border border-slate-600'}`}
        >
          <span className={`block w-6 h-6 bg-white rounded-full absolute top-1 transition-transform duration-500 shadow-md ${faEnabled ? 'translate-x-9' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="backdrop-blur-md bg-white/5 border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-700/50">
          <Monitor className="text-emerald-400" size={22} />
          <h3 className="text-xl font-medium text-slate-200">Active Sessions</h3>
        </div>
        <div className="space-y-4">
          {[
            { id: 1, name: 'Windows 11 - Chrome', location: 'Resita, RO', ip: '192.168.1.45', current: true },
            { id: 2, name: 'Mobile Device - Android', location: 'Timisoara, RO', ip: '10.0.0.12', current: false }
          ].map(session => (
            <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-slate-900/50 border border-slate-700/60 hover:bg-slate-800/80 transition-all shadow-inner group">
              <div className="mb-4 sm:mb-0">
                <p className="text-slate-200 font-medium flex items-center text-lg">
                  {session.name} 
                  {session.current && <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full ml-4 shadow-[0_0_8px_rgba(16,185,129,0.2)]">Current</span>}
                </p>
                <div className="flex items-center space-x-3 text-slate-400 mt-2">
                  <span>{session.location}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  <span className="font-mono text-sm">{session.ip}</span>
                </div>
              </div>
              {!session.current && (
                <button 
                  onClick={() => handleRevoke(session.name)}
                  className="shrink-0 flex items-center justify-center space-x-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-5 py-2.5 rounded-lg border border-transparent hover:border-red-500/30 transition-all duration-300 opacity-90 hover:opacity-100"
                >
                  <LogOut size={18} />
                  <span>Revoke Access</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}