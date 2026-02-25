import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom';
import { 
  LayoutDashboard, Users, BrainCircuit, Settings, PhoneCall, Mic, MicOff, Plus, 
  TrendingUp, Calendar, ArrowRight, Loader2, MessageSquare, BarChart3, Lock, 
  ShieldCheck, Search, Bell, Layers, CheckCircle, Clock, Sparkles, Zap,
  Terminal, Activity, AlertCircle
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [crmData, setCrmData] = useState({
    loading: true,
    stats: { pipelineValue: 0, totalLeads: 0, winRate: 68, aiActions: 124 },
    opportunities: []
  });
  
  const [systemLogs, setSystemLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Sync data and pull system logs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch CRM Data
        const res = await fetch('/api/ghl/sync', { method: 'POST' });
        const result = await res.json();
        setCrmData({ loading: false, stats: result.stats, opportunities: result.opportunities });

        // Fetch System Logs for debugging
        const logRes = await fetch('/api/debug/logs');
        const logData = await logRes.json();
        setSystemLogs(logData.logs);
      } catch (e) {
        console.error("Sync Error", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh logs every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-[#020617] flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <span className="font-bold tracking-tight text-white uppercase text-sm">Big Blue Intelligence</span>
        </div>

        <nav className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 opacity-50 cursor-not-allowed">
            <BrainCircuit size={18} /> Moore AI Hub <span className="text-[10px] bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded ml-auto">LIVE</span>
          </button>
        </nav>

        <button 
          onClick={() => setShowLogs(!showLogs)}
          className={`mt-auto flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${showLogs ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500'}`}
        >
          <Terminal size={18} /> System Console
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-bottom border-slate-800 flex items-center justify-between px-8 bg-[#020617]/50 backdrop-blur-md">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Terminal size={14} /> <span>{`nexus.bigbluecollar.tech > dashboard`}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                <ShieldCheck size={12} className="text-blue-400" />
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">Enterprise Environment</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Command Center</h1>
              <p className="text-slate-500 italic text-sm font-light">GoHighLevel v2 API Live Synchronization</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Pipeline Value', value: `$${crmData.stats.pipelineValue.toLocaleString()}`, icon: BarChart3, trend: '+16%' },
                { label: 'Total Leads', value: crmData.stats.totalLeads, icon: Users, trend: '+24' },
                { label: 'Win Rate', value: `${crmData.stats.winRate}%`, icon: CheckCircle, trend: 'Target', trendColor: 'text-blue-400' },
                { label: 'AI Decisions', value: crmData.stats.aiActions, icon: Sparkles, trend: 'Live', trendColor: 'text-blue-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <stat.icon size={48} />
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-slate-800 rounded-lg"><stat.icon size={20} className="text-slate-400" /></div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 ${stat.trendColor || 'text-emerald-400'}`}>{stat.trend}</span>
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold text-white tracking-tighter">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Leads Section */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Lead Detail</span>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View All Opportunities</button>
              </div>
              
              <div className="divide-y divide-slate-800 min-h-[200px] flex flex-col items-center justify-center">
                {crmData.loading ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <span className="text-slate-500 animate-pulse text-sm">Synchronizing with GHL Cloud...</span>
                    </div>
                ) : crmData.opportunities.length > 0 ? (
                  crmData.opportunities.map((opp) => (
                    <div key={opp.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                          {opp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{opp.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Direct Source</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-12 text-right">
                        <div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <div className={`w-1.5 h-1.5 rounded-full ${opp.status === 'won' ? 'bg-emerald-500' : opp.status === 'lost' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                            <span className="text-xs capitalize text-slate-300">{opp.status}</span>
                          </div>
                        </div>
                        <div className="w-24 font-mono font-bold text-white text-sm">${Number(opp.value).toLocaleString()}</div>
                        <ArrowRight size={16} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-slate-600 text-sm">No active opportunities found.</div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Floating AI Action Button */}
        <div className="fixed bottom-8 left-72">
           <button className="group bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl shadow-blue-500/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
             <div className="relative">
                <Mic size={20} />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border-2 border-blue-600"></div>
             </div>
             <span className="font-bold tracking-tight text-sm">Talk to Moore</span>
           </button>
        </div>

        {/* LIVE DEBUG CONSOLE - THE LOGS YOU ASKED FOR */}
        {showLogs && (
          <div className="h-64 bg-black border-t border-orange-500/30 flex flex-col font-mono text-[11px]">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
              <span className="text-orange-400 font-bold flex items-center gap-2">
                <Terminal size={12} /> SERVER DEBUG STREAM
              </span>
              <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {systemLogs.length === 0 ? (
                <div className="text-slate-700 italic">Waiting for logs...</div>
              ) : (
                systemLogs.map((log, i) => (
                  <div key={i} className={`flex gap-3 ${log.type === 'error' ? 'text-rose-400' : log.type === 'warn' ? 'text-amber-400' : 'text-slate-400'}`}>
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    <span className="text-slate-500 shrink-0 uppercase w-10">[{log.type}]</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
