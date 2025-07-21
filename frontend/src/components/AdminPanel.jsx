import React, { useState, useEffect } from 'react';
import { Plus, Settings, Edit3, Trash2, ExternalLink, ArrowUp, ArrowDown, X, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    password: '',
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
      password: '',
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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
        <div className="container mx-auto p-6">
          <Card className="max-w-6xl mx-auto shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-600 to-blue-600 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-6 w-6" />
                  <CardTitle className="text-2xl font-bold">
                    {selectedQuest ? 'Edit Quest' : 'Create New Quest'}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(false)}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-8 bg-white">
              {/* Quest Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Quest Title
                  </label>
                  <Input
                    value={questForm.title}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter quest title..."
                    className="h-12 border-gray-300 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    User Name
                  </label>
                  <Input
                    value={questForm.userName}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="e.g., Emily, John..."
                    className="h-12 border-gray-300 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    AI Guide Name
                  </label>
                  <Input
                    value={questForm.aiName}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, aiName: e.target.value }))}
                    placeholder="e.g., Guide, Assistant..."
                    className="h-12 border-gray-300 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Password (optional)
                  </label>
                  <Input
                    type="password"
                    value={questForm.password}
                    onChange={(e) => setQuestForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave empty for no password protection"
                    className="h-12 border-gray-300 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-3 md:col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questForm.active}
                      onChange={(e) => setQuestForm(prev => ({ ...prev, active: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                    />
                    <span className="ml-3 text-sm font-bold text-gray-700">Active Quest</span>
                  </label>
                </div>
              </div>

              <div className="mb-8 space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Description
                </label>
                <textarea
                  value={questForm.description}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                  placeholder="Enter quest description..."
                />
              </div>

              <div className="mb-8 space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Final Text (use {`{answers}`} to include collected answers)
                </label>
                <textarea
                  value={questForm.finalText}
                  onChange={(e) => setQuestForm(prev => ({ ...prev, finalText: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                  placeholder="Congratulations! Your final code is: {answers}"
                />
              </div>

              {/* Steps Section */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Settings className="h-6 w-6 mr-2 text-violet-600" />
                  Quest Steps
                </h3>
                
                {/* Add New Step Form */}
                <Card className="mb-6 border-violet-200 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-violet-100 to-blue-100">
                    <CardTitle className="text-lg text-violet-800">Add New Step</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">Content Type</label>
                        <select
                          value={stepForm.type}
                          onChange={(e) => setStepForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="text">Text</option>
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                          <option value="link">Link</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">Expected Answer</label>
                        <Input
                          value={stepForm.expectedAnswer}
                          onChange={(e) => setStepForm(prev => ({ ...prev, expectedAnswer: e.target.value }))}
                          placeholder="Correct answer..."
                          className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="mb-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Bot Message</label>
                      <textarea
                        value={stepForm.message}
                        onChange={(e) => setStepForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                        placeholder="What should the bot say for this step?"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">Hint (optional)</label>
                        <Input
                          value={stepForm.hint}
                          onChange={(e) => setStepForm(prev => ({ ...prev, hint: e.target.value }))}
                          placeholder="Hint when user asks for help..."
                          className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                        />
                      </div>

                      {stepForm.type !== 'text' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-600">Media URL</label>
                          <Input
                            type="url"
                            value={stepForm.mediaUrl}
                            onChange={(e) => setStepForm(prev => ({ ...prev, mediaUrl: e.target.value }))}
                            placeholder="https://..."
                            className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleAddStep}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-md mt-[10px]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Steps */}
                <div className="space-y-4">
                  {questForm.steps.map((step, index) => (
                    <Card key={step.id || index} className="border-l-4 border-l-violet-500 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-violet-100 text-violet-800 text-sm font-medium">
                              Step {index + 1}
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                              {step.type}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveStep(index, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8 rounded-full"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveStep(index, 'down')}
                              disabled={index === questForm.steps.length - 1}
                              className="h-8 w-8 rounded-full"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveStep(index)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 rounded-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <span className="font-semibold text-violet-600">Message:</span> {step.message}
                          </p>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <span className="font-semibold text-blue-600">Expected:</span> {step.expectedAnswer}
                          </p>
                          {step.hint && (
                            <p className="text-gray-500 bg-yellow-50 p-3 rounded-lg">
                              <span className="font-semibold text-yellow-600">Hint:</span> {step.hint}
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
                  onClick={() => setIsEditing(false)}
                  className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl shadow-lg mr-[5px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveQuest}
                  className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl shadow-lg"
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
      <div className="container mx-auto p-6">
        <Card className="max-w-7xl mx-auto shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-600 to-blue-600 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-8 w-8" />
                <CardTitle className="text-3xl font-bold">&nbsp;&nbsp;Quest Admin Panel</CardTitle>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateQuest}
                  className="bg-white text-violet-600 hover:bg-gray-100 rounded-xl shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Quest
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 bg-white">
            {quests.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {quests.map((quest) => (
                  <Card key={quest.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-100 to-blue-100 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 leading-tight">{quest.title}</h3>
                        <Badge className={cn(
                          "text-xs font-medium",
                          quest.active 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'
                        )}>
                          {quest.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{quest.description}</p>
                      
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        <p className="flex items-center">
                          <span className="font-medium text-violet-600">User:</span> 
                          <span className="ml-2">{quest.userName}</span>
                        </p>
                        <p className="flex items-center">
                          <span className="font-medium text-blue-600">Steps:</span> 
                          <span className="ml-2">{quest.steps?.length || 0}</span>
                        </p>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <a
                          href={`/quest/${quest.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-500 hover:text-violet-600 text-sm font-medium flex items-center transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Quest
                        </a>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQuest(quest)}
                            className="h-8 w-8 text-gray-600 hover:text-violet-600 rounded-full"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuest(quest.id)}
                            className="h-8 w-8 text-gray-600 hover:text-red-600 rounded-full"
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
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-violet-100 to-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Settings className="h-12 w-12 text-violet-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4">No quests created yet</h3>
                <p className="text-gray-500 mb-8 text-lg">Create your first quest to get started with AI adventures.</p>
                <Button
                  onClick={handleCreateQuest}
                  className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-10 py-4 text-lg rounded-xl shadow-lg"
                >
                  <Plus className="h-6 w-6 mr-3" />
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