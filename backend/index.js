import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI (will be configured when API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ai-quest-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// In-memory storage (will be replaced with database later)
const storage = {
  quests: new Map(),
  userProgress: new Map(),
  sessions: new Map()
};

// Helper functions for file-based storage
const STORAGE_DIR = './data';
const QUESTS_FILE = path.join(STORAGE_DIR, 'quests.json');
const PROGRESS_FILE = path.join(STORAGE_DIR, 'progress.json');

async function ensureStorageDir() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

async function saveQuests() {
  await ensureStorageDir();
  const questsArray = Array.from(storage.quests.entries());
  await fs.writeFile(QUESTS_FILE, JSON.stringify(questsArray, null, 2));
}

async function loadQuests() {
  try {
    const data = await fs.readFile(QUESTS_FILE, 'utf8');
    const questsArray = JSON.parse(data);
    storage.quests = new Map(questsArray);
  } catch (error) {
    console.log('No existing quests file found, starting fresh');
  }
}

async function saveProgress() {
  await ensureStorageDir();
  const progressArray = Array.from(storage.userProgress.entries());
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progressArray, null, 2));
}

async function loadProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf8');
    const progressArray = JSON.parse(data);
    storage.userProgress = new Map(progressArray);
  } catch (error) {
    console.log('No existing progress file found, starting fresh');
  }
}

// Quest management endpoints
app.get('/api/quests', async (req, res) => {
  try {
    const quests = Array.from(storage.quests.values());
    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

app.get('/api/quests/:id', async (req, res) => {
  try {
    const quest = storage.quests.get(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    res.json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quest' });
  }
});

app.post('/api/quests', async (req, res) => {
  try {
    const questId = uuidv4();
    const quest = {
      id: questId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    storage.quests.set(questId, quest);
    await saveQuests();
    res.json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

app.put('/api/quests/:id', async (req, res) => {
  try {
    const questId = req.params.id;
    const existingQuest = storage.quests.get(questId);
    if (!existingQuest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const updatedQuest = {
      ...existingQuest,
      ...req.body,
      id: questId,
      updatedAt: new Date().toISOString()
    };
    storage.quests.set(questId, updatedQuest);
    await saveQuests();
    res.json(updatedQuest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

app.delete('/api/quests/:id', async (req, res) => {
  try {
    const questId = req.params.id;
    if (!storage.quests.has(questId)) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    storage.quests.delete(questId);
    await saveQuests();
    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quest' });
  }
});

// User progress endpoints
app.get('/api/progress/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const sessionId = req.session.id || req.ip;
    const progressKey = `${sessionId}-${questId}`;
    
    const progress = storage.userProgress.get(progressKey) || {
      questId,
      sessionId,
      currentStep: 0,
      answers: [],
      completed: false,
      startedAt: new Date().toISOString()
    };
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.post('/api/progress/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const { currentStep, answer, completed } = req.body;
    const sessionId = req.session.id || req.ip;
    const progressKey = `${sessionId}-${questId}`;
    
    let progress = storage.userProgress.get(progressKey) || {
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
    
    storage.userProgress.set(progressKey, progress);
    await saveProgress();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Chat endpoint for GPT-4 integration
app.post('/api/chat', async (req, res) => {
  try {
    const { message, questId, currentStep, context } = req.body;
    
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }
    
    const quest = storage.quests.get(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const step = quest.steps[currentStep];
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    
    // Build prompt for GPT-4
    const systemPrompt = `You are a friendly AI quest guide named ${quest.aiName || 'Guide'}. 
    You are helping ${quest.userName} through an interactive quest.
    
    Current step: ${step.message}
    Expected answer: ${step.expectedAnswer}
    Hint (if requested): ${step.hint}
    
    Rules:
    - Be encouraging and friendly
    - Don't reveal the correct answer directly
    - If user asks for "hint" or "help", provide the hint
    - If the answer is correct, congratulate and move to next step
    - If incorrect, encourage them to try again
    - Keep responses concise and engaging
    - Always respond in English`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 200,
      temperature: 0.7
    });
    
    const response = completion.choices[0].message.content;
    res.json({ message: response });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Answer validation endpoint
app.post('/api/validate-answer', async (req, res) => {
  try {
    const { questId, stepIndex, answer } = req.body;
    
    const quest = storage.quests.get(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const step = quest.steps[stepIndex];
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    
    const isCorrect = answer.toLowerCase().trim() === step.expectedAnswer.toLowerCase().trim();
    
    res.json({ 
      correct: isCorrect,
      isLastStep: stepIndex === quest.steps.length - 1
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate answer' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    openaiConfigured: !!openai,
    timestamp: new Date().toISOString()
  });
});

// Initialize storage and start server
async function startServer() {
  await loadQuests();
  await loadProgress();
  
  app.listen(PORT, () => {
    console.log(`🚀 AI Quest backend running on port ${PORT}`);
    console.log(`📊 OpenAI configured: ${!!openai}`);
  });
}

startServer().catch(console.error);