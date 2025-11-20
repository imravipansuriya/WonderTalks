import React from 'react';
import { AppMode } from '../types';
import { ArrowLeft, HelpCircle, Gamepad2 } from 'lucide-react';

interface GameHubProps {
  onSelectGame: (mode: AppMode) => void;
  onBack: () => void;
}

const GameHub: React.FC<GameHubProps> = ({ onSelectGame, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-300 to-emerald-300 flex flex-col items-center justify-center p-4 relative">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 bg-white/30 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/50 transition-all shadow-lg"
      >
        <ArrowLeft size={28} />
      </button>

      <div className="text-center mb-12">
        <div className="inline-flex p-6 bg-white/20 rounded-full backdrop-blur-md mb-6 shadow-inner">
             <Gamepad2 size={64} className="text-white" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-md tracking-tight mb-4">
          Game Center
        </h1>
        <p className="text-xl text-white/90 font-bold">Play magical mini-games!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 w-full max-w-md">
        
        {/* Game 1: Guessing Game */}
        <button 
          onClick={() => onSelectGame(AppMode.GUESSING_GAME)}
          className="group bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 flex items-center border-b-8 border-teal-500 active:border-0 active:translate-y-0"
        >
          <div className="bg-teal-100 p-5 rounded-2xl mr-6 group-hover:scale-110 transition-transform">
            <HelpCircle size={40} className="text-teal-600" />
          </div>
          <div className="text-left">
            <h3 className="text-2xl font-bold text-gray-800">Who Am I?</h3>
            <p className="text-gray-500 font-medium">Guess the animal from clues!</p>
          </div>
        </button>

        {/* More games placeholder */}
        <div className="bg-white/40 rounded-3xl p-6 border-2 border-dashed border-white flex items-center justify-center text-white font-bold text-lg">
           More games coming soon!
        </div>

      </div>
    </div>
  );
};

export default GameHub;