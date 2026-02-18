
import React, { useState, useEffect, useMemo } from 'react';
import { getFromVault } from '../services/storageService';
import { AppView } from '../types';

interface VaultItem {
  id: string;
  title?: string;
  prompt?: string;
  content?: string; 
  code?: string;
  lang?: string;
  timestamp: number;
  type: 'image' | 'doc' | 'code' | 'video' | 'app' | 'analysis';
  folderId: string;
  subCategory?: string;
}

interface VaultExplorerViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const VaultExplorerView: React.FC<VaultExplorerViewProps> = ({ onViewChange, onPlaySound }) => {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [allData, setAllData] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const folderConfigs = [
    { id: 'app_builds', name: 'App Build', icon: 'fa-cube', color: 'text-emerald-400', bg: 'bg-emerald-400/5', vaultKeys: ['neural_app_vault'] },
    { id: 'app_analysis', name: 'App Analysis', icon: 'fa-microchip', color: 'text-blue-400', bg: 'bg-blue-400/5', vaultKeys: ['neural_apk_analysis_history'] },
    { id: 'images', name: 'Visual Assets', icon: 'fa-images', color: 'text-rose-500', bg: 'bg-rose-500/5', vaultKeys: ['neural_image_gallery', 'neural_drawing_gallery'] },
    { id: 'docs', name: 'File Analysis', icon: 'fa-file-signature', color: 'text-blue-500', bg: 'bg-blue-500/5', vaultKeys: ['neural_analysis_history'] },
    { id: 'code', name: 'Source Repositories', icon: 'fa-code-branch', color: 'text-emerald-500', bg: 'bg-emerald-500/5', vaultKeys: ['neural_code_repo', 'neural_api_vault'] },
    { id: 'video', name: 'Motion Media', icon: 'fa-film', color: 'text-amber-500', bg: 'bg-amber-500/5', vaultKeys: ['neural_video_history'] },
  ];

  useEffect(() => {
    fetchAllVaultData();
  }, []);

  const fetchAllVaultData = async () => {
    setLoading(true);
    const aggregated: VaultItem[] = [];
    
    const promises = folderConfigs.flatMap(config => 
      config.vaultKeys.map(async key => {
        try {
          const data = await getFromVault(key);
          if (Array.isArray(data)) {
            return data.map((item: any) => ({
              id: item.id || Math.random().toString(),
              timestamp: item.timestamp || Date.now(),
              folderId: config.id,
              type: config.id as any,
              content: item.content || item.uri || item.code,
              prompt: item.prompt,
              title: item.title,
              code: item.code,
              lang: item.lang || item.stack,
              subCategory: item.subCategory || (key === 'neural_api_vault' ? 'API' : undefined)
            }));
          }
        } catch (e) { return []; }
        return [];
      })
    );

    const results = await Promise.all(promises);
    results.forEach(res => { if(res) aggregated.push(...res); });
    
    setAllData(aggregated.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    let base = activeFolderId ? allData.filter(i => i.folderId === activeFolderId) : allData;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(item => 
      (item.prompt?.toLowerCase().includes(q)) || 
      (item.title?.toLowerCase().includes(q)) || 
      (item.lang?.toLowerCase().includes(q))
    );
  }, [allData, activeFolderId, searchQuery]);

  const activeConfig = folderConfigs.find(c => c.id === activeFolderId);

  const handleBack = () => {
    onPlaySound?.('click');
    if (activeFolderId) setActiveFolderId(null);
    else onViewChange(AppView.CHAT);
  };

  return (
    <div className="h-full w-full bg-transparent p-10 overflow-hidden flex flex-col animate-in fade-in duration-500 relative">
      <button 
        onClick={handleBack}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          {activeFolderId ? 'Back to Vault' : 'Return to Link'}
        </span>
      </button>

      <div className="mb-10 space-y-6 pt-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h2 className="text-6xl font-black text-white tracking-tighter">
              {activeConfig ? activeConfig.name : 'Neural Vault'}
            </h2>
            <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.5em] mt-4">
               {allData.length} Nodes Indexed
            </p>
          </div>

          <div className="relative group w-80">
            <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-pink-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        {!activeFolderId && !searchQuery ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {folderConfigs.map((folder) => {
              const itemCount = allData.filter(i => i.folderId === folder.id).length;
              return (
                <button 
                  key={folder.id} 
                  onClick={() => { onPlaySound?.('click'); setActiveFolderId(folder.id); }}
                  className="group relative bg-white/[0.02] border border-white/5 rounded-[4rem] p-12 text-left hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 h-80 flex flex-col shadow-4xl overflow-hidden"
                >
                  <i className={`fas ${folder.icon} text-[18rem] absolute -top-12 -right-12 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-1000`}></i>
                  <div className={`w-20 h-20 rounded-[2rem] ${folder.bg} border border-white/5 flex items-center justify-center ${folder.color} mb-10 shadow-inner group-hover:scale-110 transition-transform`}>
                    <i className={`fas ${folder.icon} text-2xl`}></i>
                  </div>
                  <div className="mt-auto">
                    <h3 className="text-3xl font-black text-white tracking-tight mb-4">{folder.name}</h3>
                    <div className="flex items-center space-x-4">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${folder.color}`}>{itemCount} Assets</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                       <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Secured Partition</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => { onPlaySound?.('click'); setPreviewItem(item); }}
                className="group bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 cursor-pointer hover:border-white/30 hover:bg-white/[0.04] transition-all flex flex-col aspect-[4/5] shadow-2xl"
              >
                <div className="flex-1 rounded-[1.5rem] bg-black/40 overflow-hidden mb-6 border border-white/5 relative">
                  {item.folderId === 'images' ? <img src={item.content} className="w-full h-full object-cover" alt="thumb" /> :
                   <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                     <i className={`fas ${item.folderId === 'code' ? 'fa-code' : item.folderId === 'video' ? 'fa-film' : item.folderId === 'app_builds' ? 'fa-cube' : item.folderId === 'app_analysis' ? 'fa-microchip' : 'fa-file-lines'} text-4xl`}></i>
                   </div>}
                </div>
                <p className="text-[12px] font-black text-white truncate uppercase tracking-tight mb-1">{item.prompt || item.title || 'Neural Node'}</p>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">{item.subCategory || item.lang || 'Archive'}</p>
                <div className="flex items-center justify-between opacity-30 text-[9px] font-black uppercase tracking-widest">
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  <span>ID: {item.id.slice(-4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewItem && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-10 animate-in fade-in duration-300">
           <div className="w-full max-w-5xl bg-[#080808] rounded-[4rem] border border-white/10 shadow-4xl flex flex-col max-h-[90vh] overflow-hidden relative">
              <button onClick={() => { onPlaySound?.('outside'); setPreviewItem(null); }} className="absolute top-10 right-10 w-16 h-16 rounded-[1.8rem] bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center z-10">
                <i className="fas fa-times text-xl"></i>
              </button>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-16 md:p-24">
                 <div className="max-w-3xl mx-auto space-y-12">
                    <div>
                       <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.5em] mb-4 block">Archive Record</span>
                       <h2 className="text-4xl font-black text-white tracking-tighter leading-tight mb-4">
                         {previewItem.prompt || previewItem.title || 'Neural Asset'}
                       </h2>
                       <div className="flex items-center space-x-6">
                         <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{previewItem.subCategory}</p>
                         <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                         <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Logged: {new Date(previewItem.timestamp).toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="bg-black/40 rounded-[3rem] border border-white/5 overflow-hidden shadow-inner">
                       {previewItem.folderId === 'images' ? <img src={previewItem.content} className="w-full h-auto" alt="p" /> :
                        previewItem.folderId === 'code' || previewItem.folderId === 'app_builds' ? <pre className="p-12 text-emerald-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">{previewItem.code || previewItem.content}</pre> :
                        previewItem.folderId === 'video' ? <video src={previewItem.content} controls autoPlay className="w-full" /> :
                        <div className="p-12 text-gray-200 text-lg leading-loose whitespace-pre-wrap">{previewItem.content}</div>}
                    </div>
                    <button onClick={() => { onPlaySound?.('outside'); setPreviewItem(null); }} className="w-full bg-white text-black font-black py-6 rounded-[2rem] uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] transition-all">Close Record</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default VaultExplorerView;
