
import React, { useState, useEffect } from 'react';
import { searchWithGemini, searchWithMaps } from '../services/geminiService';
import { SearchResult, AppView } from '../types';

const SEARCH_HISTORY_KEY = 'little_ai_search_history';
const MAX_HISTORY_ITEMS = 12;

interface MapSource extends SearchResult {
  isMap?: boolean;
  reviews?: string[];
}

interface SearchViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const SearchView: React.FC<SearchViewProps> = ({ onViewChange, onPlaySound }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<MapSource[]>([]);
  const [history, setHistory] = useState<{ query: string; timestamp: number }[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [mapMode, setMapMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  const addToHistory = (newQuery: string) => {
    const trimmedQuery = newQuery.trim();
    if (!trimmedQuery) return;

    setHistory(prev => {
      const filtered = prev.filter(item => item.query.toLowerCase() !== trimmedQuery.toLowerCase());
      const updated = [{ query: trimmedQuery, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (queryToRemove: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.query !== queryToRemove);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setShowClearConfirm(false);
  };

  const toggleMapMode = () => {
    if (!mapMode) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setMapMode(true);
          setLoading(false);
        },
        (err) => {
          console.error("Location access denied", err);
          alert("Location access is required for Map Grounding. Please enable it in your browser.");
          setLoading(false);
        }
      );
    } else {
      setMapMode(false);
      setUserLocation(null);
    }
  };

  const handleSearch = async (overrideQuery?: string) => {
    const searchTarget = overrideQuery || query;
    if (!searchTarget.trim() || loading) return;

    onPlaySound?.('click');
    setLoading(true);
    setAnswer('');
    setSources([]);
    
    if (!overrideQuery) {
      setQuery(searchTarget);
    } else {
      setQuery(overrideQuery);
    }

    try {
      const response = mapMode 
        ? await searchWithMaps(searchTarget, userLocation || undefined)
        : await searchWithGemini(searchTarget);

      setAnswer(response.text || "No results found.");
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources: MapSource[] = [];
      
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          extractedSources.push({
            title: chunk.web.title || 'Source',
            uri: chunk.web.uri,
            isMap: false
          });
        }
        if (chunk.maps) {
          extractedSources.push({
            title: chunk.maps.title || 'Place Detail',
            uri: chunk.maps.uri,
            isMap: true,
            reviews: chunk.maps.placeAnswerSources?.[0]?.reviewSnippets
          });
        }
      });

      const uniqueSources = Array.from(new Set(extractedSources.map(s => s.uri)))
        .map(uri => extractedSources.find(s => s.uri === uri) as MapSource);
      
      setSources(uniqueSources);
      addToHistory(searchTarget);
    } catch (e) {
      setAnswer("Search failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar bg-transparent relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-12 pt-20">
        
        {/* Header Section */}
        <div className="text-center space-y-4 pt-10">
          <div className={`inline-flex items-center px-6 py-2 ${mapMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20'} border rounded-full mb-2 backdrop-blur-3xl shadow-2xl`}>
            <div className={`w-2 h-2 rounded-full mr-3 ${mapMode ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`}></div>
            <span className={`text-[10px] font-black ${mapMode ? 'text-blue-500' : 'text-green-500'} uppercase tracking-[0.3em]`}>
              {mapMode ? 'Local Intelligence Engaged' : 'Neural Grounding Online'}
            </span>
          </div>
          <h2 className="text-6xl font-black tracking-tighter text-white leading-[0.9]">
            {mapMode ? 'Location Discovery' : 'Web Intelligence'}
          </h2>
          <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed opacity-60">
            {mapMode 
              ? 'Hyper-Local Search Protocol Active' 
              : 'Global Knowledge Synchronization Layer'}
          </p>
        </div>

        {/* Search Input Area */}
        <div className="space-y-10">
          <div className="relative group">
            <div className={`absolute -inset-2 bg-gradient-to-r ${mapMode ? 'from-blue-600/30 to-purple-600/30' : 'from-green-600/30 to-blue-600/30'} rounded-[3rem] blur-2xl opacity-20 group-focus-within:opacity-40 transition duration-1000`}></div>
            <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-[3.5rem] shadow-4xl p-2 backdrop-blur-3xl focus-within:border-white/20 transition-all duration-500">
              <button 
                onClick={toggleMapMode}
                className={`w-16 h-16 flex items-center justify-center rounded-[2rem] transition-all ${mapMode ? 'bg-blue-600 text-white shadow-2xl scale-105' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                title={mapMode ? "Switch to Web" : "Switch to Local"}
              >
                <i className={`fas ${mapMode ? 'fa-location-dot' : 'fa-globe-americas'} text-lg`}></i>
              </button>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={mapMode ? "Search nearby..." : "Query the web..."}
                className="flex-1 bg-transparent border-none text-white px-6 py-6 focus:outline-none text-xl placeholder:text-gray-800 font-medium"
              />
              <button 
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className={`${mapMode ? 'bg-blue-600' : 'bg-green-600'} disabled:bg-gray-800 disabled:text-gray-600 text-white h-16 px-12 rounded-[2.2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-2xl flex items-center justify-center`}
              >
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Execute'}
              </button>
            </div>
          </div>

          {/* Improved History Section */}
          {history.length > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="flex items-center justify-between px-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <i className="fas fa-clock-rotate-left text-[10px] text-gray-600"></i>
                  </div>
                  <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Recent Knowledge Queries</h3>
                </div>
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[9px] font-black text-gray-700 hover:text-red-500 uppercase tracking-widest transition-all px-4 py-2 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/10"
                >
                  <i className="fas fa-trash-can text-[9px] mr-2"></i>
                  <span>Purge All</span>
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3 px-2">
                {history.map((item, index) => (
                  <div 
                    key={index}
                    className="group flex items-center bg-white/[0.03] border border-white/5 rounded-2xl pl-5 pr-2 py-3 hover:bg-white/[0.06] hover:border-white/20 transition-all shadow-xl animate-in fade-in slide-in-from-left-2 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <button 
                      className="flex items-center text-left"
                      onClick={() => handleSearch(item.query)}
                    >
                      <span className="text-[13px] font-bold text-gray-400 group-hover:text-white transition-colors max-w-[200px] truncate">
                        {item.query}
                      </span>
                      <i className="fas fa-arrow-up-right-from-square text-[9px] text-blue-500/0 group-hover:text-blue-500/100 ml-3 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></i>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromHistory(item.query); }}
                      className="ml-4 w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center text-gray-800 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Display */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-8 animate-pulse">
            <div className="relative">
               <div className={`w-20 h-20 border-4 ${mapMode ? 'border-blue-500/10 border-t-blue-500' : 'border-green-500/10 border-t-green-500'} rounded-[2.5rem] animate-spin`}></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <i className={`fas ${mapMode ? 'fa-location-dot' : 'fa-satellite'} ${mapMode ? 'text-blue-500/40' : 'text-green-500/40'} text-xl`}></i>
               </div>
            </div>
            <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.5em]">{mapMode ? 'Triangulating Maps Data' : 'Querying Global Web Layer'}</p>
          </div>
        ) : answer ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-12 shadow-4xl relative overflow-hidden backdrop-blur-3xl">
               <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-12">
                 <i className={`fas ${mapMode ? 'fa-location-dot' : 'fa-brain'} text-[15rem]`}></i>
               </div>
               <div className="flex items-center space-x-4 mb-10">
                 <div className={`w-3 h-3 rounded-full ${mapMode ? 'bg-blue-400 shadow-[0_0_10px_#60a5fa]' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`}></div>
                 <h3 className={`text-[10px] font-black ${mapMode ? 'text-blue-400' : 'text-green-500'} uppercase tracking-[0.5em]`}>
                   Synthesis Protocol: Finalized
                 </h3>
               </div>
               <p className="text-gray-100 text-[18px] leading-relaxed whitespace-pre-wrap relative z-10 font-medium selection:bg-white/10">{answer}</p>
            </div>

            {sources.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 px-8">
                   <div className="h-[1px] flex-1 bg-white/5"></div>
                   <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em]">Neural Link Verification</h3>
                   <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-4">
                  {sources.map((source, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-col bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] rounded-[2.5rem] transition-all group shadow-2xl overflow-hidden"
                    >
                      <a 
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-8"
                      >
                        <div className={`w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center ${source.isMap ? 'text-blue-500' : 'text-green-500'} mr-6 border border-white/5`}>
                          <i className={`fas ${source.isMap ? 'fa-map-pin' : 'fa-link'} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-100 truncate group-hover:text-white transition-colors uppercase tracking-tight">{source.title}</p>
                          <p className="text-[10px] text-gray-600 truncate font-mono mt-1 opacity-50">{source.uri}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-800 group-hover:text-blue-500 transition-all">
                          <i className="fas fa-external-link-alt text-xs"></i>
                        </div>
                      </a>
                      
                      {source.reviews && source.reviews.length > 0 && (
                        <div className="px-8 pb-8 pt-0">
                           <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                              <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-3">Community Intelligence</p>
                              <p className="text-[12px] text-gray-400 italic leading-relaxed">"{source.reviews[0]}"</p>
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Re-designed Purge Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-[3.5rem] p-12 space-y-10 shadow-[0_0_100px_rgba(239,68,68,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-pink-600 to-red-600"></div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-500 mb-2 border border-red-500/20 shadow-2xl shadow-red-500/10">
                <i className="fas fa-biohazard text-3xl"></i>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Purge Neural Nodes?</h3>
                <p className="text-gray-500 text-[10px] leading-relaxed uppercase tracking-widest font-black opacity-60">
                  This action will permanently scrub all search signatures from your local sandbox.
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <button 
                onClick={clearHistory}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl shadow-red-900/40 uppercase tracking-[0.3em] text-[10px]"
              >
                Confirm Purge
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white font-black py-6 rounded-[2rem] transition-all uppercase tracking-[0.3em] text-[10px] border border-white/5"
              >
                Abort Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchView;
