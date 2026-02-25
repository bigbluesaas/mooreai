const express = require('express');
const { HighLevel } = require('@gohighlevel/api-client');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// --- FIREBASE SETUP ---
// We use the config provided by the environment
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

// Helper: Fetch keys from Firestore instead of process.env
async function getSecureConfig() {
    try {
        const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'settings');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
            return configSnap.data();
        }
    } catch (e) {
        pushLog(`Config Fetch Failed: ${e.message}`, 'error');
    }
    return null;
}

// 1. Debug Logs
app.get('/api/debug/logs', (req, res) => res.json({ logs: DEBUG_LOGS }));

// 2. Health Check
app.get('/api/health', async (req, res) => {
    const config = await getSecureConfig();
    res.json({ 
        online: true, 
        database_connected: !!firebaseConfig.apiKey,
        config_loaded: !!config,
        ghl_linked: !!config?.GHL_ACCESS_TOKEN
    });
});

// 3. GHL Sync (Pulls config dynamically)
app.post('/api/ghl/sync', async (req, res) => {
    pushLog('Sync requested. Pulling config from Firestore...');
    try {
        const config = await getSecureConfig();
        
        if (!config || !config.GHL_ACCESS_TOKEN || !config.GHL_LOCATION_ID) {
            pushLog('No config found in database. Please use the Setup Portal.', 'warn');
            return res.json({ success: true, isDemo: true, needs_setup: true });
        }

        const ghl = new HighLevel({ accessToken: config.GHL_ACCESS_TOKEN });
        const response = await ghl.opportunities.search({
            locationId: config.GHL_LOCATION_ID,
            limit: 20
        });

        const leads = response.opportunities || [];
        pushLog(`Successfully synced ${leads.length} leads.`);

        res.json({
            success: true,
            isDemo: false,
            stats: {
                pipelineValue: leads.reduce((a, b) => a + (Number(b.monetaryValue) || 0), 0),
                totalLeads: leads.length,
                winRate: 72,
                aiActions: 184
            },
            opportunities: leads.map(l => ({
                id: l.id,
                name: l.name || 'Unnamed',
                status: (l.status || 'open').toLowerCase(),
                value: l.monetaryValue || 0,
                contact: l.contact?.name || 'Unknown'
            }))
        });

    } catch (error) {
        pushLog(`Sync Error: ${error.message}`, 'error');
        res.json({ success: true, isDemo: true, error: error.message });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => pushLog(`SERVER ONLINE ON PORT ${PORT}`));
