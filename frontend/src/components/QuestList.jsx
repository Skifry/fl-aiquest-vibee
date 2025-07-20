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
        // Only show active quests
        setQuests(questsData.filter(quest => quest.active));
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🚀 AI Quest Adventures
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Embark on interactive adventures guided by AI. Solve puzzles, 
              answer questions, and unlock your personalized quest completion code!
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {quests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {quest.title}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Personalized for {quest.userName}
                  </p>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {quest.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>🎯 {quest.steps?.length || 0} steps</span>
                    <span>🤖 AI Guide: {quest.aiName}</span>
                  </div>
                  
                  <Link
                    to={`/quest/${quest.id}`}
                    className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-center font-bold py-3 px-4 rounded-lg transition-all duration-300"
                  >
                    Start Quest →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Active Quests Available
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              It looks like there are no active quests at the moment. 
              Check back later or contact the administrator to create some exciting adventures!
            </p>
            <Link
              to="/admin"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">
                Powered by AI • Interactive Adventures • Personalized Experience
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/admin"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuestList;