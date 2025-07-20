import React from 'react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="text-6xl mb-8">🚀</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            AI Quest Adventures
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Welcome to AI Quest Adventures - where interactive stories come to life through AI-powered conversations.
          </p>
          <p className="text-gray-500 mb-8">
            To start your quest, you'll need a direct link from your adventure guide.
          </p>
          <div className="text-sm text-gray-400">
            Powered by AI • Interactive Adventures • Personalized Experience
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;