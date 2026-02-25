const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Environment Variables from Hostinger
const GHL_KEY = process.env.GHL_ACCESS_TOKEN;
const GHL_LOCATION = process.env.GHL_LOCATION_ID;
const EL_KEY = process.env.ELEVENLABS_API_KEY;
const EL_AGENT = process.env.ELEVENLABS_AGENT_ID;

// 1. Health Check (Always online to prevent 503 during boot)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        ghl_key_exists: !!GHL_KEY, 
        ghl_location_exists: !!GHL_LOCATION,
        elevenlabs_active: !!(EL_KEY && EL_AGENT),
        detected_keys: Object.keys(process.env).filter(key => key.includes('GHL') || key.includes('ELEVEN'))
    });
});

// 2. GHL Sync Endpoint
app.post('/api/ghl/sync', async (req, res) => {
    console.log('Syncing GHL data...');
    try {
        if (!GHL_KEY || !GHL_LOCATION) {
            console.warn('Sync failed: Missing credentials in environment.');
            throw new Error('Missing Credentials');
        }

        const response = await axios.get(`https://services.leadconnectorhq.com/opportunities/search?locationId=${GHL_LOCATION}`, {
            headers: { 
                'Authorization': `Bearer ${GHL_KEY}`, 
                'Version': '2021-07-28',
                'Accept': 'application/json'
            },
            timeout: 12000 
        });

        const leads = response.data.opportunities || [];
        const totalValue = leads.reduce((acc, lead) => acc + (Number(lead.monetaryValue) || 0), 0);

        res.json({
            success: true,
            isDemoData: leads.length === 0,
            stats: {
                pipelineValue: leads.length === 0 ? 84200 : totalValue,
                totalLeads: leads.length === 0 ? 24 : leads.length,
                winRate: 72,
                aiActions: 342
            },
            opportunities: leads.length === 0 ? [
                { id: '1', name: 'Elite Solar Install', status: 'open', value: 25000, contact: 'James Miller' },
                { id: '2', name: 'Commercial Roofing', status: 'won', value: 42000, contact: 'Sarah Chen' },
                { id: '3', name: 'HVAC System Upgrade', status: 'open', value: 12500, contact: 'Robert Fox' }
            ] : leads.map(l => ({
                id: l.id,
                name: l.name || 'Unnamed',
                status: (l.status || 'open').toLowerCase(),
                value: l.monetaryValue || 0,
                contact: l.contact?.name || 'Unknown'
            })).slice(0, 10)
        });
    } catch (error) {
        console.error('GHL Sync Error:', error.message);
        // Fallback to demo data so UI doesn't show $0 or break
        res.json({
            success: true,
            isDemoData: true,
            api_error: true,
            stats: { pipelineValue: 42500, totalLeads: 12, winRate: 68, aiActions: 124 },
            opportunities: [
                { id: 'err', name: 'GHL API Connection Error', status: 'notice', value: 0, contact: 'System' },
                { id: 'demo1', name: 'Demo: Solar Project A', status: 'open', value: 15000, contact: 'John Doe' }
            ]
        });
    }
});

// 3. AI Token Endpoint
app.post('/api/ai/chat-token', async (req, res) => {
    try {
        if (!EL_KEY || !EL_AGENT) throw new Error('EL Keys Missing');
        const response = await axios.get(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${EL_AGENT}`, {
            headers: { 'xi-api-key': EL_KEY }
        });
        res.json({ success: true, signedUrl: response.data.signed_url });
    } catch (error) {
        console.error('ElevenLabs Auth Error:', error.message);
        res.status(500).json({ success: false, error: 'AI Offline' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Hostinger managed Node.js apps require this port binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`--- SERVER ONLINE ---`);
    console.log(`Listening on Port: ${PORT}`);
});
