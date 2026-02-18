
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { AppView } from '../types';

interface MindNode {
  label: string;
  children?: MindNode[];
}

interface MindMapViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const MindMapView: React.FC<MindMapViewProps> = ({ onViewChange, onPlaySound }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindNode | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setMindMapData(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a structured mind map for the topic: "${topic}". Provide a clear hierarchy of sub-topics.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "The central topic name." },
              children: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    children: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["label"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setMindMapData(data);
    } catch (e) {
      console.error(e);
      alert("Failed to build mind map. Try a simpler topic.");
    } finally {
      setLoading(false);
    }
  };

  const renderNode = (node: MindNode, depth: number = 0) => (
    <div key={node.label} className={`flex flex-col items-center ${depth === 0 ? 'w-full' : 'mt-8'}`}>
      <div className={`px-6 py-3 rounded-2xl border transition-all shadow-xl text-center min-w-[140px] ${
        depth === 0 
        ? 'bg-purple-600 border-purple-400 text-white font-black text-lg scale-110 mb-8' 
        : depth === 1 
        ? 'bg-[#1a1a1a] border-purple-500/30 text-purple-300 font-bold' 
        : 'bg-[#0d0d0d] border-white/10 text-gray-400 text-xs'
      }`}>
        {node.label}
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="flex items-start justify-center space-x-8 mt-4 relative">
          {/* Vertical connector */}
          <div className="absolute -top-4 left-1/2 w-[1px] h-4 bg-white/10 -translate-x-1/2"></div>
          
          {node.children.map(child => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full w-full bg-[#050505] overflow-auto custom-scrollbar p-6 md:p-12 relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-6xl mx-auto space-y-12 pb-24 pt-20">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em]">Knowledge Architecture Lab</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">AI Mind Map</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">Deconstruct complex ideas into beautiful, structured neural trees.</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-purple-600/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="relative flex items-center bg-[#0f0f0f] border border-white/10 rounded-2xl p-2 shadow-2xl">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Enter a topic (e.g., Quantum Physics, Healthy Diet, Startup Strategy)..."
                className="flex-1 bg-transparent border-none text-white px-6 py-4 focus:outline-none text-md placeholder:text-gray-700"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-800 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Execute'}
              </button>
            </div>
          </div>
        </div>

        {/* Mind Map Canvas */}
        <div className="bg-[#0a0a0a]/50 border border-white/5 rounded-[4rem] min-h-[600px] p-20 overflow-x-auto custom-scrollbar flex items-start justify-center shadow-inner relative">
           <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
           
           {loading ? (
             <div className="flex flex-col items-center justify-center space-y-6 self-center relative z-10">
               <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Constructing Semantic Nodes...</p>
             </div>
           ) : mindMapData ? (
             <div className="relative z-10 animate-in fade-in slide-in-from-top-10 duration-700">
                {renderNode(mindMapData)}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center text-center opacity-20 space-y-6 self-center">
                <i className="fas fa-brain text-8xl"></i>
                <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting Knowledge Extraction</p>
             </div>
           )}
        </div>

        <div className="text-center">
           <p className="text-[10px] text-gray-700 font-bold uppercase tracking-[0.5em]">Neural Tree Synthesis Protocol • Little.AI</p>
        </div>

      </div>
    </div>
  );
};

export default MindMapView;
