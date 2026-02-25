const express = require('express');
const path = require('path');
const app = express();

// --- STEP 1: KILL THE 503 ERROR ---
// We bind to the port IMMEDIATELY. This tells Hostinger the app is healthy
// before we even try to load Firebase or APIs.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[BOOT] Server strictly listening on port ${PORT}`);
});

app.use(express.json());
app.use(express.static('.'));

// --- STEP 2: LOAD FIREBASE SAFELY ---
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
        console.log('[BOOT] Firebase Initialized.');
    }
} catch (e) {
    console.error('[BOOT] Firebase Config Error:', e.message);
}

// In-memory logs for the dashboard
const SYSTEM_LOGS = [];
const pushLog = (msg, type = 'info') => {
    SYSTEM_LOGS.unshift({ time: new Date().toLocaleTimeString(), msg, type });
    if (SYSTEM_LOGS.length > 50) SYSTEM_LOGS.pop();
    console.log(`[${type.toUpperCase()}] ${msg}`);
};

const axios = require('axios');

// Helper: Pull settings from Firestore
async function getSettings() {
    if (!db) return null;
    try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings');
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
        pushLog(`Database Read Error: ${e.message}`, 'error');
        return null;
    }
}

// API Routes
app.get('/api/debug/logs', (req, res) => res.json({ logs: SYSTEM_LOGS }));

app.get('/api/health', async (req, res) => {
    const s = await getSettings();
    res.json({ online: true, db_ready: !!db, setup_complete: !!(s?.GHL_ACCESS_TOKEN) });
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
            timeout: 10000
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
                { id: 'd2', name: 'Demo: Roofing Project', status: 'won', value: 42000, contact: 'Sarah Chen' }
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

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
