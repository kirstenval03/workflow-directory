import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as WhiteLogo } from '../styles/logo-white.svg';
import bgGradient from '../styles/AI-GRADIENT-02.png';
import { Lock } from 'lucide-react'; // ✅ Lucide icon

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      console.log('✅ User logged in successfully:', data.user);
      navigate('/admin');
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center font-sans"
      style={{ background: `url(${bgGradient}) center/cover no-repeat` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Main card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex w-[880px] h-[520px] overflow-hidden">
        
        {/* LEFT: Login form */}
        <div className="flex flex-col justify-center items-center w-1/2 p-12 text-white">
          <WhiteLogo className="w-28 mb-6" />
          <h2 className="text-2xl font-semibold mb-6 text-center">Welcome Back</h2>

          <form onSubmit={handleLogin} className="w-full flex flex-col space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="p-3 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="p-3 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-colors text-white font-medium py-2 rounded-lg mt-2 shadow-lg"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

          <p className="text-gray-300 text-xs mt-8 opacity-80 text-center">
            © {new Date().getFullYear()} AI Architechs
          </p>
        </div>

        {/* RIGHT: Decorative panel */}
        <div className="w-1/2 bg-gradient-to-br from-blue-800/20 to-cyan-600/10 flex flex-col items-center justify-center border-l border-white/15">
          <div className="flex flex-col items-center text-white/80">
            <div className="p-4 bg-white/10 rounded-full mb-4 border border-white/20 shadow-[0_0_25px_rgba(54,209,255,0.2)]">
              <Lock size={44} strokeWidth={1.5} />
            </div>
            <p className="max-w-[220px] text-center text-sm leading-relaxed">
              Secure access for authorized AI Architechs administrators only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
