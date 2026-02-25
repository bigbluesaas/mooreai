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

// 1. Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        ghl_key_exists: !!GHL_KEY, 
        ghl_location_exists: !!GHL_LOCATION,
        elevenlabs_active: !!(EL_KEY && EL_AGENT),
        detected_keys: Object.keys(process.env).filter(key => key.includes('GHL') || key.includes('ELEVEN'))
    });
});

// 2. GHL Sync Endpoint (Updated for GHL V2 Official API)
app.post('/api/ghl/sync', async (req, res) => {
    console.log('Attempting GHL V2 Sync for Location:', GHL_LOCATION);
    try {
        if (!GHL_KEY || !GHL_LOCATION) throw new Error('Credentials missing in Environment Variables');

        // GHL V2 API uses leadconnectorhq.com
        const response = await axios.get(`https://services.leadconnectorhq.com/opportunities/search?locationId=${GHL_LOCATION}`, {
            headers: { 
                'Authorization': `Bearer ${GHL_KEY}`, 
                'Version': '2021-07-28',
                'Accept': 'application/json'
            },
            timeout: 10000 
        });

        // GHL Search returns an object with an 'opportunities' array
        const leads = response.data.opportunities || [];
        console.log(`Successfully pulled ${leads.length} leads from GHL.`);

        if (leads.length === 0) {
            console.log('No opportunities found in this pipeline. Sending Demo Data for UI.');
            return res.json({
                success: true,
                isDemoData: true,
                stats: {
                    pipelineValue: 84200,
                    totalLeads: 24,
                    winRate: 72,
                    aiActions: 342
                },
                opportunities: [
                    { id: '1', name: 'Elite Solar Install', status: 'open', value: 25000, contact: 'James Miller' },
                    { id: '2', name: 'Commercial Roofing', status: 'won', value: 42000, contact: 'Sarah Chen' },
                    { id: '3', name: 'HVAC System Upgrade', status: 'open', value: 12500, contact: 'Robert Fox' }
                ]
            });
        }

        const totalValue = leads.reduce((acc, lead) => acc + (Number(lead.monetaryValue) || 0), 0);

        res.json({
            success: true,
            isDemoData: false,
            stats: {
                pipelineValue: totalValue,
                totalLeads: leads.length,
                winRate: 68,
                aiActions: 124
            },
            opportunities: leads.map(l => ({
                id: l.id,
                name: l.name || 'Unnamed Opportunity',
                status: (l.status || 'open').toLowerCase(),
                value: l.monetaryValue || 0,
                contact: l.contact?.name || l.contactName || 'Unknown'
            })).slice(0, 10)
        });

    } catch (error) {
        const errorDetail = error.response?.data || error.message;
        console.error('GHL API ERROR:', errorDetail);
        
        // Return structured error so the UI knows exactly why it failed
        res.json({
            success: true,
            isDemoData: true,
            api_error: true,
            error_message: error.response?.status === 401 ? "Unauthorized: Check your GHL Access Token" : error.message,
            stats: { pipelineValue: 0, totalLeads: 0, winRate: 0, aiActions: 0 },
            opportunities: [{ 
                id: 'err', 
                name: 'API Connection Failed', 
                status: 'error', 
                value: 0, 
                contact: error.response?.status === 401 ? 'Invalid Token' : 'Check Logs' 
            }]
        });
    }
});

// 3. ElevenLabs AI Agent Session Endpoint
app.post('/api/ai/chat-token', async (req, res) => {
    try {
        if (!EL_KEY || !EL_AGENT) throw new Error('ElevenLabs credentials missing');
        const response = await axios.get(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${EL_AGENT}`, {
            headers: { 'xi-api-key': EL_KEY }
        });
        res.json({ success: true, signedUrl: response.data.signed_url });
    } catch (error) {
        console.error('ElevenLabs Auth Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: 'AI Offline' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`--- MOORE AI SERVER STARTED ---`);
    console.log(`Port: ${PORT}`);
    console.log(`GHL Configured: ${!!GHL_KEY}`);
});
