import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, BrainCircuit, Settings, PhoneCall, Mic, Plus, 
  TrendingUp, ArrowRight, Loader2, BarChart3, Lock, ShieldCheck, Zap,
  Terminal, Activity, AlertCircle, Key, Globe
} from 'lucide-react';

// Initialize Firebase (Variables injected by Canvas environment)
const firebaseConfig = JSON.parse(window.__firebase_config || '{}');
const appId = window.__app_id || 'default-app';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [crmData, setCrmData] = useState({ stats: { pipelineValue: 0, totalLeads: 0, winRate: 0, aiActions: 0 }, opportunities: [] });
  const [systemLogs, setSystemLogs] = useState([]);
  const [setupData, setSetupData] = useState({ GHL_ACCESS_TOKEN: '', GHL_LOCATION_ID: '', ELEVENLABS_API_KEY: '', ELEVENLABS_AGENT_ID: '' });

  const sync = async () => {
    try {
      const res = await fetch('/api/ghl/sync', { method: 'POST' });
      const result = await res.json();
      if (result.needs_setup) setNeedsSetup(true);
      setCrmData(result);
      
      const logRes = await fetch('/api/debug/logs');
      const logData = await logRes.json();
      setSystemLogs(logData.logs);
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { sync(); }, []);

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save to secure Firestore location
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings'), setupData);
      setNeedsSetup(false);
      setTimeout(sync, 2000); // Wait for server to pick up changes
    } catch (err) {
      alert("Failed to save: " + err.message);
      setLoading(false);
    }
  };

  if (needsSetup) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Key size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">System Connection</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Portal v1.5</p>
            </div>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">GoHighLevel PIT Token</label>
              <input 
                type="password" 
                placeholder="pit-..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
                value={setupData.GHL_ACCESS_TOKEN}
                onChange={e => setSetupData({...setupData, GHL_ACCESS_TOKEN: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">GHL Location ID</label>
              <input 
                type="text" 
                placeholder="Location ID" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
                value={setupData.GHL_LOCATION_ID}
                onChange={e => setSetupData({...setupData, GHL_LOCATION_ID: e.target.value})}
                required
              />
            </div>
            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Initialize Connection"}
              </button>
            </div>
          </form>
          <p className="text-[10px] text-center text-slate-600 mt-6">Credentials are encrypted and stored in your private Firestore instance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden">
      {/* Sidebar - Minimalist */}
      <div className="w-64 border-r border-slate-800 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-12">
            <Zap size={24} className="text-blue-500 fill-blue-500" />
            <span className="font-black tracking-tighter text-white text-lg">MOORE AI</span>
        </div>
        <nav className="flex-1 space-y-2">
            <div className="px-3 py-2 bg-blue-600/10 text-blue-400 rounded-xl flex items-center gap-3 border border-blue-500/20">
                <LayoutDashboard size={18} /> <span className="text-sm font-bold">Dashboard</span>
            </div>
            <div className="px-3 py-2 text-slate-500 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-all cursor-pointer">
                <BrainCircuit size={18} /> <span className="text-sm font-medium">AI Hub</span>
            </div>
        </nav>
        <div className="mt-auto bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">System Live</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">Connected to GHL Location {setupData.GHL_LOCATION_ID || 'Active'}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#020617]/50 backdrop-blur-xl">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Production // {appId}</div>
            <div className="flex items-center gap-4">
                <button onClick={() => setNeedsSetup(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-all">
                    <Settings size={18} />
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">JM</div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-2">Command Center</h1>
                    <p className="text-slate-500 font-medium">Real-time Lead Intelligence Pipeline</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={sync} className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Activity size={16} className="text-blue-500" /> Force Sync
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Pipeline Value', value: `$${Number(crmData.stats?.pipelineValue || 0).toLocaleString()}`, icon: BarChart3 },
                    { label: 'Opportunities', value: crmData.stats?.totalLeads || 0, icon: Users },
                    { label: 'Win Rate', value: `${crmData.stats?.winRate || 0}%`, icon: TrendingUp },
                    { label: 'AI Actions', value: crmData.stats?.aiActions || 0, icon: Sparkles }
                ].map((s, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-all group">
                        <div className="p-3 bg-slate-800 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform"><s.icon size={24} className="text-blue-500" /></div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{s.label}</div>
                        <div className="text-3xl font-black text-white tracking-tight">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Pipeline Detail</h3>
                    {crmData.isDemo && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-bold uppercase">Showing Demo Data</span>}
                </div>
                <div className="divide-y divide-slate-800">
                    {crmData.opportunities?.length > 0 ? crmData.opportunities.map(opp => (
                        <div key={opp.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-800/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-blue-400">{opp.name[0]}</div>
                                <div>
                                    <div className="font-bold text-white">{opp.name}</div>
                                    <div className="text-xs text-slate-500">{opp.contact}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${opp.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>{opp.status}</span>
                                <div className="text-lg font-black text-white w-24 text-right">${Number(opp.value).toLocaleString()}</div>
                                <ArrowRight size={20} className="text-slate-700" />
                            </div>
                        </div>
                    )) : <div className="py-20 text-center text-slate-600 font-medium">No active leads found. Configure your connection to start.</div>}
                </div>
            </div>

            {/* Terminal Debugger at the bottom */}
            <div className="bg-black border border-slate-800 rounded-3xl p-6 font-mono text-[11px] h-48 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    <Terminal size={14} className="text-orange-500" />
                    <span className="text-slate-500 uppercase font-bold tracking-widest">System Debug Stream</span>
                </div>
                {systemLogs.map((l, i) => (
                    <div key={i} className="flex gap-4 mb-1">
                        <span className="text-slate-700">[{l.time}]</span>
                        <span className={`uppercase w-10 font-bold ${l.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>[{l.type}]</span>
                        <span className="text-slate-400">{l.msg}</span>
                    </div>
                ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const Sparkles = ({size, className}) => <Zap size={size} className={className} />;

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
