import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

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
          content: `Hey ${questData.userName}! Welcome to "${questData.title}". ${questData.description} Let's begin!`,
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
              
              // Add copy button message
              setTimeout(() => {
                addBotMessage('Click the copy button below to copy your final code!');
              }, 1500);
            } else {
              addBotMessage('🎯 Correct! Great job!');
              
              // Show next step
              setTimeout(() => {
                const nextStep = quest.steps[newStepIndex];
                if (nextStep) {
                  addBotMessage(nextStep.message);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              🏠
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{quest.title}</h1>
              <p className="text-sm text-gray-500">
                Step {(progress?.currentStep || 0) + 1} of {quest.steps.length}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              ⚙️
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              🔗
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 max-w-md px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Final Code Copy Button */}
          {progress?.completed && (
            <div className="px-6 py-4 bg-green-50 border-t border-green-200">
              <button
                onClick={copyFinalCode}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                📋 Copy Final Code
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  className="w-full bg-gray-100 border-0 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm"
                  disabled={isLoading || progress?.completed}
                />
                {currentMessage.trim() && (
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || progress?.completed}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    {isLoading ? '...' : '→'}
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 px-2">
              {currentMessage.toLowerCase().includes('hint') || currentMessage.toLowerCase().includes('help') 
                ? "💡 Getting hint..." 
                : "Type 'hint' or 'help' for clues"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestChat;