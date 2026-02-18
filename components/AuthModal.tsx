
import React, { useState } from 'react';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
  initialMode: 'signin' | 'signup';
  isMandatory?: boolean;
}

const STORAGE_KEY = 'little_ai_vault_users';

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, initialMode, isMandatory }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getUsers = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const users = getUsers();
      if (mode === 'signup') {
        if (users[formData.username]) {
          setError('Username already linked. Try signing in.');
          setLoading(false);
          return;
        }
        const newUser: User = {
          username: formData.username,
          name: formData.username,
          fullName: formData.fullName,
          phone: '',
          gender: '',
          credit: 100,
          birthday: { day: '1', month: '1', year: '2000' },
          isLoggedIn: true
        };
        users[formData.username] = { ...newUser, password: formData.password };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        onLogin(newUser);
      } else {
        const user = users[formData.username];
        if (user && user.password === formData.password) {
          onLogin(user);
        } else {
          setError('Invalid credentials. Check your Neural ID.');
          setLoading(false);
        }
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
      <div className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[3.5rem] p-10 md:p-14 shadow-4xl relative overflow-hidden group max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500/0 via-pink-500 to-pink-500/0 opacity-30"></div>
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-pink-500/5 rounded-[1.5rem] flex items-center justify-center text-pink-500 mx-auto mb-6 border border-pink-500/10 shadow-2xl">
            <i className={`fas ${mode === 'signin' ? 'fa-fingerprint' : 'fa-sparkles'} text-2xl`}></i>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            {mode === 'signin' ? 'Link ID' : 'New Identity'}
          </h2>
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mt-3">Neural Authentication Protocol</p>
        </div>

        {/* Social Login Buttons Section */}
        <div className="space-y-3 mb-10">
          <button className="w-full bg-white text-black h-14 rounded-2xl flex items-center justify-center space-x-4 hover:scale-[1.02] transition-all group font-bold shadow-xl">
             <i className="fab fa-google text-lg"></i>
             <span className="text-[11px] uppercase tracking-widest font-black">Google ke sath connect karein</span>
          </button>
          <button className="w-full bg-[#1877F2] text-white h-14 rounded-2xl flex items-center justify-center space-x-4 hover:scale-[1.02] transition-all group font-bold shadow-xl">
             <i className="fab fa-facebook-f text-lg"></i>
             <span className="text-[11px] uppercase tracking-widest font-black">Facebook ke sath connect karein</span>
          </button>
          <button className="w-full bg-black border border-white/10 text-white h-14 rounded-2xl flex items-center justify-center space-x-4 hover:scale-[1.02] transition-all group font-bold shadow-xl">
             <i className="fab fa-apple text-xl"></i>
             <span className="text-[11px] uppercase tracking-widest font-black">Apple ID ke sath connect karein</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-10">
           <div className="h-[1px] flex-1 bg-white/5"></div>
           <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em]">OR USE NEURAL ID</span>
           <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>

        <form onSubmit={handleAction} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest pl-4">Username</label>
            <input 
              required
              type="text" 
              placeholder="Your Neural ID"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white focus:outline-none focus:border-pink-500/20 transition-all font-bold text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest pl-4">Security Key</label>
            <input 
              required
              type="password" 
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white focus:outline-none focus:border-pink-500/20 transition-all font-mono"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl active:scale-95 disabled:opacity-20 flex items-center justify-center"
          >
            {loading ? <i className="fas fa-spinner fa-spin mr-3"></i> : null}
            {mode === 'signin' ? 'Establish Link' : 'Register Profile'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-[9px] font-black text-gray-600 hover:text-white uppercase tracking-widest transition-all"
          >
            {mode === 'signin' ? "Need a profile? Join Little Ai" : "Already Identified? Link ID"}
          </button>
        </div>

        {!isMandatory && (
          <button onClick={onClose} className="absolute top-8 right-8 text-gray-700 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
