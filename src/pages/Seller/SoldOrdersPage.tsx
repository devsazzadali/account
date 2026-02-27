import React from "react";
import { Search, Info } from "lucide-react";

export function SoldOrdersPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
            Home / My Orders(Selling)
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-gray-800">📦</span> Sold Orders
                </h1>
                <p className="text-xs text-gray-500 mt-1">17 Results</p>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/30">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700 w-20">Order Status:</label>
                        <select className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm">
                            <option>Delivered</option>
                            <option>Pending</option>
                            <option>Completed</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700 w-12">Game:</label>
                        <select className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm">
                            <option>All</option>
                            <option>Facebook</option>
                            <option>Instagram</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700 w-16">category:</label>
                        <select className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm">
                            <option>All</option>
                            <option>Accounts</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700 w-24">Order number:</label>
                        <input type="text" placeholder="Order number" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700 w-20">Product Title:</label>
                        <input type="text" placeholder="Product Title" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700 w-12">Internal remarks:</label>
                        <input type="text" placeholder="Internal remarks" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700 w-16">From:</label>
                        <div className="flex-1 flex gap-2">
                            <input type="date" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                            <span className="text-gray-400 self-center">to</span>
                            <input type="date" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                    </div>
                    <div>
                        <button className="w-full bg-[#FF4400] hover:bg-[#E63E00] text-white font-bold py-1.5 rounded text-sm transition-colors">
                            Search
                        </button>
                    </div>
                </div>
                
                {/* Status Tabs */}
                <div className="flex gap-2 mt-4">
                    <button className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded bg-white hover:bg-gray-50">New Order(0)</button>
                    <button className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded bg-white hover:bg-gray-50">Delivering(0)</button>
                    <button className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded bg-white hover:bg-gray-50">PREPARING(0)</button>
                    <button className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded bg-white hover:bg-gray-50">ISSUE(0)</button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 w-1/3">Product</th>
                            <th className="px-4 py-3 text-center">Unit Price</th>
                            <th className="px-4 py-3 text-center">Type</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3">Internal remarks@</th>
                            <th className="px-4 py-3 text-right">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <OrderRow 
                            id="27291519957" 
                            buyer="Fixame" 
                            date="2026-06-10 20:39:51"
                            title="🔥LIMITED OFFER🔥 Buy three accounts get One free, Old Facebook available from (2013-2019) VERIFIED✅ And suitable✅ for marketplace 🙏🙏 LIMITED OFFER BUY 3 GET 1 FREE Order Now! 🔥🔥"
                            price="USD 4.5"
                            total="USD 4.50"
                            status="Completed"
                        />
                        <OrderRow 
                            id="27150904073" 
                            buyer="bea***@gmail.com" 
                            date="2026-06-07 21:36:07"
                            title="🔥LIMITED OFFER🔥 Buy three accounts get One free, Old Facebook available from (2013-2019) VERIFIED✅ And suitable✅ for marketplace 🙏🙏 LIMITED OFFER BUY 3 GET 1 FREE Order Now! 🔥🔥"
                            price="USD 4.5"
                            total="USD 4.50"
                            status="Completed"
                        />
                        <OrderRow 
                            id="29707715061" 
                            buyer="bea***@gmail.com" 
                            date="2026-06-05 22:11:53"
                            title="🔥LIMITED OFFER🔥 Buy three accounts get One free, Old Facebook available from (2013-2019) VERIFIED✅ And suitable✅ for marketplace 🙏🙏 LIMITED OFFER BUY 3 GET 1 FREE Order Now! 🔥🔥"
                            price="USD 4.5"
                            total="USD 4.50"
                            status="Completed"
                        />
                        <OrderRow 
                            id="26030290305" 
                            buyer="tophusa" 
                            date="2026-06-03 04:07:46"
                            title="USA 2016-2020 Years Aged Account For Sell.Full Usa Profile. Marketplace Enabled. Perfect for ADS With Gamil Veryfied Account."
                            price="USD 10"
                            total="USD 10.00"
                            status="Completed"
                        />
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 flex justify-center">
                <div className="flex gap-1">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">1</button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">3</button>
                    <span className="px-2 py-1">...</span>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Next</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ id, buyer, date, title, price, total, status }: { id: string, buyer: string, date: string, title: string, price: string, total: string, status: string }) {
    return (
        <tr className="hover:bg-gray-50">
            <td className="px-4 py-4">
                <div className="text-xs text-gray-500 mb-1">
                    Order number: <span className="text-gray-700">{id}</span> &nbsp; buyer: <span className="text-blue-500">{buyer}</span> &nbsp; Date: {date}
                </div>
                <div className="text-sm font-medium text-gray-800 line-clamp-2" title={title}>
                    {title}
                </div>
            </td>
            <td className="px-4 py-4 text-center text-sm text-gray-700">{price}</td>
            <td className="px-4 py-4 text-center">
                <div className="w-6 h-6 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs">👤</span>
                </div>
            </td>
            <td className="px-4 py-4 text-center">
                <div className="inline-flex flex-col items-center">
                    <span className="text-xs font-bold text-green-600">{status}</span>
                    <span className="text-[10px] text-gray-500">Order Detail</span>
                </div>
            </td>
            <td className="px-4 py-4"></td>
            <td className="px-4 py-4 text-right font-bold text-gray-800">{total}</td>
        </tr>
    )
}
