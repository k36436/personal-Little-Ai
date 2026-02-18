
import React, { useState } from 'react';
import { ChatSession, AppView } from '../types';

interface HistoryViewProps {
  sessions: ChatSession[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onSelect, onDelete, onViewChange, onPlaySound }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full overflow-y-auto p-6 md:p-12 custom-scrollbar bg-transparent relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => { onPlaySound?.('click'); onViewChange(AppView.CHAT); }}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-6xl mx-auto space-y-12 pt-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full">
              <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em]">Persistent Archive</span>
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-white">Neural History</h2>
            <p className="text-gray-500 text-sm max-w-md font-medium">Review and resume your cognitive exchanges. All data is localized in your browser's secure sandbox.</p>
          </div>
          
          <div className="relative group w-full md:w-80">
            <div className="absolute -inset-1 bg-pink-500/10 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="relative">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search your thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-pink-500/30 transition-all w-full text-white placeholder:text-gray-800 placeholder:uppercase placeholder:font-black placeholder:tracking-widest placeholder:text-[9px]"
              />
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-gray-800 text-3xl">
              <i className="fas fa-history"></i>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-white uppercase tracking-tighter">No Neural Nodes Found</p>
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">Initialize a new link to begin recording history</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredSessions.map((session, index) => (
              <div 
                key={session.id}
                onClick={() => onSelect(session.id)}
                style={{ animationDelay: `${index * 50}ms` }}
                className="group relative bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 hover:border-pink-500/30 hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                   <i className="fas fa-brain text-8xl -rotate-12"></i>
                </div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/10 shadow-inner group-hover:scale-110 transition-transform">
                    <i className="far fa-comments text-sm"></i>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                    className="w-10 h-10 rounded-xl bg-red-500/5 text-gray-700 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center"
                    title="Purge Session"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
                
                <h3 className="text-lg font-black text-white mb-3 truncate group-hover:text-pink-400 transition-colors tracking-tight relative z-10">
                  {session.title || 'Untitled Link'}
                </h3>
                
                <p className="text-[12px] text-gray-500 line-clamp-2 mb-8 flex-1 font-medium leading-relaxed relative z-10">
                  {session.messages[session.messages.length - 1]?.content || 'Empty transmission...'}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5 relative z-10">
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Last Synced</span>
                     <span className="text-[10px] text-gray-400 font-bold">{new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                   </div>
                   <div className="flex items-center space-x-2 text-pink-500 text-[9px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                     <span>Resume</span>
                     <i className="fas fa-arrow-right text-[8px]"></i>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(236, 72, 153, 0.2); }
      `}</style>
    </div>
  );
};

export default HistoryView;
