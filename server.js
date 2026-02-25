const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Hostinger uses process.env.PORT; default to 3000 for local testing
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets (index.html, dashboard.jsx) from the current folder
app.use(express.static(path.join(__dirname, '.')));

/**
 * GHL v2 API Proxy
 * Handles authentication on the server side to protect your token
 */
app.post('/api/ghl/sync', async (req, res) => {
    const { GHL_ACCESS_TOKEN, GHL_LOCATION_ID } = process.env;
    
    if (!GHL_ACCESS_TOKEN || !GHL_LOCATION_ID) {
        return res.status(400).json({ error: "GHL credentials missing in Hostinger environment variables." });
    }

    try {
        const response = await axios.get(`https://services.leadconnectorhq.com/opportunities/search?location_id=${GHL_LOCATION_ID}`, {
            headers: {
                'Authorization': `Bearer ${GHL_ACCESS_TOKEN}`,
                'Version': '2021-07-28'
            }
        });
        res.json(response.data);
    } catch (err) {
        console.error("GHL Error:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to sync with CRM" });
    }
});

/**
 * ElevenLabs Signed URL Proxy
 * Required for the Moore AI Voice Agent session
 */
app.post('/api/voice/session', async (req, res) => {
    const { ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID } = process.env;
    
    if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
        return res.status(400).json({ error: "Voice credentials missing in Hostinger environment variables." });
    }

    try {
        const response = await axios.get(
            `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`,
            { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
        );
        res.json({ signedUrl: response.data.signed_url });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate AI voice session" });
    }
});

// Serve index.html for all other routes to support Single Page Application behavior
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Moore AI SaaS Engine running on port ${PORT}`);
});
