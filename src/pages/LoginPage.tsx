import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Lock, ArrowRight, Zap, Crown, CheckCircle2, Github, Mail, Globe } from "lucide-react";
import { motion } from "framer-motion";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email === "admin" && password === "admin123") {
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("username", "Admin");
        window.location.href = "/dashboard";
    } else {
        localStorage.setItem("userRole", "customer");
        localStorage.setItem("username", email || "Customer");
        window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Left Side: Illustration / Branding (Visible on Desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-900 via-dark-900 to-blue-900 relative p-16 flex-col justify-between overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-primary-500/10 blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
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
                    Access the World's Most <span className="text-gradient">Premium</span> Accounts.
                </h1>
                <p className="text-lg text-primary-100/60 font-light leading-relaxed mb-10">
                    Join thousands of elite users who trust AccountStore for their digital asset needs. Secure, instant, and reliable.
                </p>

                <div className="space-y-4">
                    {[
                        "Instant Delivery on all orders",
                        "24/7 Premium Support Access",
                        "Verified & Secure Transactions"
                    ].map((text, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-primary-200/80">
                            <CheckCircle2 className="w-5 h-5 text-primary-400" />
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>

        <div className="relative z-10">
            <div className="glass-card p-6 rounded-2xl border-white/5 bg-white/5">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold">JD</div>
                    <div>
                        <div className="text-sm font-bold text-white">James Dupont</div>
                        <div className="text-[10px] text-primary-400 uppercase tracking-widest font-bold">Elite Member</div>
                    </div>
                </div>
                <p className="text-xs text-white/60 italic leading-relaxed">
                    "The quality of service and account security is unmatched. I've been using AccountStore for 2 years and never had a single issue."
                </p>
            </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16 bg-dark-950 relative">
        {/* Mobile Header */}
        <div className="md:hidden absolute top-8 left-8">
            <Link to="/" className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary-400 fill-current" />
                <span className="text-xl font-display font-bold text-white">Account<span className="text-primary-400">Store</span></span>
            </Link>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[440px]"
        >
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-dark-50/50">Enter your credentials to access your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-dark-50/40 uppercase tracking-widest mb-2 ml-1">Email / Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-dark-50/30 group-focus-within:text-primary-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-dark-50/20 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all"
                                placeholder="name@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                            <label className="block text-xs font-bold text-dark-50/40 uppercase tracking-widest">Password</label>
                            <a href="#" className="text-[10px] font-bold text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest">Forgot?</a>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-dark-50/30 group-focus-within:text-primary-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-dark-50/20 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-1">
                    <input type="checkbox" id="remember" className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500/20" />
                    <label htmlFor="remember" className="text-xs text-dark-50/50 cursor-pointer select-none">Remember me for 30 days</label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-500/20 transition-all duration-300 flex items-center justify-center gap-2 group transform hover:-translate-y-0.5"
                >
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.3em]">
                        <span className="px-4 bg-dark-950 text-dark-50/20">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        { icon: Globe, label: "Google", color: "hover:bg-red-500/10 hover:text-red-400" },
                        { icon: Github, label: "Github", color: "hover:bg-white/10 hover:text-white" },
                        { icon: Mail, label: "Discord", color: "hover:bg-indigo-500/10 hover:text-indigo-400" }
                    ].map((item, i) => (
                        <button key={i} type="button" className={`flex flex-col items-center justify-center py-3 rounded-xl border border-white/5 bg-white/2 backdrop-blur-sm transition-all duration-300 ${item.color}`}>
                            <item.icon className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </div>
            </form>

            <div className="mt-12 text-center text-sm">
                <span className="text-dark-50/40">Don't have an account? </span>
                <Link to="/signup" className="text-primary-400 font-bold hover:text-primary-300 transition-colors underline underline-offset-4">Join now</Link>
            </div>
        </motion.div>
        
        {/* Floating Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
}
