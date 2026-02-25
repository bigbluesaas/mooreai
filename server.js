const express = require('express');
const path = require('path');
const app = express();

/**
 * STUPID SIMPLE RECOVERY SERVER
 * Goal: Force the UI live and kill the 503.
 */

// 1. Immediate Port Binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('------------------------------------');
    console.log(`SERVER STARTED ON PORT: ${PORT}`);
    console.log('------------------------------------');
});

app.use(express.json());
app.use(express.static('.'));

// 2. Barebones Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'Recovery server is live',
        timestamp: new Date().toISOString()
    });
});

// 3. Mock Data for Dashboard (No API calls)
app.post('/api/ghl/sync', (req, res) => {
    res.json({
        success: true,
        isDemo: true,
        stats: {
            pipelineValue: 155000,
            totalLeads: 48,
            winRate: 82,
            aiActions: 624
        },
        opportunities: [
            { id: 'r1', name: 'Recovery Lead: Solar', status: 'open', value: 45000, contact: 'Server Stable' },
            { id: 'r2', name: 'Recovery Lead: Roof', status: 'won', value: 15000, contact: 'Port Bound' }
        ]
    });
});

// 4. Fallback to Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
