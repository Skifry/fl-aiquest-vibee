import React from 'react';
import { Sparkles, MessageCircle, Target, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Hero */}
          <div className="mb-16">
            <div className="inline-flex items-center bg-violet-100 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-violet-600 mr-2" />
              <span className="text-sm font-medium text-violet-800">AI-Powered Adventures</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              AI Quest
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent"> Adventures</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Embark on interactive adventures guided by AI. Solve puzzles, answer questions, 
              and unlock your personalized quest completion code through engaging conversations.
            </p>
            
            <div className="bg-gradient-to-r from-violet-500 to-blue-500 p-1 rounded-2xl inline-block mb-8">
              <div className="bg-white rounded-xl px-8 py-4">
                <p className="text-slate-700 font-medium">
                  🎯 To start your quest, you'll need a direct link from your adventure guide
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="bg-violet-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Interactive Chat</h3>
                <p className="text-slate-600">
                  Engage in natural conversations with AI guides that adapt to your responses and provide real-time feedback.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Personalized Quests</h3>
                <p className="text-slate-600">
                  Each adventure is tailored to you, with personalized messages and challenges that match your profile.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Instant Results</h3>
                <p className="text-slate-600">
                  Complete your quest and receive a unique completion code that you can copy and share instantly.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-3xl p-12 mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-8">How It Works</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-violet-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  1
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Receive Link</h3>
                <p className="text-sm text-slate-600">Get a personalized quest link from your guide</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  2
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Start Adventure</h3>
                <p className="text-sm text-slate-600">Begin your interactive journey with AI assistance</p>
              </div>
              
              <div className="text-center">
                <div className="bg-emerald-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  3
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Solve Challenges</h3>
                <p className="text-sm text-slate-600">Answer questions and complete quest steps</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  4
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Get Your Code</h3>
                <p className="text-sm text-slate-600">Receive your unique completion certificate</p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-slate-500 mb-4">
              ✨ Powered by AI • 🎮 Interactive Adventures • 🎯 Personalized Experience
            </p>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-sm text-slate-600">
                Each quest is unique and created specifically for you. 
                Ready to begin your adventure?
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;