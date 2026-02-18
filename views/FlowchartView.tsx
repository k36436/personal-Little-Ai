
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { AppView } from '../types';

interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end';
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface FlowchartViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const FlowchartView: React.FC<FlowchartViewProps> = ({ onViewChange, onPlaySound }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState<FlowData | null>(null);

  const handleGenerate = async () => {
    if (!input.trim() || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setFlowData(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a logical flowchart for this process: "${input}". 
        Provide a list of nodes and edges connecting them. 
        Node types: 'start', 'process', 'decision', 'end'.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['start', 'process', 'decision', 'end'] }
                  },
                  required: ['id', 'label', 'type']
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    from: { type: Type.STRING },
                    to: { type: Type.STRING },
                    label: { type: Type.STRING }
                  },
                  required: ['from', 'to']
                }
              }
            },
            required: ['nodes', 'edges']
          }
        }
      });

      const data = JSON.parse(response.text);
      setFlowData(data);
    } catch (e) {
      console.error(e);
      alert("Failed to build flowchart. Try a simpler description.");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="inline-flex items-center px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">Process Visualization Lab</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">AI Flowchart</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">Visualize complex logic and business processes instantly with AI.</p>
        </div>

        {/* Input Zone */}
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="relative flex flex-col bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe a process: e.g., 'How a customer orders coffee', 'The software deployment pipeline', 'Decision tree for loan approval'..."
                className="w-full bg-transparent border-none text-white focus:outline-none text-lg placeholder:text-gray-700 min-h-[120px] resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !input.trim()}
                  className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center space-x-3 shadow-xl shadow-yellow-900/10"
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-project-diagram"></i>}
                  <span>{loading ? 'Synthesizing Flow...' : 'Generate Flowchart'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Display Canvas */}
        <div className="bg-[#0a0a0a]/50 border border-white/5 rounded-[4rem] min-h-[600px] p-20 overflow-auto custom-scrollbar flex flex-col items-center shadow-inner relative">
           <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
           
           {loading ? (
             <div className="flex flex-col items-center justify-center space-y-6 self-center h-full relative z-10">
               <div className="w-12 h-12 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Logic Engine Processing...</p>
             </div>
           ) : flowData ? (
             <div className="w-full relative z-10 animate-in fade-in slide-in-from-top-10 duration-700 flex flex-col items-center space-y-12">
                {flowData.nodes.map((node, i) => {
                  const nodeEdges = flowData.edges.filter(e => e.from === node.id);
                  return (
                    <div key={node.id} className="flex flex-col items-center w-full">
                       <div className={`px-8 py-4 border-2 transition-all shadow-2xl text-center min-w-[180px] relative ${
                         node.type === 'start' || node.type === 'end'
                         ? 'rounded-full bg-yellow-600/10 border-yellow-500 text-yellow-400 font-black'
                         : node.type === 'decision'
                         ? 'rotate-45 w-40 h-40 flex items-center justify-center bg-orange-600/10 border-orange-500 text-orange-400 font-bold'
                         : 'rounded-xl bg-white/5 border-white/20 text-gray-300 font-semibold'
                       }`}>
                         <span className={node.type === 'decision' ? '-rotate-45' : ''}>{node.label}</span>
                       </div>
                       
                       {nodeEdges.length > 0 && (
                         <div className="w-full flex justify-center mt-8 relative">
                            {nodeEdges.map((edge, edgeIdx) => (
                              <div key={edgeIdx} className="flex flex-col items-center mx-12">
                                <div className="h-10 w-[2px] bg-white/10 relative">
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-white/20"></div>
                                  {edge.label && (
                                    <span className="absolute -right-12 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-600 uppercase tracking-widest bg-black px-1">{edge.label}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  );
                })}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center text-center opacity-10 space-y-6 h-full self-center">
                <i className="fas fa-layer-group text-9xl"></i>
                <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting Process Extraction</p>
             </div>
           )}
        </div>

        <div className="text-center">
           <p className="text-[10px] text-gray-800 font-bold uppercase tracking-[0.5em]">Neural Logic Synthesis Protocol • Little.AI</p>
        </div>

      </div>
    </div>
  );
};

export default FlowchartView;
