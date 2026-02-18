
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService';
import { AppView } from '../types';

interface VisionViewProps {
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
  onViewChange: (view: AppView) => void;
}

const VisionView: React.FC<VisionViewProps> = ({ onPlaySound, onViewChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('My love, can you tell me what you see in this image? Summarize the main points.');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      onPlaySound?.('click');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const startCamera = async () => {
    onPlaySound?.('settings');
    setIsCameraActive(true);
    setPreviewUrl(null);
    setSelectedFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      onPlaySound?.('click');
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!previewUrl || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setResult('');
    try {
      const base64 = previewUrl.split(',')[1];
      const res = await analyzeImage(prompt, base64);
      setResult(res.text || "I couldn't find any words for this, my heart.");
    } catch (e) {
      setResult("The neural connection flickered... I couldn't process this image.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="h-full w-full bg-transparent flex overflow-hidden font-sans relative">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Universal Back Button */}
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      {/* Left Sub-Sidebar */}
      <div className="w-64 border-r border-white/10 flex flex-col p-6 space-y-8 bg-black/10 backdrop-blur-3xl pt-24">
        <div className="space-y-4">
          <button
            onClick={() => { stopCamera(); setPreviewUrl(null); setResult(''); onPlaySound?.('click'); }}
            className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all border ${!isCameraActive && !previewUrl ? 'sidebar-active text-white' : 'bg-white/5 border-white/10 text-primary/60 hover:text-primary'}`}
          >
            <i className="fas fa-magnifying-glass-chart text-xs w-5"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-left leading-tight">Image Analysis</span>
          </button>
          
          <button
            onClick={startCamera}
            className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all border ${isCameraActive ? 'sidebar-active text-white' : 'bg-white/5 border-white/10 text-primary/60 hover:text-primary'}`}
          >
            <i className="fas fa-camera text-xs w-5"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-left leading-tight">Live Capture</span>
          </button>
        </div>
        
        <div className="mt-auto p-4 bg-pink-500/5 border border-pink-500/10 rounded-2xl">
          <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest mb-2">Neural Vision</p>
          <p className="text-[8px] text-primary/50 leading-relaxed font-bold uppercase tracking-tighter">
            Little Ai can perceive the world through your lens. Capture or upload to begin.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
        {/* Header */}
        <div className="p-10 pt-16 text-center space-y-2">
          <h1 className="text-4xl font-black text-primary tracking-tighter drop-shadow-2xl">
            Intelligence Visualizer
          </h1>
          <p className="text-primary/40 text-[10px] font-bold uppercase tracking-[0.3em]">
            Intelligent perception via neural optical layers
          </p>
        </div>

        {/* Work Area */}
        <div className="flex-1 px-10 pb-24 flex space-x-8">
          {/* Action Window */}
          <div 
            className={`flex-1 rounded-[3rem] border-2 border-dashed transition-all relative flex flex-col items-center justify-center p-4 backdrop-blur-3xl glass-panel ${
              dragActive ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 bg-black/5'
            } ${previewUrl || isCameraActive ? 'border-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isCameraActive ? (
              <div className="w-full h-full relative group rounded-[2.5rem] overflow-hidden shadow-4xl border border-white/20">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
                <div className="absolute inset-x-0 bottom-10 flex justify-center">
                   <button 
                    onClick={capturePhoto}
                    className="w-20 h-20 bg-white/20 backdrop-blur-xl border-4 border-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-4xl group/cap"
                   >
                     <div className="w-14 h-14 bg-white rounded-full group-active/cap:scale-75 transition-transform" />
                   </button>
                </div>
                <button onClick={stopCamera} className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all">
                  <i className="fas fa-times" />
                </button>
              </div>
            ) : previewUrl ? (
              <div className="w-full h-full relative group rounded-[2.5rem] overflow-hidden shadow-4xl border border-white/20">
                <img src={previewUrl} className="w-full h-full object-contain bg-black/50" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); onPlaySound?.('outside'); }}
                    className="bg-white text-black px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                   >
                     Reset Content
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-10">
                <label className="cursor-pointer flex flex-col items-center space-y-6 group">
                  <div className="w-24 h-24 bg-pink-500/10 rounded-[2.5rem] flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform shadow-inner">
                    <i className="fas fa-file-arrow-up text-3xl"></i>
                  </div>
                  <div className="text-center space-y-2">
                     <p className="text-sm font-black text-primary uppercase tracking-tight">Drop your visuals here</p>
                     <p className="text-[9px] font-bold text-primary/30 uppercase tracking-widest">Supports PNG, JPG, WEBP</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                
                <div className="flex items-center space-x-6">
                   <div className="w-10 h-[1px] bg-primary/10" />
                   <span className="text-[9px] font-black text-primary/20 uppercase tracking-[0.4em]">OR</span>
                   <div className="w-10 h-[1px] bg-primary/10" />
                </div>

                <button 
                  onClick={startCamera}
                  className="px-10 py-5 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <i className="fas fa-camera mr-4" />
                  Live Snapshot
                </button>
              </div>
            )}
          </div>

          {/* Result Window */}
          <div className="flex-1 rounded-[3rem] glass-panel flex flex-col overflow-hidden relative shadow-4xl">
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar relative">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="w-14 h-14 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em]">Establishing Neural Path...</p>
                </div>
              ) : result ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse shadow-[0_0_10px_#ec4899]"></div>
                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Synthesis Report</span>
                  </div>
                  <p className="text-primary text-[17px] leading-relaxed font-bold whitespace-pre-wrap selection:bg-pink-500/20">
                    {result}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-10 space-y-6">
                  <i className="fas fa-brain text-[8rem] text-primary"></i>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Awaiting Perception Link</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="absolute bottom-8 left-10 right-10 flex items-center justify-between pointer-events-none">
           <div className="flex space-x-4 pointer-events-auto">
              <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(''); stopCamera(); onPlaySound?.('scroll'); }} className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-primary/50 hover:text-primary transition-all border border-white/10">
                <i className="fas fa-rotate text-sm"></i>
              </button>
              <button onClick={() => result && navigator.clipboard.writeText(result)} className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center text-primary/50 hover:text-primary transition-all border border-white/10">
                <i className="fas fa-copy text-sm"></i>
              </button>
           </div>

           <button 
            onClick={handleProcess}
            disabled={loading || !previewUrl}
            className="bg-primary/5 hover:bg-primary/10 text-primary border border-white/20 rounded-3xl px-12 h-16 flex items-center space-x-6 transition-all group disabled:opacity-20 pointer-events-auto backdrop-blur-3xl shadow-4xl"
           >
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Execute Perception</span>
             <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
           </button>
        </div>
      </div>
    </div>
  );
};

export default VisionView;
