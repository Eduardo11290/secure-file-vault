import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Loader2 } from 'lucide-react';
import apiClient from '../api/client';

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const heatmapDays = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    intensity: Math.floor(Math.random() * 4)
  }));

  const intensities = {
    0: 'bg-slate-800/40 border-slate-700/50',
    1: 'bg-emerald-900/60 border-emerald-800/50',
    2: 'bg-emerald-600/80 border-emerald-500/60',
    3: 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
  };

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/audit/');
        
        const formattedLogs = response.data.map(log => ({
          id: log.id,
          action: log.action || log.event_type || 'System Event',
          ip: log.ip_address || 'Unknown',
          time: new Date(log.created_at).toLocaleString('en-US'),
          isWarning: log.status === 'failed' || (log.action && log.action.toLowerCase().includes('fail'))
        }));

        setLogs(formattedLogs);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="backdrop-blur-md bg-white/5 border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex items-center space-x-2 mb-8 pb-4 border-b border-slate-700/50 relative z-10">
          <Activity className="text-emerald-400" size={24} />
          <h3 className="text-xl font-medium text-slate-200">Security Activity (Last 30 Days)</h3>
        </div>
        
        <div className="flex gap-2.5 flex-wrap items-center relative z-10 p-5 bg-slate-900/40 rounded-xl border border-slate-800/80">
           {heatmapDays.map(day => (
             <div 
               key={day.id} 
               className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md border ${intensities[day.intensity]} transition-all duration-300 hover:scale-110 cursor-pointer`}
               title={`Activity Level: ${day.intensity}`}
             />
           ))}
        </div>
        
        <div className="flex items-center space-x-3 mt-6 px-2 text-sm font-medium text-slate-400 relative z-10 w-full justify-end">
          <span>Less</span>
          <div className="flex gap-2">
            <div className={`w-4 h-4 rounded-[4px] border ${intensities[0]}`}></div>
            <div className={`w-4 h-4 rounded-[4px] border ${intensities[1]}`}></div>
            <div className={`w-4 h-4 rounded-[4px] border ${intensities[2]}`}></div>
            <div className={`w-4 h-4 rounded-[4px] border ${intensities[3]}`}></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="backdrop-blur-md bg-white/5 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl relative min-h-[300px]">
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
           <h3 className="text-xl font-medium text-slate-200 flex items-center gap-3">
             <ShieldCheck size={22} className="text-slate-400" />
             Audit Log (Recent Events)
           </h3>
        </div>

        {loading ? (
          <div className="absolute inset-0 top-20 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
             <Loader2 className="animate-spin text-emerald-500" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-sm border-b border-slate-700/60">
                  <th className="py-5 px-6 font-medium">Security Event</th>
                  <th className="py-5 px-6 font-medium">IP Address</th>
                  <th className="py-5 px-6 font-medium text-right sm:text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-700/40 hover:bg-white-[0.02] transition-colors group">
                    <td className="py-5 px-6 text-slate-200">
                       <div className="flex items-center space-x-3">
                         <div className={`w-2.5 h-2.5 rounded-full ring-4 ${log.isWarning ? 'bg-red-400 ring-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.6)]' : 'bg-emerald-400 ring-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.6)]'}`}></div>
                         <span className="font-medium text-base group-hover:text-white transition-colors">{log.action}</span>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="font-mono text-slate-400 text-sm tracking-wider bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-md shadow-inner">{log.ip}</span>
                    </td>
                    <td className="py-5 px-6 text-right sm:text-left">
                       <span className="font-mono text-slate-400 text-sm tracking-wider opacity-80">{log.time}</span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-12 text-center text-slate-500">
                      No security activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}