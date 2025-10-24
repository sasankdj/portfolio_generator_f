import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import mammoth from 'mammoth';
import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { GoogleGenAI } from "@google/genai";
import Tesseract from 'tesseract.js'; 
import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer-core';
import HTMLToDOCX from 'html-to-docx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jwt from 'jsonwebtoken';

import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Portfolio from './models/Portfolio.js';
import netlifyAuthRoutes from './routes/netlifyAuth.js';
import deployRoutes from './routes/deploy.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001; // Use environment variable for port

// ✅ Define allowed origins
const allowedOrigins = [
  "https://portfolio-generator-f.vercel.app", // production frontend
  "https://portfolio-generator-f-1w22.vercel.app", // new production frontend
  "http://localhost:5173",                    // local dev (Vite)
  "http://localhost:3000"                     // optional React dev
];

// ✅ Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle all preflight (OPTIONS) requests manually
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.endsWith(".vercel.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  return res.status(200).end();
});

// Increase the server timeout to 5 minutes (300,000 ms) to handle long AI requests
app.timeout = 300000;

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });

// --- Auth Middleware ---
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Validate token before verification
      if (!token || typeof token !== 'string' || token.trim() === '' || token === 'null' || token === 'undefined') {
        return res.status(401).json({ msg: 'Not authorized, no token' });
      }

      token = token.trim();

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError.message);
        return res.status(401).json({ msg: 'Not authorized, token failed' });
      }

      // Get user from the token payload (which is { user: { id: ... } })
      // and attach to request object, excluding the password.
      req.user = await User.findById(decoded.user.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      next(); // Proceed to the protected route
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

app.post('/api/deploy/netlify', protect, upload.single('zipFile'), async (req, res) => {
  // Check if user has connected their Netlify account
  const user = await User.findById(req.user.id);
  if (!user.netlifyToken) {
    return res.status(400).json({ error: 'Please connect your Netlify account first.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'ZIP file is required for deployment.' });
  }

  try {
    const zipBuffer = req.file.buffer;
    let siteId = user.netlifySiteId;
    let siteUrl;

    // If user doesn't have a site ID, create a new site
    if (!siteId) {
      const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.netlifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Create a site with a random name
      });

      if (!createSiteResponse.ok) {
        const errorData = await createSiteResponse.json();
        throw new Error(`Failed to create Netlify site: ${errorData.message || createSiteResponse.statusText}`);
      }

      const siteData = await createSiteResponse.json();
      siteId = siteData.id;
      siteUrl = siteData.ssl_url || siteData.url;

    // Save the new site ID to the user's record
    user.netlifySiteId = siteId;
    if (!user.name) {
      user.name = 'Unknown User';
    }
    await user.save();
    }

    // Deploy the ZIP file to the site (either new or existing)
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.netlifyToken}`,
        'Content-Type': 'application/zip',
      },
      body: zipBuffer,
    });

    if (!deployResponse.ok) {
      const errorData = await deployResponse.json();
      throw new Error(`Failed to deploy to Netlify: ${errorData.message || deployResponse.statusText}`);
    }

    const deployData = await deployResponse.json();

    // If we created a new site, we already have the URL.
    // If we deployed to an existing site, the deploy response contains the URL.
    res.json({ url: siteUrl || deployData.ssl_url || deployData.url });

  } catch (error) {
    console.error('Netlify deployment process failed:', error);
    res.status(500).json({ error: error.message || 'An error occurred during deployment.' });
  }
});

const oAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware

app.use(express.json({ limit: '50mb' }));
app.use('/generated', express.static(path.join(__dirname, 'generated')));

app.use('/auth', netlifyAuthRoutes);
app.use('/api', deployRoutes);

// Set up multer for in-memory file storage (removed duplicate)

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // get key from .env
});

// --- Authentication Routes ---
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, phone } = req.body; // Added phone

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // ✅ Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name: name, // Explicitly use the name from the request
      email: email,
      password: hashedPassword,
      phone: phone // Added phone
    });
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, id: user.id, name: user.name, email: user.email, phone: user.phone });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});


app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found. Please sign up before logging in.' });
    }

    // If the user has a googleId or githubId, they should use social login.
    if (user.googleId || user.githubId) {
      return res.status(400).json({ msg: 'This account was created using a social provider. Please log in with Google or GitHub.' });
    }

    // For standard email/password users, directly compare the password.
    // The password in the DB is always expected to be hashed for these users.
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials. Please try again.' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ token, name: user.name, email: user.email, id: user.id, phone: user.phone });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    // Set the access token
    oAuth2Client.setCredentials({ access_token: token });

    // Get user info using the access token
    const userInfo = await oAuth2Client.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' });
    const { email, name, id: googleId } = userInfo.data;

    if (!email) {
      return res.status(400).json({ msg: 'Could not extract user information from Google token.' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Create a new user if they don't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(`google_${googleId}`, salt); // Hash the dummy password
      user = new User({ email, name, googleId, password: hashedPassword });
      await user.save();
    }

    // Create and return JWT
    const jwtPayload = { user: { id: user.id } };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ token: jwtToken, id: user.id, name: user.name, email: user.email, phone: user.phone });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(500).send('Server error during Google authentication');
  }
});

app.post('/api/auth/github', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ msg: 'GitHub authorization code not provided.' });
  }

  try {
    // 1. Exchange code for an access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to get GitHub access token.');
    }

    // 2. Use access token to get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const githubUser = await userResponse.json();
    const { name, email, id: githubId, login: githubLogin } = githubUser;

    // Use email if available, otherwise construct one from login
    const userEmail = email || `${githubLogin}@users.noreply.github.com`;

    // 3. Find or create user in your database
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      // Create a new user if they don't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(`github_${githubId}`, salt); // Hash the dummy password
      user = new User({
        name: name || githubLogin,
        email: userEmail,
        githubId,
        password: hashedPassword,
      });
      await user.save();
    }

    // 4. Create and return JWT
    const jwtPayload = { user: { id: user.id } };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ token, id: user.id, name: user.name, email: user.email, phone: user.phone });
  } catch (err) {
    console.error('GitHub auth error:', err.message);
    res.status(500).send('Server error during GitHub authentication');
  }
});

// --- Vercel OAuth Routes ---
app.get('/api/auth/vercel/init', protect, (req, res) => {
  const clientId = process.env.VERCEL_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${process.env.FRONTEND_URL}/auth/vercel/callback`);
  const scope = 'read,read:user,read:teams,write:deployments';
  const state = req.user.id; // Use user ID as state for security

  const authUrl = `https://vercel.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;

  res.json({ authUrl });
});

app.get('/api/auth/connections', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      isVercelConnected: !!user.vercelToken,
      isNetlifyConnected: !!user.netlifyToken,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error checking connections' });
  }
});

// --- Netlify OAuth Routes ---
app.get('/api/auth/netlify/init', protect, (req, res) => {
  const clientId = process.env.NETLIFY_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${process.env.FRONTEND_URL}/auth/netlify/callback`);
  const state = req.user.id; // Use user ID as state for security

  // const authUrl = `https://app.netlify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=all&state=${state}&response_type=code`;
const authUrl = `https://app.netlify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code`;

  res.json({ authUrl });
});

app.post('/api/auth/netlify/callback', protect, async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ msg: 'Missing code or state parameter.' });
  }

  if (state !== req.user.id) {
    return res.status(400).json({ msg: 'Invalid state parameter.' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.netlify.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NETLIFY_CLIENT_ID,
        client_secret: process.env.NETLIFY_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.FRONTEND_URL}/auth/netlify/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to get Netlify access token.');
    }

    const { access_token } = tokenData;

    // Update user with Netlify token
    await User.findByIdAndUpdate(req.user.id, {
      netlifyToken: access_token,
    });

    res.json({ msg: 'Netlify account connected successfully.' });
  } catch (err) {
    console.error('Netlify auth error:', err.message);
    res.status(500).json({ msg: 'Server error during Netlify authentication' });
  }
});
app.post('/api/auth/vercel/callback', protect, async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ msg: 'Missing code or state parameter.' });
  }

  if (state !== req.user.id) {
    return res.status(400).json({ msg: 'Invalid state parameter.' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.VERCEL_CLIENT_ID,
        client_secret: process.env.VERCEL_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.FRONTEND_URL}/auth/vercel/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to get Vercel access token.');
    }

    const { access_token, refresh_token } = tokenData;

    // Update user with Vercel tokens
    await User.findByIdAndUpdate(req.user.id, {
      vercelToken: access_token,
      vercelRefreshToken: refresh_token,
    });

    res.json({ msg: 'Vercel account connected successfully.' });
  } catch (err) {
    console.error('Vercel auth error:', err.message);
    res.status(500).json({ msg: 'Server error during Vercel authentication' });
  }
});

// --- GitHub Repo Fetching Route ---
app.get('/api/github/repos/:username', async (req, res) => {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ error: 'GitHub username is required.' });
  }

  try {
    // Using a token is best practice to avoid rate limiting
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=pushed&direction=desc&per_page=20`, { headers });

    if (!response.ok) {
      if (response.status === 404) return res.status(404).json({ error: 'GitHub user not found.' });
      throw new Error(`GitHub API responded with status ${response.status}`);
    }

    const repos = await response.json();
    const simplifiedRepos = repos.map(repo => ({
      title: repo.name.replace(/[-_]/g, ' '),
      description: repo.description || '',
      link: repo.html_url,
      technologies: repo.language || '',
    }));
    res.json(simplifiedRepos);
  } catch (error) {
    console.error('Error fetching GitHub repos:', error.message);
    res.status(500).json({ error: 'Failed to fetch repositories from GitHub.' });
  }
});

// --- Portfolio Data Routes ---
app.get('/api/portfolio', protect, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.id });
    if (!portfolio || !portfolio.data) {
      return res.status(404).json({ msg: 'Portfolio not found for this user.' });
    }
    res.json(portfolio.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/portfolio', protect, async (req, res) => {
  // The entire request body is the form data, excluding the userId which we get from the token.
  const formData = req.body;
  const portfolioData = { user: req.user.id, data: formData }; // Use the authenticated user's ID
  const portfolio = await Portfolio.findOneAndUpdate({ user: req.user.id }, portfolioData, { new: true, upsert: true });
  
  res.json(portfolio);
});


app.post("/api/enhance", async (req, res) => {
  const { text, field } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    const prompt = `Improve this ${field} for a professional portfolio:\n${text}`;

    // Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // official model from doc
      contents: prompt,
    });

    // The response.text contains the enhanced text
    const enhanced = response.text || "";

    res.json({ enhanced });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Error enhancing text" });
  }
});

app.post('/api/enhance-all', async (req, res) => {
  const { formData } = req.body;
  if (!formData) {
    return res.status(400).json({ error: 'No form data provided.' });
  }

  try {
    const prompt = `
You are a professional career coach. Review the following portfolio data and enhance the text to be more professional, compelling, and concise.
- Improve the 'careerObjective'.
- Refine the 'description' and 'technologies' for each project.
- Make 'achievements' more impactful.

Return the result as a JSON object with the exact same structure as the input. Do not add any fields that don't exist in the original. Do not include markdown or any explanations.

Input JSON:
${JSON.stringify(formData, null, 2)}

Enhanced JSON Output:
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let aiText = (response.text || "")
      .replace(/```json\s*|```/g, "")
      .trim();

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return a valid JSON object.");
    }

    const enhancedData = JSON.parse(jsonMatch[0]);
    res.json({ enhancedData });
  } catch (err) {
    console.error("Global enhancement error:", err);
    res.status(500).json({ error: "Error enhancing portfolio data." });
  }
});

app.post('/api/chatbot', async (req, res) => {
  const { messages } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided.' });
  }

  try {
    const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const prompt = `
You are 'Vita', a friendly and helpful chatbot assistant for a portfolio builder website.
Your primary goal is to help users build their portfolio. You are currently in a conversation with a user.

Here is the conversation history:
${conversationHistory}

The user's last message is a question. Provide a helpful and concise answer. Do not ask to continue the form-filling script. Just answer the question.
`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const reply = response.text || "I'm not sure how to answer that. Let's continue with the form.";
    res.json({ reply });
  } catch (err) {
    console.error("Chatbot AI error:", err);
    res.status(500).json({ reply: "Sorry, I'm having a little trouble thinking right now. Please try again in a moment." });
  }
});

app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  try {
    let text = '';

    // Extract raw text from PDF or DOCX
    if (req.file.mimetype === 'application/pdf') {
      const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const data = await pdf(req.file.buffer);
      text = data.text;
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else {
      return res.status(400).send('Unsupported file type. Please upload a PDF or DOCX.');
    }

    // ---------------------------
    // Step 1: Try AI parsing
    // ---------------------------
    const prompt = `
Extract the following fields from this resume text as JSON only (no explanations, no markdown):
{
  "fullName": "",
  "headline": "",
  "email": "",
  "github": "",
  "linkedin": "",
  "careerObjective": "",
  "skills": [],
  "education": [{ "university": "", "degree": "", "duration": "", "details": "" }],
  "projects": [{ "title": "", "description": "", "technologies": "", "link": "" }],
  "experience": [{ "jobTitle": "", "company": "", "duration": "", "responsibilities": [] }],
  "achievements": []
}

Resume Text:
${text}
`;

    let parsedData;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let aiText = (response.text || "")
        .replace(/```json\s*|```/g, "")
        .trim();

      // Find first {...} block in case of extra text
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object in AI output");

      parsedData = JSON.parse(jsonMatch[0]);
      console.log("AI parsed data:", parsedData);

    } catch (err) {
      console.warn("AI parsing failed, falling back to regex:", err.message);
      parsedData = parseResumeText(text);
    }

    res.json(parsedData);

  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: 'Error processing resume file on the server.' });
  }
});

const parseResumeText = (text) => {
  const response = {};

  // Try to find an email address
  const emailMatch = text.match(/["']?["']?[\w.-]+@["']?[\w.-]+\.["']?[\w"]+/);
  if (emailMatch) {
    response.email = emailMatch[0];
  }

  // Try to find a name (simple heuristic: look for a capitalized two-word phrase near the top)
  const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
  if (nameMatch) {
    response.fullName = nameMatch[0];
  }

  // Try to find a headline (a short line under the name)
  const headlineMatch = text.split('\n')[1]; // Very basic heuristic
  if (headlineMatch && headlineMatch.length < 100 && !headlineMatch.includes('@')) {
    response.headline = headlineMatch.trim();
  }

  // Try to find a LinkedIn URL
  const linkedinMatch = text.match(/linkedin:(.*)/);
  if (linkedinMatch && linkedinMatch[1]) {
    response.linkedin = 'https://www.linkedin.com/in/' + linkedinMatch[1].trim();
  }

  // Try to find a GitHub URL
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i) || text.match(/github:(.*)/);
  if (githubMatch) {
    response.github = githubMatch[1] ? githubMatch[1].trim() : (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`);
  }

  // Try to find a summary
  const careerObjectiveMatch = text.match(/(?:PROFILE|SUMMARY|CAREER OBJECTIVE)\s*\n([\s\S]*?)(?=\n\n[A-Z\s]+$|\n\n[A-Z])/im);
  if (careerObjectiveMatch && careerObjectiveMatch[2]) {
    response.careerObjective = careerObjectiveMatch[2].trim();
  }

  // Try to find skills
  const skillsMatch = text.match(/SKILLS\n([\s\S]*?)(?=\n\n|CERTIFICATIONS)/i);
  if (skillsMatch && skillsMatch[1]) {
    response.skills = skillsMatch[1].replace(/\n/g, ', ').replace(/, ,/g, ',').replace(/,$/, '').trim();
  }

  // Try to find education
  const educationMatch = text.match(/EDUCATION\n([\s\S]*?)(?=\n\nSKILLS|\n\nEXPERIENCE)/i);
  if (educationMatch && educationMatch[1]) {
    const [university, degree, duration, ...details] = educationMatch[1].trim().split('\n');
    response.education = [{ university: university?.replace(/,.*$/, '').trim() || '', degree: degree?.split('(')[0].trim() || '', duration: duration?.match(/\((.*?)\)/)?.[1] || '', details: details.join(' ').trim() }];
  }

  // Try to find projects
  const projectsMatch = text.match(/PROJECTS\n([\s\S]*?)(?=\n\nACHIEVEMENTS)/i);
  if (projectsMatch && projectsMatch[1]) {
      const projectsStr = projectsMatch[1].trim();
      const projectBlocks = projectsStr.split(/\n\n/);
      response.projects = projectBlocks.map(block => {
          const lines = block.split('\n');
          const title = lines[0]?.trim() || '';
          let description = '';
          let technologies = '';
          let link = block.match(/https?:\/\/[^\s,]+/)?.[0] || '';

          for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              if (line.toLowerCase().includes('skills used:') || line.toLowerCase().includes('technologies:')) {
                  technologies = line.split(':')[1]?.trim() || '';
              } else {
                  description += line + ' ';
              }
          }

          return { title, description: description.trim(), technologies };
      });
  } else { response.projects = []; }

  // Try to find experience
  const experienceMatch = text.match(/EXPERIENCE([\s\S]*?)PROJECTS/i);
  if (experienceMatch && experienceMatch[1]) {
      const expStr = experienceMatch[1].trim();
      const expParts = expStr.split(/\n\n/); // Split by double newline
      if (expParts.length > 0) {
          const firstExp = expParts[0].split('\n');
          if (firstExp.length >= 2) {
              const companyMatch = firstExp[0].match(/(.*?)\s{2,}/);
              const company = companyMatch ? companyMatch[1].trim() : firstExp[0].trim();
              const titleDurationMatch = firstExp[1].match(/(.*?)\s{2,}(.*)/);
              let jobTitle = '';
              let duration = '';
              if(titleDurationMatch){
                jobTitle = titleDurationMatch[1].trim();
                duration = titleDurationMatch[2].trim();
              }
              const responsibilities = firstExp.slice(2).join('\n').trim();
              response.experience = {
                  jobTitle,
                  company,
                  duration,
                  responsibilities
              };
          }
      } else { response.experience = []; }
  }

  // Try to find achievements
  const achievementsMatch = text.match(/ACHIEVEMENTS\n([\s\S]*)/i);
  if (achievementsMatch && achievementsMatch[1]) {
    response.achievements = achievementsMatch[1].trim().split('\n').filter(Boolean);
  }

  return response;
};




app.post('/generate-portfolio', async (req, res) => {
  const { formData, template } = req.body;

  if (!formData || !template) {
    return res.status(400).json({ error: 'Missing formData or template' });
  }

  const templateMap = {
    classic: 'ClassicTheme', 
    dark: 'DarkTheme',
    minimal: 'MinimalistTheme',
    creative: 'CreativeTheme',
  };

  const sanitizedTemplate = path.normalize(template).replace(/^(\.\.[/\\])+/, '');
  const templateFileName = templateMap[sanitizedTemplate];

  if (!templateFileName) {
    return res.status(400).json({ error: 'Invalid template' });
  }

  const templatePath = path.join(__dirname, '..', 'frontend', 'src', 'templates', `${templateFileName}.html`);

  try {
    let generatedHtml = await fs.readFile(templatePath, 'utf8');

    // --- Replace placeholders ---
    generatedHtml = generatedHtml.replace(/{{fullName}}/g, formData.fullName || '');
    generatedHtml = generatedHtml.replace(/{{headline}}/g, formData.headline || '');
    generatedHtml = generatedHtml.replace(/{{email}}/g, formData.email || '');
    generatedHtml = generatedHtml.replace(/{{github}}/g, formData.github || '');
    generatedHtml = generatedHtml.replace(/{{careerObjective}}/g, formData.careerObjective || '');
    generatedHtml = generatedHtml.replace(/{{avatarUrl}}/g, formData.image || 'https://imgcdn.stablediffusionweb.com/2024/11/1/b51f49a9-82a1-4659-905d-c8cd8643bade.jpg');

    // Skills
    if (formData.skills) {
      let skillsHtml = '';
      if (template === 'classic') {
        skillsHtml = formData.skills.split(',').map(skill => `<span class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full">${skill.trim()}</span>`).join('\n');
      } else if (template === 'dark') {
        skillsHtml = formData.skills.split(',').map(skill => `<span class="px-4 py-2 bg-gray-700 text-green-400 rounded-lg">${skill.trim()}</span>`).join('\n');
      } else if (template === 'minimal') {
        skillsHtml = formData.skills.split(',').map(skill => `<span class="skill">${skill.trim()}</span>`).join('\n');
      } else if (template === 'creative') {
        skillsHtml = formData.skills.split(',').map(skill => `<span class="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">${skill.trim()}</span>`).join('\n');
      }
      generatedHtml = generatedHtml.replace('<!-- SKILLS -->', skillsHtml);
    }


    // Projects
     if (formData.projects && formData.projects.length > 0) {
      let projectsHtml = '';
      if (template === 'classic') {
        projectsHtml = formData.projects.map(project => `
          <div class="project-card bg-white rounded-lg overflow-hidden shadow-md transition duration-300">
            <div class="p-6">
              <h3 class="text-2xl font-semibold text-gray-800 mb-2">${project.title}</h3>
              <p class="text-gray-600 mb-4">${project.description}</p>
              <div class="mb-4">
                <h4 class="font-medium text-gray-800 mb-2">Technologies:</h4>
                <div class="flex flex-wrap gap-2">
                  ${(project.technologies || '').split(',').map(tech => `<span class="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">${tech.trim()}</span>`).join('')}
                </div>
              </div>
              <a href="${project.link || '#'}" class="text-indigo-600 font-medium hover:underline inline-flex items-center">
                View Project
                <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </a>
            </div>
          </div>
        `).join('\n');
      } else if (template === 'dark') {
        projectsHtml = formData.projects.map(project => `
        <div class="project-card bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg transition duration-300 hover:border-green-600 hover:border-opacity-50">
          <div class="p-6">
            <h3 class="text-2xl font-semibold text-gray-100 mb-2">${project.title}</h3>
            <p class="text-gray-300 mb-4">${project.description}</p>
            <div class="mb-4">
              <h4 class="font-medium text-green-400 mb-2">Technologies</h4>
              <div class="flex flex-wrap gap-2">
                ${(project.technologies || '').split(',').map(tech => `<span class="px-3 py-1 bg-gray-700 text-green-400 text-xs rounded-lg">${tech.trim()}</span>`).join('')}
              </div>
            </div>
            <a href="${project.link || '#'}" class="text-green-400 hover:text-green-300 font-medium hover:underline inline-flex items-center">
              View project
              <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>
        </div>
        `).join('\n');
      } else if (template === 'minimal') {
        projectsHtml = formData.projects.map(project => `
        <div class="project fade-in">
          <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="tech-stack">
              ${(project.technologies || '').split(',').map(tech => `<span>${tech.trim()}</span>`).join('')}
            </div>
            <a href="${project.link || '#'}">View Project →</a>
          </div>
        </div>
        `).join('\n');
      } else if (template === 'creative') {
        projectsHtml = formData.projects.map(project => `
        <div class="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${project.title}</h3>
          <p class="text-gray-600 mb-4 text-sm">${project.description}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${(project.technologies || '').split(',').map(tech => `<span class="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">${tech.trim()}</span>`).join('')}
          </div>
          <a href="${project.link || '#'}" class="text-pink-600 font-semibold hover:underline text-sm">
            View Project &rarr;
          </a>
        </div>
        `).join('\n');
      }
      generatedHtml = generatedHtml.replace('<!-- PROJECTS -->', projectsHtml);
    }

    // Achievements
     if (formData.achievements) {
        let achievementsHtml = formData.achievements.filter(a => a.quote).map(achievement => {
          if (template === 'classic') {
            return `
          <div class="testimonial-card bg-gray-50 p-8 rounded-lg shadow-sm">
              <p class="text-gray-700 italic">"${achievement.quote}"</p>
          </div>`;
          } else if (template === 'dark') {
            return `
          <div class="testimonial-card bg-gray-700 p-8 rounded-lg border border-gray-600 hover:border-green-600 hover:border-opacity-50 transition duration-300">
            <p class="text-gray-300 italic">"${achievement.quote}"</p>
          </div>`;
          }
          return ''; // Return empty string for other templates or if no quote
        }).join('\n');
        generatedHtml = generatedHtml.replace('<!-- TESTIMONIALS -->', achievementsHtml);
    }
    // --- Return HTML directly in JSON ---
    res.json({ html: generatedHtml });
  } catch (error) {
    console.error('Error in /generate-portfolio:', error);
    res.status(500).json({ error: 'Failed to generate portfolio' });
  }
});

/**
 * Populates a given resume HTML template with user data.
 * @param {string} templateHtml - The raw HTML content of the template.
 * @param {object} formData - The user's portfolio data.
 * @returns {string} The populated HTML string.
 */
function populateResumeTemplate(templateHtml, formData) {
  let generatedHtml = templateHtml;

  // --- Replace placeholders ---
  generatedHtml = generatedHtml.replace(/{{fullName}}/g, formData.fullName || '');
  generatedHtml = generatedHtml.replace(/{{email}}/g, formData.email || '');
  generatedHtml = generatedHtml.replace(/{{phone}}/g, formData.phone || '');
  generatedHtml = generatedHtml.replace(/{{portfolioLink}}/g, formData.portfolioLink || '#');
  generatedHtml = generatedHtml.replace(/{{github}}/g, formData.github || '#');
  generatedHtml = generatedHtml.replace(/{{linkedin}}/g, formData.linkedin || '#');
  generatedHtml = generatedHtml.replace(/{{profile}}/g, formData.careerObjective || '');

  // Education
  if (formData.education && formData.education.length > 0) {
    const edu = formData.education[0]; // Assuming one for simplicity
    let educationHtml = `<p><strong>${edu.university || ''}</strong>, ${edu.location || ''}<br>${edu.degree || ''} (${edu.duration || ''})<br>${edu.details || ''}</p>`;
    generatedHtml = generatedHtml.replace('<!-- EDUCATION -->', educationHtml);
  }

  // Skills
  if (formData.skills) {
    const skillsHtml = `<p>${formData.skills.split(',').map(s => s.trim()).join(', ')}</p>`;
    generatedHtml = generatedHtml.replace('<!-- SKILLS -->', skillsHtml);
  }

  // Experience
  if (formData.experience && formData.experience.length > 0) {
    const experienceHtml = formData.experience.map(exp => `<p><strong>${exp.jobTitle || ''} | ${exp.company || ''} (${exp.duration || ''})</strong></p><ul>${(exp.responsibilities || []).map(res => `<li>${res}</li>`).join('')}</ul>`).join('');
    generatedHtml = generatedHtml.replace('<!-- EXPERIENCE -->', experienceHtml);
  }

  // Projects
  if (formData.projects && formData.projects.length > 0) {
    const projectsHtml = formData.projects.map(proj => `<p><strong>${proj.title}</strong></p><ul><li>${proj.description}</li><li><a href="${proj.link || '#'}">${proj.link || ' '}</a></li></ul>`).join('');
    generatedHtml = generatedHtml.replace('<!-- PROJECTS -->', projectsHtml);
  }

  // Achievements
  if (formData.achievements && formData.achievements.length > 0) {
    const achievementsHtml = formData.achievements.map(ach => `<li>${ach.quote || ''}</li>`).join('');
    generatedHtml = generatedHtml.replace('<!-- ACHIEVEMENTS -->', `<ul>${achievementsHtml}</ul>`);
  }

  return generatedHtml;
}

app.post('/api/generate-resume', async (req, res) => {
  const { formData, template } = req.body;

  if (!formData || !template) {
    return res.status(400).json({ error: 'Missing formData or template' });
  }

  const templateMap = {
    resume1: 'resume1',
    resume2: 'resume2',
  };

  const sanitizedTemplate = path.normalize(template).replace(/^(\.\.[/\\])+/, '');
  const templateFileName = templateMap[sanitizedTemplate];

  if (!templateFileName) {
    return res.status(400).json({ error: 'Invalid resume template' });
  }

  const templatePath = path.join(__dirname, '..', 'frontend', 'src', 'resumes', `${templateFileName}.html`);

  try {
    let generatedHtml = await fs.readFile(templatePath, 'utf8');

    const finalHtml = populateResumeTemplate(generatedHtml, formData);

    res.json({ html: finalHtml });
  } catch (error) {
    console.error('Error in /api/generate-resume:', error);
    res.status(500).json({ error: 'Failed to generate resume' });
  }
});

app.post('/api/download-resume', async (req, res) => {
  const { formData, template, format } = req.body; // format can be 'pdf' or 'docx'

  if (!formData || !template || !format) {
    return res.status(400).json({ error: 'Missing formData, template, or format' });
  }

  const templateMap = { resume1: 'resume1', resume2: 'resume2' };
  const sanitizedTemplate = path.normalize(template).replace(/^(\.\.[/\\])+/, '');
  const templateFileName = templateMap[sanitizedTemplate];

  if (!templateFileName) {
    return res.status(400).json({ error: 'Invalid resume template' });
  }

  const templatePath = path.join(__dirname, '..', 'frontend', 'src', 'resumes', `${templateFileName}.html`);

  try {
    let generatedHtml = await fs.readFile(templatePath, 'utf8');

    const finalHtml = populateResumeTemplate(generatedHtml, formData);

    if (format === 'pdf') {
      // Find Chrome executable path for puppeteer-core
      let executablePath;
      if (process.platform === 'win32') {
        const chromePaths = [
          path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        ];
        for (const p of chromePaths) {
          try {
            await fs.stat(p);
            executablePath = p;
            break;
          } catch (e) {
            // Path does not exist, continue to the next one
          }
        }
      }
      // Add paths for macOS and Linux if needed for deployment

      if (!executablePath) {
        throw new Error('Google Chrome not found. Please install it to generate PDFs.');
      }
      const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      res.type('application/pdf').send(pdfBuffer);
    } else if (format === 'docx') {
      // Create DOCX document using docx library with formatting to mimic HTML
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: [
            // Header - centered
            new Paragraph({
              alignment: 'center',
              children: [
                new TextRun({
                  text: formData.fullName || '',
                  bold: true,
                  size: 44, // 22pt like h1
                }),
              ],
            }),
            new Paragraph({
              alignment: 'center',
              children: [
                new TextRun({
                  text: `${formData.phone || ''} | ${formData.email || ''}`,
                  size: 24, // 12pt
                }),
              ],
            }),
            ...(formData.portfolioLink || formData.github || formData.linkedin ? [
              new Paragraph({
                alignment: 'center',
                children: [
                  new TextRun({
                    text: `${formData.portfolioLink ? `Portfolio: ${formData.portfolioLink}` : ''}${formData.github ? ` | GitHub: ${formData.github}` : ''}${formData.linkedin ? ` | LinkedIn: ${formData.linkedin}` : ''}`,
                    size: 24,
                  }),
                ],
              }),
            ] : []),
            // Profile section
            ...(formData.careerObjective ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'PROFILE',
                    bold: true,
                    size: 28, // 14pt
                    underline: {},
                    allCaps: true,
                  }),
                ],
                spacing: { after: 120 }, // space after
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: formData.careerObjective,
                    size: 24,
                  }),
                ],
                spacing: { after: 240 }, // more space
              }),
            ] : []),
            // Education section
            ...(formData.education && formData.education.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'EDUCATION',
                    bold: true,
                    size: 28,
                    underline: {},
                    allCaps: true,
                  }),
                ],
                spacing: { after: 120 },
              }),
              ...formData.education.flatMap(edu => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${edu.university || ''} (${edu.duration || ''})`,
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: edu.degree || '',
                      size: 24,
                    }),
                  ],
                }),
                ...(edu.details ? edu.details.split('\n').filter(line => line.trim()).map(line =>
                  new Paragraph({
                    bullet: { level: 0 },
                    children: [
                      new TextRun({
                        text: line.trim(),
                        size: 24,
                      }),
                    ],
                  })
                ) : []),
                new Paragraph({ children: [] }), // empty line
              ]),
            ] : []),
            // Skills section
            ...(formData.skills ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'SKILLS',
                    bold: true,
                    size: 28,
                    underline: {},
                    allCaps: true,
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: formData.skills,
                    size: 24,
                  }),
                ],
                spacing: { after: 240 },
              }),
            ] : []),
            // Experience section
            ...(formData.experience && formData.experience.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'EXPERIENCE',
                    bold: true,
                    size: 28,
                    underline: {},
                    allCaps: true,
                  }),
                ],
                spacing: { after: 120 },
              }),
              ...formData.experience.flatMap(exp => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${exp.jobTitle || ''} | ${exp.company || ''} (${exp.duration || ''})`,
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                ...(exp.responsibilities && exp.responsibilities.length > 0 ? exp.responsibilities.map(res => new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: res,
                      size: 24,
                    }),
                  ],
                })) : []),
                new Paragraph({ children: [] }), // empty line
              ]),
            ] : []),
            // Projects section
            ...(formData.projects && formData.projects.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'PROJECTS',
                    bold: true,
                    size: 28,
                    underline: {},
                    allCaps: true,
                  }),
                ],
                spacing: { after: 120 },
              }),
              ...formData.projects.flatMap(proj => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: proj.title || '',
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: proj.description || '',
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: `Technologies: ${proj.technologies || ''}`,
                      size: 24,
                    }),
                  ],
                }),
                ...(proj.link ? [
                  new Paragraph({
                    bullet: { level: 0 },
                    children: [
                      new TextRun({
                        text: `Link: ${proj.link}`,
                        size: 24,
                      }),
                    ],
                  }),
                ] : []),
                new Paragraph({ children: [] }), // empty line
              ]),
            ] : []),
            // Achievements section
            ...(formData.achievements && formData.achievements.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'ACHIEVEMENTS',
                    bold: true,
                    size: 28,
                    underline: {},
                    allCaps: true,
                  }),
                ],
                spacing: { after: 120 },
              }),
              ...formData.achievements.map(ach => new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: typeof ach === 'string' ? ach : ach.quote || '',
                    size: 24,
                  }),
                ],
              })),
            ] : []),
          ],
        }],
      });

      const docxBuffer = await Packer.toBuffer(doc);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=resume.docx');
      res.send(docxBuffer);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error(`Error in /api/download-resume for format ${format}:`, error);
    res.status(500).json({ error: `Failed to generate ${format} resume` });
  }
});


app.post('/api/download-html', async (req, res) => {
  const { formData, template } = req.body;

  if (!formData || !template) {
    return res.status(400).send('Missing formData or template');
  }

  const templateMap = {
    classic: 'ClassicTheme',
    dark: 'DarkTheme',
    minimal: 'MinimalistTheme',
    creative: 'CreativeTheme',
  };

  const sanitizedTemplate = path.normalize(template).replace(/^(\.\.[/\\])+/, '');
  const templateFileName = templateMap[sanitizedTemplate];

  if (!templateFileName) {
    return res.status(400).send('Invalid template');
  }

  const templatePath = path.join(__dirname, '..', 'frontend', 'src', 'templates', `${templateFileName}.html`);

  try {
    let generatedHtml = await fs.readFile(templatePath, 'utf8');

    // Simple replacements
    generatedHtml = generatedHtml.replace(/{{fullName}}/g, formData.fullName || '');
    generatedHtml = generatedHtml.replace(/{{headline}}/g, formData.headline || '');
    generatedHtml = generatedHtml.replace(/{{email}}/g, formData.email || '');
    generatedHtml = generatedHtml.replace(/{{github}}/g, formData.github || '');
    generatedHtml = generatedHtml.replace(/{{careerObjective}}/g, formData.careerObjective || '');

    // Skills
    if (formData.skills) {
      let skillsHtml = '';
      if (template === 'classic') {
        skillsHtml = formData.skills.split(',').map(skill => `<span class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full">${skill.trim()}</span>`).join('\n');
      } else if (template === 'dark') {
        skillsHtml = formData.skills.split(',').map(skill => `<span class="px-4 py-2 bg-gray-700 text-green-400 rounded-lg">${skill.trim()}</span>`).join('\n');
      } else if (template === 'minimal') {
        skillsHtml = formData.skills.split(',').map(skill => `<span class="skill">${skill.trim()}</span>`).join('\n');
      } else if (template === 'creative') {
        skillsHtml = formData.skills.split(',').map(skill => `<span class="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">${skill.trim()}</span>`).join('\n');
      }
      generatedHtml = generatedHtml.replace('<!-- SKILLS -->', skillsHtml);
    }

    // Projects
    if (formData.projects && formData.projects.length > 0) {
      let projectsHtml = '';
      // This logic is duplicated for brevity, but it's the same as in /generate-portfolio
      if (template === 'classic') {
        projectsHtml = formData.projects.map(project => `
          <div class="project-card bg-white rounded-lg overflow-hidden shadow-md transition duration-300"><div class="p-6"><h3 class="text-2xl font-semibold text-gray-800 mb-2">${project.title}</h3><p class="text-gray-600 mb-4">${project.description}</p><div class="mb-4"><h4 class="font-medium text-gray-800 mb-2">Technologies:</h4><div class="flex flex-wrap gap-2">${(project.technologies || '').split(',').map(tech => `<span class="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">${tech.trim()}</span>`).join('')}</div></div><a href="${project.link || '#'}" class="text-indigo-600 font-medium hover:underline inline-flex items-center">View Project <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></a></div></div>`).join('\n');
      } else if (template === 'minimal') {
        projectsHtml = formData.projects.map(project => `
        <div class="project fade-in">
          <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="tech-stack">
              ${(project.technologies || '').split(',').map(tech => `<span>${tech.trim()}</span>`).join('')}
            </div>
            <a href="${project.link || '#'}">View Project →</a>
          </div>
        </div>
        `).join('\n');
      } else if (template === 'creative') {
        projectsHtml = formData.projects.map(project => `
        <div class="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${project.title}</h3>
          <p class="text-gray-600 mb-4 text-sm">${project.description}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${(project.technologies || '').split(',').map(tech => `<span class="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">${tech.trim()}</span>`).join('')}
          </div>
          <a href="${project.link || '#'}" class="text-pink-600 font-semibold hover:underline text-sm">
            View Project &rarr;
          </a>
        </div>
        `).join('\n');
      } else { // dark
        projectsHtml = formData.projects.map(project => `
        <div class="project-card bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg transition duration-300 hover:border-green-600 hover:border-opacity-50"><div class="p-6"><h3 class="text-2xl font-semibold text-gray-100 mb-2">${project.title}</h3><p class="text-gray-300 mb-4">${project.description}</p><div class="mb-4"><h4 class="font-medium text-green-400 mb-2">Technologies</h4><div class="flex flex-wrap gap-2">${(project.technologies || '').split(',').map(tech => `<span class="px-3 py-1 bg-gray-700 text-green-400 text-xs rounded-lg">${tech.trim()}</span>`).join('')}</div></div><a href="${project.link || '#'}" class="text-green-400 hover:text-green-300 font-medium hover:underline inline-flex items-center">View project <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></a></div></div>`).join('\n');
      }
      generatedHtml = generatedHtml.replace('<!-- PROJECTS -->', projectsHtml);
    }

    // Achievements
    if (formData.achievements) {
        let achievementsHtml = '';
        // This logic is duplicated for brevity
        if (template === 'classic') {
          achievementsHtml = formData.achievements.split('\n').filter(Boolean).map(achievement => `<div class="testimonial-card bg-gray-50 p-8 rounded-lg shadow-sm"><p class="text-gray-700 italic">"${achievement}"</p></div>`).join('\n');
        } else { // dark
          achievementsHtml = formData.achievements.split('\n').filter(Boolean).map(achievement => `<div class="testimonial-card bg-gray-700 p-8 rounded-lg border border-gray-600 hover:border-green-600 hover:border-opacity-50 transition duration-300"><p class="text-gray-300 italic">"${achievement}"</p></div>`).join('\n');
        }
        generatedHtml = generatedHtml.replace('<!-- TESTIMONIALS -->', achievementsHtml);
    }

    // Set headers to trigger download
    res.setHeader('Content-Disposition', 'attachment; filename=portfolio.html');
    res.setHeader('Content-Type', 'text/html');
    res.send(generatedHtml);

  } catch (error) {
    console.error('Error in /api/download-html:', error);
    res.status(500).send('Error generating portfolio for download');
  }
});

/**
 * Generates portfolio HTML from form data and a template.
 * @param {object} formData The user's portfolio data.
 * @param {string} template The name of the template (e.g., 'classic').
 * @returns {Promise<string>} The generated HTML string.
 */
async function generatePortfolioHtml(formData, template) {
  const templateMap = {
    classic: 'ClassicTheme',
    dark: 'DarkTheme',
    minimal: 'MinimalistTheme',
    creative: 'CreativeTheme',
  };

  const sanitizedTemplate = path.normalize(template).replace(/^(\.\.[/\\])+/, '');
  const templateFileName = templateMap[sanitizedTemplate];

  if (!templateFileName) {
    throw new Error('Invalid template specified.');
  }

  const templatePath = path.join(__dirname, '..', 'frontend', 'src', 'templates', `${templateFileName}.html`);
  let generatedHtml = await fs.readFile(templatePath, 'utf8');

  // --- Replace placeholders ---
  generatedHtml = generatedHtml.replace(/{{fullName}}/g, formData.fullName || '');
  generatedHtml = generatedHtml.replace(/{{headline}}/g, formData.headline || '');
  generatedHtml = generatedHtml.replace(/{{email}}/g, formData.email || '');
  generatedHtml = generatedHtml.replace(/{{github}}/g, formData.github || '');
  generatedHtml = generatedHtml.replace(/{{careerObjective}}/g, formData.careerObjective || '');
  generatedHtml = generatedHtml.replace(/{{avatarUrl}}/g, formData.image || 'https://imgcdn.stablediffusionweb.com/2024/11/1/b51f49a9-82a1-4659-905d-c8cd8643bade.jpg');

  // Skills
  if (formData.skills) {
    let skillsHtml = '';
    const skillsList = Array.isArray(formData.skills) ? formData.skills : formData.skills.split(',');
    if (template === 'classic') {
      skillsHtml = skillsList.map(skill => `<span class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full">${skill.trim()}</span>`).join('\n');
    } else if (template === 'dark') {
      skillsHtml = skillsList.map(skill => `<span class="px-4 py-2 bg-gray-700 text-green-400 rounded-lg">${skill.trim()}</span>`).join('\n');
    } else if (template === 'minimal') {
      skillsHtml = skillsList.map(skill => `<span class="skill">${skill.trim()}</span>`).join('\n');
    } else if (template === 'creative') {
      skillsHtml = skillsList.map(skill => `<span class="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">${skill.trim()}</span>`).join('\n');
    }
    generatedHtml = generatedHtml.replace('<!-- SKILLS -->', skillsHtml);
  }

  // Projects
  if (formData.projects && formData.projects.length > 0) {
    let projectsHtml = '';
    if (template === 'classic') {
      projectsHtml = formData.projects.map(project => `
        <div class="project-card bg-white rounded-lg overflow-hidden shadow-md transition duration-300">
          <div class="p-6">
            <h3 class="text-2xl font-semibold text-gray-800 mb-2">${project.title}</h3>
            <p class="text-gray-600 mb-4">${project.description}</p>
            <div class="mb-4">
              <h4 class="font-medium text-gray-800 mb-2">Technologies:</h4>
              <div class="flex flex-wrap gap-2">
                ${(project.technologies || '').split(',').map(tech => `<span class="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">${tech.trim()}</span>`).join('')}
              </div>
            </div>
            <a href="${project.link || '#'}" class="text-indigo-600 font-medium hover:underline inline-flex items-center">
              View Project
              <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>
        </div>
      `).join('\n');
    }
    // ... (add other template logic here for brevity)
    generatedHtml = generatedHtml.replace('<!-- PROJECTS -->', projectsHtml);
  }

  // Achievements
  if (formData.achievements && formData.achievements.length > 0) {
    const achievementsHtml = formData.achievements.filter(a => a.quote).map(achievement => `<div class="testimonial-card"><p>"${achievement.quote}"</p></div>`).join('\n');
    generatedHtml = generatedHtml.replace('<!-- TESTIMONIALS -->', achievementsHtml);
  }

  return generatedHtml;
}
app.get("/debug-cors", (req, res) => {
  res.json({
    originHeader: req.headers.origin || null,
    corsHeader: res.getHeader("Access-Control-Allow-Origin") || "not set",
    message: "Debug endpoint active",
  });
});


app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
