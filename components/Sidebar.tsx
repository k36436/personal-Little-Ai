
import React, { useState } from 'react';
import { AppView, ChatSession, User } from '../types';
import { AppSettings } from '../App';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  settings: AppSettings;
  systemTime: Date;
  apiStatus?: 'stable' | 'error';
  onPlaySettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  user,
  onOpenAuth,
  onNewChat,
  systemTime,
  apiStatus = 'stable',
  onPlaySettings,
  settings,
  sessions,
  activeSessionId,
  onSelectSession
}) => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  const specializedTools = [
    { view: AppView.API_ARCHITECT, icon: 'fa-server', label: 'API Architect' },
    { view: AppView.APP_BUILDER, icon: 'fa-cube', label: 'App Builder' },
    { view: AppView.APP_ANALYST, icon: 'fa-shield-halved', label: 'App Analyst' },
    { view: AppView.VAULT_EXPLORER, icon: 'fa-vault', label: 'Neural Vault' },
    { view: AppView.IMAGE, icon: 'fa-paintbrush', label: 'Image Lab' },
    { view: AppView.CODE, icon: 'fa-code', label: 'Code Master' },
    { view: AppView.LIVE, icon: 'fa-microphone-lines', label: 'Voice Sync' },
    { view: AppView.VISION, icon: 'fa-eye', label: 'Vision Hub' },
    { view: AppView.SEARCH, icon: 'fa-globe', label: 'Web Intelligence' },
    { view: AppView.VIDEO, icon: 'fa-film', label: 'Video Render' },
  ];

  const handleToolClick = (view: AppView) => {
    onViewChange(view);
    setIsToolsExpanded(false);
  };

  const handleSettingsClick = () => {
    onPlaySettings?.();
    onViewChange(AppView.SETTINGS);
  };

  const iconColorClass = settings.darkMode ? 'text-white/80 hover:text-white' : 'text-black/80 hover:text-black';

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-24 border-r border-white/10 flex flex-col items-center py-10 z-[120] bg-transparent transition-all duration-700">
        <button 
          onClick={() => { setIsToolsExpanded(!isToolsExpanded); onPlaySettings?.(); }}
          className={`w-14 h-14 flex items-center justify-center transition-all duration-300 mb-10 rounded-2xl ${
            isToolsExpanded ? 'sidebar-active text-white shadow-2xl' : `${iconColorClass} bg-white/10 backdrop-blur-3xl border border-white/5`
          }`}
        >
          <i className={`fas ${isToolsExpanded ? 'fa-times' : 'fa-grid-2'} text-sm`}></i>
        </button>

        <div className="flex-1 w-full flex flex-col items-center space-y-6 overflow-y-auto no-scrollbar py-4">
          <button 
            onClick={onNewChat} 
            title="New Neural Link" 
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${!activeSessionId && currentView === AppView.CHAT ? 'sidebar-active text-white' : `${iconColorClass} bg-white/10 backdrop-blur-2xl border border-white/5`}`}
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
          
          <div className="w-8 h-[1px] bg-white/10 rounded-full my-2"></div>

          {sessions.slice(0, 8).map((session) => (
            <button 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              title={session.title || 'Untitled Link'}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all group relative ${
                activeSessionId === session.id && currentView === AppView.CHAT 
                  ? 'sidebar-active text-white' 
                  : `${iconColorClass} bg-white/5 border border-white/5 hover:bg-white/10`
              }`}
            >
              <i className="far fa-message text-[10px]"></i>
              <div className="absolute left-full ml-4 px-3 py-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-[200]">
                {session.title || 'Untitled Link'}
              </div>
            </button>
          ))}

          <button 
            onClick={() => onViewChange(AppView.HISTORY)} 
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${currentView === AppView.HISTORY ? 'sidebar-active text-white' : `${iconColorClass} bg-white/10 backdrop-blur-2xl border border-white/5`}`}
          >
            <i className="fas fa-history text-xs"></i>
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center space-y-6 pt-4">
          <div className="flex flex-col items-center space-y-1">
             <div className={`w-2 h-2 rounded-full ${apiStatus === 'stable' ? 'bg-green-600 animate-pulse shadow-[0_0_10px_#16a34a]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} title={apiStatus === 'stable' ? 'Neural Link Stable' : 'Neural Link Interrupted'}></div>
             <div className={`text-[7px] font-black uppercase tracking-widest ${settings.darkMode ? 'text-gray-300' : 'text-black/60'}`}>{apiStatus === 'stable' ? 'Sync' : 'Fail'}</div>
          </div>

          <div className={`text-[10px] font-black mb-2 ${settings.darkMode ? 'text-gray-300' : 'text-black/60'}`}>
            {systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={handleSettingsClick} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${currentView === AppView.SETTINGS ? 'sidebar-active text-white' : `${iconColorClass} bg-white/10 backdrop-blur-2xl border border-white/5`}`}>
            <i className="fas fa-sliders text-xs"></i>
          </button>
          <button 
            onClick={() => user ? handleSettingsClick() : onOpenAuth('signin')}
            className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20 shadow-xl hover:scale-110 transition-transform"
          >
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`} alt="avatar" />
          </button>
        </div>
      </aside>

      <div className={`fixed left-24 top-0 bottom-0 bg-transparent backdrop-blur-[60px] border-r border-white/10 transition-all duration-500 z-[110] ${isToolsExpanded ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
        <div className="w-64 p-10 flex flex-col h-full overflow-y-auto no-scrollbar">
          <h2 className="text-[10px] font-black text-pink-600 uppercase tracking-[0.5em] mb-12">Neural Instruments</h2>
          <div className="flex-1 space-y-3">
            {specializedTools.map((tool, idx) => (
              <button
                key={idx}
                onClick={() => handleToolClick(tool.view)}
                className={`w-full flex items-center space-x-5 p-4 rounded-2xl transition-all ${
                  currentView === tool.view ? 'sidebar-active text-white shadow-xl' : `${iconColorClass} hover:bg-white/10`
                }`}
              >
                <i className={`fas ${tool.icon} text-xs w-6`}></i>
                <span className="text-[11px] font-black uppercase tracking-widest">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
