import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, BrainCircuit, Settings, PhoneCall, Mic, Plus, 
  TrendingUp, ArrowRight, Loader2, BarChart3, Lock, ShieldCheck, Zap,
  Terminal, Activity, AlertCircle, Key, Globe, Sparkles
} from 'lucide-react';

// Firebase Globals from Canvas Environment
const firebaseConfig = JSON.parse(window.__firebase_config || '{}');
const appId = window.__app_id || 'default-app';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
  const [view, setView] = useState('loading'); // loading, setup, dashboard
  const [crmData, setCrmData] = useState({ stats: { pipelineValue: 0, totalLeads: 0, winRate: 0, aiActions: 0 }, opportunities: [] });
  const [systemLogs, setSystemLogs] = useState([]);
  const [setupData, setSetupData] = useState({ GHL_ACCESS_TOKEN: '', GHL_LOCATION_ID: '', ELEVENLABS_API_KEY: '', ELEVENLABS_AGENT_ID: '' });

  const sync = async () => {
    try {
      const res = await fetch('/api/ghl/sync', { method: 'POST' });
      const result = await res.json();
      
      if (result.needs_setup) {
        setView('setup');
      } else {
        setCrmData(result);
        setView('dashboard');
      }
      
      const logRes = await fetch('/api/debug/logs');
      const logData = await logRes.json();
      setSystemLogs(logData.logs);
    } catch (e) { 
      console.error(e);
      setView('setup');
    }
  };

  useEffect(() => { sync(); }, []);

  const handleSetup = async (e) => {
    e.preventDefault();
    setView('loading');
    try {
      // Save keys to secure Firestore path
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings'), setupData);
      // Give server a moment to realize keys are saved
      setTimeout(sync, 1500);
    } catch (err) {
      alert("Error saving: " + err.message);
      setView('setup');
    }
  };

  if (view === 'loading') {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (view === 'setup') {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Key size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">System Connection</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Portal v1.5.1</p>
            </div>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">GHL Access Token (PIT)</label>
              <input 
                type="password" 
                placeholder="pit-..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                value={setupData.GHL_LOCATION_ID}
                onChange={e => setSetupData({...setupData, GHL_LOCATION_ID: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all mt-4">
              Connect Enterprise Systems
            </button>
          </form>
          <div className="mt-6 p-4 bg-blue-600/5 rounded-xl border border-blue-500/10">
            <p className="text-[10px] text-slate-500 leading-relaxed italic text-center">
              Storing keys in Firestore prevents 503 errors and removes the need for Hostinger server restarts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 flex flex-col p-6 bg-[#020617]">
        <div className="flex items-center gap-3 mb-10">
            <Zap size={24} className="text-blue-500 fill-blue-500" />
            <span className="font-black tracking-tighter text-white text-lg">MOORE AI</span>
        </div>
        <nav className="flex-1 space-y-1">
            <div className="px-4 py-2.5 bg-blue-600/10 text-blue-400 rounded-xl flex items-center gap-3 border border-blue-500/20">
                <LayoutDashboard size={18} /> <span className="text-sm font-bold">Command Center</span>
            </div>
            <div className="px-4 py-2.5 text-slate-500 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-all cursor-not-allowed opacity-50">
                <BrainCircuit size={18} /> <span className="text-sm font-medium">Moore AI Hub</span>
            </div>
        </nav>
        <button onClick={() => setView('setup')} className="flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:text-white transition-all text-sm mt-auto border-t border-slate-800 pt-6">
            <Settings size={18} /> Connection Settings
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 backdrop-blur-md">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                <Globe size={12} /> Live Environment // {appId}
            </div>
            <div className="flex items-center gap-4">
                <div className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Enterprise</div>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"></div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-10">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-2 italic">MOORE AI</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Enterprise Lead Intelligence & Response Pipeline</p>
                </div>
                <button onClick={sync} className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" /> Refresh Stream
                </button>
            </div>

            <div className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Pipeline Value', value: `$${Number(crmData.stats?.pipelineValue || 0).toLocaleString()}`, icon: BarChart3 },
                    { label: 'Opportunities', value: crmData.stats?.totalLeads || 0, icon: Users },
                    { label: 'Win Rate', value: `${crmData.stats?.winRate || 0}%`, icon: TrendingUp },
                    { label: 'AI Actions', value: crmData.stats?.aiActions || 0, icon: Sparkles }
                ].map((s, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[32px] hover:border-slate-700 transition-all">
                        <div className="p-3 bg-slate-800 w-fit rounded-2xl mb-6"><s.icon size={24} className="text-blue-500" /></div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{s.label}</div>
                        <div className="text-3xl font-black text-white tracking-tighter">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Pipeline</h3>
                    {crmData.isDemo && <span className="text-[10px] bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">Demo Environment Active</span>}
                </div>
                <div className="divide-y divide-slate-800">
                    {crmData.opportunities?.length > 0 ? crmData.opportunities.map(opp => (
                        <div key={opp.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-800/20 transition-all group">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:text-blue-400 transition-colors uppercase">{opp.name[0]}</div>
                                <div>
                                    <div className="font-bold text-white group-hover:translate-x-1 transition-transform">{opp.name}</div>
                                    <div className="text-xs text-slate-500 font-medium">{opp.contact}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md ${opp.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>{opp.status}</span>
                                <div className="text-lg font-black text-white w-24 text-right tabular-nums tracking-tight">${Number(opp.value).toLocaleString()}</div>
                                <ArrowRight size={20} className="text-slate-800 group-hover:text-slate-500 transition-colors" />
                            </div>
                        </div>
                    )) : <div className="py-24 text-center text-slate-600 font-medium italic">Pipeline is currently empty. Connect GHL to stream live leads.</div>}
                </div>
            </div>

            {/* System Console */}
            <div className="bg-black border border-slate-800 rounded-3xl p-6 font-mono text-[11px] h-48 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    <Terminal size={14} className="text-blue-500" />
                    <span className="text-slate-500 uppercase font-black tracking-[0.2em]">Live Debug Console</span>
                </div>
                {systemLogs.map((l, i) => (
                    <div key={i} className="flex gap-4 mb-1">
                        <span className="text-slate-700 shrink-0">[{l.time}]</span>
                        <span className={`uppercase w-10 font-bold shrink-0 ${l.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>[{l.type}]</span>
                        <span className="text-slate-500 break-all">{l.msg}</span>
                    </div>
                ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
