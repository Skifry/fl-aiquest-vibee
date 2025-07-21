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
  origin: true,
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
    const quests = Array.from(storage.quests.values()).map(quest => {
      // Don't expose passwords in response for security
      const { password, ...questWithoutPassword } = quest;
      return questWithoutPassword;
    });
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
    
    // Don't expose password in response for security
    const { password, ...questWithoutPassword } = quest;
    res.json(questWithoutPassword);
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

// Password validation endpoint for protected quests
app.post('/api/quests/:id/validate-password', async (req, res) => {
  try {
    const quest = storage.quests.get(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const { password } = req.body;
    
    // If quest has no password, it's not protected
    if (!quest.password) {
      return res.json({ valid: true, protected: false });
    }
    
    // Check if provided password matches
    const isValid = password === quest.password;
    
    if (isValid) {
      // Don't expose password in response
      const { password: _, ...questWithoutPassword } = quest;
      res.json({ valid: true, protected: true, quest: questWithoutPassword });
    } else {
      res.json({ valid: false, protected: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate password' });
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

// Enhanced Chat endpoint for GPT-4 integration
app.post('/api/chat', async (req, res) => {
  try {
    const { message, questId, currentStep, context, isAnswerAttempt } = req.body;
    
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
    
    const quest = storage.quests.get(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const step = quest.steps[stepIndex];
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    
    // Use AI to validate the answer
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
    const step = storage.quests.get(req.body.questId)?.steps[req.body.stepIndex];
    if (step) {
      const isCorrect = req.body.answer.toLowerCase().trim() === step.expectedAnswer.toLowerCase().trim();
      res.json({ 
        correct: isCorrect,
        isLastStep: req.body.stepIndex === storage.quests.get(req.body.questId).steps.length - 1,
        aiResponse: 'AI validation failed, used fallback comparison'
      });
    } else {
      res.status(500).json({ error: 'Failed to validate answer' });
    }
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