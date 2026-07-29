import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { triggerToast } from '../components/Toast';
import { API_URL } from '../config';

export default function OrderLookup() {
  const [phoneQuery, setPhoneQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [books, setBooks] = useState([]);
  const [searched, setSearched] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const CANCEL_REASONS = [
    'Thay đổi ý định mua',
    'Tìm thấy giá rẻ hơn ở nơi khác',
    'Thời gian giao hàng quá lâu',
    'Muốn thay đổi phương thức thanh toán/vận chuyển',
    'Khác'
  ];

  // Cancel Order Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Thay đổi ý định mua');
  const [customReason, setCustomReason] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankUser, setBankUser] = useState('');

  // Product Feedback Modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [feedbackRatings, setFeedbackRatings] = useState({}); // { bookID: rating }
  const [feedbackContents, setFeedbackContents] = useState({}); // { bookID: text }

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phoneQuery.trim()) {
      triggerToast('Vui lòng nhập số điện thoại!', 'warning');
      return;
    }

    try {
      const [ordersRes, detailsRes, booksRes] = await Promise.all([
        fetch(`${API_URL}/donhang`).then(r => r.json()),
        fetch(`${API_URL}/chitietdonhang`).then(r => r.json()),
        fetch(`${API_URL}/sach`).then(r => r.json())
      ]);

      // Filter orders by phone number (exact match or partial match)
      const cleanedQuery = phoneQuery.trim().replace(/[\s.-]/g, '');
      const filtered = ordersRes.filter(o => {
        const cleanedPhone = o.sdtnguoinhan.replace(/[\s.-]/g, '');
        return cleanedPhone === cleanedQuery || cleanedPhone.includes(cleanedQuery);
      });

      setOrders(filtered);
      setOrderDetails(detailsRes);
      setBooks(booksRes);
      setSearched(true);

      if (filtered.length === 0) {
        triggerToast('Không tìm thấy đơn hàng nào khớp với số điện thoại này!', 'info');
      } else {
        triggerToast(`Tìm thấy ${filtered.length} đơn hàng!`, 'success');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Lỗi truy vấn đơn hàng!', 'error');
    }
  };

  const handleOpenCancelModal = (order) => {
    setCancellingOrder(order);
    setCancelReason('Thay đổi ý định mua');
    setCustomReason('');
    setBankAccount('');
    setBankName('');
    setBankUser('');
    setShowCancelModal(true);
  };

  const submitCancelOrder = async () => {
    if (!cancellingOrder) return;
    
    const isCOD = cancellingOrder.phuongthucthanhtoan === 'COD';
    const isUnpaid = (cancellingOrder.trangthaidonhang || cancellingOrder.trangThaiDonHang) === 'Chờ thanh toán';
    const needsRefund = !isCOD && !isUnpaid;
    
    // Validate bank details if not COD and already paid
    if (needsRefund) {
      if (!bankAccount.trim() || !bankName.trim() || !bankUser.trim()) {
        triggerToast('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng để hoàn tiền!', 'warning');
        return;
      }
    }

    let finalReason = cancelReason;
    if (cancelReason === 'Khác' && customReason.trim()) {
      finalReason = customReason.trim();
    }
    
    if (needsRefund) {
      finalReason += ` | STK hoàn tiền: ${bankAccount.trim()} - Ngân hàng: ${bankName.trim()} - Tên người nhận: ${bankUser.trim()}`;
    }

    try {
      const res = await fetch(`${API_URL}/donhang/${cancellingOrder.donhangid}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason })
      });

      if (res.ok) {
        triggerToast('Hủy đơn hàng thành công!', 'success');
        setShowCancelModal(false);
        setCancellingOrder(null);
        
        // Refresh orders list
        const [ordersRes, detailsRes] = await Promise.all([
          fetch(`${API_URL}/donhang`).then(r => r.json()),
          fetch(`${API_URL}/chitietdonhang`).then(r => r.json())
        ]);
        const cleanedQuery = phoneQuery.trim().replace(/[\s.-]/g, '');
        const filtered = ordersRes.filter(o => {
          const cleanedPhone = o.sdtnguoinhan.replace(/[\s.-]/g, '');
          return cleanedPhone === cleanedQuery || cleanedPhone.includes(cleanedQuery);
        });
        setOrders(filtered);
        setOrderDetails(detailsRes);
      } else {
        triggerToast('Hủy đơn hàng thất bại!', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Lỗi hủy đơn hàng!', 'error');
    }
  };

  const handleOpenFeedbackModal = (order) => {
    setFeedbackOrder(order);
    const items = getOrderItems(order.donhangid);
    const ratings = {};
    const contents = {};
    items.forEach(item => {
      ratings[item.sachid] = 5;
      contents[item.sachid] = '';
    });
    setFeedbackRatings(ratings);
    setFeedbackContents(contents);
    setShowFeedbackModal(true);
  };

  const handleFeedbackRatingChange = (bookId, ratingVal) => {
    setFeedbackRatings(prev => ({ ...prev, [bookId]: ratingVal }));
  };

  const handleFeedbackContentChange = (bookId, text) => {
    setFeedbackContents(prev => ({ ...prev, [bookId]: text }));
  };

  const submitFeedback = async () => {
    if (!feedbackOrder) return;
    const items = getOrderItems(feedbackOrder.donhangid);

    for (const item of items) {
      const text = feedbackContents[item.sachid] || '';
      if (!text.trim()) {
        triggerToast(`Vui lòng nhập nội dung nhận xét cho cuốn "${item.tenSach}"!`, 'warning');
        return;
      }
    }

    try {
      const promises = items.map(item => {
        const starRating = feedbackRatings[item.sachid] || 5;
        const reviewText = feedbackContents[item.sachid] || '';
        const guestName = feedbackOrder.tennguoiNhan || feedbackOrder.tennguoinhan || 'Khách vãng lai';
        const finalContent = `[Khách vãng lai: ${guestName}] ${reviewText.trim()}`;
        
        return fetch(`${API_URL}/danhgia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nguoiDungID: null,
            sachID: item.sachid,
            soSao: starRating,
            noiDung: finalContent
          })
        });
      });

      await Promise.all(promises);
      triggerToast('Đã gửi phản hồi sản phẩm thành công!', 'success');
      setShowFeedbackModal(false);
      setFeedbackOrder(null);
    } catch (err) {
      console.error(err);
      triggerToast('Gửi phản hồi thất bại!', 'error');
    }
  };

  const toggleDetails = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const getOrderItems = (orderId) => {
    const items = orderDetails.filter(d => d.donhangid === orderId);
    return items.map(item => {
      const book = books.find(b => b.sachID === item.sachid);
      return {
        ...item,
        tenSach: book ? book.tenSach : `Sách #${item.sachid}`,
        hinhAnh: book ? book.hinhAnh : ''
      };
    });
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 md:p-10 space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-wider">Tìm kiếm đơn hàng</h1>
          <p className="text-xs text-gray-400">Tra cứu nhanh lịch sử mua hàng bằng số điện thoại nhận hàng của bạn.</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto bg-gray-50 p-2 rounded-2xl border border-gray-150">
          <input 
            type="tel" 
            placeholder="Vui lòng nhập số điện thoại để tìm kiếm đơn..."
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            className="flex-grow bg-transparent px-4 py-2 text-sm text-gray-700 focus:outline-none placeholder-gray-400 font-mono"
            required
          />
          <button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm text-xs"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Results Section */}
        {searched && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đơn hàng tìm thấy ({orders.length})</h2>
            
            {orders.length === 0 ? (
              <p className="text-gray-450 italic text-sm text-center py-8">Không có dữ liệu đơn hàng khớp với số điện thoại này.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((o) => {
                  const isExpanded = expandedOrderId === o.donhangid;
                  return (
                    <div key={o.donhangid} className="py-4 space-y-3">
                      <div className="flex flex-wrap justify-between items-center text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-gray-900 text-sm block">Đơn hàng #{o.donhangid}</span>
                          <p className="text-gray-400 font-medium">Khách hàng: <span className="font-semibold text-gray-700">{o.tennguoinhan}</span> | SĐT: <span className="font-mono">{o.sdtnguoinhan}</span></p>
                          <p className="text-gray-400 font-medium">Địa chỉ: <span className="font-semibold text-gray-700">{o.diachigiao}</span></p>
                        </div>
                        
                        <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.trangThaiDonHang === 'Chờ thanh toán' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            o.trangThaiDonHang === 'Chờ xác nhận' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            o.trangThaiDonHang === 'Đang vận chuyển' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                            o.trangThaiDonHang === 'Đã hoàn thành' ? 'bg-green-50 text-green-600 border border-green-200' :
                            'bg-red-50 text-red-750 border border-red-200'
                          }`}>
                            {o.trangThaiDonHang}
                          </span>

                          {o.trangThaiDonHang === 'Chờ thanh toán' && (
                            <button
                              onClick={async () => {
                                if (o.phuongthucthanhtoan === 'ZaloPay') {
                                  try {
                                    triggerToast('Đang kết nối ZaloPay Gateway...', 'info');
                                    const res = await fetch(`http://localhost:3001/api/zalopay/create-payment`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ donhangID: o.donhangid })
                                    });
                                    const data = await res.json();
                                    if (data.order_url) {
                                      window.location.href = data.order_url;
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                } else {
                                  router.push(`/checkout-qr?orderId=${o.donhangid}`);
                                }
                              }}
                              className="text-xxs font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-all select-none shadow-xs cursor-pointer"
                            >
                              Thanh toán ngay
                            </button>
                          )}
                          <span className="font-black text-indigo-700 text-sm">{formatPrice(o.tongTien)}</span>
                          
                          {(o.trangThaiDonHang === 'Chờ xác nhận' || o.trangThaiDonHang === 'Chờ thanh toán') && (
                            <button 
                              onClick={() => handleOpenCancelModal(o)}
                              className="text-xxs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded transition-all select-none"
                            >
                              Hủy đơn
                            </button>
                          )}
                          {(o.trangThaiDonHang === 'Đã hoàn thành' || o.trangThaiDonHang === 'Đã giao') && (
                            <button 
                              onClick={() => handleOpenFeedbackModal(o)}
                              className="text-xxs font-bold text-indigo-650 hover:text-indigo-850 border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded transition-all select-none"
                            >
                              Phản hồi sản phẩm
                            </button>
                          )}
                          
                          <button 
                            onClick={() => toggleDetails(o.donhangid)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors select-none"
                          >
                            {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable book list details */}
                      {isExpanded && (
                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 space-y-3 animate-fade-in">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Danh sách sách đã mua:</p>
                          <div className="space-y-2">
                            {getOrderItems(o.donhangid).map(item => (
                              <div key={item.idchitietdonhang} className="flex justify-between items-center text-xs">
                                <span className="text-gray-700 font-medium">{item.tenSach} <span className="text-indigo-600 font-extrabold ml-1">x{item.soluong}</span></span>
                                <span className="font-semibold text-gray-800">{formatPrice(item.donGia * item.soluong)}</span>
                              </div>
                            ))}
                          </div>
                          {o.ghichu && (
                            <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-450 italic">
                              Ghi chú: {o.ghichu}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Cancellation Modal */}
      {showCancelModal && cancellingOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl animate-scale-up space-y-4 text-left">
            
            {/* Title */}
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Bạn có chắc chắn muốn hủy đơn hàng #{cancellingOrder.donhangid}?
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">Vui lòng chọn lý do để xác nhận hủy đơn.</p>
            </div>

            {/* Display info */}
            <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2 border border-gray-100/50">
              <p className="text-gray-500 font-medium">Họ và tên: <span className="font-bold text-gray-800">{cancellingOrder.tennguoinhan}</span></p>
              <p className="text-gray-500 font-medium">Số điện thoại: <span className="font-bold text-gray-800">{cancellingOrder.sdtnguoinhan}</span></p>
              <p className="text-gray-500 font-medium font-sans">Địa chỉ: <span className="font-bold text-gray-800">{cancellingOrder.diachigiao}</span></p>
            </div>

            {/* Refund logic ONLY for paid non-COD payment */}
            {cancellingOrder.phuongthucthanhtoan !== 'COD' && (cancellingOrder.trangthaidonhang || cancellingOrder.trangThaiDonHang) !== 'Chờ thanh toán' && (
              <div className="space-y-3 border-t border-b border-gray-100 py-3">
                <p className="text-xxs font-bold text-indigo-600 uppercase tracking-wider">Thông tin tài khoản nhận hoàn tiền</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase">Số tài khoản *</label>
                    <input 
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Nhập số tài khoản..."
                      className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase">Ngân hàng *</label>
                    <input 
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Ví dụ: Vietcombank..."
                      className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase">Tên người nhận *</label>
                  <input 
                    type="text"
                    value={bankUser}
                    onChange={(e) => setBankUser(e.target.value)}
                    placeholder="Nhập tên không dấu..."
                    className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all uppercase"
                  />
                </div>
                
                {/* Disclaimer */}
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-[10px] text-amber-800 leading-normal font-medium">
                  <strong>Lưu ý:</strong> Số tiền sẽ được hoàn trong vòng 7 ngày làm việc. Số tài khoản và Tên người nhận phải chính xác. Nếu sai sót thông tin, chúng tôi sẽ không chịu trách nhiệm.
                </div>
              </div>
            )}

            {/* Cancel reason dropdown */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Lý do hủy đơn *</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="block w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                {CANCEL_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Custom reason input if selected 'Khác' */}
            {cancelReason === 'Khác' && (
              <input 
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do khác..."
                className="block w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            )}

            {/* Modal Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-gray-250 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-xs text-center"
              >
                Hủy
              </button>
              <button
                onClick={submitCancelOrder}
                className="flex-1 py-2 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all text-xs text-center shadow-sm"
              >
                Xác nhận hủy đơn
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && feedbackOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-gray-100 shadow-2xl animate-scale-up space-y-4 max-h-[85vh] overflow-y-auto text-left">
            
            {/* Title */}
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Phản hồi sản phẩm - Đơn hàng #{feedbackOrder.donhangid}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Vui lòng viết nhận xét và chấm điểm sao cho từng sản phẩm.</p>
            </div>

            {/* List of items for feedback */}
            <div className="space-y-6 py-2">
              {getOrderItems(feedbackOrder.donhangid).map(item => {
                const currentRating = feedbackRatings[item.sachid] || 5;
                const currentText = feedbackContents[item.sachid] || '';
                
                return (
                  <div key={item.idchitietdonhang} className="bg-gray-50/55 border border-gray-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      {item.hinhAnh && (
                        <img src={item.hinhAnh} alt={item.tenSach} className="w-10 h-13 object-cover rounded border border-gray-200" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-gray-800 block leading-snug">{item.tenSach}</span>
                        <span className="text-[10px] text-gray-450 mt-1 block">Mã sách: BOOK-000{item.sachid}</span>
                      </div>
                    </div>

                    {/* Star selector */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase">Đánh giá số sao *</label>
                      <div className="flex space-x-1.5 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleFeedbackRatingChange(item.sachid, star)}
                            className={`text-xl focus:outline-none transition-colors ${star <= currentRating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="text-xs font-bold text-indigo-650 self-center ml-2">{currentRating} / 5 sao</span>
                      </div>
                    </div>

                    {/* Text input */}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase">Nội dung nhận xét *</label>
                      <textarea
                        rows="2"
                        placeholder="Cảm nhận của bạn về sản phẩm này..."
                        value={currentText}
                        onChange={(e) => handleFeedbackContentChange(item.sachid, e.target.value)}
                        className="mt-1 block w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 placeholder-gray-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackOrder(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-250 text-gray-650 font-bold hover:bg-gray-50 transition-colors text-xs text-center"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitFeedback}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-bold transition-all text-xs text-center shadow-md hover:shadow-lg"
              >
                Gửi phản hồi
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
