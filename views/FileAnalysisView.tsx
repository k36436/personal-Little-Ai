
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { saveToVault, getFromVault } from '../services/storageService';
import { AppView } from '../types';

interface FileAnalysisViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const FileAnalysisView: React.FC<FileAnalysisViewProps> = ({ onViewChange, onPlaySound }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Analyze this document and provide a comprehensive summary with key points.');
  const [history, setHistory] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getFromVault('neural_analysis_history');
    if (data) setHistory(data);
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
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64 = await fileToBase64(selectedFile);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: selectedFile.type } },
            { text: prompt }
          ]
        }
      });

      const result = response.text || "Analysis failed to return text content.";
      setAnalysis(result);

      const newEntry = {
        id: Date.now().toString(),
        title: selectedFile.name,
        content: result,
        timestamp: Date.now()
      };
      const newHistory = [newEntry, ...history].slice(0, 20);
      setHistory(newHistory);
      await saveToVault('neural_analysis_history', newHistory);

    } catch (e) {
      console.error(e);
      alert("Analysis failed. Please try a different file format (PDF, PNG, JPG supported).");
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
          <div className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Document Intelligence Hub</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">AI File Analysis</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">Upload reports to extract deep insights. Persistent in 1TB Vault.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#151515] border-2 border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/30 transition-all group"
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt,image/*" />
                {selectedFile ? (
                  <div className="text-center">
                     <i className="fas fa-file-alt text-3xl text-blue-500 mb-3"></i>
                     <p className="text-xs font-bold text-gray-300 truncate max-w-[150px]">{selectedFile.name}</p>
                  </div>
                ) : (
                  <div className="text-center opacity-30 group-hover:opacity-100 transition-opacity">
                     <i className="fas fa-cloud-upload-alt text-3xl mb-3"></i>
                     <p className="text-[10px] font-bold uppercase tracking-widest">Browse Files</p>
                  </div>
                )}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#151515] border border-white/5 rounded-2xl p-5 text-white text-xs focus:outline-none focus:border-blue-500/50 h-32 resize-none"
              />

              <button
                onClick={handleAnalyze}
                disabled={loading || !selectedFile}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center space-x-3 disabled:opacity-30"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microchip"></i>}
                <span>Analyze Document</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-[3rem] min-h-[500px] p-10 flex flex-col relative overflow-hidden shadow-2xl">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : analysis ? (
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed font-medium whitespace-pre-wrap text-[15px]">
                  {analysis}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10">
                   <i className="fas fa-file-medical-alt text-[8rem]"></i>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileAnalysisView;
