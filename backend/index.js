import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const app = express();

// Initialize OpenAI (will be configured when API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const OpenAI = await import('openai').then(m => m.default);
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.log('OpenAI module not available, continuing without it');
  }
}

// Initialize Supabase client
let supabase = null;
if (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!anonKey) {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
    } else {
      supabase = createClient(supabaseUrl, anonKey);
      console.log('Supabase client initialized successfully');
      console.log('Supabase URL:', supabaseUrl);
    }
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
  }
} else {
  console.log('Supabase URL not found, using local storage for development');
}

// Middleware - Manual CORS handling for Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // For local development, be more permissive
  if (process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
    return;
  }
  
  // Define allowed origins for production
  const allowedOrigins = [
    'https://questfront.vercel.app',
    'https://questfront-skifrydevs-projects.vercel.app',
    'https://questfront-git-main-skifrydevs-projects.vercel.app',
    'https://ai-quest-frontend.vercel.app'
  ];
  
  // Check if origin is allowed or if it's a Vercel preview deployment
  const isAllowed = !origin || 
    allowedOrigins.includes(origin) || 
    (origin && origin.endsWith('.vercel.app'));
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ai-quest-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// File paths for local storage
const dataDir = path.join(process.cwd(), 'data');
const questsFile = path.join(dataDir, 'quests.json');
const progressFile = path.join(dataDir, 'progress.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Database table creation (run once)
async function initializeDatabase() {
  if (!supabase) return;
  
  try {
    // Create quests table if it doesn't exist
    const { error: questsError } = await supabase.rpc('create_quests_table', {});
    if (questsError && !questsError.message.includes('already exists')) {
      console.log('Creating quests table...');
    }
    
    // Create progress table if it doesn't exist
    const { error: progressError } = await supabase.rpc('create_progress_table', {});
    if (progressError && !progressError.message.includes('already exists')) {
      console.log('Creating progress table...');
    }
  } catch (error) {
    console.log('Database tables may already exist:', error.message);
  }
}

// Helper functions for Supabase and local storage
async function getAllQuests() {
  try {
    console.log('getAllQuests called, supabase client exists:', !!supabase);
    
    // Try Supabase first (production)
    if (supabase) {
      console.log('Querying Supabase for quests...');
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .order('createdAt', { ascending: false });
      
      console.log('Supabase response - data:', data, 'error:', error);
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Returning quests array with length:', data.length);
      return data;
    }
    
    // Fallback to local file (development)
    try {
      const data = await fs.readFile(questsFile, 'utf8');
      const questsData = JSON.parse(data);
      console.log(questsData)
      return questsData
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Error fetching quests:', error);
    return [];
  }
}

async function getQuest(questId) {
  try {
    // Try Supabase first (production)
    if (supabase) {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data || null;
    }
    
    // Fallback to local file (development)
    try {
      const data = await fs.readFile(questsFile, 'utf8');
      const questsData = JSON.parse(data);
      return questsData[questId] || null;
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Error fetching quest:', error);
    return null;
  }
}

async function saveQuest(quest) {
  try {
    console.log('saveQuest called with quest:', quest);
    
    // Try Supabase first (production)
    if (supabase) {
      console.log('Using Supabase to save quest');
      
      // First, check if quest exists
      const { data: existingQuest } = await supabase
        .from('quests')
        .select('id')
        .eq('id', quest.id)
        .single();
      
      console.log('Existing quest check:', existingQuest);
      
      let result;
      if (existingQuest) {
        // Update existing quest
        console.log('Updating existing quest');
        result = await supabase
          .from('quests')
          .update(quest)
          .eq('id', quest.id)
          .select()
          .single();
      } else {
        // Insert new quest
        console.log('Inserting new quest');
        result = await supabase
          .from('quests')
          .insert(quest)
          .select()
          .single();
      }
      
      const { data, error } = result;
      console.log('Supabase operation response - data:', data, 'error:', error);
      
      if (error) {
        console.error('Supabase operation error:', error);
        throw error;
      }
      
      console.log('Quest saved to Supabase successfully');
      return data;
    }
    
    // Local development - use file system
    await ensureDataDir();
    
    let questsData = {};
    try {
      const data = await fs.readFile(questsFile, 'utf8');
      questsData = JSON.parse(data);
    } catch {
      // File doesn't exist, start with empty object
    }
    
    questsData[quest.id] = quest;
    await fs.writeFile(questsFile, JSON.stringify(questsData, null, 2));
    
    return quest;
  } catch (error) {
    console.error('Error saving quest:', error);
    throw error;
  }
}

async function deleteQuest(questId) {
  try {
    // Try Supabase first (production)
    if (supabase) {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId);
      
      if (error) throw error;
      return true;
    }
    
    // Local development
    await ensureDataDir();
    
    let questsData = {};
    try {
      const data = await fs.readFile(questsFile, 'utf8');
      questsData = JSON.parse(data);
    } catch {
      return true; // Quest doesn't exist
    }
    
    delete questsData[questId];
    await fs.writeFile(questsFile, JSON.stringify(questsData, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error deleting quest:', error);
    throw error;
  }
}

async function getProgress(sessionId, questId) {
  try {
    // Try Supabase first (production)
    if (supabase) {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('sessionId', sessionId)
        .eq('questId', questId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data || null;
    }
    
    // Fallback to local file (development)
    const progressKey = `${sessionId}-${questId}`;
    try {
      const data = await fs.readFile(progressFile, 'utf8');
      const progressData = JSON.parse(data);
      return progressData[progressKey] || null;
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Error fetching progress:', error);
    return null;
  }
}

async function saveProgress(sessionId, questId, progress) {
  try {
    // Try Supabase first (production)
    if (supabase) {
      const progressData = {
        sessionId: sessionId,
        questId: questId,
        currentStep: progress.currentStep,
        answers: progress.answers,
        completed: progress.completed,
        startedAt: progress.startedAt,
        updatedAt: progress.updatedAt || new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('progress')
        .upsert(progressData, { onConflict: 'sessionId,questId' })
        .select()
        .single();
      
      if (error) throw error;
      
      // Return in frontend format (already camelCase)
      return {
        questId: data.questId,
        sessionId: data.sessionId,
        currentStep: data.currentStep,
        answers: data.answers,
        completed: data.completed,
        startedAt: data.startedAt,
        updatedAt: data.updatedAt
      };
    }
    
    // Local development
    await ensureDataDir();
    const progressKey = `${sessionId}-${questId}`;
    
    let progressData = {};
    try {
      const data = await fs.readFile(progressFile, 'utf8');
      progressData = JSON.parse(data);
    } catch {
      // File doesn't exist, start with empty object
    }
    
    progressData[progressKey] = progress;
    await fs.writeFile(progressFile, JSON.stringify(progressData, null, 2));
    
    return progress;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
}

// Initialize with sample data if no quests exist
async function initializeSampleData() {
  try {
    const existingQuests = await getAllQuests();
    if (existingQuests.length === 0) {
      const sampleQuest = {
        id: 'sample-quest-1',
        title: 'Welcome Quest',
        description: 'A simple getting started quest',
        aiName: 'Guide',
        userName: 'Adventurer',
        steps: [
          {
            message: 'Welcome! What is 2 + 2?',
            expectedAnswer: '4',
            hint: 'Think about basic addition'
          },
          {
            message: 'Great! Now, what color do you get when you mix red and blue?',
            expectedAnswer: 'purple',
            hint: 'Think about primary colors mixing'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveQuest(sampleQuest);
      console.log('Sample quest initialized');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// Middleware to check admin authentication
const requireAdminAuth = (req, res, next) => {
  if (req.session.adminAuthenticated === true) {
    next();
  } else {
    res.status(401).json({ error: 'Admin authentication required' });
  }
};

// Quest management endpoints
app.get('/api/quests', async (req, res) => {
  try {
    const quests = await getAllQuests();
    const questsWithoutPasswords = quests.map(quest => {
      const { password, ...questWithoutPassword } = quest;
      return questWithoutPassword;
    });
    res.json(questsWithoutPasswords);
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

app.get('/api/quests/:id', async (req, res) => {
  try {
    const quest = await getQuest(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const { password, ...questWithoutPassword } = quest;
    res.json(questWithoutPassword);
  } catch (error) {
    console.error('Error fetching quest:', error);
    res.status(500).json({ error: 'Failed to fetch quest' });
  }
});

app.post('/api/quests', requireAdminAuth, async (req, res) => {
  try {
    const questId = uuidv4();
    const quest = {
      id: questId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveQuest(quest);
    res.json(quest);
  } catch (error) {
    console.error('Error creating quest:', error);
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

app.put('/api/quests/:id', requireAdminAuth, async (req, res) => {
  try {
    console.log('PUT /api/quests/:id called with ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const questId = req.params.id;
    const existingQuest = await getQuest(questId);
    console.log('Existing quest found:', !!existingQuest);
    
    if (!existingQuest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const updatedQuest = {
      ...existingQuest,
      ...req.body,
      id: questId,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updated quest to save:', updatedQuest);
    
    const savedQuest = await saveQuest(updatedQuest);
    console.log('Quest saved successfully:', !!savedQuest);
    
    res.json(savedQuest);
  } catch (error) {
    console.error('Error updating quest:', error);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

app.delete('/api/quests/:id', requireAdminAuth, async (req, res) => {
  try {
    const questId = req.params.id;
    const quest = await getQuest(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    await deleteQuest(questId);
    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    console.error('Error deleting quest:', error);
    res.status(500).json({ error: 'Failed to delete quest' });
  }
});

// Password validation endpoint for protected quests
app.post('/api/quests/:id/validate-password', async (req, res) => {
  try {
    const quest = await getQuest(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const { password } = req.body;
    
    if (!quest.password) {
      return res.json({ valid: true, protected: false });
    }
    
    const isValid = password === quest.password;
    
    if (isValid) {
      const { password: _, ...questWithoutPassword } = quest;
      res.json({ valid: true, protected: true, quest: questWithoutPassword });
    } else {
      res.json({ valid: false, protected: true });
    }
  } catch (error) {
    console.error('Error validating password:', error);
    res.status(500).json({ error: 'Failed to validate password' });
  }
});

// User progress endpoints
app.get('/api/progress/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const sessionId = req.session.id || req.ip;
    
    let progress = await getProgress(sessionId, questId);
    
    if (!progress) {
      progress = {
        questId,
        sessionId,
        currentStep: 0,
        answers: [],
        completed: false,
        startedAt: new Date().toISOString()
      };
    }
    
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.post('/api/progress/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const { currentStep, answer, completed } = req.body;
    const sessionId = req.session.id || req.ip;
    
    let progress = await getProgress(sessionId, questId) || {
      questId,
      sessionId,
      currentStep: 0,
      answers: [],
      completed: false,
      startedAt: new Date().toISOString()
    };
    
    if (currentStep !== undefined) progress.currentStep = currentStep;
    if (answer !== undefined) {
      if (progress.answers.length <= currentStep) {
        progress.answers[currentStep] = answer;
      }
    }
    if (completed !== undefined) progress.completed = completed;
    progress.updatedAt = new Date().toISOString();
    
    await saveProgress(sessionId, questId, progress);
    res.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Enhanced Chat endpoint for GPT-4 integration
app.post('/api/chat', async (req, res) => {
  try {
    const { message, questId, currentStep, context, isAnswerAttempt } = req.body;
    
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }
    
    const quest = await getQuest(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const step = quest.steps[currentStep];
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    
    let systemPrompt = `You are ${quest.aiName || 'Guide'}, a friendly and encouraging AI quest guide helping ${quest.userName} through an interactive adventure.

Current Quest: ${quest.title}
Current Step: ${step.message}
Expected Answer: ${step.expectedAnswer}
Available Hint: ${step.hint || 'No specific hint available'}

Your personality:
- Encouraging and supportive
- Never reveal answers directly
- Guide users with hints when they ask for help
- Celebrate correct answers enthusiastically
- For wrong answers, encourage them to try again
- Keep responses conversational and engaging
- Always stay in character as ${quest.aiName || 'Guide'}

Rules:
- If user asks for "hint" or "help", provide guidance without giving the exact answer
- If user seems stuck, offer encouragement and strategic hints
- If they're close to the answer, acknowledge their progress
- Keep all responses under 100 words unless providing detailed hints
- Always maintain the adventure/quest theme`;

    if (isAnswerAttempt) {
      systemPrompt += `\n\nThe user just submitted: "${message}" as their answer. This is an answer attempt, so respond as if you're checking their answer and providing feedback.`;
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 150,
      temperature: 0.7
    });
    
    const response = completion.choices[0].message.content;
    res.json({ message: response });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Answer validation endpoint - AI-powered
app.post('/api/validate-answer', async (req, res) => {
  try {
    const { questId, stepIndex, answer } = req.body;
    
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }
    
    const quest = await getQuest(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const step = quest.steps[stepIndex];
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    
    const validationPrompt = `You are an AI judge evaluating quest answers. 
    
Question/Challenge: ${step.message}
Expected Answer: ${step.expectedAnswer}
User's Answer: ${answer}

Evaluate if the user's answer is correct or acceptable based on the expected answer. Consider:
- Exact matches
- Semantic equivalence (same meaning, different words)
- Reasonable variations or synonyms
- Partial credit for close answers

Respond with ONLY "CORRECT" or "INCORRECT" followed by a brief explanation (max 30 words).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a precise answer validator. Respond with CORRECT or INCORRECT followed by a brief explanation." },
        { role: "user", content: validationPrompt }
      ],
      max_tokens: 100,
      temperature: 0.2
    });
    
    const response = completion.choices[0].message.content.trim();
    const isCorrect = response.toUpperCase().startsWith('CORRECT');
    
    res.json({ 
      correct: isCorrect,
      isLastStep: stepIndex === quest.steps.length - 1,
      aiResponse: response
    });
    
  } catch (error) {
    console.error('AI validation error:', error);
    // Fallback to simple comparison if AI fails
    const step = quest?.steps[stepIndex];
    if (step) {
      const isCorrect = answer.toLowerCase().trim() === step.expectedAnswer.toLowerCase().trim();
      res.json({ 
        correct: isCorrect,
        isLastStep: stepIndex === quest.steps.length - 1,
        aiResponse: 'AI validation failed, used fallback comparison'
      });
    } else {
      res.status(500).json({ error: 'Failed to validate answer' });
    }
  }
});

// Admin authentication endpoints
app.post('/api/admin/authenticate', (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({ error: 'Admin password not configured' });
    }

    if (password === adminPassword) {
      req.session.adminAuthenticated = true;
      res.json({ success: true, message: 'Authentication successful' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/api/admin/check', (req, res) => {
  try {
    const isAuthenticated = req.session.adminAuthenticated === true;
    res.json({ authenticated: isAuthenticated });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to check authentication' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  try {
    req.session.adminAuthenticated = false;
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    openaiConfigured: !!openai,
    supabaseConfigured: !!supabase,
    timestamp: new Date().toISOString()
  });
});

// Initialize app
async function initializeApp() {
  await initializeSampleData();
  await initializeDatabase();
}

// Initialize for serverless
initializeApp().catch(console.error);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 AI Quest backend running on port ${PORT}`);
    console.log(`📊 OpenAI configured: ${!!openai}`);
    console.log(`🗄️ Vercel KV configured: ${!!process.env.KV_REST_API_URL}`);
  });
}

// Export for Vercel serverless deployment
export default app;

// Assistant UI Runtime endpoint for per-quest chat
app.post('/api/runtime/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const { messages, abortSignal } = req.body;
    
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }
    
    const quest = await getQuest(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const sessionId = req.session.id || req.ip;
    let progress = await getProgress(sessionId, questId) || {
      questId,
      sessionId,
      currentStep: 0,
      answers: [],
      completed: false,
      startedAt: new Date().toISOString()
    };
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content || '';
    
    // Check if this is an answer attempt
    const currentStep = quest.steps[progress.currentStep];
    const isAnswerAttempt = currentStep && userMessage.trim().length > 0 && lastMessage?.role === 'user';
    
    let systemPrompt = `You are ${quest.aiName || 'Guide'}, a friendly AI quest guide helping ${quest.userName || 'Adventurer'} through an interactive adventure.

Quest: ${quest.title}
Description: ${quest.description}
Current Step: ${progress.currentStep + 1}/${quest.steps.length}

Your personality:
- Encouraging and supportive
- Guide users with hints when they struggle
- Celebrate correct answers enthusiastically
- Keep responses conversational and engaging
- Always stay in character as ${quest.aiName || 'Guide'}

Rules:
- If user asks for "hint" or "help", provide guidance without giving the exact answer
- Keep responses under 150 words unless providing detailed explanations
- Always maintain the adventure/quest theme
- AT THE END OF QUEST, INSERT ALL ANSWERS AS SINGLE LINE, SEPARATED BY COMMAS`;

    if (progress.completed) {
      systemPrompt += `\n\nThe quest is COMPLETED! Congratulate the user and offer to help with any questions about their journey.`;
    } else if (currentStep) {
      systemPrompt += `\n\nCurrent Challenge: ${currentStep.message}
Expected Answer: ${currentStep.expectedAnswer}
Available Hint: ${currentStep.hint || 'No specific hint available'}

If the user's message looks like an answer attempt, validate it and respond accordingly.`;
    }
    
    // If this looks like an answer attempt, validate it first
    if (isAnswerAttempt && currentStep && !progress.completed) {
      try {
        const validationPrompt = `Evaluate if this answer is correct:
        
Question: ${currentStep.message}
Expected Answer: ${currentStep.expectedAnswer}
User's Answer: ${userMessage}

Consider exact matches, semantic equivalence, synonyms, and reasonable variations.
Respond with ONLY "CORRECT" or "INCORRECT".`;

        const validationCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are a precise answer validator. Respond with CORRECT or INCORRECT only." },
            { role: "user", content: validationPrompt }
          ],
          max_tokens: 10,
          temperature: 0.1
        });
        
        const isCorrect = validationCompletion.choices[0].message.content.trim().toUpperCase() === 'CORRECT';
        
        if (isCorrect) {
          // Update progress
          progress.answers[progress.currentStep] = userMessage;
          progress.currentStep += 1;
          progress.updatedAt = new Date().toISOString();
          
          if (progress.currentStep >= quest.steps.length) {
            progress.completed = true;
            systemPrompt += `\n\nThe user just completed the FINAL step! This is a celebration moment - be very enthusiastic and congratulatory!`;
          } else {
            const nextStep = quest.steps[progress.currentStep];
            systemPrompt += `\n\nThe user just answered CORRECTLY! Celebrate and then present the next challenge: "${nextStep.message}"`;
          }
          
          await saveProgress(sessionId, questId, progress);
        } else {
          systemPrompt += `\n\nThe user's answer "${userMessage}" is INCORRECT. Encourage them to try again and offer a gentle hint if appropriate.`;
        }
      } catch (validationError) {
        console.error('Validation error:', validationError);
        // Continue with regular chat if validation fails
      }
    }
    
    // Build conversation history for context
    const conversationMessages = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add recent messages for context (limit to last 10)
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        conversationMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: conversationMessages,
      max_tokens: 200,
      temperature: 0.7,
      stream: true
    });
    
    // Set up Server-Sent Events for streaming response (Assistant UI format)
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    
    let fullResponse = '';
    
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(content);
      }
      
      if (chunk.choices[0]?.finish_reason === 'stop') {
        break;
      }
    }
    
    res.end();
    
  } catch (error) {
    console.error('Runtime error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get quest runtime configuration for Assistant UI
app.get('/api/runtime/:questId/config', async (req, res) => {
  try {
    const { questId } = req.params;
    const quest = await getQuest(questId);
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const sessionId = req.session.id || req.ip;
    const progress = await getProgress(sessionId, questId) || {
      questId,
      sessionId,
      currentStep: 0,
      answers: [],
      completed: false,
      startedAt: new Date().toISOString()
    };
    
    const currentStep = quest.steps[progress.currentStep];
    
    res.json({
      quest: {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        aiName: quest.aiName || 'Guide',
        userName: quest.userName || 'Adventurer'
      },
      progress: {
        currentStep: progress.currentStep,
        totalSteps: quest.steps.length,
        completed: progress.completed,
        answers: progress.answers
      },
      currentChallenge: currentStep ? {
        message: currentStep.message,
        hint: currentStep.hint,
        type: currentStep.type || 'text',
        mediaUrl: currentStep.mediaUrl
      } : null,
      initialMessage: progress.currentStep === 0 && progress.answers.length === 0 ? 
        `Welcome to ${quest.title}! I'm ${quest.aiName || 'Guide'}, and I'll be guiding you through this adventure. ${currentStep ? currentStep.message : 'Let\'s begin!'}` : null
    });
  } catch (error) {
    console.error('Runtime config error:', error);
    res.status(500).json({ error: 'Failed to get runtime configuration' });
  }
});

// Reset quest progress for Assistant UI
app.post('/api/runtime/:questId/reset', async (req, res) => {
  try {
    const { questId } = req.params;
    const sessionId = req.session.id || req.ip;
    
    const resetProgress = {
      questId,
      sessionId,
      currentStep: 0,
      answers: [],
      completed: false,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await saveProgress(sessionId, questId, resetProgress);
    res.json({ success: true, progress: resetProgress });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Failed to reset progress' });
  }
});

// Assistant UI compatible thread history endpoint
app.get('/api/runtime/:questId/history', async (req, res) => {
  try {
    const { questId } = req.params;
    const quest = await getQuest(questId);
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const sessionId = req.session.id || req.ip;
    const progress = await getProgress(sessionId, questId);
    
    // Build conversation history from progress
    const messages = [];
    
    if (progress && progress.answers.length > 0) {
      for (let i = 0; i < progress.answers.length; i++) {
        const step = quest.steps[i];
        if (step) {
          // Add step challenge as assistant message
          messages.push({
            id: `step-${i}`,
            role: 'assistant',
            content: [{ type: 'text', text: step.message }],
            createdAt: new Date().toISOString()
          });
          
          // Add user answer
          if (progress.answers[i]) {
            messages.push({
              id: `answer-${i}`,
              role: 'user',
              content: [{ type: 'text', text: progress.answers[i] }],
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }
    
    res.json({ messages });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});