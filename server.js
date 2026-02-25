const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Environment Variables from Hostinger
const GHL_KEY = process.env.GHL_ACCESS_TOKEN;
const GHL_LOCATION = process.env.GHL_LOCATION_ID;

// 1. Health Check (Test this by visiting /api/health)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        ghl_key_exists: !!GHL_KEY, 
        ghl_location_exists: !!GHL_LOCATION 
    });
});

// 2. GHL Sync Endpoint
app.post('/api/ghl/sync', async (req, res) => {
    console.log('Starting GHL Sync...');
    try {
        if (!GHL_KEY || !GHL_LOCATION) {
            throw new Error('Missing GHL Credentials in Environment Variables');
        }

        const response = await axios.get(`https://services.gohighlevel.com/opportunities/search?locationId=${GHL_LOCATION}`, {
            headers: { 'Authorization': `Bearer ${GHL_KEY}`, 'Version': '2021-07-28' }
        });

        // Simplified data for the dashboard
        const leads = response.data.opportunities || [];
        const totalValue = leads.reduce((acc, lead) => acc + (lead.monetaryValue || 0), 0);

        res.json({
            success: true,
            stats: {
                pipelineValue: totalValue,
                totalLeads: leads.length,
                winRate: 68, // Hardcoded for now
                aiActions: 124
            },
            opportunities: leads.slice(0, 5) // Send top 5
        });
    } catch (error) {
        console.error('GHL Sync Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
