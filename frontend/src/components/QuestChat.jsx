import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Home, Settings, Link2, Copy, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const QuestChat = () => {
  const { questId } = useParams();
  const [quest, setQuest] = useState(null);
  const [progress, setProgress] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadQuest();
    loadProgress();
  }, [questId]);

  const loadQuest = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/quests/${questId}`);
      if (response.ok) {
        const questData = await response.json();
        setQuest(questData);
        
        // Add initial welcome message
        setMessages([{
          id: 1,
          type: 'bot',
          content: `Welcome ${questData.userName}! Hi ${questData.userName}! Ready to start your adventure?\n${questData.description} Let's begin!`,
          timestamp: new Date()
        }]);
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
      // Check if user is asking for hint
      if (userMessage.toLowerCase() === 'hint' || userMessage.toLowerCase() === 'help') {
        const currentStep = quest.steps[progress?.currentStep || 0];
        if (currentStep?.hint) {
          setTimeout(() => {
            addBotMessage(`💡 Hint: ${currentStep.hint}`);
            setIsTyping(false);
          }, 1000);
          setIsLoading(false);
          return;
        }
      }

      // Validate answer
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
              addBotMessage(`🎉 Congratulations! You've completed the quest! ${finalText}`);
            } else {
              addBotMessage('Excellent! That\'s exactly right! ✨');
              
              // Show next step
              setTimeout(() => {
                const nextStep = quest.steps[newStepIndex];
                if (nextStep) {
                  addBotMessage(`Perfect! Let's continue ${quest.userName} Great choice! Now, ${nextStep.message}`);
                }
              }, 1500);
            }
            setIsTyping(false);
          }, 1000);
        }
      } else {
        // Wrong answer - encourage to try again
        setTimeout(() => {
          addBotMessage("Hmm, that's not quite right. Give it another try! 🤔 (Type 'hint' if you need help)");
          setIsTyping(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to process message:', error);
      setTimeout(() => {
        addBotMessage('Sorry, something went wrong. Please try again.');
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
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => window.history.back()}
                className="h-9 w-9 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{quest.title}</h1>
                <Badge variant="secondary" className="text-xs">
                  Step {(progress?.currentStep || 0) + 1} of {quest.steps.length}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-100">
                <Settings className="h-4 w-4 text-gray-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-100">
                <Link2 className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
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
                        "px-4 py-3 rounded-2xl shadow-sm",
                        message.type === 'user'
                          ? 'bg-violet-500 text-white rounded-br-md ml-auto'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.type === 'user' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-violet-500 text-white text-xs">
                          {quest.userName.charAt(0).toUpperCase()}
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
          <div className="px-4 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  className="bg-gray-50 border-gray-300 rounded-full px-4 py-3 pr-12 focus:bg-white focus:border-violet-500 transition-all text-sm min-h-[44px]"
                  disabled={isLoading || progress?.completed}
                />
                {currentMessage.trim() && (
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || progress?.completed}
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 text-white rounded-full shadow-sm"
                  >
                    {isLoading ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            {!progress?.completed && (
              <p className="text-xs text-gray-500 mt-2 px-4">
                {currentMessage.toLowerCase().includes('hint') || currentMessage.toLowerCase().includes('help') 
                  ? "💡 Getting hint..." 
                  : "Type 'hint' or 'help' for clues"
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestChat;