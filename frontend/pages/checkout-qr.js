import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { triggerToast } from '../components/Toast';

const API_URL = 'http://localhost:3001/api';

export default function CheckoutQR() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch(`${API_URL}/donhang`)
      .then(r => r.json())
      .then(orders => {
        const found = orders.find(o => o.donhangid === parseInt(orderId));
        if (found) {
          setOrder(found);
        } else {
          triggerToast('Không tìm thấy đơn hàng!', 'error');
          router.push('/');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Trigger unsuccessful email after 5 minutes if user stays without confirming payment
    const timer = setTimeout(() => {
      if (orderId) {
        fetch(`${API_URL}/donhang/${orderId}/unsuccessful-email`, { method: 'POST' }).catch(console.error);
      }
    }, 5 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [orderId]);

  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const handleCancelQR = async (e) => {
    e.preventDefault();
    try {
      if (orderId) {
        await fetch(`${API_URL}/donhang/${orderId}/unsuccessful-email`, { method: 'POST' });
      }
    } catch (err) {
      console.error(err);
    }
    router.push('/');
  };

  const handleConfirmPayment = async () => {
    try {
      await fetch(`${API_URL}/donhang/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Chờ xác nhận' })
      });
      triggerToast('Đã gửi xác nhận thanh toán! Đơn hàng đang chờ quản trị viên duyệt.', 'success');
      router.push(`/thankyou?orderId=${orderId}`);
    } catch (err) {
      console.error(err);
      triggerToast('Có lỗi xảy ra, vui lòng thử lại!', 'error');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 font-bold">Đang nạp thông tin thanh toán...</p>
      </div>
    );
  }

  if (!order) return null;

  const cleanName = removeAccents(order.tennguoinhan).toUpperCase();
  // VietQR parameters
  const bankId = 'MB';
  const accountNo = '0002102342503';
  const accountName = 'MAI VAN KHANH';
  const amount = order.tongTien;
  const addInfo = `DH${order.donhangid} ${cleanName}`.substring(0, 50); // limit chars for VietQR

  // Generate VietQR URL
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 md:p-10 space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-wider">Thanh toán chuyển khoản QR</h1>
          <p className="text-xs text-gray-400">Vui lòng quét mã QR dưới đây hoặc chuyển khoản theo thông tin chi tiết.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* QR Image Box */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100/50 shadow-inner">
            <img 
              src={qrUrl} 
              alt="Mã VietQR thanh toán" 
              className="w-full max-w-[240px] aspect-square object-contain bg-white rounded-xl shadow-md border border-gray-150 p-2"
            />
            <span className="text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-wider">Quét qua ứng dụng Ngân hàng (VietQR)</span>
          </div>

          {/* Transfer Details */}
          <div className="space-y-4 text-xs">
            <div className="border-b border-gray-55 pb-2">
              <span className="text-gray-450 block font-semibold uppercase">Tên ngân hàng</span>
              <span className="text-sm font-bold text-gray-800">MB Bank (Ngân hàng Quân Đội)</span>
            </div>
            
            <div className="border-b border-gray-55 pb-2">
              <span className="text-gray-450 block font-semibold uppercase">Số tài khoản</span>
              <span className="text-sm font-black text-indigo-700 font-mono select-all">{accountNo}</span>
            </div>

            <div className="border-b border-gray-55 pb-2">
              <span className="text-gray-450 block font-semibold uppercase">Chủ tài khoản</span>
              <span className="text-sm font-bold text-gray-800 uppercase">{accountName}</span>
            </div>

            <div className="border-b border-gray-55 pb-2">
              <span className="text-gray-450 block font-semibold uppercase">Số tiền</span>
              <span className="text-sm font-black text-indigo-700">{formatPrice(amount)}</span>
            </div>

            <div className="border-b border-gray-55 pb-2 bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/40">
              <span className="text-indigo-600 block font-bold uppercase text-[10px]">Nội dung chuyển khoản bắt buộc</span>
              <span className="text-sm font-black text-indigo-700 font-mono select-all block mt-0.5">{addInfo}</span>
            </div>
          </div>

        </div>

        {/* Buttons */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleCancelQR}
            className="flex-1 text-center py-3 px-6 rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-600 transition-all text-xs font-bold cursor-pointer"
          >
            Hủy / Trở về trang chủ
          </button>
          <button 
            onClick={handleConfirmPayment}
            className="flex-grow py-3 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-xs font-bold shadow-md hover:shadow-lg text-center cursor-pointer"
          >
            Xác nhận đã thanh toán
          </button>
        </div>

      </div>
    </div>
  );
}
