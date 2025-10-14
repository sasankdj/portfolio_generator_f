import express from 'express';
import cors from 'cors';
import multer from 'multer';
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
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Portfolio from './models/Portfolio.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001; // Use environment variable for port

// Increase the server timeout to 5 minutes (300,000 ms) to handle long AI requests
app.timeout = 300000;

const oAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'postmessage');

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

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

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload and attach to request object
      // We exclude the password from being attached to the req object
      req.user = await User.findById(decoded.user.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      next(); // Proceed to the protected route
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};
// Middleware
app.use(cors()); // Allow requests from your frontend
app.use(express.json({ limit: '50mb' }));
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// Set up multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // get key from .env
});

// --- Authentication Routes ---
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // ✅ Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    res.json({ token, id: user.id });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});


app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found. Please sign up before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials. Please try again.' });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, name: user.name, email: user.email, id: user.id });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { code } = req.body;
  try {
    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return res.status(400).json({ msg: 'Google sign-in failed, no ID token received.' });
    }

    // Verify the ID token
    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ msg: 'Could not extract user information from Google token.' });
    }

    const { email, name, sub: googleId } = payload;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Create a new user if they don't exist
      user = new User({ email, name, googleId, password: `google_${googleId}` }); // Create a dummy password for Google users
      await user.save();
    }

    // Create and return JWT
    const jwtPayload = { user: { id: user.id } };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ token, id: user.id });
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
      user = new User({
        name: name || githubLogin,
        email: userEmail,
        githubId,
        password: `github_${githubId}`, // Create a dummy password
      });
      await user.save();
    }

    // 4. Create and return JWT
    const jwtPayload = { user: { id: user.id } };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ token, id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('GitHub auth error:', err.message);
    res.status(500).send('Server error during GitHub authentication');
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
  const { userId, ...formData } = req.body;
  const portfolioData = { user: req.user.id, data: formData };
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
  "linkedin": "",
  "careerObjective": "",
  "skills": "",
  "projects": [{ "title": "", "description": "", "technologies": "" }],
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

  // Try to find a summary
  const careerObjectiveMatch = text.match(/(PROFILE|Summary|Career Objective)\n([\s\S]*?)(?=\n\n|EDUCATION)/i);
  if (careerObjectiveMatch && careerObjectiveMatch[2]) {
    response.careerObjective = careerObjectiveMatch[2].trim();
  }

  // Try to find skills
  const skillsMatch = text.match(/SKILLS\n([\s\S]*?)(?=\n\n|CERTIFICATIONS)/i);
  if (skillsMatch && skillsMatch[1]) {
    response.skills = skillsMatch[1].replace(/\n/g, ', ').replace(/, ,/g, ',').replace(/,$/, '').trim();
  }

  // Try to find projects
  const projectsMatch = text.match(/PROJECTS\n([\s\S]*?)(?=\n\nACHIEVEMENTS)/i);
  if (projectsMatch && projectsMatch[1]) {
      const projectsStr = projectsMatch[1].trim();
      const projectBlocks = projectsStr.split(/\n\n/);
      response.projects = projectBlocks.map(block => {
          const lines = block.split('\n');
          const title = lines[0].trim();
          let description = '';
          let technologies = '';

          for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              if (line.toLowerCase().includes('skills used:') || line.toLowerCase().includes('technologies:')) {
                  technologies = line.split(':')[1].trim();
              } else {
                  description += line + ' ';
              }
          }

          return { title, description: description.trim(), technologies };
      });
  }

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
      }
  }

  // Try to find achievements
  const achievementsMatch = text.match(/ACHIEVEMENTS\n([\s\S]*)/i);
  if (achievementsMatch && achievementsMatch[1]) {
    response.achievements = achievementsMatch[1].trim();
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
        let achievementsHtml = '';
        if (template === 'classic') {
          achievementsHtml = formData.achievements.split('\n').filter(Boolean).map(achievement => `
          <div class="testimonial-card bg-gray-50 p-8 rounded-lg shadow-sm">
              <p class="text-gray-700 italic">"${achievement}"</p>
          </div>
          `).join('\n');
        } else if (template === 'dark') {
          achievementsHtml = formData.achievements.split('\n').filter(Boolean).map(achievement => `
          <div class="testimonial-card bg-gray-700 p-8 rounded-lg border border-gray-600 hover:border-green-600 hover:border-opacity-50 transition duration-300">
            <p class="text-gray-300 italic">"${achievement}"</p>
          </div>
          `).join('\n');
        }
        generatedHtml = generatedHtml.replace('<!-- TESTIMONIALS -->', achievementsHtml);
    }
    // --- Return HTML directly in JSON ---
    res.json({ html: generatedHtml });
  } catch (error) {
    console.error('Error in /generate-portfolio:', error);
    res.status(500).json({ error: 'Failed to generate portfolio' });
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

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
