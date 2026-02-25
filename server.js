const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Environment Variables from Hostinger
const GHL_KEY = process.env.GHL_ACCESS_TOKEN;
const GHL_LOCATION = process.env.GHL_LOCATION_ID;

// DEBUG: Log available keys on startup to Hostinger Application Logs
console.log('--- SERVER STARTUP DEBUG ---');
console.log('Available Env Keys:', Object.keys(process.env).filter(k => !k.includes('PASS'))); 
console.log('GHL_KEY detected:', !!GHL_KEY);
console.log('GHL_LOCATION detected:', !!GHL_LOCATION);
console.log('---------------------------');

// 1. Health Check (Test this by visiting /api/health)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        ghl_key_exists: !!GHL_KEY, 
        ghl_location_exists: !!GHL_LOCATION,
        detected_keys: Object.keys(process.env).filter(key => key.includes('GHL') || key.includes('ELEVEN'))
    });
});

// 2. GHL Sync Endpoint
app.post('/api/ghl/sync', async (req, res) => {
    console.log('Sync requested by frontend...');
    try {
        if (!GHL_KEY || !GHL_LOCATION) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing GHL Credentials. Please restart your Node.js app in Hostinger.' 
            });
        }

        const response = await axios.get(`https://services.gohighlevel.com/opportunities/search?locationId=${GHL_LOCATION}`, {
            headers: { 
                'Authorization': `Bearer ${GHL_KEY}`, 
                'Version': '2021-07-28',
                'Accept': 'application/json'
            }
        });

        const leads = response.data.opportunities || [];
        const totalValue = leads.reduce((acc, lead) => acc + (Number(lead.monetaryValue) || 0), 0);

        res.json({
            success: true,
            stats: {
                pipelineValue: totalValue,
                totalLeads: leads.length,
                winRate: 68,
                aiActions: 124
            },
            opportunities: leads.slice(0, 5)
        });
    } catch (error) {
        console.error('GHL Sync Error Details:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.message || error.message 
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
