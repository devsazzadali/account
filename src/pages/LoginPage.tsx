import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Lock, Home, UserPlus, RefreshCw } from "lucide-react";

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
        // Default to customer for any other credentials
        localStorage.setItem("userRole", "customer");
        localStorage.setItem("username", email || "Customer");
        window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-[#D12020] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern (Optional) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full border-[40px] border-white"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full border-[60px] border-white"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-2xl relative z-10">
        <div className="text-center">
          <h2 className="text-[#FF3333] font-bold text-3xl tracking-tighter mb-2">Account Store One</h2>
          <h2 className="text-xl font-bold text-red-600 font-serif">Login</h2>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FF3333] focus:border-[#FF3333] sm:text-sm bg-blue-50/30"
                placeholder="Username / Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FF3333] focus:border-[#FF3333] sm:text-sm bg-blue-50/30"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {/* Captcha Simulation */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <RefreshCw className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Captcha"
                        className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FF3333] focus:border-[#FF3333] sm:text-sm bg-blue-50/30"
                    />
                </div>
                <div className="w-32 bg-gray-200 rounded-md flex items-center justify-center text-xl font-mono tracking-widest text-gray-500 italic border border-gray-300 select-none">
                    8R3k9
                </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <a href="#" className="font-medium text-gray-500 hover:text-[#FF3333]">
                Problem to Login?
              </a>
            </div>
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-[#FF3333] hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3333] shadow-lg transform transition hover:-translate-y-0.5"
          >
            LOGIN
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-bold text-blue-600">Or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <SocialButton color="bg-red-500" icon="G" label="Connect with Google" />
             <SocialButton color="bg-blue-600" icon="f" label="Connect with Facebook" />
             <SocialButton color="bg-[#171a21]" icon="S" label="Connect with Steam" />
             <SocialButton color="bg-black" icon="X" label="Connect with Twitter" />
             <SocialButton color="bg-black" icon="♪" label="Connect with TikTok" />
             <SocialButton color="bg-[#5865F2]" icon="D" label="Connect with Discord" />
          </div>
        </form>
        
        <div className="mt-6 flex justify-between items-center pt-6 border-t border-gray-100">
            <Link to="/signup" className="flex flex-col items-center text-gray-600 hover:text-[#FF3333] group">
                <UserPlus className="w-6 h-6 mb-1 text-teal-500 group-hover:text-[#FF3333]" />
                <span className="text-xs font-bold">Register</span>
                <span className="text-[10px] text-gray-400">Not a member yet?</span>
            </Link>
            
            <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-[#FF3333] group">
                <Home className="w-6 h-6 mb-1 text-orange-400 group-hover:text-[#FF3333]" />
                <span className="text-xs font-bold">Return to Home Page</span>
                <span className="text-[10px] text-gray-400">Go back to the home page</span>
            </Link>
        </div>
      </div>
    </div>
  );
}

function SocialButton({ color, icon, label }: { color: string, icon: string, label: string }) {
    return (
        <button className={`${color} text-white py-2 px-3 rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}>
            <span className="font-bold font-serif">{icon}</span>
            <span className="text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
        </button>
    )
}
