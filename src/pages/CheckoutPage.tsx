import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, CreditCard, Lock, CheckCircle } from "lucide-react";

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

export function CheckoutPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [productId]);

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: product?.id,
                quantity: 1,
                paymentMethod
            })
        });
        
        if (res.ok) {
            const order = await res.json();
            navigate(`/order/${order.id}`);
        } else {
            alert("Failed to place order");
        }
    } catch (error) {
        console.error("Order error:", error);
        alert("An error occurred");
    } finally {
        setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading checkout...</div>;
  if (!product) return <div className="p-8 text-center">Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Payment & Billing */}
        <div className="md:col-span-2 space-y-6">
            
            {/* Payment Methods */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#FF3333]" />
                    Payment Method
                </h2>
                
                <div className="space-y-3">
                    <label className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${paymentMethod === 'credit_card' ? 'border-[#FF3333] bg-red-50' : 'border-gray-200'}`}>
                        <input 
                            type="radio" 
                            name="payment" 
                            value="credit_card" 
                            checked={paymentMethod === 'credit_card'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-[#FF3333] focus:ring-[#FF3333]"
                        />
                        <span className="ml-3 font-medium">Credit/Debit Card</span>
                        <div className="ml-auto flex gap-2">
                            <div className="w-8 h-5 bg-gray-200 rounded"></div>
                            <div className="w-8 h-5 bg-gray-200 rounded"></div>
                        </div>
                    </label>

                    <label className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${paymentMethod === 'crypto' ? 'border-[#FF3333] bg-red-50' : 'border-gray-200'}`}>
                        <input 
                            type="radio" 
                            name="payment" 
                            value="crypto" 
                            checked={paymentMethod === 'crypto'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-[#FF3333] focus:ring-[#FF3333]"
                        />
                        <span className="ml-3 font-medium">Cryptocurrency</span>
                        <span className="ml-auto text-xs text-gray-500">BTC, ETH, USDT</span>
                    </label>

                    <label className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-[#FF3333] bg-red-50' : 'border-gray-200'}`}>
                        <input 
                            type="radio" 
                            name="payment" 
                            value="paypal" 
                            checked={paymentMethod === 'paypal'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-[#FF3333] focus:ring-[#FF3333]"
                        />
                        <span className="ml-3 font-medium">PayPal</span>
                    </label>
                </div>
            </div>

            {/* Email Field (Mock) */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium mb-4">Contact Information</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address for Delivery</label>
                    <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#FF3333]" placeholder="you@example.com" />
                    <p className="text-xs text-gray-500 mt-1">Your product key will be sent to this email.</p>
                </div>
            </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="md:col-span-1">
            <div className="bg-white p-6 rounded shadow-sm border border-gray-200 sticky top-24">
                <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                
                <div className="flex gap-3 mb-4">
                    <img src={product.image} alt={product.title} className="w-16 h-16 object-cover rounded bg-gray-100" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium line-clamp-2">{product.title}</h3>
                        <div className="text-xs text-gray-500 mt-1">Qty: 1</div>
                    </div>
                </div>

                <div className="border-t border-gray-100 py-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span>$0.50</span>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-6">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-[#FF3333]">${(product.price + 0.50).toFixed(2)}</span>
                    </div>
                </div>

                <button 
                    onClick={handlePlaceOrder}
                    disabled={processing}
                    className="w-full bg-[#FF3333] hover:bg-red-600 text-white font-bold py-3 rounded shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {processing ? (
                        <span>Processing...</span>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" />
                            Pay Now
                        </>
                    )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Secure Encrypted Payment</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
