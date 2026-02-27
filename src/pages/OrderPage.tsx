import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Copy, Download, Home } from "lucide-react";

interface Order {
  id: number;
  productTitle: string;
  productImage: string;
  total: number;
  status: string;
  date: string;
  deliveryContent: string;
}

export function OrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) return <div className="p-8 text-center">Loading order...</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Success Header */}
        <div className="bg-green-50 p-8 text-center border-b border-green-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h1>
            <p className="text-green-700">Your order #{order.id} has been completed.</p>
        </div>

        <div className="p-8">
            {/* Delivery Content */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Your Purchased Content</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="text-sm text-gray-500 mb-2">Product Key / Account Details:</div>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white border border-gray-300 rounded px-4 py-3 font-mono text-lg text-gray-800 break-all">
                            {order.deliveryContent}
                        </code>
                        <button className="p-3 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600" title="Copy">
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>Sent to your email address automatically.</span>
                    </div>
                </div>
            </div>

            {/* Order Details */}
            <div className="border-t border-gray-100 pt-8">
                <h3 className="font-medium text-gray-900 mb-4">Order Details</h3>
                <div className="flex gap-4 mb-6">
                    <img src={order.productImage} alt={order.productTitle} className="w-20 h-20 object-cover rounded bg-gray-100" />
                    <div>
                        <div className="font-medium text-gray-900">{order.productTitle}</div>
                        <div className="text-sm text-gray-500 mt-1">Date: {new Date(order.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">Status: <span className="text-green-600 font-medium">{order.status}</span></div>
                    </div>
                    <div className="ml-auto font-bold text-lg">
                        ${order.total.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-8">
                <Link to="/" className="inline-flex items-center gap-2 text-[#FF3333] font-medium hover:underline">
                    <Home className="w-4 h-4" />
                    Return to Store
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
