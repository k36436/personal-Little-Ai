
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView } from '../types';
import { AppSettings } from '../App';
import { getVaultUsage, wipeVault } from '../services/storageService';

interface SettingsViewProps {
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout, onOpenAuth, settings, onUpdateSettings, onViewChange, onPlaySound }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'studio' | 'storage' | 'account'>('appearance');
  const [storageStats, setStorageStats] = useState({ used: 0, total: 107374182400 });
  const [customWallInput, setCustomWallInput] = useState(settings.customWallpaper || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    updateStorageStats();
  }, []);

  const triggerWallpaperUpdate = useCallback((url: string) => {
    const trimmedUrl = url.trim();
    if (trimmedUrl.toLowerCase().startsWith('http') || trimmedUrl.startsWith('data:image')) {
      setIsSyncing(true);
      onUpdateSettings({ 
        ...settings, 
        wallpaper: 'custom', 
        customWallpaper: trimmedUrl 
      });
      setTimeout(() => setIsSyncing(false), 300);
    }
  }, [onUpdateSettings, settings]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData('text');
    if (pastedData.toLowerCase().startsWith('http')) {
      onPlaySound?.('click');
      setCustomWallInput(pastedData);
      triggerWallpaperUpdate(pastedData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPlaySound?.('click');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomWallInput('Local Image Loaded');
        triggerWallpaperUpdate(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const update = (changes: Partial<AppSettings>) => {
    onPlaySound?.('click');
    onUpdateSettings({ ...settings, ...changes });
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const updateStorageStats = async () => {
    const stats = await getVaultUsage();
    setStorageStats(stats);
  };

  return (
    <div className="h-full overflow-y-auto p-10 md:p-16 custom-scrollbar bg-transparent relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => { onPlaySound?.('click'); onViewChange(AppView.CHAT); }}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-5xl mx-auto space-y-16 pb-20 pt-20">
        <header className="border-b border-white/5 pb-10 flex items-end justify-between">
          <div>
            <h2 className="text-5xl font-black text-primary tracking-tighter">System Engine</h2>
            <p className="text-secondary text-[10px] mt-3 uppercase tracking-widest font-black opacity-40">User Interface Protocol: {user?.username || 'Guest'}</p>
          </div>
          <div className="w-16 h-1 bg-pink-500 rounded-full shadow-[0_0_15px_#ec4899]"></div>
        </header>

        <nav className="flex flex-wrap gap-2 p-1 rounded-[2.5rem] border border-white/10 glass-panel shadow-2xl w-fit">
           {['general', 'appearance', 'studio', 'storage', 'account'].map(tab => (
             <button 
                key={tab} 
                onClick={() => { onPlaySound?.('click'); setActiveTab(tab as any); }} 
                className={`px-6 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-pink-600 text-white shadow-xl scale-105' : 'text-secondary hover:text-primary'}`}
             >
                {tab}
             </button>
           ))}
        </nav>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {activeTab === 'appearance' && (
            <div className="space-y-10">
              <div className="glass-panel border rounded-[3rem] p-12 space-y-10 shadow-4xl">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black text-primary tracking-tight">Wallpaper Architecture</h3>
                   <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.4em]">Background Control</span>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                 <div className="space-y-1">
                    <h3 className="text-xl font-bold text-primary">Neural Luminance</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Switch between Light and Dark core themes</p>
                 </div>
                 <div className="flex items-center space-x-4">
                   <i className={`fas fa-sun text-lg transition-colors ${!settings.darkMode ? 'text-yellow-500' : 'text-secondary'}`}></i>
                   <button onClick={() => update({ darkMode: !settings.darkMode })} className={`w-14 h-7 rounded-full transition-all relative ${settings.darkMode ? 'bg-pink-600 shadow-[0_0_15px_var(--accent)]' : 'bg-gray-300'}`}>
                     <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`}></div>
                   </button>
                   <i className={`fas fa-moon text-lg transition-colors ${settings.darkMode ? 'text-pink-500' : 'text-secondary'}`}></i>
                 </div>
               </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-10">
                  {[
                    {id: 'petals', label: 'Sakura'}, 
                    {id: 'cyber', label: 'Cyber'}, 
                    {id: 'galaxy', label: 'Void'}, 
                    {id: 'aurora', label: 'Ethereal'}, 
                    {id: 'none', label: 'Dark'}
                  ].map(wp => (
                    <button 
                      key={wp.id} 
                      onClick={() => update({ wallpaper: wp.id as any })}
                      className={`py-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${settings.wallpaper === wp.id ? 'bg-pink-600 border-pink-400 text-white' : 'border-white/5 text-secondary hover:text-primary'}`}
                    >
                      {wp.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-6 pt-10 border-t border-white/5">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[11px] font-black text-primary uppercase tracking-[0.4em] block italic">Change Chat Background: Paste Link or Browse</label>
                    {isSyncing && (
                      <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest animate-pulse">Establishing Signal...</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 flex flex-col space-y-6">
                      <div className="flex space-x-4 bg-black/5 p-3 rounded-[2rem] border border-white/10 backdrop-blur-3xl focus-within:border-pink-500/50 transition-all shadow-4xl">
                        <input 
                          type="text" 
                          value={customWallInput}
                          onPaste={handlePaste}
                          onChange={(e) => setCustomWallInput(e.target.value)}
                          placeholder="PASTE IMAGE URL HERE..."
                          className="flex-1 bg-transparent border-none rounded-xl px-6 py-4 text-primary focus:outline-none text-[11px] font-black tracking-widest uppercase placeholder:text-secondary opacity-80"
                        />
                        <button 
                          onClick={() => triggerWallpaperUpdate(customWallInput)}
                          className="px-10 bg-pink-500/10 hover:bg-pink-600 text-pink-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all shadow-xl"
                        >
                          Apply Link
                        </button>
                      </div>

                      <div className="flex space-x-4">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 bg-black/5 hover:bg-black text-primary hover:text-white border border-white/10 rounded-[2rem] py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center space-x-4 shadow-2xl"
                        >
                          <i className="fas fa-folder-open text-lg"></i>
                          <span>Browse My System Picture</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                      </div>
                    </div>

                    <div className="w-full md:w-80 h-56 rounded-[3rem] border border-white/20 overflow-hidden bg-black/20 relative group shadow-4xl">
                      {settings.customWallpaper ? (
                        <img 
                          src={settings.customWallpaper} 
                          alt="preview" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                          <i className="fas fa-image text-5xl text-secondary"></i>
                          <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Awaiting Picture Signal</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
