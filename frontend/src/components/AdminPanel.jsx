import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [questForm, setQuestForm] = useState({
    title: '',
    description: '',
    userName: '',
    aiName: '',
    finalText: '',
    active: true,
    steps: []
  });

  const [stepForm, setStepForm] = useState({
    type: 'text',
    message: '',
    expectedAnswer: '',
    hint: '',
    mediaUrl: ''
  });

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
    }
  };

  const handleCreateQuest = () => {
    setSelectedQuest(null);
    setIsEditing(true);
    setQuestForm({
      title: '',
      description: '',
      userName: '',
      aiName: 'Guide',
      finalText: 'Congratulations! Your final code is: {answers}',
      active: true,
      steps: []
    });
  };

  const handleEditQuest = (quest) => {
    setSelectedQuest(quest);
    setIsEditing(true);
    setQuestForm(quest);
  };

  const handleSaveQuest = async () => {
    try {
      const url = selectedQuest 
        ? `http://localhost:3001/api/quests/${selectedQuest.id}`
        : 'http://localhost:3001/api/quests';
      
      const method = selectedQuest ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questForm)
      });

      if (response.ok) {
        await loadQuests();
        setIsEditing(false);
        setSelectedQuest(null);
      }
    } catch (error) {
      console.error('Failed to save quest:', error);
    }
  };

  const handleDeleteQuest = async (questId) => {
    if (!confirm('Are you sure you want to delete this quest?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/quests/${questId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadQuests();
      }
    } catch (error) {
      console.error('Failed to delete quest:', error);
    }
  };

  const handleAddStep = () => {
    if (!stepForm.message || !stepForm.expectedAnswer) {
      alert('Please fill in the message and expected answer');
      return;
    }

    const newStep = { ...stepForm, id: Date.now() };
    setQuestForm(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));

    setStepForm({
      type: 'text',
      message: '',
      expectedAnswer: '',
      hint: '',
      mediaUrl: ''
    });
  };

  const handleRemoveStep = (stepIndex) => {
    setQuestForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, index) => index !== stepIndex)
    }));
  };

  const handleMoveStep = (stepIndex, direction) => {
    const newSteps = [...questForm.steps];
    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    
    if (newIndex >= 0 && newIndex < newSteps.length) {
      [newSteps[stepIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[stepIndex]];
      setQuestForm(prev => ({ ...prev, steps: newSteps }));
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedQuest ? 'Edit Quest' : 'Create New Quest'}
            </h1>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Quest Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quest Title
              </label>
              <input
                type="text"
                value={questForm.title}
                onChange={(e) => setQuestForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quest title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Name
              </label>
              <input
                type="text"
                value={questForm.userName}
                onChange={(e) => setQuestForm(prev => ({ ...prev, userName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Emily, John..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Guide Name
              </label>
              <input
                type="text"
                value={questForm.aiName}
                onChange={(e) => setQuestForm(prev => ({ ...prev, aiName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Guide, Assistant..."
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={questForm.active}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Active Quest</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={questForm.description}
              onChange={(e) => setQuestForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quest description..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Text (use {`{answers}`} to include collected answers)
            </label>
            <textarea
              value={questForm.finalText}
              onChange={(e) => setQuestForm(prev => ({ ...prev, finalText: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Congratulations! Your final code is: {answers}"
            />
          </div>

          {/* Steps Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Quest Steps</h3>
            
            {/* Add New Step Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Add New Step</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Content Type</label>
                  <select
                    value={stepForm.type}
                    onChange={(e) => setStepForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="link">Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Expected Answer</label>
                  <input
                    type="text"
                    value={stepForm.expectedAnswer}
                    onChange={(e) => setStepForm(prev => ({ ...prev, expectedAnswer: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Correct answer..."
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Bot Message</label>
                <textarea
                  value={stepForm.message}
                  onChange={(e) => setStepForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="What should the bot say for this step?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hint (optional)</label>
                  <input
                    type="text"
                    value={stepForm.hint}
                    onChange={(e) => setStepForm(prev => ({ ...prev, hint: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Hint when user asks for help..."
                  />
                </div>

                {stepForm.type !== 'text' && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Media URL</label>
                    <input
                      type="url"
                      value={stepForm.mediaUrl}
                      onChange={(e) => setStepForm(prev => ({ ...prev, mediaUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleAddStep}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Add Step
              </button>
            </div>

            {/* Existing Steps */}
            <div className="space-y-3">
              {questForm.steps.map((step, index) => (
                <div key={step.id || index} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        Step {index + 1}
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {step.type}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMoveStep(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveStep(index, 'down')}
                        disabled={index === questForm.steps.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleRemoveStep(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Message:</strong> {step.message}
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Expected:</strong> {step.expectedAnswer}
                  </p>
                  {step.hint && (
                    <p className="text-sm text-gray-500">
                      <strong>Hint:</strong> {step.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuest}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {selectedQuest ? 'Update Quest' : 'Create Quest'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quest Admin Panel</h1>
          <div className="flex gap-3">
            <Link
              to="/admin/quests"
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              View All Quests
            </Link>
            <button
              onClick={handleCreateQuest}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              + Create New Quest
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <div key={quest.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-gray-800">{quest.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  quest.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {quest.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
              <p className="text-xs text-gray-500 mb-3">
                User: {quest.userName} | Steps: {quest.steps?.length || 0}
              </p>
              
              <div className="flex justify-between items-center">
                <a
                  href={`/quest/${quest.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-sm"
                >
                  View Quest →
                </a>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditQuest(quest)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteQuest(quest.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {quests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No quests created yet.</p>
            <button
              onClick={handleCreateQuest}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Create Your First Quest
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;