import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StoryPage } from '../types';
import { generateIllustration, generateSpeech, continueInteractiveStory } from '../services/geminiService';
import { decodeBase64, decodeAudioData, getAudioContext } from '../services/audioUtils';
import { saveFavorite, getFavorites } from '../services/storageUtils';
import { Play, Home, Volume2, Image as ImageIcon, Mic, Square, RotateCcw, Wand2, Heart } from 'lucide-react';

interface StoryBookProps {
  initialPage: StoryPage;
  onExit: (pages: StoryPage[], durationSeconds: number) => void;
}

const StoryBook: React.FC<StoryBookProps> = ({ initialPage, onExit }) => {
  // Story State
  const [pages, setPages] = useState<StoryPage[]>([initialPage]);
  const [pageIndex, setPageIndex] = useState(0);
  const [startTime] = useState(Date.now());
  
  // Asset State
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nextPageLoading, setNextPageLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null); // For user recording playback
  
  const currentPage = pages[pageIndex];
  
  // Cache for generated assets
  const assetCache = useRef<Record<number, { image: string | null, audioBuffer: AudioBuffer | null }>>({});

  // --- Audio Control ---

  const stopAllAudio = useCallback(() => {
    // Stop TTS
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    // Stop User Recording
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const playTTS = useCallback(async (buffer: AudioBuffer) => {
    stopAllAudio();
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    
    audioSourceRef.current = source;
    source.start(0);
    setIsPlaying(true);
  }, [stopAllAudio]);

  const playUserRecording = useCallback(() => {
    if (!currentPage.userRecordingUrl) return;
    stopAllAudio();
    
    const audio = new Audio(currentPage.userRecordingUrl);
    audioElRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  }, [currentPage, stopAllAudio]);

  // --- Recording Logic ---
  
  const startRecording = async () => {
    stopAllAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        // Update current page with recording URL
        const updatedPages = [...pages];
        updatedPages[pageIndex] = { ...updatedPages[pageIndex], userRecordingUrl: url };
        setPages(updatedPages);
        setRecordingBlobUrl(url); // Local state for immediate UI update
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Asset Loading Effect ---

  useEffect(() => {
    let isMounted = true;
    stopAllAudio();
    setCurrentImage(null);
    setRecordingBlobUrl(currentPage.userRecordingUrl || null); // Reset recording state for new page
    setIsFavorite(false);

    // Only load if we haven't cached it
    const cached = assetCache.current[pageIndex];
    
    const loadAssets = async () => {
      // 1. Image
      if (cached?.image) {
         if (isMounted) {
             setCurrentImage(cached.image);
             checkIfFavorite(cached.image);
         }
      } else {
        if (isMounted) setImageLoading(true);
        try {
          const imgData = await generateIllustration(currentPage.imagePrompt);
          if (isMounted) {
            setCurrentImage(imgData);
            setImageLoading(false);
            if (imgData) {
                 assetCache.current[pageIndex] = { ...assetCache.current[pageIndex], image: imgData };
                 checkIfFavorite(imgData);
            }
          }
        } catch (e) {
          if (isMounted) setImageLoading(false);
        }
      }

      // 2. TTS Audio
      if (cached?.audioBuffer) {
        if (!currentPage.userRecordingUrl && isMounted) {
           playTTS(cached.audioBuffer);
        }
      } else {
        if (isMounted) setAudioLoading(true);
        try {
          const audioBase64 = await generateSpeech(currentPage.text);
          if (audioBase64 && isMounted) {
            const bytes = decodeBase64(audioBase64);
            const ctx = getAudioContext();
            const buffer = await decodeAudioData(bytes, ctx);
            
            assetCache.current[pageIndex] = { ...assetCache.current[pageIndex], audioBuffer: buffer };
            setAudioLoading(false);

            if (!currentPage.userRecordingUrl) {
                playTTS(buffer);
            }
          } else {
            if (isMounted) setAudioLoading(false);
          }
        } catch (e) {
          if (isMounted) setAudioLoading(false);
        }
      }
    };

    loadAssets();

    return () => {
      isMounted = false;
      stopAllAudio();
    };
  }, [pageIndex, currentPage, playTTS, stopAllAudio]); 

  const checkIfFavorite = (url: string) => {
      const favs = getFavorites();
      setIsFavorite(favs.some(f => f.imageUrl === url));
  };

  const handleToggleFavorite = () => {
      if (!currentImage) return;
      
      if (!isFavorite) {
          saveFavorite({
              id: crypto.randomUUID(),
              imageUrl: currentImage,
              prompt: currentPage.imagePrompt,
              date: new Date().toISOString()
          });
          setIsFavorite(true);
      } 
      // We can choose not to allow unfavoriting here for simplicity or implement removeFavorite
  };

  // --- Navigation & Interaction ---

  const handleOptionSelect = async (choice: string) => {
    stopAllAudio();
    setNextPageLoading(true);
    try {
      const nextPage = await continueInteractiveStory(currentPage.text, choice, pageIndex + 1);
      setPages(prev => [...prev, nextPage]);
      setPageIndex(prev => prev + 1);
    } catch (e) {
      alert("The story magic hiccuped! Try again.");
    } finally {
      setNextPageLoading(false);
    }
  };

  const handleBack = () => {
    if (pageIndex > 0) setPageIndex(prev => prev - 1);
  };
  
  const handleFinish = () => {
    stopAllAudio();
    const duration = Math.floor((Date.now() - startTime) / 1000);
    onExit(pages, duration);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50 p-4 relative font-sans">
       {/* Exit Button */}
       <div className="absolute top-4 left-4 z-20">
            <button 
                onClick={handleFinish} 
                className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-amber-800 hover:bg-white transition-all"
            >
                <Home size={24} />
            </button>
       </div>

       <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-200 flex flex-col md:flex-row min-h-[650px]">
          
          {/* Left: Illustration */}
          <div className="w-full md:w-1/2 bg-amber-100 relative flex items-center justify-center min-h-[300px] md:min-h-full border-r border-amber-100">
            {imageLoading ? (
                <div className="text-center p-8">
                    <ImageIcon className="w-16 h-16 text-amber-300 mx-auto mb-4 animate-pulse" />
                    <p className="text-amber-800 font-bold animate-pulse">Painting the scene...</p>
                </div>
            ) : currentImage ? (
                <>
                <img 
                    src={currentImage} 
                    alt="Story Illustration" 
                    className="w-full h-full object-cover animate-fadeIn"
                />
                <button 
                   onClick={handleToggleFavorite}
                   className="absolute top-4 right-4 p-2 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white transition-all hover:scale-110"
                   title="Save to Favorites"
                >
                    <Heart size={24} className={isFavorite ? "fill-red-500 text-red-500" : "text-white"} />
                </button>
                </>
            ) : (
                <div className="text-amber-400 flex flex-col items-center">
                    <ImageIcon size={48} className="mb-2"/>
                    <span>Image unavailable</span>
                </div>
            )}
            
            <div className="absolute bottom-4 left-4 bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-md font-bold text-sm">
                Page {pageIndex + 1}
            </div>
          </div>

          {/* Right: Content & Controls */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-white relative">
             
             {/* Story Text */}
             <div className="flex-grow flex flex-col justify-center">
                <p className="text-2xl md:text-3xl leading-relaxed font-medium text-gray-800 font-['Nunito'] mb-8">
                    {currentPage.text}
                </p>
             </div>

             {/* Audio Controls Section */}
             <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-inner">
                 {/* TTS Play */}
                 <button 
                    onClick={() => assetCache.current[pageIndex]?.audioBuffer && playTTS(assetCache.current[pageIndex].audioBuffer!)}
                    disabled={audioLoading || isRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        isPlaying && !audioElRef.current && !isRecording ? 'bg-amber-200 text-amber-900' : 'bg-white hover:bg-amber-100 text-gray-700'
                    } shadow-sm border border-gray-200`}
                 >
                    {audioLoading ? <div className="animate-spin w-5 h-5 border-2 border-amber-500 rounded-full border-t-transparent" /> : <Volume2 size={20} />}
                    <span className="font-bold text-sm">Narrator</span>
                 </button>

                 <div className="h-8 w-px bg-gray-300 mx-2"></div>

                 {/* User Recording Controls */}
                 <div className="flex items-center gap-2">
                     {!isRecording ? (
                         <>
                            {recordingBlobUrl ? (
                                <button
                                    onClick={playUserRecording}
                                    disabled={isPlaying}
                                    className={`p-3 rounded-full transition-all ${isPlaying && audioElRef.current ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                    title="Play My Voice"
                                >
                                    <Play size={20} fill="currentColor" />
                                </button>
                            ) : null}
                            
                            <button 
                                onClick={startRecording}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all font-bold text-sm border border-red-100"
                            >
                                <Mic size={18} />
                                {recordingBlobUrl ? 'Re-record' : 'Record Me'}
                            </button>
                         </>
                     ) : (
                         <button 
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all font-bold text-sm animate-pulse"
                         >
                            <Square size={18} fill="currentColor" />
                            Stop
                         </button>
                     )}
                 </div>
             </div>

             {/* Interactive Choices or Next Step */}
             <div className="mt-auto">
                {nextPageLoading ? (
                    <div className="w-full py-6 bg-indigo-50 rounded-2xl flex items-center justify-center gap-3 text-indigo-600">
                        <Wand2 className="animate-spin" />
                        <span className="font-bold text-lg">Writing next chapter...</span>
                    </div>
                ) : currentPage.isEnding ? (
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-amber-600 mb-4">The End!</h3>
                        <button 
                            onClick={handleFinish}
                            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-xl hover:bg-amber-600 shadow-lg transition-transform hover:scale-105"
                        >
                            Finish Story
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">What happens next?</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {currentPage.choices?.map((choice, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(choice)}
                                    className="text-left p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-100 hover:border-indigo-300 transition-all text-indigo-900 font-bold text-lg active:scale-95"
                                >
                                    {choice}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* Back Button (Only if not on page 1) */}
             {pageIndex > 0 && !nextPageLoading && (
                <button 
                    onClick={handleBack}
                    className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm font-bold"
                >
                    <RotateCcw size={14} /> Previous Page
                </button>
             )}

          </div>
       </div>
    </div>
  );
};

export default StoryBook;