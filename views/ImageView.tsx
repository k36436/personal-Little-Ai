
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { saveToVault, getFromVault } from '../services/storageService';
import { AppView } from '../types';

interface ImageViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const ImageView: React.FC<ImageViewProps> = ({ onViewChange, onPlaySound }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      checkKey();
      const savedHistory = await getFromVault('neural_image_gallery');
      if (savedHistory) setHistory(savedHistory);
    };
    loadData();
  }, []);

  const checkKey = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      setHasKey(true); 
    }
  };

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true); 
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    if (isHighQuality && !hasKey) {
      handleOpenKeySelector();
      return;
    }

    onPlaySound?.('click');
    setLoading(true);
    setImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { 
            aspectRatio: aspectRatio as any,
            imageSize: isHighQuality ? "1K" : undefined
          }
        }
      });

      let extractedUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          extractedUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      if (extractedUrl) {
        setImageUrl(extractedUrl);
        const newHistory = [extractedUrl, ...history].slice(0, 20);
        setHistory(newHistory);
        await saveToVault('neural_image_gallery', newHistory);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Requested entity was not found')) {
        setHasKey(false);
        handleOpenKeySelector();
      } else {
        alert("Image generation failed. Try a different prompt or check your API key.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#050505] overflow-y-auto custom-scrollbar p-6 md:p-12 font-sans relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-6xl mx-auto space-y-12 pt-20">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Neural Canvas Engine</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">AI Image Lab</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">Create breathtaking visuals with high-fidelity neural synthesis. Saved to 1TB Vault.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Describe your vision</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic city with floating gardens, cinematic lighting, 8k..."
                  className="w-full bg-[#151515] border border-white/5 rounded-2xl p-5 text-white text-sm focus:outline-none focus:border-blue-500/50 h-32 resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {['1:1', '16:9', '9:16', '4:3'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        aspectRatio === ratio ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest">High Quality</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Requires Paid Tier Key</p>
                </div>
                <button 
                  onClick={() => { onPlaySound?.('settings'); setIsHighQuality(!isHighQuality); }}
                  className={`w-12 h-6 rounded-full transition-all relative ${isHighQuality ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isHighQuality ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={`w-full font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-[0.2em] text-[11px] flex items-center justify-center space-x-3 ${isHighQuality ? 'bg-purple-600 shadow-purple-900/20' : 'bg-blue-600 shadow-blue-900/20'}`}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-sparkles"></i>}
                <span>{loading ? 'Synthesizing...' : 'Generate Image'}</span>
              </button>
            </div>

            {history.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Neural Gallery (Vault)</h3>
                <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar">
                  {history.map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => setImageUrl(url)}
                      className="w-20 h-20 rounded-xl border border-white/10 overflow-hidden shrink-0 cursor-pointer hover:border-blue-500 transition-all shadow-lg"
                    >
                      <img src={url} className="w-full h-full object-cover" alt="history" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-[3rem] aspect-square lg:aspect-video flex items-center justify-center relative overflow-hidden shadow-inner group">
              {loading ? (
                <div className="flex flex-col items-center space-y-6">
                  <div className={`w-16 h-16 border-4 rounded-full animate-spin ${isHighQuality ? 'border-purple-500/10 border-t-purple-500' : 'border-blue-500/10 border-t-blue-500'}`}></div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Rendering Neural Buffer...</p>
                </div>
              ) : imageUrl ? (
                <img src={imageUrl} className="w-full h-full object-contain p-4 animate-in fade-in zoom-in duration-700" alt="generated" />
              ) : (
                <div className="text-center opacity-20 space-y-6 px-12">
                   <i className="fas fa-image text-8xl"></i>
                   <p className="text-xs uppercase tracking-[0.3em] font-black">Awaiting Generation Signal</p>
                </div>
              )}
              
              {imageUrl && !loading && (
                <div className="absolute top-8 right-8 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => window.open(imageUrl)} className="w-12 h-12 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-black transition-all">
                    <i className="fas fa-expand-alt"></i>
                  </button>
                  <a href={imageUrl} download="rock-ai-image.png" className="w-12 h-12 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-black transition-all">
                    <i className="fas fa-download"></i>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageView;
