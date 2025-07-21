import React from 'react';
import { Sparkles, MessageCircle, Target, Zap, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br ">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Hero */}
          <div className="mb-20">
            <Badge variant="secondary" className="inline-flex items-center bg-violet-100 text-violet-800 rounded-full px-4 py-2 mb-8 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Adventures
            </Badge>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
              AI Quest
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent"> Adventures</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Embark on interactive adventures guided by AI. Solve puzzles, answer questions, 
              and unlock your personalized quest completion code through engaging conversations.
            </p>
            
            <div className="bg-gradient-to-r from-violet-500 to-blue-500 p-1 rounded-3xl inline-block mb-12 shadow-lg">
              <div className="bg-white rounded-2xl px-8 py-6">
                <p className="text-gray-200 font-medium flex items-center">
                  <Target className="h-5 w-5 mr-3 text-violet-500" />
                  To start your quest, you'll need a direct link from your adventure guide
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-violet-100 to-violet-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageCircle className="h-10 w-10 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-4">Interactive Chat</h3>
                <p className="text-gray-600 leading-relaxed">
                  Engage in natural conversations with AI guides that adapt to your responses and provide real-time feedback.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-4">Personalized Quests</h3>
                <p className="text-gray-600 leading-relaxed">
                  Each adventure is tailored to you, with personalized messages and challenges that match your profile.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-4">Instant Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Complete your quest and receive a unique completion code that you can copy and share instantly.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-12 mb-16 shadow-xl">
            <h2 className="text-4xl font-bold text-gray-100 mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { number: 1, title: "Receive Link", desc: "Get a personalized quest link from your guide", color: "violet" },
                { number: 2, title: "Start Adventure", desc: "Begin your interactive journey with AI assistance", color: "blue" },
                { number: 3, title: "Solve Challenges", desc: "Answer questions and complete quest steps", color: "emerald" },
                { number: 4, title: "Get Your Code", desc: "Receive your unique completion certificate", color: "orange" }
              ].map((step, index) => (
                <div key={step.number} className="text-center group">
                  <div className={`bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {step.number}
                  </div>
                  <h3 className="font-bold text-gray-100 mb-3 text-lg">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  {index < 3 && (
                    <ArrowRight className="h-6 w-6 text-gray-400 mx-auto mt-4 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <div className="flex justify-center items-center space-x-8 mb-8 text-gray-500">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-violet-500" />
                <span className="font-medium">Powered by AI</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
                <span className="font-medium">Interactive Adventures</span>
              </div>
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-emerald-500" />
                <span className="font-medium">Personalized Experience</span>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 max-w-lg mx-auto shadow-xl">
              <p className="text-gray-200 leading-relaxed font-medium">
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