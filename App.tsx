import React, { useState } from 'react';
import { AppMode, StoryPage, Story } from './types';
import StoryWizard from './components/StoryWizard';
import StoryBook from './components/StoryBook';
import ChatBuddy from './components/ChatBuddy';
import ParentDashboard from './components/ParentDashboard';
import { saveStoryToHistory } from './services/storageUtils';
import { Bot, BookOpen, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [currentStoryContext, setCurrentStoryContext] = useState<{title: string, initialPage: StoryPage} | null>(null);

  const handleStoryStarted = (firstPage: StoryPage, topic: string) => {
    setCurrentStoryContext({ title: topic, initialPage: firstPage });
    setMode(AppMode.READING);
  };

  const handleStoryCompleted = (pages: StoryPage[], durationSeconds: number) => {
    // Save to history
    if (currentStoryContext) {
      const newStory: Story = {
        id: crypto.randomUUID(),
        title: currentStoryContext.title,
        date: new Date().toISOString(),
        pages: pages,
        durationSeconds: durationSeconds
      };
      saveStoryToHistory(newStory);
    }
    setMode(AppMode.HOME);
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.HOME:
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex flex-col items-center justify-center p-6 text-center relative">
            
            {/* Parent Dashboard Button */}
            <button 
              onClick={() => setMode(AppMode.PARENT_DASHBOARD)}
              className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/40 transition-all text-white border border-white/30"
              title="Parents Area"
            >
              <Shield size={24} />
            </button>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 drop-shadow-md tracking-tight">
              WonderTales
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 font-semibold max-w-md">
              Read magical stories or chat with a new friend!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
              <button 
                onClick={() => setMode(AppMode.STORY_WIZARD)}
                className="group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 flex flex-col items-center border-b-8 border-indigo-200 active:border-0 active:translate-y-0"
              >
                <div className="bg-indigo-100 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen size={64} className="text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Read a Story</h2>
                <p className="text-gray-500 font-medium">Start a new adventure!</p>
              </button>

              <button 
                onClick={() => setMode(AppMode.CHAT)}
                className="group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 flex flex-col items-center border-b-8 border-emerald-200 active:border-0 active:translate-y-0"
              >
                 <div className="bg-emerald-100 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Bot size={64} className="text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Chat with Sparkle</h2>
                <p className="text-gray-500 font-medium">Ask questions & have fun!</p>
              </button>
            </div>
          </div>
        );
      case AppMode.STORY_WIZARD:
        return <StoryWizard onStoryStarted={handleStoryStarted} onBack={() => setMode(AppMode.HOME)} />;
      case AppMode.READING:
        return currentStoryContext ? (
          <StoryBook 
            initialPage={currentStoryContext.initialPage} 
            onExit={handleStoryCompleted} 
          />
        ) : null;
      case AppMode.CHAT:
        return <ChatBuddy onBack={() => setMode(AppMode.HOME)} />;
      case AppMode.PARENT_DASHBOARD:
        return <ParentDashboard onBack={() => setMode(AppMode.HOME)} />;
      default:
        return null;
    }
  };

  return (
    <div className="font-['Nunito'] antialiased">
      {renderContent()}
    </div>
  );
};

export default App;
