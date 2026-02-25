import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom'; // Add this line
import { 
  LayoutDashboard, Users, BrainCircuit, Settings, PhoneCall, Mic, MicOff, Plus, 
  TrendingUp, Calendar, ArrowRight, Loader2, MessageSquare, BarChart3, Lock, 
  ShieldCheck, Search, Bell, Layers, CheckCircle, Clock, Sparkles, Zap, 
  Terminal, Activity 
} from 'lucide-react';

/**
 * BIG BLUE AI - ENTERPRISE DASHBOARD
 * Connects to GHL v2 and ElevenLabs via the Node.js server.
 */

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [crmData, setCrmData] = useState({
    loading: true,
    stats: { pipelineValue: 0, totalLeads: 0, winRate: 68, aiActions: 124 },
    opportunities: []
  });

  const elRef = useRef(null);

  // Sync data from the Node.js backend
  useEffect(() => {
    const syncCRM = async () => {
      try {
        const response = await fetch('/api/ghl/sync', { method: 'POST' });
        const result = await response.json();
        
        if (result && result.opportunities) {
            const totalValue = result.opportunities.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0);
            setCrmData({
                loading: false,
                stats: { 
                    pipelineValue: totalValue, 
                    totalLeads: result.meta?.total || result.opportunities.length, 
                    winRate: 72, 
                    aiActions: 148 
                },
                opportunities: result.opportunities
            });
        }
      } catch (err) {
        console.error("CRM Synchronization Failed:", err);
        setCrmData(prev => ({ ...prev, loading: false }));
      }
    };
    syncCRM();
  }, []);

  const toggleVoiceAgent = async () => {
    if (isAiTalking) {
      if (elRef.current) elRef.current.stopSession();
      setIsAiTalking(false);
      return;
    }

    try {
      const res = await fetch('/api/voice/session', { method: 'POST' });
      const { signedUrl } = await res.json();

      if (signedUrl && window.ElevenLabs) {
        elRef.current = await window.ElevenLabs.startSession({
          signedUrl,
          onConnect: () => setIsAiTalking(true),
          onDisconnect: () => setIsAiTalking(false),
          onMessage: (m) => console.log("Moore AI:", m)
        });
      }
    } catch (err) {
      console.error("Voice Agent Error:", err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#030712] text-slate-300 overflow-hidden font-sans">
      
      {/* Sidebar Section */}
      <aside className={`bg-[#090E1A] border-r border-white/5 transition-all duration-500 ease-in-out flex flex-col z-50 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="p-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Zap size={22} fill="currentColor" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col text-left">
                <span className="text-xl font-black text-white tracking-tighter leading-none uppercase">Big Blue</span>
                <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase">Intelligence</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="mb-6">
            {!sidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 ml-1 text-left">Workspace</p>}
            <div className="space-y-1">
              <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={sidebarCollapsed} />
              <NavItem icon={<Layers size={20}/>} label="Moore AI Hub" active={activeTab === 'moore'} onClick={() => setActiveTab('moore')} collapsed={sidebarCollapsed} badge="Live" />
              <NavItem icon={<Users size={20}/>} label="Lead CRM" active={activeTab === 'crm'} onClick={() => setActiveTab('crm')} collapsed={sidebarCollapsed} />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-[#0D121F]">
          {!sidebarCollapsed && (
            <div className="mb-4 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl text-[11px] flex justify-between items-center text-left text-slate-400 font-bold">
              <span>Agent Status</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          )}
          <button 
            onClick={toggleVoiceAgent}
            className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300 ${
                isAiTalking ? 'bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-blue-500/20'
            }`}
          >
            {isAiTalking ? <MicOff size={18} /> : <Mic size={18} />}
            {!sidebarCollapsed && <span>{isAiTalking ? 'Stop Moore' : 'Talk to Moore'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Dashboard */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#030712] relative overflow-hidden text-left">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#030712]/50 backdrop-blur-xl sticky top-0 z-40">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-slate-500 hover:text-white transition-colors"><Terminal size={20} /></button>
          
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest leading-none">
                <ShieldCheck size={14}/> Enterprise Environment
             </div>
             <div className="flex items-center gap-4 group cursor-pointer text-right">
                <div>
                  <p className="text-sm font-bold text-white leading-none mb-1">Jake Moore</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">System Owner</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold uppercase">JM</div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter mb-2 leading-none">Command Center</h2>
                  <p className="text-slate-500 italic mt-2">GoHighLevel v2 API Live Synchronization</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">+ Add Opportunity</button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Pipeline Value" value={`$${crmData.stats.pipelineValue.toLocaleString()}`} trend={crmData.loading ? "..." : "+16%"} icon={<BarChart3 size={20}/>} />
                <StatCard label="Total Leads" value={crmData.stats.totalLeads} trend={crmData.loading ? "..." : "+24"} icon={<Users size={20}/>} />
                <StatCard label="Win Rate" value={`${crmData.stats.winRate}%`} trend="Target" icon={<CheckCircle size={20}/>} />
                <StatCard label="AI Decisions" value={crmData.stats.aiActions} trend="Live" icon={<Sparkles size={20}/>} />
              </div>

              <div className="bg-[#090E1A] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <table className="w-full text-left">
                    <thead className="bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                       <tr><th className="px-8 py-4">Lead Detail</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-right">Value</th><th className="px-8 py-4"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {crmData.loading ? (
                        <tr><td colSpan="4" className="px-8 py-20 text-center text-slate-500 font-bold"><Loader2 className="animate-spin inline-block mr-3"/>Synchronizing with GHL Cloud...</td></tr>
                      ) : crmData.opportunities.map(opp => (
                        <tr key={opp.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6 flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white uppercase">{opp.name ? opp.name[0] : '?'}</div>
                            <div>
                                <span className="block font-bold text-white leading-tight">{opp.name}</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{opp.source || 'Direct Source'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-left">
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                               <span className="text-sm font-semibold text-slate-400 capitalize">{opp.status}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right font-black text-white text-lg">${(opp.monetaryValue || 0).toLocaleString()}</td>
                          <td className="px-8 py-6 text-right"><ArrowRight size={18} className="text-slate-700 inline-block group-hover:text-blue-500 transition-colors"/></td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {activeTab === 'moore' && (
            <div className="max-w-7xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-4xl font-black text-white tracking-tighter mb-10 leading-none font-extrabold text-left">Moore AI Workspace</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 pb-10">
                 <KanbanCol label="Analysis" color="bg-blue-500" tasks={[{id: 1, title: 'Process Franchise Pipeline Data'}]} />
                 <KanbanCol label="Moore AI Processing" color="bg-indigo-500" tasks={[{id: 2, title: 'Voice Agent Call Tuning'}]} isProcessing />
                 <KanbanCol label="Review Required" color="bg-red-500" tasks={[]} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Sub-components

const NavItem = ({ icon, label, active, onClick, collapsed, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group text-left ${
      active 
        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm shadow-blue-500/5' 
        : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
    }`}
  >
    <div className={`${active ? 'scale-110' : ''} transition-transform flex-shrink-0`}>{icon}</div>
    {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
    {!collapsed && badge && (
      <span className="ml-auto text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-md uppercase">
        {badge}
      </span>
    )}
    {collapsed && active && (
      <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"></div>
    )}
  </button>
);

const StatCard = ({ label, value, trend, icon }) => (
  <div className="bg-[#090E1A] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group text-left">
    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all duration-700"></div>
    <div className="flex justify-between mb-8 relative z-10">
      <div className="p-3 bg-[#030712] border border-white/5 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400">
        {icon}
      </div>
      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${trend.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>{trend}</span>
    </div>
    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 relative z-10">{label}</p>
    <h4 className="text-4xl font-black text-white relative z-10 tracking-tighter leading-none">{value}</h4>
  </div>
);

const KanbanCol = ({ label, color, tasks, isProcessing }) => (
  <div className={`flex flex-col gap-6 p-8 bg-white/[0.02] rounded-[3rem] border border-white/5 relative text-left`}>
     {isProcessing && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse rounded-t-full"></div>}
     <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
           <div className={`w-2 h-2 rounded-full ${color}`}></div>
           <h4 className="font-bold text-white tracking-tight">{label}</h4>
        </div>
        <span className="text-[10px] font-black bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-slate-500 uppercase tracking-widest">{tasks.length} Tasks</span>
     </div>
     <div className="space-y-4 flex-1">
        {tasks.map(task => (
          <div key={task.id} className="bg-[#0D121F] border border-white/5 p-6 rounded-[2rem] shadow-xl hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden text-left">
             <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-widest leading-none">
                  Moore AI
                </span>
             </div>
             <p className="text-sm font-bold text-white mb-6 leading-relaxed group-hover:text-blue-400 transition-colors">{task.title}</p>
             <div className="flex justify-between items-center">
                <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border-2 border-[#0D121F]"></div>
                    <div className="w-7 h-7 rounded-lg bg-slate-700 border-2 border-[#0D121F]"></div>
                </div>
                <ArrowRight size={14} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
             </div>
          </div>
        ))}
        <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-[2rem] text-slate-600 hover:text-slate-400 hover:border-white/10 transition-all flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest">
           <Plus size={16}/> New Task
        </button>
     </div>
  </div>
);

// Mount Application
const rootEl = document.getElementById('root');
if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(<App />);
}

export default App;
// At the very bottom of the file
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
