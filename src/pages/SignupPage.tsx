import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Lock, Mail, Shield, Zap, ArrowRight, CheckCircle2, Globe, Github } from "lucide-react";
import { motion } from "framer-motion";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic
    console.log("Signup:", email, password);
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans text-slate-900">
      {/* Left Side: Branding / Features (Desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-slate-900 via-slate-800 to-primary-950 relative p-16 flex-col justify-between overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-blue-500/10 blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary-500/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
        
        <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 mb-12 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-primary-400 fill-current" />
                </div>
                <span className="text-2xl font-display font-bold text-white tracking-tight">Account<span className="text-primary-400">Store</span></span>
            </Link>

            <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-md"
            >
                <h1 className="text-5xl font-display font-bold text-white leading-tight mb-6">
                    Start Your <span className="bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">Premium</span> Journey Today.
                </h1>
                <p className="text-lg text-slate-300 font-light leading-relaxed mb-10">
                    Create an account to unlock exclusive access to the most coveted digital assets in the industry.
                </p>

                <div className="space-y-6">
                    {[
                        { title: "Global Marketplace", desc: "Access accounts from sellers worldwide." },
                        { title: "Titan™ Protection", desc: "Your transactions are shielded by our elite security." },
                        { title: "Instant Access", desc: "Get your digital assets delivered in seconds." }
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="mt-1 p-1 bg-primary-500/20 rounded-full border border-primary-500/30">
                                <CheckCircle2 className="w-4 h-4 text-primary-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white mb-0.5">{item.title}</div>
                                <div className="text-xs text-slate-400">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <span>Verified Platform</span>
            <div className="w-1 h-1 bg-white/10 rounded-full"></div>
            <span>Secure Cloud</span>
            <div className="w-1 h-1 bg-white/10 rounded-full"></div>
            <span>2026 Edition</span>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16 bg-white relative">
        {/* Mobile Header */}
        <div className="md:hidden absolute top-8 left-8">
            <Link to="/" className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary-600 fill-current" />
                <span className="text-xl font-display font-bold text-slate-900">Account<span className="text-primary-600">Store</span></span>
            </Link>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[460px]"
        >
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Create Account</h2>
                <p className="text-slate-500">Join the elite community of digital asset owners.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                                    placeholder="you@domain.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Shield className="h-5 w-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3 ml-1">
                    <input type="checkbox" id="terms" required className="w-4 h-4 mt-0.5 rounded border-slate-200 bg-slate-50 text-primary-600 focus:ring-primary-500/20" />
                    <label htmlFor="terms" className="text-xs text-slate-500 cursor-pointer select-none leading-relaxed">
                        I agree to the <a href="#" className="text-primary-600 hover:text-primary-500 transition-colors underline">Terms of Service</a> and <a href="#" className="text-primary-600 hover:text-primary-500 transition-colors underline">Privacy Policy</a>.
                    </label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-500/20 transition-all duration-300 flex items-center justify-center gap-2 group transform hover:-translate-y-0.5"
                >
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.3em]">
                        <span className="px-4 bg-white text-slate-400">Or register with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {[
                        { icon: Globe, label: "Google", color: "hover:bg-red-50 hover:text-red-600 border-slate-100" },
                        { icon: Github, label: "Github", color: "hover:bg-slate-50 hover:text-slate-900 border-slate-100" }
                    ].map((item, i) => (
                        <button key={i} type="button" className={`flex items-center justify-center gap-3 py-3 rounded-xl border bg-white shadow-sm transition-all duration-300 ${item.color}`}>
                            <item.icon className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </div>
            </form>

            <div className="mt-12 text-center text-sm">
                <span className="text-slate-500">Already have an account? </span>
                <Link to="/login" className="text-primary-600 font-bold hover:text-primary-500 transition-colors underline underline-offset-4">Sign in</Link>
            </div>
        </motion.div>
        
        {/* Floating Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
}
