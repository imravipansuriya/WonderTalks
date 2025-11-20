import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ArrowLeft, Bot } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatBuddyProps {
  onBack: () => void;
}

const ChatBuddy: React.FC<ChatBuddyProps> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hi! I'm Sparkle the Story Bot. What do you want to talk about?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setIsLoading(true);

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);

    try {
      // Format history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg);
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Oops! My magic is a little tired. Try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-indigo-50 max-w-3xl mx-auto shadow-2xl border-x border-indigo-100">
      {/* Header */}
      <div className="bg-indigo-500 p-4 flex items-center text-white shadow-md sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-indigo-600 rounded-full transition-colors mr-2"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="p-2 bg-indigo-400 rounded-full mr-3">
             <Bot size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-wide">Chat with Sparkle</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-4 rounded-2xl text-lg shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-500 text-white rounded-br-none' 
                  : 'bg-white text-indigo-900 rounded-bl-none border border-indigo-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-indigo-100 flex space-x-2 items-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-indigo-100 sticky bottom-0">
        <div className="flex items-center bg-indigo-50 rounded-full px-4 py-2 border border-indigo-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Say something..."
            className="flex-1 bg-transparent outline-none text-indigo-900 placeholder-indigo-300 text-lg py-2"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-full transition-all ml-2 ${
              !input.trim() 
                ? 'text-indigo-300 cursor-not-allowed' 
                : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md hover:scale-105'
            }`}
          >
            {isLoading ? <Sparkles className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBuddy;
