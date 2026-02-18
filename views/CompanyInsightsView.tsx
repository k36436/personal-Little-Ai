
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const CompanyInsightsView: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [loadingStep, setLoadingStep] = useState('');

  const handleExecute = async () => {
    if (!input.trim() || loading) return;
    
    setLoading(true);
    setAnalysis(null);
    setSources([]);
    setLoadingStep('Initializing Neural Search...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const steps = [
        'Connecting to Global Data Streams...',
        'Cross-referencing market metadata...',
        'Synthesizing organizational insights...',
        'Generating strategic report...'
      ];
      
      let stepIdx = 0;
      const interval = setInterval(() => {
        setLoadingStep(steps[stepIdx % steps.length]);
        stepIdx++;
      }, 2000);

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Provide a detailed intelligence report for: ${input}. 
        Focus on: 
        1. Current market standing. 
        2. Recent news and major developments. 
        3. Strategic SWOT analysis. 
        4. Investment/Partnership outlook. 
        Format with professional headings.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      clearInterval(interval);
      setAnalysis(response.text || "Analysis complete but no text returned.");
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources = chunks
        .filter((c: any) => c.web)
        .map((c: any) => ({ title: c.web.title || 'Source', uri: c.web.uri }));
      
      setSources(extractedSources);
    } catch (e) {
      console.error(e);
      setAnalysis("Research failed. Ensure your query is specific and try again.");
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#0b0c10] custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        
        {/* Header */}
        <div className="text-center space-y-4 pt-10">
          <div className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Corporate Intelligence Engine</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Strategic Insights</h2>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            Unlock professional-grade analysis on any organization using real-time web grounding and Gemini 3 Pro.
          </p>
        </div>

        {/* Input Bar */}
        <div className="sticky top-0 z-30 pt-2 pb-6 backdrop-blur-md">
          <div className="relative group max-w-3xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="relative flex items-center bg-[#161b22] border border-gray-800 rounded-3xl p-2 shadow-3xl">
              <div className="w-14 h-14 flex items-center justify-center text-gray-500">
                <i className="fas fa-building text-lg"></i>
              </div>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                placeholder="Enter Company Name (e.g., NVIDIA, OpenAI, Tesla)..."
                className="flex-1 bg-transparent border-none text-white px-2 py-4 focus:outline-none text-lg"
              />
              <button 
                onClick={handleExecute}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Research'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="py-24 flex flex-col items-center space-y-8 animate-pulse">
             <div className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">{loadingStep}</p>
          </div>
        ) : analysis ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
             <div className="bg-[#161b22] border border-gray-800 rounded-[3rem] p-12 shadow-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12">
                   <i className="fas fa-chart-line text-[15rem]"></i>
                </div>
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-10 flex items-center space-x-3">
                   <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                   <span>Neural Intelligence Report</span>
                </h3>
                <div className="prose prose-invert max-w-none text-gray-200 leading-loose whitespace-pre-wrap text-lg font-medium">
                  {analysis}
                </div>
             </div>

             {sources.length > 0 && (
               <div className="space-y-6 px-4">
                 <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Primary Data Sources</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sources.map((source, i) => (
                      <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center p-5 bg-[#161b22] border border-gray-800 rounded-2xl hover:border-blue-500/40 transition-all group">
                        <i className="fas fa-link text-blue-500/50 mr-4 group-hover:text-blue-500 transition-colors"></i>
                        <span className="text-xs font-bold text-gray-400 truncate flex-1 group-hover:text-white transition-colors uppercase tracking-tight">{source.title}</span>
                        <i className="fas fa-external-link-alt text-[10px] text-gray-800 group-hover:text-blue-500 ml-4"></i>
                      </a>
                    ))}
                 </div>
               </div>
             )}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4 opacity-20">
             <i className="fas fa-search-dollar text-7xl mb-4"></i>
             <p className="text-xl font-bold uppercase tracking-tighter">Ready for Analysis</p>
             <p className="text-xs uppercase tracking-widest font-bold">Input a corporate entity to begin strategic extraction</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyInsightsView;
