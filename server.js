const express = require('express');
const { HighLevel } = require('@gohighlevel/api-client');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// --- IN-MEMORY LOGGING SYSTEM ---
const SYSTEM_LOGS = [];
const addLog = (msg, type = 'info') => {
    const log = { timestamp: new Date().toLocaleTimeString(), message: msg, type };
    console.log(`[${type.toUpperCase()}] ${msg}`);
    SYSTEM_LOGS.unshift(log);
    if (SYSTEM_LOGS.length > 50) SYSTEM_LOGS.pop();
};

addLog('Server initializing...');

// Environment Variables
const GHL_KEY = process.env.GHL_ACCESS_TOKEN;
const GHL_LOCATION = process.env.GHL_LOCATION_ID;
const EL_KEY = process.env.ELEVENLABS_API_KEY;
const EL_AGENT = process.env.ELEVENLABS_AGENT_ID;

// Safe SDK Initialization
let ghl = null;
try {
    if (GHL_KEY) {
        ghl = new HighLevel({ accessToken: GHL_KEY });
        addLog('GHL SDK Initialized successfully.');
    } else {
        addLog('GHL_ACCESS_TOKEN missing from environment.', 'warn');
    }
} catch (e) {
    addLog(`GHL SDK Init Failed: ${e.message}`, 'error');
}

// 1. Debug Logs Endpoint (For the dashboard to pull)
app.get('/api/debug/logs', (req, res) => {
    res.json({ logs: SYSTEM_LOGS });
});

// 2. Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        ghl_ready: !!ghl,
        location: !!GHL_LOCATION,
        el: !!EL_KEY
    });
});

// 3. GHL Sync with Detailed Error Logging
app.post('/api/ghl/sync', async (req, res) => {
    addLog('Frontend requested GHL sync...');
    try {
        if (!ghl || !GHL_LOCATION) {
            addLog('Sync skipped: Missing credentials.', 'warn');
            return res.json(getDemoData('Missing GHL Credentials'));
        }

        const response = await ghl.opportunities.search({
            locationId: GHL_LOCATION,
            limit: 20
        });

        const leads = response.opportunities || [];
        addLog(`Successfully pulled ${leads.length} leads from GHL.`);
        
        if (leads.length === 0) {
            addLog('Account empty, sending demo data.', 'info');
            return res.json(getDemoData());
        }

        res.json({
            success: true,
            isDemoData: false,
            stats: {
                pipelineValue: leads.reduce((a, b) => a + (Number(b.monetaryValue) || 0), 0),
                totalLeads: leads.length,
                winRate: 72,
                aiActions: 342
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
        addLog(`GHL Sync Error: ${error.message}`, 'error');
        res.json(getDemoData(error.message));
    }
});

function getDemoData(error = null) {
    return {
        success: true,
        isDemoData: true,
        error: error,
        stats: { pipelineValue: 84200, totalLeads: 24, winRate: 72, aiActions: 342 },
        opportunities: [
            { id: 'd1', name: 'Demo: Elite Solar Project', status: 'open', value: 25000, contact: 'James Miller' },
            { id: 'd2', name: 'Demo: Commercial Roofing', status: 'won', value: 42000, contact: 'Sarah Chen' }
        ]
    };
}

// 4. AI Token Endpoint
app.post('/api/ai/chat-token', async (req, res) => {
    addLog('Voice AI session requested...');
    try {
        if (!EL_KEY || !EL_AGENT) throw new Error('ElevenLabs keys missing');
        const response = await axios.get(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${EL_AGENT}`, {
            headers: { 'xi-api-key': EL_KEY }
        });
        addLog('ElevenLabs token generated.');
        res.json({ success: true, signedUrl: response.data.signed_url });
    } catch (error) {
        addLog(`ElevenLabs Error: ${error.message}`, 'error');
        res.status(500).json({ success: false });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    addLog(`Server strictly listening on port ${PORT}`);
});
