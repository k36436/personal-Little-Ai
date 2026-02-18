
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, ChatSession, User, MemoryEntry } from './types';
import Sidebar from './components/Sidebar';
import ChatView from './views/ChatView';
import VisionView from './views/VisionView';
import LiveView from './views/LiveView';
import SearchView from './views/SearchView';
import VideoView from './views/VideoView';
import ImageView from './views/ImageView';
import DrawingView from './views/DrawingView';
import MindMapView from './views/MindMapView';
import FlowchartView from './views/FlowchartView';
import FileAnalysisView from './views/FileAnalysisView';
import HistoryView from './views/HistoryView';
import SettingsView from './views/SettingsView';
import AuthModal from './components/AuthModal';
import CodeView from './views/CodeView';
import VaultExplorerView from './views/VaultExplorerView';
import VideoToLyricsView from './views/VideoToLyricsView';
import AppBuilderView from './views/AppBuilderView';
import AppAnalystView from './views/AppAnalystView';
import ApiArchitectView from './views/ApiArchitectView';

export interface AppSettings {
  highPerformance: boolean;
  sweetheartMode: boolean; 
  wallpaper: 'none' | 'cyber' | 'galaxy' | 'aurora' | 'custom' | 'petals';
  customWallpaper?: string;
  accentColor: 'rose' | 'sky' | 'emerald' | 'amber' | 'purple';
  buttonStyle: 'rounded' | 'square' | 'pill' | 'neon' | 'glass';
  soundEffects: boolean;
  soundVolume: number;
  glassIntensity: number;
  blurIntensity: number;
  showPetals: boolean;
  darkMode: boolean;
}

export interface BuilderState {
  prompt: string;
  code: string | null;
  loading: boolean;
  platform: 'android' | 'ios';
}

const WALLPAPER_PRESETS = {
  petals: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2076&auto=format&fit=crop',
  cyber: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
  galaxy: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2111&auto=format&fit=crop',
  aurora: 'https://images.unsplash.com/photo-1531366930477-d9cd0c7d51a4?q=80&w=2070&auto=format&fit=crop',
  none: ''
};

const SOUNDS = {
  click: 'https://www.soundjay.com/buttons/sounds/button-16.mp3',
  settings: 'https://www.soundjay.com/buttons/sounds/button-3.mp3',
  scroll: 'https://www.soundjay.com/buttons/sounds/button-20.mp3',
  outside: 'https://www.soundjay.com/buttons/sounds/button-10.mp3'
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [systemTime, setSystemTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState<'stable' | 'error'>('stable');
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'signin' | 'signup'; mandatory?: boolean }>({ 
    open: false, 
    mode: 'signin' 
  });

  const [builderState, setBuilderState] = useState<BuilderState>({
    prompt: '',
    code: null,
    loading: false,
    platform: 'android'
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('little_ai_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse settings", e); }
    }
    return {
      highPerformance: true,
      sweetheartMode: true,
      wallpaper: 'petals',
      accentColor: 'rose',
      buttonStyle: 'glass',
      soundEffects: true,
      soundVolume: 0.1,
      glassIntensity: 0.05,
      blurIntensity: 60,
      showPetals: true,
      darkMode: false
    };
  });

  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (!settings.soundEffects) return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = settings.soundVolume;
    audio.play().catch(() => {});
  }, [settings.soundEffects, settings.soundVolume]);

  useEffect(() => {
    localStorage.setItem('little_ai_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getWallpaperUrl = () => {
    if (settings.wallpaper === 'custom' && settings.customWallpaper) {
      return settings.customWallpaper;
    }
    return WALLPAPER_PRESETS[settings.wallpaper as keyof typeof WALLPAPER_PRESETS] || '';
  };

  const renderView = () => {
    const props = { 
      activeSessionId, setActiveSessionId, sessions, setSessions, onViewChange: (v: AppView) => { playSound('click'); setCurrentView(v); }, 
      user, settings, memories, 
      onSaveMemory: (content: string) => setMemories(prev => [{id: Date.now().toString(), content, timestamp: Date.now()}, ...prev].slice(0, 50)),
      systemTime, onApiError: () => setApiStatus('error'),
      onPlaySound: playSound
    };
    
    switch (currentView) {
      case AppView.CHAT: return <ChatView {...props} />;
      case AppView.SETTINGS: return <SettingsView user={user} onLogout={() => { playSound('click'); setUser(null); }} onOpenAuth={() => { playSound('settings'); setAuthModal({ open: true, mode: 'signin' }); }} settings={settings} onUpdateSettings={setSettings} onPlaySound={playSound} onViewChange={props.onViewChange} />;
      case AppView.CODE: return <CodeView {...props} />;
      case AppView.VISION: return <VisionView {...props} />;
      case AppView.IMAGE: return <ImageView {...props} />;
      case AppView.DRAWING: return <DrawingView {...props} />;
      case AppView.MINDMAP: return <MindMapView {...props} />;
      case AppView.FLOWCHART: return <FlowchartView {...props} />;
      case AppView.FILE_ANALYSIS: return <FileAnalysisView {...props} />;
      case AppView.LIVE: return <LiveView memories={memories} onSaveMemory={props.onSaveMemory} sweetheartMode={settings.sweetheartMode} />;
      case AppView.SEARCH: return <SearchView {...props} />;
      case AppView.VIDEO: return <VideoView {...props} />;
      case AppView.VAULT_EXPLORER: return <VaultExplorerView {...props} />;
      case AppView.VIDEO_TO_LYRICS: return <VideoToLyricsView {...props} />;
      case AppView.APP_BUILDER: return <AppBuilderView {...props} builderState={builderState} setBuilderState={setBuilderState} />;
      case AppView.APP_ANALYST: return <AppAnalystView {...props} />;
      case AppView.API_ARCHITECT: return <ApiArchitectView {...props} />;
      case AppView.HISTORY: return <HistoryView sessions={sessions} onSelect={(id) => { playSound('click'); setActiveSessionId(id); setCurrentView(AppView.CHAT); }} onDelete={(id) => { playSound('outside'); setSessions(sessions.filter(s => s.id !== id)); }} onViewChange={props.onViewChange} onPlaySound={playSound} />;
      default: return <ChatView {...props} />;
    }
  };

  return (
    <div className={`flex h-screen w-screen transition-all duration-700 overflow-hidden relative theme-${settings.accentColor} ${settings.darkMode ? 'theme-dark' : 'theme-light'}`}>
      
      {settings.wallpaper !== 'none' && (
        <div 
          className="universal-wallpaper fixed inset-0 z-[-10]" 
          style={{ 
            backgroundImage: `url('${getWallpaperUrl()}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.8, 
            transition: 'background-image 1s ease-in-out'
          }} 
        />
      )}
      
      <div className="fixed inset-0 z-[-9] bg-overlay pointer-events-none transition-all duration-700"></div>

      <Sidebar 
        currentView={currentView} 
        onViewChange={(v) => { playSound('click'); setCurrentView(v); }} 
        sessions={sessions} 
        activeSessionId={activeSessionId}
        onSelectSession={(id) => { playSound('click'); setActiveSessionId(id); setCurrentView(AppView.CHAT); }}
        onNewChat={() => { 
          playSound('click'); 
          setActiveSessionId(null); 
          setCurrentView(AppView.CHAT); 
        }}
        user={user} 
        onLogout={() => { playSound('click'); setUser(null); }} 
        onOpenAuth={(mode) => { playSound('settings'); setAuthModal({ open: true, mode, mandatory: false }); }}
        settings={settings} 
        systemTime={systemTime} 
        apiStatus={apiStatus} 
        onPlaySettings={() => playSound('settings')}
      />

      <main className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden z-10 ml-24 bg-transparent text-primary">
        {renderView()}
      </main>

      {authModal.open && <AuthModal initialMode={authModal.mode} isMandatory={authModal.mandatory} onClose={() => { playSound('click'); setAuthModal({ ...authModal, open: false }); }} onLogin={(u) => { playSound('click'); setUser(u); localStorage.setItem('little_ai_active_user', JSON.stringify(u)); setAuthModal({ ...authModal, open: false }); }} />}
      
      <style>{`
        :root { 
          --accent: #ec4899; 
          --accent-rgb: 236, 72, 153; 
        }
        
        .theme-dark {
          --text-primary: #ffffff;
          --text-secondary: rgba(255, 255, 255, 0.6);
          --glass-bg: rgba(0, 0, 0, 0.12);
          --glass-border: rgba(255, 255, 255, 0.08);
          --bg-overlay: rgba(0, 0, 0, 0.4);
        }

        .theme-light {
          --text-primary: #1a1a1a;
          --text-secondary: rgba(0, 0, 0, 0.6);
          --glass-bg: rgba(255, 255, 255, 0.1);
          --glass-border: rgba(0, 0, 0, 0.05);
          --bg-overlay: rgba(255, 255, 255, 0.1);
        }

        .glass-panel {
          background-color: var(--glass-bg);
          border-color: var(--glass-border);
          backdrop-filter: blur(40px) saturate(1.8);
          border-width: 1px;
        }

        .bg-overlay { background-color: var(--bg-overlay); }

        .sidebar-active {
          background-color: var(--accent);
          color: white !important;
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.4);
        }

        body, #root { 
          background: transparent !important; 
        }

        .universal-wallpaper {
          filter: brightness(0.9) contrast(1.1);
          animation: wallPulse 25s infinite alternate ease-in-out;
        }
        @keyframes wallPulse {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default App;
