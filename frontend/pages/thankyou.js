import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ThankYou() {
  const router = useRouter();
  const { orderId } = router.query;
  const [checking, setChecking] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [zlpResult, setZlpResult] = useState(null);

  useEffect(() => {
    if (!router.isReady || !orderId) return;

    setChecking(true);
    
    // 1. Fetch order details to know exact payment method
    fetch(`http://localhost:3001/api/donhang`)
      .then(res => res.json())
      .then(orders => {
        const found = orders.find(o => String(o.donhangid) === String(orderId));
        if (found) {
          setOrderData(found);
          const pMethod = found.phuongthucthanhtoan || found.phuongThucThanhToan;
          
          if (pMethod === 'ZaloPay') {
            // Real-time Query to ZaloPay Server for ZaloPay orders ONLY
            fetch('http://localhost:3001/api/zalopay/check-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ donhangID: orderId })
            })
              .then(res => res.json())
              .then(data => {
                setZlpResult(data);
                setChecking(false);
              })
              .catch(err => {
                console.error('Error checking ZaloPay status:', err);
                setChecking(false);
              });
          } else {
            // COD or QR payments do NOT query ZaloPay
            setChecking(false);
          }
        } else {
          setChecking(false);
        }
      })
      .catch(err => {
        console.error('Error fetching order info:', err);
        setChecking(false);
      });
  }, [router.isReady, orderId]);

  const handleRePayZaloPay = async () => {
    try {
      setChecking(true);
      const res = await fetch(`http://localhost:3001/api/zalopay/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donhangID: orderId })
      });
      const data = await res.json();
      if (data.order_url) {
        window.location.href = data.order_url;
      }
    } catch (err) {
      console.error(err);
      setChecking(false);
    }
  };

  const paymentMethod = orderData?.phuongthucthanhtoan || orderData?.phuongThucThanhToan || 'COD';

  return (
    <div className="max-w-xl w-full mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 md:p-12 space-y-6">
        
        {checking ? (
          <div className="space-y-4 py-8">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-700">Đang nạp thông tin đơn hàng...</p>
          </div>
        ) : (
          <>
            {/* Case 1: COD or QR Ngân hàng (Always Success Thank-You Page) */}
            {paymentMethod !== 'ZaloPay' && (
              <>
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <svg className="w-10 h-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>

                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wider">Đặt hàng thành công!</h1>
                
                <p className="text-sm text-gray-500 leading-relaxed">
                  Cảm ơn bạn đã mua sắm tại <span className="font-extrabold text-indigo-600">LSBook Store</span>. Đơn hàng ({paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng - COD' : 'Chuyển khoản QR Ngân hàng'}) của bạn đã được ghi nhận vào hệ thống và đang <strong className="text-amber-600">Chờ xác nhận</strong>.
                </p>

                {orderId && (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-w-xs mx-auto">
                    <span className="text-xxs font-bold text-gray-400 uppercase block tracking-wider">Mã số đơn hàng</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">#{orderId}</span>
                  </div>
                )}

                <div className="pt-6 flex flex-col sm:flex-row gap-3">
                  <Link href="/" className="flex-1 text-center py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all text-xs font-bold">
                    Tiếp tục mua hàng
                  </Link>
                  <Link href="/profile?tab=orders" className="flex-1 text-center py-3 px-6 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl transition-all text-xs font-bold shadow-md hover:shadow-lg">
                    Xem lịch sử đơn hàng
                  </Link>
                </div>
              </>
            )}

            {/* Case 2: ZaloPay Payment handling */}
            {paymentMethod === 'ZaloPay' && (
              <>
                {zlpResult && zlpResult.success ? (
                  <>
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <svg className="w-10 h-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wider">Đặt hàng & Thanh toán thành công!</h1>
                    
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Cảm ơn bạn đã mua sắm tại <span className="font-extrabold text-indigo-600">LSBook Store</span>. Giao dịch ZaloPay đã được đối soát thực tế <strong className="text-green-600">Thành công</strong>. Đơn hàng đang ở trạng thái <strong>Chờ xác nhận</strong>.
                    </p>

                    {orderId && (
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-w-xs mx-auto">
                        <span className="text-xxs font-bold text-gray-400 uppercase block tracking-wider">Mã số đơn hàng</span>
                        <span className="text-lg font-black text-indigo-700 font-mono">#{orderId}</span>
                      </div>
                    )}

                    <div className="pt-6 flex flex-col sm:flex-row gap-3">
                      <Link href="/" className="flex-1 text-center py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all text-xs font-bold">
                        Tiếp tục mua hàng
                      </Link>
                      <Link href="/profile?tab=orders" className="flex-1 text-center py-3 px-6 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl transition-all text-xs font-bold shadow-md hover:shadow-lg">
                        Xem lịch sử đơn hàng
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Warning / Error Icon */}
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>

                    <h1 className="text-xl font-black text-gray-900 uppercase tracking-wider text-amber-600">Thanh toán ZaloPay chưa thành công</h1>
                    
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Hệ thống đối soát thực tế từ ZaloPay cho thấy giao dịch chưa được hoàn tất hoặc gặp lỗi (Mã phản hồi: <span className="font-mono text-gray-500 font-bold">{zlpResult?.zlpData?.return_code || zlpResult?.status || 'N/A'}</span>). Đơn hàng <strong className="font-mono text-indigo-700">#{orderId}</strong> của bạn hiện ở trạng thái <strong className="text-blue-700">Chờ thanh toán</strong>.
                    </p>

                    {orderId && (
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 max-w-xs mx-auto">
                        <span className="text-xxs font-bold text-blue-400 uppercase block tracking-wider">Trạng thái đơn hàng</span>
                        <span className="text-sm font-black text-blue-800 uppercase">Chờ thanh toán</span>
                      </div>
                    )}

                    <div className="pt-6 flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={handleRePayZaloPay} 
                        className="flex-1 text-center py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all text-xs font-bold shadow-md cursor-pointer"
                      >
                        Thanh toán lại qua ZaloPay
                      </button>
                      <Link href="/profile?tab=orders" className="flex-1 text-center py-3 px-6 border border-gray-250 hover:bg-gray-50 text-gray-700 rounded-xl transition-all text-xs font-bold">
                        Xem lịch sử đơn hàng
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
