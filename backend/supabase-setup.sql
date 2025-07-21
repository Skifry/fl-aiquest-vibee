-- Create quests table
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ai_name TEXT DEFAULT 'Guide',
  user_name TEXT DEFAULT 'Adventurer',
  password TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create progress table
CREATE TABLE IF NOT EXISTS progress (
  session_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]',
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, quest_id),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quests_created_at ON quests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_quest_id ON progress(quest_id);
CREATE INDEX IF NOT EXISTS idx_progress_session_id ON progress(session_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on quests" ON quests FOR ALL USING (true);
CREATE POLICY "Allow all operations on progress" ON progress FOR ALL USING (true);