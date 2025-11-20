import React, { useState } from 'react';
import { startInteractiveStory } from '../services/geminiService';
import { StoryPage } from '../types';
import { Sparkles, BookOpen, Loader2, ArrowLeft } from 'lucide-react';

interface StoryWizardProps {
  onStoryStarted: (firstPage: StoryPage, topic: string) => void;
  onBack: () => void;
}

const StoryWizard: React.FC<StoryWizardProps> = ({ onStoryStarted, onBack }) => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const firstPage = await startInteractiveStory(topic);
      onStoryStarted(firstPage, topic);
    } catch (error) {
      alert("Oops! The magic book got stuck. Try a different topic!");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-300 to-indigo-300 relative">
       <button 
        onClick={onBack}
        className="absolute top-6 left-6 bg-white/30 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/50 transition-all"
      >
        <ArrowLeft size={24} />
      </button>
      
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-lg w-full text-center transform transition-all hover:scale-[1.01]">
        <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-indigo-600" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">
          Magic Story Maker
        </h1>
        <p className="text-gray-500 mb-8 text-lg">
          What do you want your story to be about today?
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., A brave astronaut bunny..."
              className="w-full px-6 py-4 text-xl border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-center placeholder-gray-300 text-gray-700"
              disabled={isGenerating}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!topic.trim() || isGenerating}
            className={`w-full py-4 px-6 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-all transform ${
              !topic.trim() || isGenerating
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 shadow-xl shadow-indigo-200'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" />
                Writing Magic...
              </>
            ) : (
              <>
                <Sparkles className="animate-pulse" />
                Start Adventure
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StoryWizard;
