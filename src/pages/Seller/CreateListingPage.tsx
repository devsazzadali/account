import React, { useState } from "react";
import { ChevronDown, Info, Upload, AlertCircle } from "lucide-react";

export function CreateListingPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-sans text-slate-900">
      <div className="container mx-auto px-4 max-w-6xl py-12">
        {/* Breadcrumb */}
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
            Home / Store Management / <span className="text-primary-600">Create Listing</span>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50/50 border-b border-slate-100 p-8">
                <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
                        <Upload size={20} />
                    </div>
                    Asset Specification
                </h1>
            </div>

            {/* Form Content */}
            <div className="p-10 space-y-12">
                {/* Custom Program Section */}
                <div className="bg-slate-50/50 rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 text-white px-8 py-4 text-xs font-bold uppercase tracking-widest flex justify-between items-center">
                        <span>Digital Asset Node #1</span>
                        <div className="flex gap-4">
                            <button className="hover:text-primary-400 transition-colors">Minimize</button>
                            <button className="hover:text-red-400 transition-colors text-red-500">Purge</button>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        {/* Title */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            <label className="md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Title</label>
                            <div className="md:col-span-10">
                                <input 
                                    type="text" 
                                    placeholder="Ex: High-Tier Valorant Account - Immortal 3"
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            <label className="md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">Description</label>
                            <div className="md:col-span-10">
                                <textarea 
                                    rows={5}
                                    placeholder="Provide detailed technical specifications and history of the asset..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                                ></textarea>
                            </div>
                        </div>

                        {/* Add Image */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            <label className="md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Media Hub</label>
                            <div className="md:col-span-10 flex gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Enter secure image URL"
                                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                                />
                                <button className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20">
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Currency</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 transition-all shadow-sm appearance-none cursor-pointer">
                            <option>USD - Dollar</option>
                            <option>EUR - Euro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Unit Valuation</label>
                        <input type="text" placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 transition-all shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Min Acquisition</label>
                        <input type="text" defaultValue="1" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 transition-all shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Stock Reserve</label>
                        <input type="text" placeholder="Quantity" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 transition-all shadow-sm" />
                    </div>
                </div>

                {/* Product Specification */}
                <div className="pt-8 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                        Asset Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origin Time</label>
                            <div className="col-span-2">
                                <input type="text" placeholder="YYYY-MM-DD" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none shadow-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Region Node</label>
                            <div className="col-span-2">
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none shadow-sm appearance-none cursor-pointer">
                                    <option>Global Protocol</option>
                                    <option>North America</option>
                                    <option>European Union</option>
                                    <option>Asia Pacific</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connections</label>
                            <div className="col-span-2">
                                <input type="text" placeholder="Internal Links" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none shadow-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Auth</label>
                            <div className="col-span-2">
                                <input type="text" placeholder="Verification Level" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-10 border-t border-slate-100 flex justify-end gap-6">
                    <button className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all">
                        Cancel Protocol
                    </button>
                    <button className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/20 flex items-center gap-3 group">
                        <span>Initialize Listing</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
