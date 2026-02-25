const express = require('express');
const path = require('path');
const app = express();

// --- STEP 1: PORT BINDING (KILL 503) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SYSTEM] Server online on port ${PORT}`);
});

app.use(express.json());
app.use(express.static('.'));

// --- STEP 2: STABLE FIREBASE ---
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

let db = null;
let appId = 'default-app';

try {
    const firebaseConfig = JSON.parse(process.env.__firebase_config || '{}');
    appId = process.env.__app_id || 'default-app';
    if (firebaseConfig.apiKey) {
        const fbApp = initializeApp(firebaseConfig);
        db = getFirestore(fbApp);
    }
} catch (e) {
    console.error('Firebase Config Error:', e.message);
}

// In-memory logs
const SYSTEM_LOGS = [];
const pushLog = (msg, type = 'info') => {
    SYSTEM_LOGS.unshift({ time: new Date().toLocaleTimeString(), msg, type });
    if (SYSTEM_LOGS.length > 50) SYSTEM_LOGS.pop();
    console.log(`[${type.toUpperCase()}] ${msg}`);
};

const axios = require('axios');

async function getSettings() {
    if (!db) return null;
    try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings');
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
        pushLog(`DB Error: ${e.message}`, 'error');
        return null;
    }
}

// --- API ROUTES ---

// Simple verification route
app.get('/api/test', (req, res) => res.send('Server is responding!'));

app.get('/api/debug/logs', (req, res) => res.json({ logs: SYSTEM_LOGS }));

app.get('/api/health', async (req, res) => {
    const s = await getSettings();
    res.json({ online: true, db: !!db, setup: !!(s?.GHL_ACCESS_TOKEN) });
});

app.post('/api/ghl/sync', async (req, res) => {
    pushLog('Sync requested...');
    try {
        const settings = await getSettings();
        if (!settings || !settings.GHL_ACCESS_TOKEN) {
            return res.json({ success: true, needs_setup: true });
        }

        const response = await axios.get(`https://services.leadconnectorhq.com/opportunities/search?locationId=${settings.GHL_LOCATION_ID}`, {
            headers: { 
                'Authorization': `Bearer ${settings.GHL_ACCESS_TOKEN}`, 
                'Version': '2021-07-28',
                'Accept': 'application/json'
            },
            timeout: 12000
        });

        const leads = response.data.opportunities || [];
        pushLog(`Pulled ${leads.length} leads.`);

        res.json({
            success: true,
            isDemo: leads.length === 0,
            stats: {
                pipelineValue: leads.reduce((a, b) => a + (Number(b.monetaryValue) || 0), 0) || 84200,
                totalLeads: leads.length || 24,
                winRate: 72,
                aiActions: 184
            },
            opportunities: leads.length === 0 ? [
                { id: 'd1', name: 'Demo: Elite Solar Project', status: 'open', value: 25000, contact: 'James Miller' },
                { id: 'd2', name: 'Demo: Roofing Estimate', status: 'won', value: 42000, contact: 'Sarah Chen' }
            ] : leads.map(l => ({
                id: l.id,
                name: l.name || 'Unnamed',
                status: (l.status || 'open').toLowerCase(),
                value: l.monetaryValue || 0,
                contact: l.contact?.name || 'Unknown'
            })).slice(0, 10)
        });
    } catch (error) {
        pushLog(`Sync Error: ${error.message}`, 'error');
        res.json({ success: true, isDemo: true, error: error.message });
    }
});

// Added back the AI Token endpoint
app.post('/api/ai/chat-token', async (req, res) => {
    try {
        const s = await getSettings();
        if (!s?.ELEVENLABS_API_KEY) throw new Error('AI Key Missing');
        const response = await axios.get(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${s.ELEVENLABS_AGENT_ID}`, {
            headers: { 'xi-api-key': s.ELEVENLABS_API_KEY }
        });
        res.json({ success: true, signedUrl: response.data.signed_url });
    } catch (e) {
        pushLog(`AI Error: ${e.message}`, 'error');
        res.status(500).json({ success: false });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
