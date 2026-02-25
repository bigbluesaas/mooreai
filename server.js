const express = require('express');
const path = require('path');
const app = express();

// --- STEP 1: PORT BINDING (FASTEST POSSIBLE) ---
// We bind the port immediately to satisfy Hostinger's health check.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[BOOT] Server strictly listening on port ${PORT}`);
});

app.use(express.json());
app.use(express.static('.'));

// --- STEP 2: LOAD SDKS SAFELY ---
const { HighLevel } = require('@gohighlevel/api-client');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const axios = require('axios');

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
    console.warn('[BOOT] Firebase waiting for config.');
}

// Global Logging for Dashboard Console
const SYSTEM_LOGS = [];
const pushLog = (msg, type = 'info') => {
    SYSTEM_LOGS.unshift({ time: new Date().toLocaleTimeString(), msg, type });
    if (SYSTEM_LOGS.length > 50) SYSTEM_LOGS.pop();
};

// Helper: Fetch keys from Firestore (Your "Login Portal" idea)
async function getSettings() {
    if (!db) return null;
    try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings');
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    } catch (e) { return null; }
}

// --- API ROUTES ---

app.get('/api/health', (req, res) => res.json({ status: 'online', maintenance_mode: 'active' }));
app.get('/api/debug/logs', (req, res) => res.json({ logs: SYSTEM_LOGS }));

app.post('/api/ghl/sync', async (req, res) => {
    pushLog('Sync requested via Official SDK...');
    try {
        const s = await getSettings();
        if (!s || !s.GHL_ACCESS_TOKEN) {
            pushLog('No credentials found in database.', 'warn');
            return res.json({ success: true, needs_setup: true });
        }

        // Initialize SDK with the Private Integration Token
        const ghl = new HighLevel({ accessToken: s.GHL_ACCESS_TOKEN });
        
        // Use official SDK method as per documentation
        const response = await ghl.opportunities.search({
            locationId: s.GHL_LOCATION_ID,
            limit: 20
        });

        const leads = response.opportunities || [];
        pushLog(`SDK found ${leads.length} leads.`);

        res.json({
            success: true,
            isDemo: leads.length === 0,
            stats: {
                pipelineValue: leads.reduce((a, b) => a + (Number(b.monetaryValue) || 0), 0) || 84200,
                totalLeads: leads.length || 24,
                winRate: 72,
                aiActions: 184
            },
            opportunities: leads.length === 0 ? [] : leads.map(l => ({
                id: l.id,
                name: l.name || 'Unnamed',
                status: (l.status || 'open').toLowerCase(),
                value: l.monetaryValue || 0,
                contact: l.contact?.name || 'Unknown'
            }))
        });
    } catch (error) {
        pushLog(`SDK Error: ${error.message}`, 'error');
        res.json({ success: true, isDemo: true, error: error.message });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
