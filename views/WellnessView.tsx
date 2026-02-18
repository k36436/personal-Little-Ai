
import React from 'react';

const WellnessView: React.FC = () => {
  const sections = [
    {
      title: "The Dopamine Loop",
      icon: "fa-atom",
      color: "text-blue-400",
      content: "Pornography and infinite-scroll feeds trigger massive dopamine spikes. Over time, the brain's reward system becomes desensitized, requiring more 'extreme' stimuli to feel normal. This can lead to a state of emotional numbness in daily life."
    },
    {
      title: "Neural Plasticity",
      icon: "fa-brain",
      color: "text-purple-400",
      content: "Frequent exposure to high-intensity digital content can 'rewire' neural pathways. It shifts the brain's focus from long-term satisfaction to short-term gratification, making complex tasks like studying or working significantly harder."
    },
    {
      title: "Behavioral Disconnect",
      icon: "fa-people-arrows",
      color: "text-green-400",
      content: "Reliance on digital fantasies can create unrealistic expectations for real-world interactions. This often results in social anxiety, decreased empathy, and a preference for isolation over human connection."
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#0b0c10] custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        
        {/* Header */}
        <div className="text-center space-y-6 pt-10">
          <div className="inline-flex items-center px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Digital Health Protocol</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Human Intelligence Recovery</h2>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            Little Ai goes beyond data—we care about the processor. Understand the impact of digital consumption on your neural architecture.
          </p>
        </div>

        {/* Main Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 space-y-4 hover:border-gray-600 transition-all group shadow-2xl">
              <div className={`w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center ${section.color} border border-gray-800 shadow-inner group-hover:scale-110 transition-transform`}>
                <i className={`fas ${section.icon} text-lg`}></i>
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">{section.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Actionable Advice Section */}
        <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-gray-800 rounded-[3rem] p-12 relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <i className="fas fa-shield-heart text-9xl"></i>
          </div>
          
          <div className="relative z-10 space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center space-x-4">
               <span className="w-8 h-1 bg-green-500 rounded-full"></span>
               <span>Neural Reset Roadmap</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">Strategy 01: Fasting</h4>
                 <p className="text-sm text-gray-400 leading-relaxed">Implement 'analog hours'—at least 2 hours before sleep and 1 hour after waking without any digital screens to allow cortisol levels to stabilize.</p>
               </div>
               <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Strategy 02: Real-World Anchoring</h4>
                 <p className="text-sm text-gray-400 leading-relaxed">Prioritize physical hobbies (gym, reading, hiking) that provide delayed gratification, which strengthens the prefrontal cortex.</p>
               </div>
            </div>

            <div className="pt-6 border-t border-gray-800">
               <p className="text-xs text-gray-600 font-bold uppercase tracking-widest text-center italic">
                 "A healthy mind is the ultimate competitive advantage in the age of Ai."
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessView;
