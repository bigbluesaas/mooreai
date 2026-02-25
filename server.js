const express = require('express');
const path = require('path');
const app = express();

// --- STEP 1: KILL THE 503 (IMMEDIATE BINDING) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SERVICE] Process started on port ${PORT}`);
});

app.use(express.json());
app.use(express.static('.'));

// --- STEP 2: LOAD UTILITIES SAFELY ---
const axios = require('axios');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

let db = null;
let appId = 'default-app';

try {
    const firebaseConfig = JSON.parse(process.env.__firebase_config || '{}');
    appId = process.env.__app_id || 'default-app';
    if (firebaseConfig.apiKey) {
        const fbApp = initializeApp(firebaseConfig);
        db = getFirestore(fbApp);
    }
} catch (e) {
    console.error('[SERVICE] Config initialization deferred.');
}

// 1. Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', binding: 'immediate', port: PORT });
});

// 2. Mock Sync (Guaranteed to return data for UI testing)
app.post('/api/ghl/sync', (req, res) => {
    res.json({
        success: true,
        isDemo: true,
        stats: { pipelineValue: 155000, totalLeads: 48, winRate: 82, aiActions: 624 },
        opportunities: [
            { id: '1', name: 'System Check: Solar', status: 'open', value: 45000, contact: 'Server Online' },
            { id: '2', name: 'System Check: Roof', status: 'won', value: 15000, contact: 'Port Bound' }
        ]
    });
});

// 3. Fallback to Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
