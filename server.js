const express = require('express');
const path = require('path');
const app = express();

/**
 * EMERGENCY RECOVERY MODE
 * Goal: Kill 503 error by binding port immediately and removing all heavy dependencies.
 */

const PORT = process.env.PORT || 3000;

// 1. Bind port immediately so Hostinger sees the app as "Healthy"
app.listen(PORT, () => {
    console.log(`RECOVERY SERVER LIVE ON PORT ${PORT}`);
});

app.use(express.json());
app.use(express.static('.'));

// 2. Mock API Routes - Guaranteed to return 200 OK
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', mode: 'recovery', note: 'Firebase/GHL temporarily disabled to clear 503' });
});

app.get('/api/debug/logs', (req, res) => {
    res.json({ logs: [{ time: new Date().toLocaleTimeString(), msg: "Recovery mode active. UI is live.", type: "info" }] });
});

// 3. Mock Sync - Returns demo data instantly so UI populates
app.post('/api/ghl/sync', (req, res) => {
    res.json({
        success: true,
        isDemo: true,
        stats: {
            pipelineValue: 125500,
            totalLeads: 42,
            winRate: 88,
            aiActions: 512
        },
        opportunities: [
            { id: '1', name: 'Recovery: Solar System A', status: 'open', value: 35000, contact: 'System Stable' },
            { id: '2', name: 'Recovery: Roof Replacement', status: 'won', value: 12000, contact: 'Connection Live' },
            { id: '3', name: 'Recovery: HVAC Repair', status: 'open', value: 4500, contact: 'Port Bound' }
        ]
    });
});

// 4. Fallback to Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
