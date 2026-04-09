import React, { useState } from 'react';
import { X, Lock, Link as LinkIcon, AlertTriangle, Send } from 'lucide-react';

export default function ShareModal({ file, onClose }) {
  const [protectWithPin, setProtectWithPin] = useState(false);
  const [downloadLimit, setDownloadLimit] = useState('Unlimited');

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xl px-4 animate-in fade-in duration-200">
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden relative transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full p-1.5 transition-all outline-none">
          <X size={18} />
        </button>
        
        <div className="p-7 relative z-10">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center space-x-2">
            <LinkIcon size={20} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <span>Secure Share</span>
          </h2>
          <p className="text-slate-400 text-sm font-mono mb-6 pb-5 border-b border-slate-700/60 truncate" title={file.name}>
            {file.name}
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Email</label>
              <input type="email" placeholder="colleague@company.com" className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono shadow-inner placeholder-slate-600" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 shadow-sm">
               <div className="flex items-center space-x-3">
                 <div className="p-2 bg-emerald-500/10 rounded-lg">
                   <Lock size={16} className="text-emerald-400" />
                 </div>
                 <span className="text-sm font-medium text-slate-200">Protect with PIN</span>
               </div>
               <button 
                  onClick={() => setProtectWithPin(!protectWithPin)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 focus:outline-none ${protectWithPin ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-700 border border-slate-600'}`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-sm ${protectWithPin ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
            </div>

            {protectWithPin && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200 bg-slate-900/40 p-4 rounded-xl border border-amber-500/20">
                 <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center space-x-1.5">
                    <span>Access PIN</span>
                    <AlertTriangle size={14} className="text-amber-400" />
                 </label>
                 <input type="text" placeholder="e.g. 8492" maxLength={6} className="w-full bg-slate-900/90 border border-slate-600 rounded-lg px-4 py-3 text-white font-mono tracking-widest text-center text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Download Limit</label>
              <div className="relative">
                <select 
                  value={downloadLimit} 
                  onChange={(e) => setDownloadLimit(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer shadow-inner pr-10"
                >
                  <option value="1">1 Download (Burn after reading)</option>
                  <option value="5">5 Downloads</option>
                  <option value="Unlimited">Unlimited</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-slate-400"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-900/80 border-t border-slate-700/80 flex items-center justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900">
            Cancel
          </button>
          <button onClick={() => { alert('Secure link sent!'); onClose(); }} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900">
            <Send size={16} />
            <span>Send Secure Link</span>
          </button>
        </div>
      </div>
    </div>
  );
}
