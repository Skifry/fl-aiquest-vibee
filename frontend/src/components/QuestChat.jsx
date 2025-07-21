import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Home, Settings, Link2, Copy, ChevronLeft, Bot, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
        await loadWelcomeMessage(questData);
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
            addBotMessage(currentStep.message);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const addBotMessage = (content) => {
    const newMessage = {
      id: Date.now(),
      type: 'bot',
      content,
      timestamp: new Date()
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
              const finalText = quest.finalText.replace(/\{answers\}/g, updatedProgress.answers.join(', '));
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
                    addBotMessage(data.message);
                  } else {
                    addBotMessage(`Great job! Next challenge: ${nextStep.message}`);
                  }
                }).catch(() => {
                  addBotMessage(`Perfect! Now for your next challenge: ${nextStep.message}`);
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
    if (progress?.answers) {
      const finalCode = progress.answers.join('-');
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

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden" style={{"marginTop": "15px"}}>
        <div className="max-w-4xl mx-auto h-[98%] flex flex-col">
          <ScrollArea className="flex-1 px-4 py-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className="flex items-start space-x-2 max-w-[75%]">
                    {message.type === 'bot' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl shadow-sm",
                        message.type === 'user'
                          ? 'bg-violet-500 text-white rounded-md bg-[#3e3e3e] bg ml-auto'
                          : 'text-gray-800 bg-[#303030] rounded-md'
                      )} style={{"padding": "10px", "marginLeft": "10px"}}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.type === 'user' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-violet-500 text-white text-xs">
                          {quest.userName}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[75%]">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

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

          {/* Modern Input Area */}
          <div className="px-4 py-4 bg-white border-t border-[#3a3a3a]">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer or ask for help..."
                  className="bg-[#3a3a3a] border-none rounded-xl px-4 py-3 pr-12 focus:bg-white focus:border-violet-500 transition-all text-[14px] min-h-[44px] mt-[6px] px-[14px] text-[#d6d6d6]"
                  disabled={isLoading || progress?.completed}
                />
                {currentMessage.trim() && (
                  // <Button
                  //   onClick={handleSendMessage}
                  //   disabled={isLoading || progress?.completed}
                  //   size="icon"
                  //   className="absolute right-2 top-1/2 transform  -translate-y-1/2 w-8 h-8 text-white rounded-full shadow-sm"
                  // >
                  //   {isLoading ? (
                  //     <div className="w-3 h-3 rounded-full animate-spin" />
                  //   ) : (
                  //     <Send className="h-4 w-4" />
                  //   )}
                  // </Button>

                  <button
                   onClick={handleSendMessage}
                   disabled={isLoading || progress?.completed}
                   style={{
                    "background-color": "transparent",
                    "border": "none",
                    "color": "white",
                    "position": "absolute",
                    "top": "15px",
                    "right": "20px"
                   }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestChat;