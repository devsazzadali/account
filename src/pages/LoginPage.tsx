import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, Zap, Crown, CheckCircle2, Github, Mail, Globe, Facebook, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSocialLogin = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert("Social Authentication Error: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;

        if (authData.user) {
            // Check role from profiles
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, username')
                .eq('id', authData.user.id)
                .single();

            if (profile) {
                localStorage.setItem("userRole", profile.role);
                localStorage.setItem("username", profile.username || "User");
                
                if (profile.role === 'admin') {
                    navigate("/admin");
                } else {
                    navigate("/dashboard");
                }
            } else {
                // Fallback if profile trigger hasn't finished
                localStorage.setItem("userRole", "user");
                navigate("/dashboard");
            }
        }
    } catch (err: any) {
        alert("Access Denied: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans text-slate-900">
      {/* Left Side: Illustration / Branding (Visible on Desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-slate-50 relative p-16 flex-col justify-between overflow-hidden border-r border-slate-200">
        {/* Animated Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#1dbf73]/10 blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 mb-12 group">
                <div className="w-10 h-10 rounded-xl bg-white backdrop-blur-md border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Zap className="w-6 h-6 text-[#1dbf73] fill-current" />
                </div>
                <span className="text-2xl font-display font-bold text-slate-900 tracking-tight">Account<span className="text-[#1dbf73]">Store</span></span>
            </Link>

            <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-md"
            >
                <h1 className="text-5xl font-display font-bold text-slate-900 leading-tight mb-6">
                    Access the World's Most <span className="bg-gradient-to-r from-[#1dbf73] to-emerald-400 bg-clip-text text-transparent">Premium</span> Accounts.
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
                    Join thousands of elite users who trust AccountStore for their digital asset needs. Secure, instant, and reliable.
                </p>

                <div className="space-y-4">
                    {[
                        "Instant Delivery on all orders",
                        "24/7 Premium Support Access",
                        "Verified & Secure Transactions"
                    ].map((text, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                            <CheckCircle2 className="w-5 h-5 text-[#1dbf73]" />
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>

        <div className="relative z-10">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1dbf73] to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">JD</div>
                    <div>
                        <div className="text-sm font-bold text-slate-900">James Dupont</div>
                        <div className="text-[10px] text-[#1dbf73] uppercase tracking-widest font-black">Elite Member</div>
                    </div>
                </div>
                <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                    "The quality of service and account security is unmatched. I've been using AccountStore for 2 years and never had a single issue."
                </p>
            </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16 bg-white relative">
        {/* Mobile Header */}
        <div className="md:hidden absolute top-8 left-8">
            <Link to="/" className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-[#1dbf73] fill-current" />
                <span className="text-xl font-display font-bold text-slate-900">Account<span className="text-[#1dbf73]">Store</span></span>
            </Link>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[440px]"
        >
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome Back</h2>
                <p className="text-slate-500">Enter your credentials to access your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email / Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-300 group-focus-within:text-[#1dbf73] transition-colors" />
                            </div>
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#1dbf73] focus:ring-4 focus:ring-[#1dbf73]/10 transition-all shadow-sm"
                                placeholder="name@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                            <a href="#" className="text-[10px] font-bold text-[#1dbf73] hover:text-[#19a463] transition-colors uppercase tracking-widest">Forgot?</a>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-[#1dbf73] transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#1dbf73] focus:ring-4 focus:ring-[#1dbf73]/10 transition-all shadow-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-1">
                    <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-[#1dbf73] focus:ring-[#1dbf73]/20" />
                    <label htmlFor="remember" className="text-xs text-slate-500 cursor-pointer select-none">Remember me for 30 days</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#1dbf73] to-[#19a463] hover:from-[#19a463] hover:to-[#148852] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#1dbf73]/20 transition-all duration-300 flex items-center justify-center gap-2 group transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Sign In
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.3em]">
                        <span className="px-4 bg-white text-slate-400">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <button 
                        type="button" 
                        onClick={() => handleSocialLogin('google')}
                        className="flex flex-col items-center justify-center py-3 rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:bg-red-50 hover:text-red-600"
                    >
                        <Globe className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Google</span>
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleSocialLogin('github')}
                        className="flex flex-col items-center justify-center py-3 rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:bg-slate-50 hover:text-slate-900"
                    >
                        <Github className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Github</span>
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleSocialLogin('facebook')}
                        className="flex flex-col items-center justify-center py-3 rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <Facebook className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
                    </button>
                </div>
            </form>

            <div className="mt-12 text-center text-sm">
                <span className="text-slate-500">Don't have an account? </span>
                <Link to="/signup" className="text-[#1dbf73] font-bold hover:text-[#19a463] transition-colors underline underline-offset-4">Join now</Link>
            </div>
        </motion.div>
        
        {/* Floating Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#1dbf73]/5 blur-[150px] rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
}
