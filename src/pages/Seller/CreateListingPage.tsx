import React, { useState } from "react";
import { ChevronDown, Info, Upload, AlertCircle } from "lucide-react";

export function CreateListingPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 max-w-6xl py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
            Home / Store Management / Create Listing
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-gray-400">🛠️</span> Game details
                </h1>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-8">
                {/* Custom Program 1 Section */}
                <div className="bg-gray-50 rounded border border-gray-200">
                    <div className="bg-[#333] text-white px-4 py-2 text-sm font-medium flex justify-between items-center rounded-t">
                        <span>Custom Program 1</span>
                        <div className="flex gap-2 text-gray-400">
                            <span>^</span>
                            <span>🗑️</span>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Title */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <label className="md:col-span-2 text-sm font-medium text-gray-700">Title</label>
                            <div className="md:col-span-10">
                                <input 
                                    type="text" 
                                    placeholder="Title"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <label className="md:col-span-2 text-sm font-medium text-gray-700 pt-2">Description</label>
                            <div className="md:col-span-10">
                                <textarea 
                                    rows={5}
                                    placeholder="Description"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]"
                                ></textarea>
                            </div>
                        </div>

                        {/* Add Image */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <label className="md:col-span-2 text-sm font-medium text-gray-700">Add Image</label>
                            <div className="md:col-span-10 flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter image URL"
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]"
                                />
                                <button className="bg-[#FF3333] text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600">
                                    Add Image
                                </button>
                            </div>
                        </div>
                        <div className="md:col-start-3 md:col-span-10 text-xs text-gray-500 text-right">
                            Third-party image hosting sites are supported. Please see list of supported domains and accepted URL format.
                        </div>
                    </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]">
                            <option>USD</option>
                            <option>EUR</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Price Per Unit</label>
                        <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Min Unit Per Order</label>
                        <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Stock <Info className="inline w-3 h-3 text-gray-400" /></label>
                        <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                    </div>
                </div>

                {/* Product Specification */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Product Specification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-xs font-medium text-gray-700">Registration time</label>
                            <div className="col-span-2">
                                <input type="text" placeholder="2000-12-31" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                                <div className="text-[10px] text-red-500 mt-1 flex items-start gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    If when you are not sure of the exact time, you can choose the last day of the year.
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-xs font-medium text-gray-700">Registered Country</label>
                            <div className="col-span-2">
                                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-500">
                                    <option>Please Select</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-xs font-medium text-gray-700">FRIENDS</label>
                            <div className="col-span-2">
                                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-xs font-medium text-gray-700">FOLLOWERS</label>
                            <div className="col-span-2">
                                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                            <label className="text-xs font-medium text-gray-700">Marketplace</label>
                            <div className="col-span-2">
                                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-500">
                                    <option>Please Select</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-6 border-t border-gray-200">
                    <button className="bg-[#FF3333] hover:bg-red-600 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2">
                        <span className="text-lg">+</span> Add Custom Program
                    </button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
