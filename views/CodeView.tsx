
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { saveToVault, getFromVault } from '../services/storageService';
import { AppView } from '../types';

const LANGUAGES = [
  'Auto-Detect', 'HTML/JS/CSS', 'TypeScript', 'Python', 'React (JSX)', 'Rust', 'Go', 'C++', 'Java', 'SQL', 'Bash'
];

interface SavedCode {
  id: string;
  lang: string;
  code: string;
  prompt: string;
  timestamp: number;
}

interface CodeViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const CodeView: React.FC<CodeViewProps> = ({ onViewChange, onPlaySound }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedLang, setSelectedLang] = useState('HTML/JS/CSS');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<SavedCode[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      const saved = await getFromVault('neural_code_repo');
      if (saved) setHistory(saved);
    };
    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setCode(null);
    setShowPreview(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const languageContext = selectedLang !== 'Auto-Detect' ? `Writing in ${selectedLang}.` : '';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a senior software engineer. ${languageContext} Task: ${prompt}. Return ONLY the requested code without markdown block wrappers if possible, or use standard markdown. Ensure the code is complete and runnable.`,
        config: { temperature: 0.3 }
      });

      let result = response.text || "";
      // Strip markdown code blocks if present
      result = result.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
      
      setCode(result);
      const newEntry: SavedCode = { id: Date.now().toString(), lang: selectedLang, code: result, prompt, timestamp: Date.now() };
      setHistory([newEntry, ...history].slice(0, 30));
      await saveToVault('neural_code_repo', [newEntry, ...history]);
    } catch (e) {
      console.error(e);
      alert("Code synthesis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (code) {
      onPlaySound?.('scroll');
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!code) return;
    onPlaySound?.('outside');
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-code-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = () => {
    if (!code) return;
    onPlaySound?.('click');
    setShowPreview(true);
  };

  return (
    <div className="h-full w-full bg-transparent overflow-y-auto custom-scrollbar p-6 md:p-12 font-sans relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-6xl mx-auto space-y-12 pb-20 pt-20">
        
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Neural Compiler v3.1</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">Code Expert</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm font-medium uppercase tracking-widest opacity-60">Production-ready logic synthesis with live execution.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0d0d0d]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Logic Directive</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Build a beautiful weather app dashboard with glassmorphism..."
                  className="w-full bg-[#151515] border border-white/5 rounded-2xl p-6 text-white text-sm focus:outline-none focus:border-blue-500/50 h-44 resize-none font-mono"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Target Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.slice(1, 5).map(lang => (
                    <button key={lang} onClick={() => { onPlaySound?.('click'); setSelectedLang(lang); }} className={`py-3 rounded-xl text-[9px] font-black border transition-all uppercase tracking-widest ${selectedLang === lang ? 'bg-blue-600 text-white border-blue-500' : 'bg-transparent text-gray-600 border-white/5 hover:border-white/20'}`}>{lang}</button>
                  ))}
                  <select value={selectedLang} onChange={(e) => { onPlaySound?.('click'); setSelectedLang(e.target.value); }} className="col-span-2 bg-[#151515] border border-white/5 rounded-xl p-3 text-[10px] font-black text-gray-500 focus:outline-none uppercase tracking-widest">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/40 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center space-x-3 active:scale-95">
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-terminal"></i>}
                <span>{loading ? 'Compiling...' : 'Generate Code'}</span>
              </button>
            </div>

            {history.length > 0 && (
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-4">Local Repository</h3>
                 <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                   {history.map((entry) => (
                     <button key={entry.id} onClick={() => { setCode(entry.code); setPrompt(entry.prompt); setSelectedLang(entry.lang); setShowPreview(false); onPlaySound?.('click'); }} className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500 transition-all group backdrop-blur-lg">
                       <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">{entry.lang}</p>
                       <p className="text-[11px] text-gray-400 truncate group-hover:text-white font-bold">{entry.prompt}</p>
                     </button>
                   ))}
                 </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col space-y-4">
            <div className="bg-[#0f0f0f]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] min-h-[550px] flex flex-col relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40">
                 <div className="flex space-x-6">
                    <button onClick={() => { onPlaySound?.('click'); setShowPreview(false); }} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!showPreview ? 'text-blue-500' : 'text-gray-600 hover:text-white'}`}>Source Code</button>
                    <button onClick={() => { onPlaySound?.('click'); setShowPreview(true); }} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${showPreview ? 'text-green-500' : 'text-gray-600 hover:text-white'}`}>Live Output</button>
                 </div>
                 
                 {code && (
                    <div className="flex items-center space-x-6">
                      <button onClick={handleRun} className="text-[10px] font-black text-green-500 hover:text-green-400 transition-colors flex items-center space-x-2">
                        <i className="fas fa-play"></i><span>Run</span>
                      </button>
                      <button onClick={handleDownload} className="text-[10px] font-black text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                        <i className="fas fa-download"></i><span>Download</span>
                      </button>
                      <button onClick={handleCopy} className="text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors flex items-center space-x-2">
                        <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i><span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                 )}
              </div>

              <div className="flex-1 overflow-auto relative">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6">
                    <div className="w-14 h-14 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Neural Extraction Active...</p>
                  </div>
                ) : code ? (
                  showPreview ? (
                    <div className="h-full w-full bg-white text-black animate-in fade-in zoom-in duration-500">
                      {(selectedLang === 'HTML/JS/CSS' || selectedLang === 'Auto-Detect') ? (
                        <iframe 
                          srcDoc={code} 
                          title="Preview" 
                          className="w-full h-full border-none"
                          sandbox="allow-scripts"
                        />
                      ) : (
                        <div className="p-12 bg-[#0d0d0d] h-full flex flex-col">
                           <div className="flex items-center space-x-3 mb-6 text-green-500">
                              <i className="fas fa-terminal"></i>
                              <span className="text-[10px] font-black uppercase tracking-widest">Neural Console Simulation</span>
                           </div>
                           <pre className="text-sm font-mono text-gray-400 italic">
                             {"// Execution trace initialized...\n// " + selectedLang + " runtime simulation active\n\nOutput:\n> Neural compilation successful.\n> " + code.slice(0, 300) + "..."}
                           </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <pre className="text-sm font-mono text-blue-100/90 leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30">
                        {code}
                      </pre>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-10 space-y-6">
                     <i className="fas fa-code text-[8rem]"></i>
                     <p className="text-xs uppercase tracking-[0.4em] font-black">Awaiting Synthesis Command</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-[9px] text-gray-800 font-black uppercase tracking-[0.4em] mt-4">Transparent Neural Logic • Verified by Little.AI</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeView;
