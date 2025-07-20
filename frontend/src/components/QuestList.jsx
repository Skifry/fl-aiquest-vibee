import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const QuestList = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/quests');
      if (response.ok) {
        const questsData = await response.json();
        setQuests(questsData);
      }
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Quest Management
            </h1>
            <Link
              to="/admin"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ← Back to Admin Panel
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {quests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {quest.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      quest.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {quest.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                    {quest.description}
                  </p>
                  
                  <div className="text-sm text-gray-500 mb-4 space-y-1">
                    <div>👤 User: {quest.userName}</div>
                    <div>🤖 AI Guide: {quest.aiName}</div>
                    <div>🎯 Steps: {quest.steps?.length || 0}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/quest/${quest.id}`}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-center font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      View Quest
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Quests Created Yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start by creating your first quest in the admin panel.
            </p>
            <Link
              to="/admin"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Go to Admin Panel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestList;