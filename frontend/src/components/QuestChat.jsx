import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Home, Settings, Link2, Copy, ChevronLeft, Bot, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocalRuntime, AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import MediaRenderer from './MediaRenderer';

const QuestChat = () => {
  const { questId } = useParams();
  const [quest, setQuest] = useState(null);
  const [progress, setProgress] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkQuestAccess();
  }, [questId]);

  // Create ChatModelAdapter for Assistant UI
  const questModelAdapter = React.useMemo(() => {
    if (!questId) return null;

    const adapter = {
      async run({ messages, abortSignal }) {
        try {
          const response = await fetch(`http://localhost:3001/api/runtime/${questId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content[0]?.text || msg.content
              })),
              abortSignal
            }),
            signal: abortSignal
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          // Handle streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let fullContent = '';
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;
          }

          return {
            content: [{ type: 'text', text: fullContent }]
          };
        } catch (error) {
          console.error('Runtime adapter error:', error);
          return {
            content: [{ 
              type: 'text', 
              text: 'I apologize, but I encountered an issue. Please try again.' 
            }]
          };
        }
      }
    };

    return adapter;
  }, [questId]);

  // Create LocalRuntime
  const runtime = useLocalRuntime(questModelAdapter, {
    initialMessages: quest ? [{
      role: 'assistant',
      content: [{
        type: 'text',
        text: `Welcome to ${quest.title}! I'm ${quest.aiName || 'Guide'}, and I'll be guiding you through this adventure. ${quest.description}`
      }]
    }] : []
  });

  const checkQuestAccess = async () => {
    try {
      // First check if quest exists and if it's password protected
      const response = await fetch(`http://localhost:3001/api/quests/${questId}/validate-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: '' })
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.protected) {
          // Quest is not password protected, load it directly
          await loadQuest();
          await loadProgress();
        } else {
          // Quest is password protected, show password prompt
          setShowPasswordPrompt(true);
        }
      } else {
        console.error('Quest not found');
      }
    } catch (error) {
      console.error('Failed to check quest access:', error);
    }
  };

  const validatePassword = async () => {
    if (!password.trim()) {
      setPasswordError('Please enter a password');
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError('');

    try {
      const response = await fetch(`http://localhost:3001/api/quests/${questId}/validate-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setShowPasswordPrompt(false);
          setQuest(data.quest);
          await loadProgress();
          await loadWelcomeMessage(data.quest);
        } else {
          setPasswordError('Incorrect password. Please try again.');
        }
      } else {
        setPasswordError('Failed to validate password. Please try again.');
      }
    } catch (error) {
      console.error('Failed to validate password:', error);
      setPasswordError('Network error. Please try again.');
    }

    setIsValidatingPassword(false);
  };

  const loadWelcomeMessage = async (questData) => {
    try {
      const chatResponse = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Welcome ${questData.userName} to the quest: ${questData.title}. ${questData.description}`,
          questId,
          currentStep: 0,
          context: [],
          isAnswerAttempt: false
        })
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        setMessages([{
          id: 1,
          type: 'bot',
          content: chatData.message,
          timestamp: new Date()
        }]);
      } else {
        // Fallback welcome message
        setMessages([{
          id: 1,
          type: 'bot',
          content: `Welcome ${questData.userName}! Ready to start your adventure?\n${questData.description} Let's begin!`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to get AI welcome message:', error);
      // Fallback welcome message
      setMessages([{
        id: 1,
        type: 'bot',
        content: `Welcome ${questData.userName}! Ready to start your adventure?\n${questData.description} Let's begin!`,
        timestamp: new Date()
      }]);
    }
  };

  const loadQuest = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/quests/${questId}`);
      if (response.ok) {
        const questData = await response.json();
        setQuest(questData);
        
        // Load runtime configuration
        const configResponse = await fetch(`http://localhost:3001/api/runtime/${questId}/config`, {
          credentials: 'include'
        });
        
        if (configResponse.ok) {
          const config = await configResponse.json();
          setProgress(config.progress);
        }
      }
    } catch (error) {
      console.error('Failed to load quest:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/progress/${questId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const progressData = await response.json();
        setProgress(progressData);
        
        // If user has progress, show current step
        if (progressData.currentStep > 0 && quest) {
          const currentStep = quest.steps[progressData.currentStep];
          if (currentStep) {
            addBotMessage(currentStep.message, progressData.currentStep);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const addBotMessage = (content, stepIndex = null, questData = null) => {
    const sourceQuest = questData || quest;
    const step = stepIndex !== null && sourceQuest?.steps ? sourceQuest.steps[stepIndex] : null;
    const newMessage = {
      id: Date.now(),
      type: 'bot',
      content,
      timestamp: new Date(),
      step: step
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content) => {
    const newMessage = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !quest || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    addUserMessage(userMessage);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // First, get AI response for the user's message
      const chatResponse = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          questId,
          currentStep: progress?.currentStep || 0,
          context: messages.slice(-5), // Send last 5 messages for context
          isAnswerAttempt: true
        })
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        
        // Add AI response
        setTimeout(() => {
          addBotMessage(chatData.message);
        }, 1000);
      }

      // Then validate the answer using AI
      const validateResponse = await fetch('http://localhost:3001/api/validate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questId,
          stepIndex: progress?.currentStep || 0,
          answer: userMessage
        })
      });

      const validation = await validateResponse.json();
      
      if (validation.correct) {
        // Update progress
        const newStepIndex = (progress?.currentStep || 0) + 1;
        const updateResponse = await fetch(`http://localhost:3001/api/progress/${questId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            currentStep: newStepIndex,
            answer: userMessage,
            completed: validation.isLastStep
          })
        });

        if (updateResponse.ok) {
          const updatedProgress = await updateResponse.json();
          setProgress(updatedProgress);

          // Show success message and next step or completion
          setTimeout(() => {
            if (validation.isLastStep) {
              // Fetch expected answers from the quest steps
              const expectedAnswers = quest.steps.map(step => step.expectedAnswer);
              const finalText = quest.finalText.replace(/\{answers\}/g, expectedAnswers.join(', '));
              addBotMessage(`🎉 Quest Complete! ${finalText}`);
            } else {
              // Get AI response for next step
              const nextStep = quest.steps[newStepIndex];
              if (nextStep) {
                fetch('http://localhost:3001/api/chat', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: `Present the next challenge: ${nextStep.message}`,
                    questId,
                    currentStep: newStepIndex,
                    context: messages.slice(-3),
                    isAnswerAttempt: false
                  })
                }).then(async (res) => {
                  if (res.ok) {
                    const data = await res.json();
                    addBotMessage(data.message, newStepIndex);
                  } else {
                    addBotMessage(`Great job! Next challenge: ${nextStep.message}`, newStepIndex);
                  }
                }).catch(() => {
                  addBotMessage(`Perfect! Now for your next challenge: ${nextStep.message}`, newStepIndex);
                });
              }
            }
            setIsTyping(false);
          }, 2000);
        }
      } else {
        // AI determined answer was wrong - its response was already added above
        setTimeout(() => {
          setIsTyping(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to process message:', error);
      setTimeout(() => {
        addBotMessage('I apologize, but I encountered an issue. Please try again.');
        setIsTyping(false);
      }, 1000);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyFinalCode = () => {
    if (quest?.steps) {
      const expectedAnswers = quest.steps.map(step => step.expectedAnswer);
      const finalCode = expectedAnswers.join('-');
      navigator.clipboard.writeText(finalCode);
      addBotMessage('✅ Final code copied to clipboard!');
    }
  };

  const handlePasswordKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validatePassword();
    }
  };

  if (showPasswordPrompt) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-violet-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Quest Access Required
            </CardTitle>
            <p className="text-gray-600 text-sm">
              This quest is password protected. Please enter the password to continue.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handlePasswordKeyPress}
                placeholder="Enter quest password"
                className="h-12 border-gray-300 focus:border-violet-500 focus:ring-violet-500"
                disabled={isValidatingPassword}
              />
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>
            <Button
              onClick={validatePassword}
              disabled={isValidatingPassword || !password.trim()}
              className="w-full h-12 bg-violet-500 hover:bg-violet-600 text-white font-medium"
            >
              {isValidatingPassword ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Validating...</span>
                </div>
              ) : (
                'Access Quest'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading quest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Modern Header */}
      <div className="bg-white border-b border-[#3a3a3a] px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-violet-500" /> &nbsp;
                  {quest.title}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden" style={{"marginTop": "15px"}}>
        <div className="max-w-4xl mx-auto h-[98%] flex flex-col">
          {/* Assistant UI Thread with LocalRuntime */}
          {questModelAdapter && (
            <AssistantRuntimeProvider runtime={runtime}>
              <div className="flex-1 px-4">
                <Thread />
              </div>
            </AssistantRuntimeProvider>
          )}

          {/* Final Code Copy Button */}
          {progress?.completed && (
            <div className="px-4 py-3 bg-green-50 border-t border-green-200">
              <Button
                onClick={copyFinalCode}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-all shadow-sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Final Code
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestChat;