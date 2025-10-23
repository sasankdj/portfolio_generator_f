// routes/netlifyAuth.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const CLIENT_ID = process.env.NETLIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.NETLIFY_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.FRONTEND_URL}/auth/netlify/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Step 1: Redirect user to Netlify auth page
router.get('/netlify', (req, res) => {
  // In production: generate and persist `state` to guard against CSRF
  const state = Math.random().toString(36).slice(2);
  const authUrl = `https://app.netlify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
  res.redirect(authUrl);
});

// Step 2: Callback — exchange code for access token
router.get('/netlify/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');

  try {
    const resp = await fetch('https://api.netlify.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await resp.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to get Netlify access token.');
    }

    const { access_token } = tokenData;

    // DEMO: redirect with token (insecure). Production: store token server-side and set secure cookie/session.
    return res.redirect(`${FRONTEND_URL}/auth/success?token=${access_token}`);
  } catch (err) {
    console.error('OAuth error', err.response?.data || err.message);
    return res.status(500).send('Netlify OAuth failed');
  }
});

export default router;
