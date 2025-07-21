import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import QuestChat from './components/QuestChat';
import AdminPanel from './components/AdminPanel';
import AdminAuth from './components/AdminAuth';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/quest/:questId" element={<QuestChat />} />
          <Route path="/admin" element={
            <AdminAuth>
              <AdminPanel />
            </AdminAuth>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
