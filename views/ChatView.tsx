
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, AppView, User, MemoryEntry } from '../types';
import { AppSettings } from '../App';
import { chatWithGemini } from '../services/geminiService';

interface ChatViewProps {
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  onViewChange: (view: AppView) => void;
  user: User | null;
  settings: AppSettings;
  memories: MemoryEntry[];
  onSaveMemory: (content: string) => void;
  systemTime: Date;
  onApiError?: (error: any) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  activeSessionId, setActiveSessionId, sessions, setSessions, user, settings, systemTime, memories, onApiError, onPlaySound
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    onPlaySound?.('click');
    const content = input;
    setInput('');
    setIsLoading(true);

    const sessionId = activeSessionId || Date.now().toString();
    if (!activeSessionId) setActiveSessionId(sessionId);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];

    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === sessionId);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], messages: newMessages, updatedAt: Date.now() };
        return updated;
      }
      return [{ id: sessionId, title: content.slice(0, 30), messages: newMessages, updatedAt: Date.now(), startTime: Date.now() }, ...prev];
    });

    try {
      const response = await chatWithGemini(content, newMessages.slice(0, -1).map(m => ({ 
        role: m.role, 
        parts: [{ text: m.content }] 
      })));

      const modelMsg: Message = { id: Date.now().toString(), role: 'model', content: response.text || '...', timestamp: Date.now() };
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === sessionId);
        const updated = [...prev];
        updated[idx] = { ...updated[idx], messages: [...newMessages, modelMsg], updatedAt: Date.now() };
        return updated;
      });
    } catch (e: any) {
      if (onApiError) onApiError(e);
      const errorMsg: Message = { id: Date.now().toString(), role: 'model', content: "Neural sync interrupted.", timestamp: Date.now() };
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === sessionId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], messages: [...newMessages, errorMsg], updatedAt: Date.now() };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pt-24 pb-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Minimalist Top Greeting */}
          {messages.length === 0 && (
            <div className="py-10 animate-in fade-in slide-in-from-top-4 duration-1000">
               <h1 className="text-5xl font-black text-primary tracking-tighter text-center opacity-90 drop-shadow-2xl">
                 Hello, I am Little Ai.
               </h1>
               <div className="w-12 h-1 bg-pink-500/40 rounded-full mx-auto mt-6 shadow-2xl"></div>
            </div>
          )}
          
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] px-7 py-5 rounded-[2.5rem] border shadow-2xl glass-panel ${
                m.role === 'user' ? 'opacity-100' : 'opacity-90'
              } bg-white/5 backdrop-blur-[50px] border-white/10`}>
                <div className="text-[17px] leading-relaxed whitespace-pre-wrap font-bold text-primary">{m.content}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="glass-panel px-5 py-3 rounded-full flex items-center space-x-2 border border-white/10 bg-white/5 backdrop-blur-3xl">
                 <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pb-10 pt-4 px-6 relative z-20">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-pink-500/10 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
          <div className="relative flex items-center bg-transparent backdrop-blur-[50px] border border-white/20 rounded-[2.5rem] p-2 shadow-4xl">
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
              placeholder="MESSAGE LITTLE AI..." 
              className="flex-1 bg-transparent border-none text-primary px-7 py-5 focus:outline-none placeholder:text-black/40 font-black text-xs uppercase tracking-[0.4em]" 
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()} 
              className="w-14 h-14 bg-pink-600/20 hover:bg-pink-600 text-pink-600 hover:text-white rounded-full flex items-center justify-center border border-pink-500/30 shadow-2xl active:scale-90 disabled:opacity-10 transition-all ml-2"
            >
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-arrow-up'} text-sm`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
