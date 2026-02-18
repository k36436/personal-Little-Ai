
import React, { useState, useEffect, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { saveToVault, getFromVault } from '../services/storageService';
import { AppView } from '../types';

const VIDEO_PROMPT_EXAMPLES = [
  {
    category: "Cinematic",
    icon: "fa-film",
    prompts: [
      "A breathtaking drone shot of a hidden crystal-clear waterfall deep in a lush tropical rainforest, cinematic lighting, 8k resolution, slow motion.",
      "An epic wide shot of a lone astronaut standing on the edge of a vast Martian canyon during a dust storm, dramatic orange lighting, hyper-realistic.",
      "A mysterious noir scene of a detective walking down a wet cobblestone street at night, flickering streetlights, heavy fog, high contrast."
    ]
  },
  {
    category: "Animated",
    icon: "fa-wand-magic-sparkles",
    prompts: [
      "A whimsical 3D animated scene of a small steampunk robot trying to plant a glowing digital flower in a metallic garden, Pixar style, vibrant colors.",
      "A hand-drawn Ghibli-style landscape of a floating island with windmills and lush green meadows under a soft summer sky.",
      "A playful claymation-style sequence of a curious cat discovering a magical box that shoots out colorful confetti."
    ]
  },
  {
    category: "Documentary",
    icon: "fa-camera-retro",
    prompts: [
      "A macro documentary-style shot of a honeybee landing on a dew-covered lavender flower, morning sunlight, shallow depth of field, sharp focus.",
      "A close-up of a master watchmaker's hands assembling an intricate mechanical movement, soft natural lighting, museum-quality detail.",
      "Slow-motion capture of a breaking wave at sunset, crystalline water textures, golden hour lighting, National Geographic style."
    ]
  }
];

interface VideoViewProps {
  onViewChange: (view: AppView) => void;
  onPlaySound?: (type: 'click' | 'settings' | 'scroll' | 'outside') => void;
}

const VideoView: React.FC<VideoViewProps> = ({ onViewChange, onPlaySound }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkKey();
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getFromVault('neural_video_history');
    if (data) setHistory(data);
  };

  const checkKey = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected);
    }
  };

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true); 
    }
  };

  const handleUsePrompt = (p: string) => {
    setPrompt(p);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `little-ai-render-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download failed", e);
      window.open(videoUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    onPlaySound?.('click');
    setLoading(true);
    setVideoUrl(null);
    setLoadingStep('Initializing generation model...');

    try {
      const steps = [
        'Connecting to Veo 3.1 Fast...',
        'Processing prompt semantics...',
        'Generating frames (this may take a minute)...',
        'Synthesizing temporal consistency...',
        'Finalizing video stream...'
      ];
      
      let stepIndex = 0;
      const interval = setInterval(() => {
        setLoadingStep(steps[stepIndex % steps.length]);
        stepIndex++;
      }, 10000);

      const url = await generateVideo(prompt);
      clearInterval(interval);
      setVideoUrl(url);

      const newEntry = {
        id: Date.now().toString(),
        prompt,
        uri: url,
        timestamp: Date.now()
      };
      const newHistory = [newEntry, ...history].slice(0, 10);
      setHistory(newHistory);
      await saveToVault('neural_video_history', newHistory);

    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Requested entity was not found')) {
        setHasKey(false);
        alert("Session expired or API key invalid. Please select your key again.");
      } else {
        alert("Video generation failed. Ensure you are using a paid GCP project API key.");
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  if (!hasKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#030303] text-center relative">
        {/* Universal Back Button */}
        <button 
          onClick={() => onViewChange(AppView.CHAT)}
          className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
        >
          <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
        </button>
        <div className="w-24 h-24 bg-yellow-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-yellow-500/20 shadow-2xl">
          <i className="fas fa-key text-4xl text-yellow-500"></i>
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tighter text-white">Neural Key Required</h2>
        <p className="text-gray-500 max-w-md mb-10 text-sm leading-relaxed font-medium uppercase tracking-tight">
          Video generation using Veo requires a specific API key from a paid GCP project. 
          Please initialize your secure connection.
        </p>
        <button 
          onClick={handleOpenKeySelector}
          className="px-12 py-5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-[2rem] font-black shadow-2xl shadow-yellow-900/20 transition-all uppercase tracking-[0.3em] text-[10px]"
        >
          Select Neural Key
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar bg-transparent relative">
      
      {/* Universal Back Button */}
      <button 
        onClick={() => onViewChange(AppView.CHAT)}
        className="fixed top-8 left-32 z-[100] flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-3xl group shadow-2xl"
      >
        <i className="fas fa-chevron-left text-[10px] group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Link</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-12 pb-32 pt-20">
        
        {/* Header Section */}
        <div className="text-center space-y-4 pt-10">
          <div className="inline-flex items-center px-6 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-2 backdrop-blur-3xl shadow-2xl">
            <div className="w-2 h-2 rounded-full mr-3 bg-yellow-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">
              Cinematic Synthesis Layer
            </span>
          </div>
          <h2 className="text-6xl font-black tracking-tighter text-white leading-none">
            Video Lab
          </h2>
          <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed opacity-60">
            Transform conceptual directives into cinematic motion pictures. Saved to 1TB Vault.
          </p>
        </div>

        {/* Input Bar */}
        <div className="glass-panel rounded-[3.5rem] p-10 space-y-10 shadow-4xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12 pointer-events-none">
            <i className="fas fa-video text-[15rem]"></i>
          </div>

          <div className="space-y-4 relative z-10">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 h-44 resize-none focus:outline-none focus:border-yellow-500/20 transition-all text-white text-lg placeholder:text-gray-800 font-medium selection:bg-yellow-500/30"
            />
          </div>

          <div className="flex items-center justify-end relative z-10">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-white/5 disabled:text-gray-700 text-white h-16 px-12 rounded-[2.2rem] font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl shadow-yellow-900/40 active:scale-95 flex items-center group/btn"
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-4"></i>
                  Synthesizing...
                </>
              ) : (
                <>
                  <i className="fas fa-wand-magic-sparkles mr-4 group-hover/btn:rotate-12 transition-transform"></i>
                  {videoUrl ? 'Re-Generate' : 'Initialize Render'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Display Area */}
        <div className="space-y-6">
          <div className="glass-panel rounded-[4rem] min-h-[500px] flex items-center justify-center overflow-hidden shadow-4xl relative">
            {loading ? (
              <div className="text-center space-y-10 px-10 relative z-10">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_40px_rgba(234,179,8,0.2)]"></div>
                </div>
                <p className="text-3xl font-black text-white tracking-tighter uppercase">{loadingStep}</p>
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay className="w-full h-full bg-black block"></video>
            ) : (
              <div className="text-center space-y-8 opacity-20 px-12">
                <i className="fas fa-clapperboard text-5xl"></i>
                <p className="text-2xl font-black uppercase tracking-tighter text-gray-400">Cinematic Void</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoView;
