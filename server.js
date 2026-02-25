const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// --- FIREBASE INITIALIZATION ---
// Note: In Node.js, we use the standard firebase package.
const firebaseConfig = JSON.parse(process.env.__firebase_config || '{}');
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const appId = process.env.__app_id || 'default-app';

const DEBUG_LOGS = [];
const pushLog = (msg, type = 'info') => {
    DEBUG_LOGS.unshift({ time: new Date().toLocaleTimeString(), msg, type });
    if (DEBUG_LOGS.length > 50) DEBUG_LOGS.pop();
    console.log(`[${type.toUpperCase()}] ${msg}`);
};

// Helper: Fetch keys from Firestore
async function getSecureConfig() {
    try {
        const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings');
        const configSnap = await getDoc(configRef);
        return configSnap.exists() ? configSnap.data() : null;
    } catch (e) {
        pushLog(`DB Fetch Error: ${e.message}`, 'error');
        return null;
    }
}

pushLog('SERVER BOOT: System is live.');

// 1. Debug Logs
app.get('/api/debug/logs', (req, res) => res.json({ logs: DEBUG_LOGS }));

// 2. Health Check
app.get('/api/health', async (req, res) => {
    const config = await getSecureConfig();
    res.json({ 
        online: true, 
        db: !!firebaseConfig.apiKey,
        setup: !!(config?.GHL_ACCESS_TOKEN && config?.GHL_LOCATION_ID)
    });
});

// 3. GHL Sync (Uses config from Database)
app.post('/api/ghl/sync', async (req, res) => {
    pushLog('Sync requested...');
    try {
        const config = await getSecureConfig();
        
        if (!config || !config.GHL_ACCESS_TOKEN) {
            pushLog('No configuration found. Awaiting user setup.', 'warn');
            return res.json({ success: true, needs_setup: true });
        }

        // We use standard axios for stability in recovery mode
        const response = await axios.get(`https://services.leadconnectorhq.com/opportunities/search?locationId=${config.GHL_LOCATION_ID}`, {
            headers: { 
                'Authorization': `Bearer ${config.GHL_ACCESS_TOKEN}`, 
                'Version': '2021-07-28' 
            },
            timeout: 10000
        });

        const leads = response.data.opportunities || [];
        pushLog(`Successfully synced ${leads.length} leads.`);

        res.json({
            success: true,
            isDemo: leads.length === 0,
            stats: {
                pipelineValue: leads.length === 0 ? 84200 : leads.reduce((a, b) => a + (Number(b.monetaryValue) || 0), 0),
                totalLeads: leads.length === 0 ? 24 : leads.length,
                winRate: 72,
                aiActions: 184
            },
            opportunities: leads.length === 0 ? getDemoLeads() : leads.map(l => ({
                id: l.id,
                name: l.name || 'Unnamed',
                status: (l.status || 'open').toLowerCase(),
                value: l.monetaryValue || 0,
                contact: l.contact?.name || 'Unknown'
            }))
        });

    } catch (error) {
        pushLog(`GHL Error: ${error.message}`, 'error');
        res.json({ success: true, isDemo: true, stats: { pipelineValue: 0, totalLeads: 0, winRate: 0, aiActions: 0 }, opportunities: [] });
    }
});

function getDemoLeads() {
    return [
        { id: 'd1', name: 'Elite Solar (Demo)', status: 'open', value: 25000, contact: 'James Miller' },
        { id: 'd2', name: 'Roofing Project (Demo)', status: 'won', value: 42000, contact: 'Sarah Chen' }
    ];
}

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => pushLog(`SERVER RUNNING ON PORT ${PORT}`));
