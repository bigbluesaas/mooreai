const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// --- THE SYSTEM LOGS (This shows up on your dashboard) ---
const DEBUG_LOGS = [];
const pushLog = (msg, type = 'info') => {
    const entry = { time: new Date().toLocaleTimeString(), msg, type };
    DEBUG_LOGS.unshift(entry);
    if (DEBUG_LOGS.length > 30) DEBUG_LOGS.pop();
    console.log(`[${type}] ${msg}`);
};

pushLog('SERVER BOOT: Starting Recovery Mode...');

// Environment Variables
const GHL_KEY = process.env.GHL_ACCESS_TOKEN;
const GHL_LOC = process.env.GHL_LOCATION_ID;
const EL_KEY = process.env.ELEVENLABS_API_KEY;
const EL_AGENT = process.env.ELEVENLABS_AGENT_ID;

// 1. Debug Logs Endpoint
app.get('/api/debug/logs', (req, res) => res.json({ logs: DEBUG_LOGS }));

// 2. Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        online: true, 
        keys: { ghl: !!GHL_KEY, el: !!EL_KEY },
        loc: GHL_LOC || 'missing'
    });
});

// 3. Resilient GHL Sync
app.post('/api/ghl/sync', async (req, res) => {
    pushLog('Sync requested...');
    try {
        if (!GHL_KEY || !GHL_LOC) {
            pushLog('Sync skipped: Missing keys in Hostinger settings.', 'warn');
            return res.json(getDemo('Keys Missing'));
        }

        // Using manual Axios to avoid SDK install issues during recovery
        const response = await axios.get(`https://services.leadconnectorhq.com/opportunities/search?locationId=${GHL_LOC}`, {
            headers: { 'Authorization': `Bearer ${GHL_KEY}`, 'Version': '2021-07-28' },
            timeout: 8000
        });

        const leads = response.data.opportunities || [];
        pushLog(`Pulled ${leads.length} real leads from GHL.`);

        if (leads.length === 0) return res.json(getDemo('Account Empty'));

        res.json({
            success: true,
            stats: {
                pipelineValue: leads.reduce((a, b) => a + (Number(b.monetaryValue) || 0), 0),
                totalLeads: leads.length,
                winRate: 72,
                aiActions: 150
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
        pushLog(`GHL Error: ${error.message}`, 'error');
        res.json(getDemo(error.message));
    }
});

function getDemo(reason) {
    return {
        success: true,
        isDemo: true,
        reason: reason,
        stats: { pipelineValue: 84200, totalLeads: 24, winRate: 72, aiActions: 342 },
        opportunities: [
            { id: 'd1', name: 'DEMO: Premium Solar', status: 'open', value: 25000, contact: 'James Miller' },
            { id: 'd2', name: 'DEMO: Roof Repair', status: 'won', value: 42000, contact: 'Sarah Chen' }
        ]
    };
}

// 4. ElevenLabs Chat Token
app.post('/api/ai/chat-token', async (req, res) => {
    try {
        const response = await axios.get(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${EL_AGENT}`, {
            headers: { 'xi-api-key': EL_KEY }
        });
        res.json({ success: true, signedUrl: response.data.signed_url });
    } catch (e) {
        pushLog(`AI Token Error: ${e.message}`, 'error');
        res.status(500).json({ success: false });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => pushLog(`SERVER IS LIVE ON PORT ${PORT}`));
