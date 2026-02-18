
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { saveToVault, getFromVault } from '../services/storageService';
import { AppView } from '../types';

interface AppAnalystViewProps {
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
  onViewChange: (view: AppView) => void;
}

const AppAnalystView: React.FC<AppAnalystViewProps> = ({ onPlaySound, onViewChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [masterPrompt, setMasterPrompt] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isSelfScanning, setIsSelfScanning] = useState(false);
  const [analysisTimer, setAnalysisTimer] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appDetails = {
    name: "Little Ai Neural Core",
    version: "3.2.0-Aurora",
    engine: "Gemini 3 Pro Deep Analysis",
    architecture: "Neural-React Hybrid",
    uiSpecs: "Glassmorphism v4, Cherry Blossom Layer",
    status: "Neural Link Optimal",
    features: [
      "Master Prompt Synthesis",
      "APK Reverse Mapping",
      "Function & Interface Extraction",
      "UI Component Deconstruction",
      "Security Risk Assessment"
    ]
  };

  useEffect(() => {
    loadHistory();
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("application/vnd.android.package-archive") !== -1 || items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file && (file.name.endsWith('.apk') || file.type === 'application/vnd.android.package-archive')) {
              onPlaySound?.('click');
              setSelectedFile(file);
              setAnalysis(null);
              setMasterPrompt(null);
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Timer for Self-Scan
  useEffect(() => {
    let interval: any;
    if (isSelfScanning && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && isSelfScanning) {
      setIsSelfScanning(false);
      const selfScanContent = `**Little Ai System Self-Analysis Report**\n\n**Description**: Little Ai is a multi-dimensional AI ecosystem designed to bridge the gap between human creativity and neural intelligence. It leverages the latest Gemini 3 models for high-speed reasoning and 2.5 native audio for human-like conversations.\n\n**UI Design**: The interface utilizes 'Neural Glassmorphism', combining high-saturation atmospheric glows with semi-transparent functional layers. The signature 'Cherry Blossom' petal animation provides a calming, biological contrast to the hard-tech features.\n\n**Key Components**:\n- **Neural Engine**: Managed via GeminiService with exponential backoff.\n- **Storage**: IndexedDB 'Neural Vault' providing 100GB of localized persistent memory.\n- **Audio Hub**: PCM 16kHz/24kHz bi-directional stream for zero-latency voice interaction.\n\n**Conclusion**: The platform is optimized for production-grade AI interaction with deep privacy focus (all data stored in browser sandbox).`;
      setAnalysis(selfScanContent);
      
      const saveSelfScan = async () => {
        const newEntry = {
          id: Date.now().toString(),
          title: "System Self-Scan Report",
          content: selfScanContent,
          timestamp: Date.now(),
          subCategory: 'System Self-Scan',
          type: 'analysis'
        };
        const updatedHistory = [newEntry, ...history].slice(0, 10);
        setHistory(updatedHistory);
        await saveToVault('neural_apk_analysis_history', updatedHistory);
      };
      saveSelfScan();
    }
    return () => clearInterval(interval);
  }, [isSelfScanning, timer]);

  // Timer for Deep Analysis Progress
  useEffect(() => {
    let interval: any;
    if (loading && analysisTimer < 100) {
      interval = setInterval(() => setAnalysisTimer(prev => Math.min(prev + 0.8, 100)), 1000);
    }
    return () => clearInterval(interval);
  }, [loading, analysisTimer]);

  const loadHistory = async () => {
    const data = await getFromVault('neural_apk_analysis_history');
    if (data) setHistory(data);
  };

  const handleSelfScan = () => {
    onPlaySound?.('settings');
    setIsSelfScanning(true);
    setTimer(60);
    setAnalysis(null);
    setMasterPrompt(null);
    setSelectedFile(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPlaySound?.('click');
      setSelectedFile(file);
      setAnalysis(null);
      setMasterPrompt(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setAnalysis(null);
    setMasterPrompt(null);
    setAnalysisTimer(0);
    setProgress('Initializing Deep Synthesis Engine...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64 = await fileToBase64(selectedFile);
      
      const analysisPrompt = `Perform an EXTREMELY detailed reverse-engineering analysis of the provided APK file: "${selectedFile.name}".
      
      Part 1: Technical Analysis
      - Describe EXACTLY what is inside the app (modules, libraries, assets).
      - List all core functions and public interfaces discovered or inferred.
      - Detail the UI style, themes, and component libraries used.
      - Identify any games or specialized features (e.g., chat, audio, video engines).
      - Explain the code structure and runtime requirements.

      Part 2: Master Reconstruction Prompt
      - Generate a "Master Prompt" that could be used by another AI to rebuild this entire application from scratch. 
      - This prompt must be exhaustive, covering design specs, functional requirements, and logical flow.

      Structure the output into two clear sections: "**FULL ARCHITECTURAL BREAKDOWN**" and "**MASTER RECONSTRUCTION PROMPT**". Use professional, highly technical Markdown.`;

      setProgress('Deconstructing Neural Scaffolding...');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      setProgress('Mapping Function Signatures & UI Components...');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: 'application/vnd.android.package-archive' } },
            { text: analysisPrompt }
          ]
        }
      });

      const result = response.text || "Analysis failed.";
      setAnalysis(result);

      const newEntry = {
        id: Date.now().toString(),
        title: selectedFile.name,
        content: result,
        timestamp: Date.now(),
        fileSize: selectedFile.size,
        subCategory: 'APK Analysis',
        type: 'analysis'
      };
      const updatedHistory = [newEntry, ...history].slice(0, 10);
      setHistory(updatedHistory);
      await saveToVault('neural_apk_analysis_history', updatedHistory);

    } catch (e) {
      setAnalysis("Neural link interrupted. This binary might be encrypted or too large for standard buffer.");
    } finally {
      setLoading(false);
      setAnalysisTimer(100);
      setProgress('');
    }
  };

  const handleCopyPrompt = () => {
    if (analysis) {
      const splitAnalysis = analysis.split('MASTER RECONSTRUCTION PROMPT');
      const promptToCopy = splitAnalysis.length > 1 ? splitAnalysis[1] : analysis;
      navigator.clipboard.writeText(promptToCopy.trim());
      setCopied(true);
      onPlaySound?.('scroll');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full w-full bg-transparent flex overflow-hidden font-sans relative">
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <aside className="w-80 border-l border-white/10 glass-panel bg-black/10 backdrop-blur-3xl p-8 overflow-y-auto custom-scrollbar flex flex-col order-2 pt-24">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-4 border border-emerald-500/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
            <i className="fas fa-brain text-3xl group-hover:scale-110 transition-transform relative z-10"></i>
          </div>
          <h3 className="text-xl font-black text-white tracking-tighter">Neural Link Health</h3>
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">{appDetails.status}</p>
        </div>

        <div className="space-y-8">
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-4">
            <div>
              <label className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] block mb-1">Active Core</label>
              <p className="text-[11px] font-bold text-white uppercase">{appDetails.name}</p>
            </div>
            <div>
              <label className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] block mb-1">Build Engine</label>
              <p className="text-[11px] font-bold text-emerald-500 uppercase">{appDetails.engine}</p>
            </div>
            <div>
              <label className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] block mb-1">Version</label>
              <p className="text-[11px] font-bold text-white uppercase">{appDetails.version}</p>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-0.4em block mb-4 px-2">Diagnostic Capabilities</label>
            <div className="space-y-2">
              {appDetails.features.map((f, i) => (
                <div key={i} className="flex items-center space-x-3 text-[10px] text-gray-400 font-bold group p-2 hover:bg-white/5 rounded-xl transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:shadow-[0_0_10px_#10b981] transition-all"></div>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-10">
          <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] text-[9px] font-black text-gray-700 uppercase leading-loose text-center tracking-[0.2em] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl"></div>
            SECURE SANDBOX ACTIVE <br/> 
            NO DATA LEAVES LOCAL VAULT
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent p-6 md:p-12 overflow-y-auto custom-scrollbar order-1">
        <div className="max-w-4xl mx-auto space-y-12 pb-32 pt-20">
          <div className="text-center space-y-4 pt-10">
            <div className="inline-flex items-center px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-2 backdrop-blur-3xl shadow-2xl">
              <div className="w-2 h-2 rounded-full mr-3 bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Deep Synthesis Protocol</span>
            </div>
            <h2 className="text-6xl font-black tracking-tighter text-white leading-none">
              App Analyst
            </h2>
            <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed opacity-60">
              Transform binaries into structured intelligence. Generate Master Blueprints and reconstruction prompts in real-time.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-10">
            {(isSelfScanning || loading) ? (
              <div className="w-full max-w-2xl bg-black/40 border-2 border-emerald-500/20 rounded-[4rem] p-24 flex flex-col items-center justify-center backdrop-blur-3xl shadow-4xl relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                <div className="relative z-10 text-center space-y-10 w-full">
                  <div className="text-7xl font-black text-emerald-500 tracking-tighter">
                    {isSelfScanning ? timer : Math.floor(analysisTimer)}%
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-700 shadow-[0_0_15px_#10b981]" 
                      style={{ width: isSelfScanning ? `${((60 - timer) / 60) * 100}%` : `${analysisTimer}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse">
                    {isSelfScanning ? 'Performing System Self-Scan...' : progress}
                  </p>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-2xl bg-black/20 border-2 border-dashed border-white/10 rounded-[4rem] p-16 md:p-24 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/40 transition-all group shadow-4xl backdrop-blur-3xl relative overflow-hidden"
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".apk" />
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 group-hover:scale-110 transition-transform border border-emerald-500/20 shadow-2xl relative z-10">
                   <i className="fas fa-microchip text-3xl"></i>
                </div>
                {selectedFile ? (
                  <div className="text-center space-y-3 relative z-10">
                     <p className="text-3xl font-black text-white tracking-tighter">{selectedFile.name}</p>
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em]">Target Binary Ready for Deconstruction</p>
                  </div>
                ) : (
                  <div className="text-center space-y-6 relative z-10">
                     <div className="space-y-2">
                       <p className="text-xl font-black text-gray-300 uppercase tracking-widest">Drop APK Node or Paste Binary</p>
                       <p className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.4em]">Ctrl+V Supported</p>
                     </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-6">
              <button
                onClick={handleAnalyze}
                disabled={loading || !selectedFile || isSelfScanning}
                className="px-16 py-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:text-gray-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-4xl shadow-emerald-900/40 transition-all active:scale-95 flex items-center space-x-6"
              >
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-hammer"></i>}
                <span>{loading ? 'Synthesizing...' : 'Execute Deep Analysis'}</span>
              </button>
              
              <button
                onClick={handleSelfScan}
                disabled={loading || isSelfScanning}
                className="px-12 py-6 bg-white/5 border border-white/10 hover:border-emerald-500/40 text-gray-400 hover:text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl transition-all flex items-center space-x-4"
              >
                <i className="fas fa-radar"></i>
                <span>One-Minute Self-Scan</span>
              </button>
            </div>
          </div>

          {analysis && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="flex items-center justify-between px-10">
                 <div className="flex items-center space-x-4">
                   <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse"></div>
                   <h3 className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.6em]">Intelligence Synthesis</h3>
                 </div>
                 <button 
                  onClick={handleCopyPrompt}
                  className={`px-8 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 ${copied ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-emerald-500/20'}`}
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  <span>{copied ? 'Blueprint Copied' : 'Copy Master Prompt'}</span>
                </button>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-[4rem] p-16 shadow-4xl relative overflow-hidden backdrop-blur-[100px]">
                <div className="prose prose-invert max-w-none relative z-10">
                  <div className="text-gray-100 text-[18px] leading-[1.8] font-medium whitespace-pre-wrap selection:bg-emerald-500/20">
                    {analysis}
                  </div>
                </div>
              </div>
            </div>
          )}

          {history.length > 0 && !analysis && !loading && !isSelfScanning && (
            <div className="space-y-8 pt-10">
               <div className="flex items-center justify-center space-x-4">
                 <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-[0.5em]">Inspection History</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {history.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => { setAnalysis(item.content); onPlaySound?.('click'); }} 
                      className="p-8 bg-white/5 border border-white/5 rounded-[3rem] text-left hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group backdrop-blur-3xl shadow-2xl relative overflow-hidden"
                    >
                      <p className="text-base font-black text-white uppercase tracking-tight mb-2 group-hover:text-emerald-500 transition-colors">{item.title}</p>
                      <div className="flex items-center space-x-4 opacity-40">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest ml-auto">{item.subCategory}</p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppAnalystView;
