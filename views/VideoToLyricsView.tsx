
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppView } from '../types';

interface VideoToLyricsViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const VideoToLyricsView: React.FC<VideoToLyricsViewProps> = ({ onViewChange, onPlaySound }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPlaySound?.('click');
      setSelectedFile(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerateLyrics = async () => {
    if (!selectedFile || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setLyrics(null);
    setProgress('Extracting Audio Streams...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64 = await fileToBase64(selectedFile);
      
      setProgress('Analyzing Musical Frequency...');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: selectedFile.type } },
            { text: "Listen to this video carefully. If there is a song, extract all the lyrics perfectly. If it is a speech, provide a full transcript. Format it beautifully with headings and structure." }
          ]
        }
      });

      setLyrics(response.text || "No lyrics or speech detected in the signal.");
    } catch (e) {
      console.error(e);
      setLyrics("Neural processing failed. Please ensure the file is a valid video format (MP4, WEBM).");
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="h-full w-full bg-transparent p-6 md:p-12 overflow-y-auto custom-scrollbar relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-12 pb-24 pt-20">
        <div className="text-center space-y-4 pt-10">
          <div className="inline-flex items-center px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em]">Audio Extraction Protocol</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Video to Lyrics</h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
            Upload any video to extract perfectly timed lyrics or complete speech transcriptions using Gemini's multi-modal intelligence.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xl bg-black/40 border-2 border-dashed border-white/10 rounded-[3rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/40 transition-all group shadow-2xl backdrop-blur-3xl"
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="video/*" />
            <div className="w-20 h-20 rounded-[1.5rem] bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform border border-purple-500/20 shadow-inner">
               <i className="fas fa-video text-2xl"></i>
            </div>
            {selectedFile ? (
              <div className="text-center space-y-2">
                 <p className="text-lg font-bold text-white">{selectedFile.name}</p>
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                 <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Click to Drop Video Node</p>
                 <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.4em]">MP4 • WEBM • MOV</p>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateLyrics}
            disabled={loading || !selectedFile}
            className="px-16 py-5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-purple-900/40 transition-all active:scale-95 flex items-center space-x-4"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-music"></i>}
            <span>{loading ? progress : 'Extract Content'}</span>
          </button>
        </div>

        {lyrics && (
          <div className="bg-black/40 border border-white/5 rounded-[4rem] p-12 shadow-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 p-16 opacity-[0.02] -rotate-12 pointer-events-none">
               <i className="fas fa-music text-[15rem]"></i>
            </div>
            <div className="flex items-center space-x-4 mb-10">
               <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
               <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.5em]">Neural Transcription Output</h3>
            </div>
            <div className="prose prose-invert max-w-none">
              <pre className="text-lg font-medium text-gray-100 leading-relaxed whitespace-pre-wrap selection:bg-purple-500/20 font-sans">
                {lyrics}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoToLyricsView;
