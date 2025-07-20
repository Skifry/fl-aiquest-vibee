import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Settings, Edit3, Trash2, ExternalLink, ArrowUp, ArrowDown, X, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <Card className="max-w-6xl mx-auto shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">
                  {selectedQuest ? 'Edit Quest' : 'Create New Quest'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {/* Quest Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Quest Title
                  </label>
                  <Input
                    value={questForm.title}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter quest title..."
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    User Name
                  </label>
                  <Input
                    value={questForm.userName}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="e.g., Emily, John..."
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    AI Guide Name
                  </label>
                  <Input
                    value={questForm.aiName}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, aiName: e.target.value }))}
                    placeholder="e.g., Guide, Assistant..."
                    className="h-12"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questForm.active}
                      onChange={(e) => setQuestForm(prev => ({ ...prev, active: e.target.checked }))}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-3 text-sm font-semibold text-slate-700">Active Quest</span>
                  </label>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={questForm.description}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter quest description..."
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Final Text (use {`{answers}`} to include collected answers)
                </label>
                <textarea
                  value={questForm.finalText}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, finalText: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Congratulations! Your final code is: {answers}"
                />
              </div>

              {/* Steps Section */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Quest Steps</h3>
                
                {/* Add New Step Form */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Step</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Content Type</label>
                        <select
                          value={stepForm.type}
                          onChange={(e) => setStepForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="text">Text</option>
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                          <option value="link">Link</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Expected Answer</label>
                        <Input
                          value={stepForm.expectedAnswer}
                          onChange={(e) => setStepForm(prev => ({ ...prev, expectedAnswer: e.target.value }))}
                          placeholder="Correct answer..."
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-600 mb-2">Bot Message</label>
                      <textarea
                        value={stepForm.message}
                        onChange={(e) => setStepForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What should the bot say for this step?"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Hint (optional)</label>
                        <Input
                          value={stepForm.hint}
                          onChange={(e) => setStepForm(prev => ({ ...prev, hint: e.target.value }))}
                          placeholder="Hint when user asks for help..."
                        />
                      </div>

                      {stepForm.type !== 'text' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">Media URL</label>
                          <Input
                            type="url"
                            value={stepForm.mediaUrl}
                            onChange={(e) => setStepForm(prev => ({ ...prev, mediaUrl: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleAddStep}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Steps */}
                <div className="space-y-4">
                  {questForm.steps.map((step, index) => (
                    <Card key={step.id || index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                              Step {index + 1}
                            </span>
                            <span className="bg-slate-100 text-slate-800 text-sm px-3 py-1 rounded-full">
                              {step.type}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveStep(index, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveStep(index, 'down')}
                              disabled={index === questForm.steps.length - 1}
                              className="h-8 w-8"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveStep(index)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <p className="text-slate-700">
                            <span className="font-semibold">Message:</span> {step.message}
                          </p>
                          <p className="text-slate-700">
                            <span className="font-semibold">Expected:</span> {step.expectedAnswer}
                          </p>
                          {step.hint && (
                            <p className="text-slate-500">
                              <span className="font-semibold">Hint:</span> {step.hint}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveQuest}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {selectedQuest ? 'Update Quest' : 'Create Quest'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        <Card className="max-w-7xl mx-auto shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl font-bold">Quest Admin Panel</CardTitle>
              <div className="flex gap-3">
                <Link to="/admin/quests">
                  <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Quests
                  </Button>
                </Link>
                <Button
                  onClick={handleCreateQuest}
                  className="bg-white text-blue-600 hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Quest
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {quests.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {quests.map((quest) => (
                  <Card key={quest.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800 leading-tight">{quest.title}</h3>
                        <span className={cn(
                          "text-xs px-3 py-1 rounded-full font-medium",
                          quest.active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-600'
                        )}>
                          {quest.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{quest.description}</p>
                      
                      <div className="text-xs text-slate-500 mb-4 space-y-1">
                        <p><span className="font-medium">User:</span> {quest.userName}</p>
                        <p><span className="font-medium">Steps:</span> {quest.steps?.length || 0}</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <a
                          href={`/quest/${quest.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Quest
                        </a>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQuest(quest)}
                            className="h-8 w-8 text-slate-600 hover:text-blue-600"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuest(quest.id)}
                            className="h-8 w-8 text-slate-600 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Settings className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-3">No quests created yet</h3>
                <p className="text-slate-500 mb-6">Create your first quest to get started with AI adventures.</p>
                <Button
                  onClick={handleCreateQuest}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Quest
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;