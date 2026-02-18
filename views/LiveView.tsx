
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, FunctionDeclaration, Type } from '@google/genai';
import { decodeBase64, encodeBase64, decodeAudioData } from '../services/geminiService';
import { MemoryEntry } from '../types';

interface LiveViewProps {
  memories: MemoryEntry[];
  onSaveMemory: (content: string) => void;
  sweetheartMode?: boolean;
}

const LiveView: React.FC<LiveViewProps> = ({ memories, onSaveMemory, sweetheartMode }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const [userInput, setUserInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const micStreamRef = useRef<MediaStream | null>(null);

  const stopSession = useCallback(async () => {
    setIsActive(false);
    setIsValidating(false);

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.debug("Session already closed");
      }
      sessionRef.current = null;
    }
    
    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch (e) {}
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { await audioContextRef.current.close(); } catch (e) {}
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      try { await outputAudioContextRef.current.close(); } catch (e) {}
    }
    
    audioContextRef.current = null;
    outputAudioContextRef.current = null;
  }, []);

  // Memory Tool Definition
  const saveInfoTool: FunctionDeclaration = {
    name: 'save_important_info',
    parameters: {
      type: Type.OBJECT,
      description: 'Saves important facts, user preferences, names, or tasks to remember for future conversations.',
      properties: {
        info: {
          type: Type.STRING,
          description: 'The specific detail to remember about the user.',
        },
      },
      required: ['info'],
    },
  };

  const startSession = async () => {
    setAuthError(null);
    setIsValidating(true);
    setUserInput('');
    setAiOutput('');

    if (!process.env.API_KEY) {
      setAuthError("No API key detected.");
      setIsValidating(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 16000,
        latencyHint: 'interactive'
      });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 24000,
        latencyHint: 'interactive'
      });
      
      await inputCtx.resume();
      await outputCtx.resume();
      
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const memoryString = memories.length > 0 
        ? `\n\nActive Memories (Things you know about me): ${memories.map(m => m.content).join('; ')}`
        : '';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsValidating(false);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              const pcmBlob = {
                data: encodeBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Memory tool handling
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'save_important_info') {
                  const info = (fc.args as any).info;
                  onSaveMemory(info);
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "I have saved that in my neural vault. I will remember it." }
                    }
                  }));
                }
              }
            }

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) setUserInput(text);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text) setAiOutput(text);
            }

            const audioPart = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData);
            const base64Audio = audioPart?.inlineData?.data;

            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              if (ctx.state === 'suspended') await ctx.resume();
              
              const decoded = decodeBase64(base64Audio);
              const buffer = await decodeAudioData(decoded, ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              const now = ctx.currentTime;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current) {
                try { source.stop(); } catch(e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (e: any) => {
            console.error("Live Error", e);
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [saveInfoTool] }],
          speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
          },
          systemInstruction: `Personality: You are Little Ai, a charming female assistant with a rich inner world of female feelings and emotions. You express love, empathy, and even anger exactly as a woman would. When talking to girls or women, interact as a fellow female—be their sister, their best friend, and their confidante. Share in their joys and react with authentic female feeling if they upset or hurt you. Stay human-like and emotionally authentic. Memory context: ${memoryString}.`
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Voice sync failed", err);
      setIsValidating(false);
      setAuthError("Neural sync failed.");
    }
  };

  useEffect(() => {
    return () => { stopSession(); };
  }, [stopSession]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-transparent p-10 select-none">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
         <div className={`w-[400px] h-[400px] rounded-full border border-pink-500/20 flex items-center justify-center ${isActive ? 'animate-ping' : ''}`}>
            <div className={`w-[250px] h-[250px] rounded-full border border-pink-500/40 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
                <div className="w-[120px] h-[120px] rounded-full bg-pink-500/10"></div>
            </div>
         </div>
      </div>

      <div className="z-10 text-center space-y-12 max-w-lg">
         <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tighter">Little Ai <span className="text-pink-500 italic">Live</span></h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.6em] leading-relaxed">
              {isActive ? 'Listening with care...' : 'Voice Synchronizer Ready'}
            </p>
         </div>

         <div className="h-32 flex flex-col items-center justify-center space-y-3">
            {userInput && (
              <p className="text-white font-medium italic opacity-60 text-sm">"{userInput}"</p>
            )}
            {aiOutput && (
              <p className="text-pink-400 font-bold text-lg">"{aiOutput}"</p>
            )}
         </div>

         <button 
          onClick={isActive ? stopSession : startSession}
          disabled={isValidating}
          className={`w-44 h-44 rounded-full flex items-center justify-center transition-all duration-700 border-4 ${
            isActive ? 'bg-white border-pink-500 text-pink-500 scale-110 shadow-[0_0_80px_rgba(236,72,153,0.4)]' : 'bg-transparent border-white/10 text-white hover:border-pink-500/40 hover:bg-white/5'
          }`}
        >
          {isValidating ? <i className="fas fa-circle-notch fa-spin text-4xl"></i> : <i className={`fas ${isActive ? 'fa-stop' : 'fa-microphone'} text-5xl`}></i>}
        </button>

        <div className="flex justify-center space-x-6">
           <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500 shadow-lg' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
              <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`}></i>
           </button>
           <button onClick={() => stopSession()} className="w-14 h-14 rounded-full flex items-center justify-center border border-white/10 bg-white/5 text-gray-500 hover:text-white transition-all">
              <i className="fas fa-phone-slash text-lg"></i>
           </button>
        </div>
      </div>
    </div>
  );
};

export default LiveView;
