import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QuestChat from './components/QuestChat';
import AdminPanel from './components/AdminPanel';
import QuestList from './components/QuestList';
import Landing from './components/Landing';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/quest/:questId" element={<QuestChat />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/quests" element={<QuestList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
