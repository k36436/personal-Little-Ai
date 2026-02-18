
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { saveToVault, getFromVault } from '../services/storageService';
import { AppView } from '../types';

const STACKS = [
  { id: 'nodejs', label: 'Node.js/Express', icon: 'fab fa-node-js' },
  { id: 'python', label: 'Python/FastAPI', icon: 'fab fa-python' },
  { id: 'go', label: 'Go/Gin', icon: 'fab fa-golang' }
];

interface ApiArchitectViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const ApiArchitectView: React.FC<ApiArchitectViewProps> = ({ onViewChange, onPlaySound }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStack, setSelectedStack] = useState(STACKS[0]);
  const [loading, setLoading] = useState(false);
  const [projectCode, setProjectCode] = useState<string | null>(null);
  const [swaggerSpec, setSwaggerSpec] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'docs' | 'sandbox'>('code');
  const [history, setHistory] = useState<any[]>([]);
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getFromVault('neural_api_vault');
    if (data) setHistory(data);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setProjectCode(null);
    setSwaggerSpec(null);
    setSandboxResponse(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemPrompt = `Act as a senior backend architect. Build a production-ready API project based on user specifications using ${selectedStack.label}.
      
      Requirements:
      - Provide full source code.
      - Include OpenAPI 3.0 Swagger specs.
      - Return response ONLY as a clean JSON object without markdown wrappers.
      
      Response Format: { "code": "source", "swagger": "json_string", "mockResponse": "json_example" }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              swagger: { type: Type.STRING },
              mockResponse: { type: Type.STRING }
            },
            required: ["code", "swagger", "mockResponse"]
          }
        }
      });

      // Robust JSON extraction
      let text = response.text || "";
      text = text.trim().replace(/^```json\n/i, '').replace(/\n```$/i, '').trim();
      
      const result = JSON.parse(text);
      setProjectCode(result.code);
      setSwaggerSpec(result.swagger);
      setSandboxResponse(result.mockResponse);

      const newEntry = { 
        id: Date.now().toString(), 
        prompt, 
        code: result.code, 
        swagger: result.swagger, 
        mock: result.mockResponse, 
        stack: selectedStack.label, 
        timestamp: Date.now() 
      };
      const updatedHistory = [newEntry, ...history].slice(0, 15);
      setHistory(updatedHistory);
      await saveToVault('neural_api_vault', updatedHistory);

    } catch (e) {
      console.error(e);
      alert("API Masla: Neural architecture failed. This often happens due to an invalid API key or connection timeout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-transparent overflow-hidden flex flex-col font-sans p-6 md:p-10 relative">
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="flex items-center justify-between mb-8 px-4 pt-20">
        <div className="flex items-center space-x-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 shadow-lg backdrop-blur-3xl">
             <i className="fas fa-server text-xl"></i>
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">API Architect</h2>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Universal Backend Synthesis Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-3xl">
            {STACKS.map(stack => (
              <button 
                key={stack.id}
                onClick={() => { onPlaySound?.('click'); setSelectedStack(stack); }}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${selectedStack.id === stack.id ? 'bg-emerald-500 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
              >
                <i className={stack.icon}></i>
                <span>{stack.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        <div className="w-[400px] shrink-0 flex flex-col space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-3xl shadow-2xl flex flex-col">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">API Specification Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your API... e.g., Book tracking system with user auth."
                className="w-full bg-transparent border border-white/10 rounded-2xl p-6 text-white text-sm focus:outline-none focus:border-white/20 h-48 resize-none font-medium placeholder:text-gray-800"
              />
            </div>
            
            <button 
              onClick={handleGenerate} 
              disabled={loading || !prompt.trim()}
              className="w-full bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white font-black py-5 rounded-2xl transition-all border border-emerald-500/20 shadow-2xl uppercase tracking-[0.3em] text-[10px] flex items-center justify-center space-x-4 backdrop-blur-3xl"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microchip"></i>}
              <span>{loading ? 'Synthesizing...' : 'Build Neural API'}</span>
            </button>
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col">
            <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-6">Neural Project Vault</h3>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                   <i className="fas fa-server text-4xl mb-3"></i>
                   <p className="text-[9px] font-black uppercase tracking-widest">No API Nodes Synthesized</p>
                </div>
              ) : (
                history.map((entry) => (
                  <button key={entry.id} onClick={() => { onPlaySound?.('click'); setProjectCode(entry.code); setSwaggerSpec(entry.swagger); setSandboxResponse(entry.mock); setPrompt(entry.prompt); }} className="w-full text-left p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group backdrop-blur-lg">
                     <p className="text-[11px] text-gray-300 font-bold truncate group-hover:text-emerald-500 transition-colors">{entry.prompt}</p>
                     <div className="flex items-center justify-between mt-2">
                       <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">{new Date(entry.timestamp).toLocaleDateString()}</p>
                       <span className="text-[8px] font-black uppercase text-emerald-500">{entry.stack}</span>
                     </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden relative shadow-4xl backdrop-blur-3xl">
           <div className="h-14 bg-black/40 border-b border-white/5 flex items-center justify-between px-8">
              <div className="flex space-x-8">
                 <button onClick={() => setActiveTab('code')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'code' ? 'text-emerald-500' : 'text-gray-600 hover:text-white'}`}>Source Code</button>
                 <button onClick={() => setActiveTab('docs')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'docs' ? 'text-emerald-500' : 'text-gray-600 hover:text-white'}`}>OpenAPI Specs</button>
                 <button onClick={() => setActiveTab('sandbox')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sandbox' ? 'text-emerald-500' : 'text-gray-600 hover:text-white'}`}>Mock Sandbox</button>
              </div>
              <div className="flex space-x-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500/20 shadow-[0_0_8px_#10b981]"></div>
                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Status: Live</span>
              </div>
           </div>

           <div className="flex-1 overflow-auto p-12 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                   <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Compiling Logic Architecture...</p>
                </div>
              ) : projectCode ? (
                <div className="animate-in fade-in zoom-in duration-500 h-full">
                   {activeTab === 'code' && (
                     <pre className="text-sm font-mono text-emerald-100/90 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/20">
                        {projectCode}
                     </pre>
                   )}
                   {activeTab === 'docs' && (
                     <pre className="text-sm font-mono text-blue-300/90 leading-relaxed whitespace-pre-wrap selection:bg-blue-500/20">
                        {swaggerSpec}
                     </pre>
                   )}
                   {activeTab === 'sandbox' && (
                     <div className="space-y-8">
                        <div className="flex items-center space-x-4">
                           <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-black rounded-lg uppercase">GET</div>
                           <p className="text-[12px] font-mono text-gray-400">/api/v1/resource</p>
                        </div>
                        <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5 font-mono text-xs text-emerald-400 leading-relaxed overflow-hidden">
                           <div className="mb-4 text-gray-600 uppercase tracking-widest text-[8px]">Sample JSON Response</div>
                           {sandboxResponse}
                        </div>
                        <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">Note: This is a neural simulation of the backend response.</p>
                     </div>
                   )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-10 space-y-8">
                   <i className="fas fa-terminal text-[10rem]"></i>
                   <div className="space-y-2">
                     <p className="text-2xl font-black uppercase tracking-tighter">Awaiting Directive</p>
                     <p className="text-xs uppercase tracking-[0.4em] font-black">Specify an API for cross-platform backend synthesis</p>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ApiArchitectView;
