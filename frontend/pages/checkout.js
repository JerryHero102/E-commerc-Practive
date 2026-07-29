import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { triggerToast } from '../components/Toast';

const API_URL = 'http://localhost:3001/api';

export default function Checkout() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  
  // User info form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Dialog/Modal state
  const [showCodModal, setShowCodModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('LS_currentUser');
    let cartKey = 'LS_cart_guest';
    
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setFullName(user.hoTen || '');
      setPhone(user.soDienThoai || '');
      setEmail(user.email || '');
      setAddress(user.diaChi || '');
      cartKey = `LS_cart_${user.nguoiDungID}`;
    }

    const cartData = JSON.parse(localStorage.getItem(cartKey) || '[]');
    setCart(cartData);
    if (cartData.length === 0) {
      router.push('/cart');
    }
  }, []);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await fetch(`${API_URL}/magiamgia/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          userID: currentUser ? currentUser.nguoiDungID : null
        })
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.voucher);
        setCouponError('');
        triggerToast('Áp dụng mã giảm giá thành công!', 'success');
      } else {
        setCouponError(data.message || 'Mã giảm giá không hợp lệ!');
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error(err);
      setCouponError('Đã xảy ra lỗi khi xác thực mã giảm giá!');
    }
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.giaBan * item.quantity, 0);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    const rate = parseFloat(appliedCoupon.tiLe !== undefined ? appliedCoupon.tiLe : appliedCoupon.tile || 0);
    const subtotal = getSubtotal();
    return (subtotal * rate) / 100;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    return subtotal - discount;
  };

  const submitOrder = async () => {
    try {
      const targetEmail = currentUser ? currentUser.email : email.trim();
      const orderPayload = {
        nguoiDungID: currentUser ? currentUser.nguoiDungID : null,
        email: targetEmail,
        maGiamID: appliedCoupon ? appliedCoupon.magiamid : null,
        diaChiGiao: address.trim(),
        sdtNguoiNhan: phone.trim(),
        tenNguoiNhan: fullName.trim(),
        tongTien: getTotal(),
        phuongThucThanhToan: paymentMethod,
        ghiChu: notes.trim(),
        items: cart
      };

      const res = await fetch(`${API_URL}/donhang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const order = await res.json();
        
        // Clear cart
        const cartKey = currentUser ? `LS_cart_${currentUser.nguoiDungID}` : 'LS_cart_guest';
        localStorage.setItem(cartKey, JSON.stringify([]));
        window.dispatchEvent(new Event('cart-updated'));
        
        if (paymentMethod === 'COD') {
          triggerToast('Đặt hàng thành công!', 'success');
          router.push(`/thankyou?orderId=${order.donhangID}`);
        } else if (paymentMethod === 'ZaloPay') {
          try {
            triggerToast('Đang kết nối Cổng thanh toán ZaloPay...', 'info');
            const zlpRes = await fetch(`${API_URL}/zalopay/create-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ donhangID: order.donhangID })
            });
            const zlpData = await zlpRes.json();
            if (zlpData.order_url) {
              window.location.href = zlpData.order_url;
            } else {
              triggerToast('Không thể kết nối ZaloPay Gateway. Chuyển sang xác nhận đơn...', 'warning');
              router.push(`/thankyou?orderId=${order.donhangID}`);
            }
          } catch (zlpErr) {
            console.error(zlpErr);
            router.push(`/thankyou?orderId=${order.donhangID}`);
          }
        } else {
          // QR Payment redirects to dynamic VietQR page
          router.push(`/checkout-qr?orderId=${order.donhangID}`);
        }
      } else {
        const err = await res.json();
        triggerToast(`Đơn hàng không thể xử lý: ${err.error || 'Vui lòng thử lại!'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Đặt hàng thất bại!', 'error');
    }
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    const targetEmail = currentUser ? currentUser.email : email.trim();
    if (!fullName.trim() || !phone.trim() || !address.trim() || !targetEmail) {
      triggerToast('Vui lòng điền đầy đủ các thông tin giao nhận bắt buộc!', 'warning');
      return;
    }

    if (paymentMethod === 'COD') {
      setShowCodModal(true);
    } else {
      submitOrder();
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  if (cart.length === 0) return null;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-wider">Đặt hàng & Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Shipping details form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">Thông tin giao hàng</h2>
            
            <form id="shipping-form" onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Họ tên người nhận *</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập tên người nhận hàng..."
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Số điện thoại người nhận *</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Số điện thoại nhận hàng..."
                    className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ email *</label>
                  {currentUser ? (
                    <input 
                      type="email" 
                      value={currentUser.email}
                      disabled
                      className="mt-2 block w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                    />
                  ) : (
                    <>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        required
                      />
                      <p className="text-xxs text-gray-400 font-medium mt-1">Điền email nhận mã đơn hàng để theo dõi vận chuyển</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ nhận hàng *</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, ngõ/ngách, tên đường, phường/xã, quận/huyện..."
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Ghi chú giao hàng (nếu có)</label>
                <textarea 
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao..."
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </form>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">Phương thức thanh toán</h2>
            
            <div className="mt-6 space-y-3">
              <label className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:border-indigo-500 transition-colors">
                <input 
                  type="radio" 
                  name="payment" 
                  value="COD" 
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-800 block">Thanh toán khi nhận hàng (COD)</span>
                  <span className="text-xs text-gray-400">Bạn sẽ thanh toán tiền mặt cho nhân viên giao hàng sau khi nhận và kiểm tra sách.</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:border-indigo-500 transition-colors">
                <input 
                  type="radio" 
                  name="payment" 
                  value="QR(ngân hàng)" 
                  checked={paymentMethod === 'QR(ngân hàng)'}
                  onChange={() => setPaymentMethod('QR(ngân hàng)')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-800 block">Chuyển khoản qua mã QR (QR ngân hàng)</span>
                  <span className="text-xs text-gray-400">Hiển thị mã QR động chứa đầy đủ thông tin số tiền và số tài khoản để quét thanh toán nhanh.</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:border-blue-500 transition-colors">
                <input 
                  type="radio" 
                  name="payment" 
                  value="ZaloPay" 
                  checked={paymentMethod === 'ZaloPay'}
                  onChange={() => setPaymentMethod('ZaloPay')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0068FF] text-white flex items-center justify-center font-extrabold text-[9px] uppercase shadow-xs shrink-0">
                    ZaloPay
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-800 block">ZaloPay</span>
                    <span className="text-xs text-gray-400">Thanh toán trực tuyến bảo mật qua ZaloPay QR đa năng, Ví ZaloPay, Thẻ ATM/Visa/Mastercard.</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order details side box */}
        <div className="col-span-1 space-y-6">
          {/* Coupon input */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">Mã giảm giá</h3>
            <form onSubmit={handleApplyCoupon} className="mt-4 flex gap-2">
              <input 
                type="text" 
                placeholder="Nhập mã (VD: KM10)" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all uppercase"
              />
              <button type="submit" className="bg-gray-900 hover:bg-black text-white font-bold py-1.5 px-4 rounded-xl transition-all text-xs">
                Áp dụng
              </button>
            </form>
            {couponError && <p className="text-xs text-red-500 mt-2 font-semibold">{couponError}</p>}
            {appliedCoupon && (
              <div className="mt-3 bg-green-50 border border-green-200 text-green-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex justify-between items-center">
                <span>Khấu trừ {appliedCoupon.tile}% (Giảm {appliedCoupon.maGiam || appliedCoupon.magiam})</span>
                <button type="button" onClick={() => setAppliedCoupon(null)} className="text-green-900 hover:text-red-500">×</button>
              </div>
            )}
          </div>

          {/* Pricing summary */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">Giỏ sách của bạn</h3>
            
            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto pr-1">
              {cart.map(item => (
                <div key={item.sachID} className="flex justify-between py-2.5 text-xs">
                  <span className="text-gray-600 line-clamp-1 max-w-[150px]">{item.tenSach} <span className="font-bold text-indigo-600">x{item.quantity}</span></span>
                  <span className="font-semibold text-gray-800">{formatPrice(item.giaBan * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span className="font-semibold text-gray-800">{formatPrice(getSubtotal())}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({appliedCoupon.tile}%)</span>
                  <span className="font-semibold">- {formatPrice(getDiscountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-green-600 uppercase text-[10px]">Miễn phí</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                <span className="font-black text-gray-900 text-sm">Tổng thanh toán</span>
                <span className="text-xl font-black text-indigo-700">{formatPrice(getTotal())}</span>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                form="shipping-form"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-sm text-center"
              >
                {paymentMethod === 'COD' ? 'Thanh toán' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cash/COD Confirmation Dialog Modal */}
      {showCodModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            
            <h3 className="text-center text-sm font-bold text-gray-900 mb-2">Bạn muốn thanh toán bằng tiền mặt?</h3>
            <p className="text-center text-xs text-gray-500 mb-6 leading-relaxed">
              Bạn sẽ trả tiền mặt trực tiếp cho nhân viên giao hàng sau khi nhận và kiểm tra đơn sách của mình.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCodModal(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all text-xs font-bold"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  setShowCodModal(false);
                  submitOrder();
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-xs font-bold shadow-sm"
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-up {
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
