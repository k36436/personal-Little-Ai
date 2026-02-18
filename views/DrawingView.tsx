
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { saveToVault, getFromVault } from '../services/storageService';
import { AppView } from '../types';

const ART_STYLES = [
  { id: 'sketch', label: 'Pencil Sketch', icon: 'fa-pencil-alt', promptSuffix: 'highly detailed pencil sketch, graphite textures, artistic shading' },
  { id: 'watercolor', label: 'Watercolor', icon: 'fa-tint', promptSuffix: 'watercolor painting style, soft edges, vibrant washes, artistic drips' },
  { id: 'oil', label: 'Oil Painting', icon: 'fa-palette', promptSuffix: 'thick oil painting, visible brushstrokes, canvas texture, classical masterpiece style' },
  { id: 'charcoal', label: 'Charcoal', icon: 'fa-fire', promptSuffix: 'charcoal drawing, smudged shadows, rough expressive lines, high contrast black and white' },
  { id: 'digital', label: 'Digital Art', icon: 'fa-laptop-code', promptSuffix: 'clean digital art, sharp lines, smooth gradients, modern illustration style' },
];

interface DrawingViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const DrawingView: React.FC<DrawingViewProps> = ({ onViewChange, onPlaySound }) => {
  const [prompt, setPrompt] = useState('');
  const [activeStyle, setActiveStyle] = useState(ART_STYLES[0]);
  const [loading, setLoading] = useState(false);
  const [drawingUrl, setDrawingUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getFromVault('neural_drawing_gallery');
    if (data) setHistory(data);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setDrawingUrl(null);

    const fullPrompt = `${prompt}, ${activeStyle.promptSuffix}`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: fullPrompt }] },
        config: {
          imageConfig: { aspectRatio: '1:1' }
        }
      });

      let extractedUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          extractedUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      if (extractedUrl) {
        setDrawingUrl(extractedUrl);
        const newEntry = {
          id: Date.now().toString(),
          prompt,
          content: extractedUrl,
          style: activeStyle.label,
          timestamp: Date.now()
        };
        const newHistory = [newEntry, ...history].slice(0, 20);
        setHistory(newHistory);
        await saveToVault('neural_drawing_gallery', newHistory);
      }
    } catch (e) {
      console.error(e);
      alert("Drawing generation failed. Try another prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#050505] overflow-auto custom-scrollbar p-6 md:p-12 font-sans relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-6xl mx-auto space-y-12 pt-20">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full">
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em]">Neural Art Studio</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">AI Drawing</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">Turn your thoughts into artistic sketches and paintings. Saved to 1TB Vault.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Describe your drawing</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A lonely tree on a hill, a portrait of a wise owl, a medieval castle..."
                  className="w-full bg-[#151515] border border-white/5 rounded-2xl p-5 text-white text-sm focus:outline-none focus:border-pink-500/50 h-32 resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Select Style</label>
                <div className="space-y-2">
                  {ART_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => { onPlaySound?.('click'); setActiveStyle(style); }}
                      className={`w-full flex items-center space-x-4 p-4 rounded-xl border transition-all ${
                        activeStyle.id === style.id 
                        ? 'bg-pink-500 border-pink-400 text-white shadow-lg' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                      }`}
                    >
                      <i className={`fas ${style.icon} w-5 text-center`}></i>
                      <span className="text-xs font-bold uppercase tracking-wider">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-pink-900/20 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center space-x-3"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                <span>{loading ? 'Sketching...' : 'Generate Drawing'}</span>
              </button>
            </div>
          </div>

          {/* Canvas Preview Area */}
          <div className="lg:col-span-8">
            <div className="bg-[#0f0f0f] border-8 border-[#0d0d0d] rounded-[3rem] aspect-square flex items-center justify-center relative overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none"></div>
              
              {loading ? (
                <div className="flex flex-col items-center space-y-6 relative z-10">
                  <div className="w-16 h-16 border-4 border-pink-500/10 border-t-pink-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Applying Neural Strokes...</p>
                </div>
              ) : drawingUrl ? (
                <img src={drawingUrl} className="w-full h-full object-contain p-4 animate-in fade-in zoom-in duration-1000 relative z-10" alt="drawing" />
              ) : (
                <div className="text-center opacity-10 space-y-6 px-12 relative z-10">
                   <i className="fas fa-paint-brush text-[8rem]"></i>
                   <p className="text-xs uppercase tracking-[0.3em] font-black">Canvas Ready for Input</p>
                </div>
              )}
              
              {drawingUrl && !loading && (
                <div className="absolute bottom-8 right-8 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button onClick={() => window.open(drawingUrl)} className="w-12 h-12 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl">
                    <i className="fas fa-expand"></i>
                  </button>
                  <a href={drawingUrl} download={`little-ai-sketch-${Date.now()}.png`} className="w-12 h-12 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl">
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

export default DrawingView;
