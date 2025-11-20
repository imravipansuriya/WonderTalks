import React, { useState, useEffect, useRef } from 'react';
import { startGuessingGameRound, checkGameAnswer, generateIllustration, generateSpeech } from '../services/geminiService';
import { decodeBase64, decodeAudioData, getAudioContext } from '../services/audioUtils';
import { Mic, Send, Volume2, HelpCircle, ArrowLeft, Sparkles, Award, Frown, Loader2 } from 'lucide-react';

interface GuessingGameProps {
  onBack: () => void;
}

interface GameRound {
  answer: string;
  clue: string;
  imagePrompt: string;
}

const GuessingGame: React.FC<GuessingGameProps> = ({ onBack }) => {
  const [round, setRound] = useState<GameRound | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [checking, setChecking] = useState(false);
  const [revealedImage, setRevealedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Audio refs
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    startNewRound();
    return () => stopAudio();
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
    }
  };

  const playAudio = async (text: string) => {
    stopAudio();
    try {
      const base64 = await generateSpeech(text);
      if (base64) {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();
        const buffer = await decodeAudioData(decodeBase64(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        audioSourceRef.current = source;
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const startNewRound = async () => {
    setIsLoading(true);
    setFeedback(null);
    setIsCorrect(false);
    setInput('');
    setRevealedImage(null);
    setRound(null);
    
    try {
      const data = await startGuessingGameRound();
      setRound(data);
      setIsLoading(false);
      // Auto-play clue
      playAudio(data.clue);
    } catch (e) {
      setFeedback("Oops, couldn't start the game. Try again!");
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !round) return;
    
    setChecking(true);
    try {
      const result = await checkGameAnswer(round.answer, input);
      setFeedback(result.feedback);
      playAudio(result.feedback); // Speak the feedback
      
      if (result.correct) {
        setIsCorrect(true);
        // Generate prize image
        const img = await generateIllustration(round.imagePrompt);
        setRevealedImage(img);
      }
    } catch (e) {
        setFeedback("I got confused. Try again!");
    } finally {
        setChecking(false);
    }
  };

  // Voice Input Logic
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        // Use simple speech recognition if available, otherwise just mock generic logic or warn
        // Note: Browser native SpeechRecognition is experimental.
        // For this demo, we will simulate "listening" state but in a real app we'd use the Gemini Live API or browser SpeechRecognition.
        // Since we don't have SpeechRecognition in the imports/setup, we'll rely on text input or a placeholder for now 
        // OR we could implement a simple "alert" that speech-to-text requires browser support.
        
        // Let's use the window.webkitSpeechRecognition if available for a "wow" factor, else fallback.
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.start();
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsRecording(false);
            };
            recognition.onerror = () => setIsRecording(false);
        } else {
            alert("Your browser doesn't support Speech Recognition. Please type your answer.");
            setIsRecording(false);
        }
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-sky-100 flex flex-col items-center p-4 relative font-sans">
       <button 
        onClick={onBack}
        className="absolute top-6 left-6 bg-white p-3 rounded-full text-sky-600 shadow-md hover:bg-sky-50 transition-all z-10"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden mt-10 flex flex-col">
        {/* Header Area */}
        <div className="bg-sky-500 p-6 text-center relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2">Who Am I?</h2>
                <div className="bg-white/20 inline-block px-4 py-1 rounded-full text-white font-medium text-sm backdrop-blur-md">
                    Riddle Game
                </div>
            </div>
            <Sparkles className="absolute top-[-10px] right-[-10px] text-sky-300 w-32 h-32 opacity-50" />
        </div>

        {/* Content Area */}
        <div className="p-8 flex flex-col items-center flex-grow min-h-[400px] justify-center">
            {isLoading ? (
                <div className="flex flex-col items-center text-sky-600">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p className="font-bold text-xl">Finding a riddle...</p>
                </div>
            ) : isCorrect ? (
                <div className="text-center w-full animate-fadeIn">
                    <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Award size={40} className="text-green-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-green-600 mb-2">You got it!</h3>
                    <p className="text-gray-600 text-xl mb-6">{round?.answer}</p>
                    
                    {revealedImage ? (
                        <img src={revealedImage} alt="Answer" className="w-64 h-64 object-cover rounded-2xl shadow-lg mx-auto mb-6 border-4 border-green-100" />
                    ) : (
                        <div className="w-64 h-64 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                             <Loader2 className="animate-spin text-gray-400" />
                        </div>
                    )}

                    <p className="text-gray-500 mb-6 italic">"{feedback}"</p>

                    <button 
                        onClick={startNewRound}
                        className="bg-sky-500 text-white px-8 py-4 rounded-2xl font-bold text-xl hover:bg-sky-600 shadow-lg hover:-translate-y-1 transition-all w-full"
                    >
                        Play Again
                    </button>
                </div>
            ) : (
                <div className="w-full text-center">
                    {/* Clue Card */}
                    <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 mb-8 relative">
                        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-amber-400 text-white p-2 rounded-full shadow-md">
                            <HelpCircle size={24} />
                        </div>
                        <p className="text-2xl text-gray-700 font-medium mt-4 leading-relaxed">
                            "{round?.clue}"
                        </p>
                        <button 
                            onClick={() => round && playAudio(round.clue)}
                            className="mt-4 text-amber-600 font-bold flex items-center justify-center gap-2 hover:text-amber-700"
                        >
                            <Volume2 size={20} /> Listen Again
                        </button>
                    </div>
                    
                    {/* Feedback Area */}
                    {feedback && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 font-bold animate-bounce-short">
                           <Frown size={20} /> {feedback}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 w-full">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your guess..."
                                className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 text-lg outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                disabled={checking}
                            />
                            <button 
                                onClick={toggleRecording}
                                className={`p-4 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                title="Use Microphone"
                            >
                                <Mic size={24} />
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleSubmit}
                            disabled={!input.trim() || checking}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                                !input.trim() || checking ? 'bg-gray-200 text-gray-400' : 'bg-sky-500 text-white hover:bg-sky-600 shadow-md'
                            }`}
                        >
                            {checking ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            Check Answer
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GuessingGame;