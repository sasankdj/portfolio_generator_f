// routes/deploy.js
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload a zip and create a new Netlify site from it using the user's token
router.post('/deploy', requireAuth, upload.single('zip'), async (req, res) => {
  const token = req.netlifyToken;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'zip file required as form part `zip`' });

  try {
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname });

    const response = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    return res.json({ success: true, site: response.data });
  } catch (err) {
    console.error('Deploy error', err.response?.data || err.message);
    const netlifyErr = err.response?.data || { message: err.message };
    return res.status(500).json({ error: 'Deploy failed', details: netlifyErr });
  }
});

export default router;
