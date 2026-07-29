import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { triggerToast } from '../components/Toast';
import { API_URL } from '../config';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [books, setBooks] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('profile');
  const [orderStatusNavFilter, setOrderStatusNavFilter] = useState('ALL');
  const [reviews, setReviews] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  
  // Profile form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [points, setPoints] = useState(0);

  // Notification states
  const [readNotifIds, setReadNotifIds] = useState(new Set());

  // Change password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

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

  // Forgot Password Modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const router = useRouter();
  const { tab } = router.query;

  // Initial Load
  useEffect(() => {
    const userStr = localStorage.getItem('LS_currentUser');
    if (!userStr) {
      router.push('/auth');
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    setFullName(user.hoTen || '');
    setPhone(user.soDienThoai || '');
    setAddress(user.diaChi || '');
    setPoints(user.diemTichLuy || 0);

    const fetchData = async () => {
      try {
        const [ordersRes, detailsRes, booksRes, paymentsRes, reviewsRes, vouchersRes] = await Promise.all([
          fetch(`${API_URL}/donhang`).then(r => r.json()),
          fetch(`${API_URL}/chitietdonhang`).then(r => r.json()),
          fetch(`${API_URL}/sach`).then(r => r.json()),
          fetch(`${API_URL}/thanhtoan`).then(r => r.json()),
          fetch(`${API_URL}/danhgia`).then(r => r.json()).catch(() => []),
          fetch(`${API_URL}/magiamgia`).then(r => r.json()).catch(() => [])
        ]);

        // Filter orders by user id
        const userOrders = ordersRes.filter(o => o.nguoidungid === user.nguoiDungID);
        setOrders(userOrders);
        setOrderDetails(detailsRes);
        setBooks(booksRes);
        setPayments(paymentsRes);
        setReviews(reviewsRes);
        setVouchers((vouchersRes || []).filter(v => (v.trangThai || v.trangthai || 'Hoạt động') === 'Hoạt động'));
        // Load read notifications from LocalStorage
        const savedRead = localStorage.getItem(`LS_read_notifs_${user.nguoiDungID}`);
        if (savedRead) {
          setReadNotifIds(new Set(JSON.parse(savedRead)));
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      }
    };
    fetchData();
  }, []);

  // Listen to tab in router query
  useEffect(() => {
    if (tab === 'orders') {
      setActiveTab('orders');
    } else if (tab === 'vouchers') {
      setActiveTab('vouchers');
    } else if (tab === 'password') {
      setActiveTab('change-password');
    } else if (tab === 'notifications') {
      setActiveTab('notifications');
    }
  }, [tab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      triggerToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'warning');
      return;
    }

    try {
      const payload = {
        hoTen: fullName.trim(),
        soDienThoai: phone.trim(),
        diaChi: address.trim()
      };

      const res = await fetch(`${API_URL}/nguoidung/${currentUser.nguoiDungID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        
        // Save back to local storage
        const newUserPayload = {
          ...currentUser,
          hoTen: updated.hoTen,
          soDienThoai: updated.soDienThoai,
          diaChi: updated.diaChi
        };
        localStorage.setItem('LS_currentUser', JSON.stringify(newUserPayload));
        setCurrentUser(newUserPayload);
        
        triggerToast('Cập nhật thông tin cá nhân thành công!', 'success');
        window.dispatchEvent(new Event('cart-updated')); // updates Header display name dynamically
      }
    } catch (err) {
      console.error(err);
      triggerToast('Cập nhật thông tin thất bại!', 'error');
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
        const updatedOrders = await fetch(`${API_URL}/donhang`).then(r => r.json());
        setOrders(updatedOrders.filter(o => o.nguoidungid === currentUser.nguoiDungID));
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
        
        return fetch(`${API_URL}/danhgia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nguoiDungID: currentUser.nguoiDungID,
            sachID: item.sachid,
            soSao: starRating,
            noiDung: reviewText.trim()
          })
        });
      });

      await Promise.all(promises);
      triggerToast('Đã gửi phản hồi sản phẩm thành công!', 'success');
      setShowFeedbackModal(false);
      setFeedbackOrder(null);

      // Refresh reviews list
      const updatedReviews = await fetch(`${API_URL}/danhgia`).then(r => r.json()).catch(() => []);
      setReviews(updatedReviews);
    } catch (err) {
      console.error(err);
      triggerToast('Gửi phản hồi thất bại!', 'error');
    }
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      triggerToast('Vui lòng điền đầy đủ các trường thông tin!', 'warning');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      triggerToast('Mật khẩu mới và Xác nhận mật khẩu không trùng khớp!', 'warning');
      return;
    }

    if (newPassword.length < 4) {
      triggerToast('Mật khẩu mới phải có tối thiểu 4 ký tự!', 'warning');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/nguoidung/${currentUser.nguoiDungID}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast('Đổi mật khẩu thành công!', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        triggerToast(data.message || 'Đổi mật khẩu thất bại!', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Đã xảy ra lỗi khi cập nhật mật khẩu!', 'error');
    }
  };

  const handleOpenForgotModal = () => {
    if (currentUser) {
      setForgotEmail(currentUser.email || '');
    }
    setForgotStep(1);
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setShowForgotModal(true);
  };

  const handleProfileRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      triggerToast('Vui lòng nhập địa chỉ email!', 'warning');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('Mã OTP đã được gửi đến email của bạn!', 'success');
        setForgotStep(2);
      } else {
        triggerToast(data.message || 'Không thể gửi mã OTP!', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Lỗi gửi yêu cầu mã OTP!', 'error');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleProfileVerifyOtp = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 4) {
      triggerToast('Vui lòng nhập đúng 4 chữ số mã OTP!', 'warning');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: forgotOtp.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('Xác thực OTP thành công!', 'success');
        setForgotStep(3);
      } else {
        triggerToast(data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Lỗi xác thực mã OTP!', 'error');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleProfileResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotNewPassword || !forgotConfirmPassword) {
      triggerToast('Vui lòng nhập đầy đủ các trường thông tin!', 'warning');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      triggerToast('Mật khẩu mới và Xác nhận mật khẩu không trùng khớp!', 'warning');
      return;
    }

    if (forgotNewPassword.length < 4) {
      triggerToast('Mật khẩu phải có tối thiểu 4 ký tự!', 'warning');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('Cài đặt lại mật khẩu thành công!', 'success');
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } else {
        triggerToast(data.message || 'Lỗi cài đặt lại mật khẩu!', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Cài đặt lại mật khẩu thất bại!', 'error');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  const getPaymentStatus = (orderId) => {
    const payment = payments.find(p => p.donhangid === orderId);
    return payment ? payment.trangthaithanhtoan : 'Chưa thanh toán';
  };

  const getPaymentMethod = (orderId) => {
    const order = orders.find(o => o.donhangid === orderId);
    return order ? order.phuongthucthanhtoan : 'COD';
  };

  const generateNotifications = () => {
    const list = [];
    orders.forEach(o => {
      const orderId = o.donhangid;
      const orderDate = o.ngaydat ? new Date(o.ngaydat).toLocaleString('vi-VN') : '';
      const status = o.trangthaidonhang || o.trangThaiDonHang;

      // 1. Notification: Created
      list.push({
        id: `notif_create_${orderId}`,
        orderId,
        type: 'ORDER_CREATED',
        icon: '📦',
        title: `Đặt hàng thành công #${orderId}`,
        message: `Đơn hàng #${orderId} trị giá ${formatPrice(o.tongTien)} đã được khởi tạo thành công (Trạng thái: ${status}).`,
        time: orderDate,
        rawDate: o.ngaydat ? new Date(o.ngaydat) : new Date(0)
      });

      // 2. Notification: Payment successful if paid
      const payment = payments.find(p => p.donhangid === orderId);
      if (payment && (payment.trangthaithanhtoan === 'Đã thanh toán' || payment.trangThaiThanhToan === 'Đã thanh toán')) {
        list.push({
          id: `notif_pay_${orderId}`,
          orderId,
          type: 'PAYMENT_SUCCESS',
          icon: '💳',
          title: `Thanh toán thành công đơn hàng #${orderId}`,
          message: `Đơn hàng #${orderId} đã hoàn tất thanh toán thành công qua ${o.phuongthucthanhtoan}.`,
          time: payment.ngaythanhtoan ? new Date(payment.ngaythanhtoan).toLocaleString('vi-VN') : orderDate,
          rawDate: payment.ngaythanhtoan ? new Date(payment.ngaythanhtoan) : new Date()
        });
      }

      // 3. Notification: Order Cancelled if cancelled
      if (status === 'Đã hủy') {
        list.push({
          id: `notif_cancel_${orderId}`,
          orderId,
          type: 'ORDER_CANCELLED',
          icon: '❌',
          title: `Đơn hàng #${orderId} đã bị hủy`,
          message: `Đơn hàng #${orderId} đã được hủy thành công. Lý do: ${o.lydohuy || o.lyDoHuy || 'Khách hàng yêu cầu hủy'}.`,
          time: orderDate,
          rawDate: o.ngaydat ? new Date(o.ngaydat) : new Date()
        });
      }

      // 4. Notification: Order Delivered if finished
      if (status === 'Đã hoàn thành' || status === 'Đã giao') {
        list.push({
          id: `notif_delivered_${orderId}`,
          orderId,
          type: 'ORDER_DELIVERED',
          icon: '🎉',
          title: `Đơn hàng #${orderId} giao hàng thành công`,
          message: `Đơn hàng #${orderId} đã được giao thành công tới ${o.tennguoinhan || o.tenNguoiNhan}. Cảm ơn bạn đã mua sắm tại LSBook Store!`,
          time: orderDate,
          rawDate: o.ngaydat ? new Date(o.ngaydat) : new Date()
        });
      }
    });

    return list.sort((a, b) => b.rawDate - a.rawDate);
  };

  const notifications = generateNotifications();
  const unreadCount = notifications.filter(n => !readNotifIds.has(n.id)).length;

  const handleMarkAsRead = (notifId) => {
    if (!currentUser) return;
    const newSet = new Set(readNotifIds);
    newSet.add(notifId);
    setReadNotifIds(newSet);
    localStorage.setItem(`LS_read_notifs_${currentUser.nguoiDungID}`, JSON.stringify(Array.from(newSet)));
    window.dispatchEvent(new Event('notif-updated'));
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    const allIds = notifications.map(n => n.id);
    const newSet = new Set(allIds);
    setReadNotifIds(newSet);
    localStorage.setItem(`LS_read_notifs_${currentUser.nguoiDungID}`, JSON.stringify(allIds));
    window.dispatchEvent(new Event('notif-updated'));
    triggerToast('Đã đánh dấu tất cả thông báo là đã đọc!', 'success');
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Menu */}
        <div className="col-span-1">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-2">
            <div className="flex items-center space-x-3 pb-5 border-b border-gray-50 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
                {(currentUser.hoTen || '').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{currentUser.hoTen}</p>
                <span className="text-[10px] bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded font-black">{currentUser.vaiTro}</span>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span>Thông tin tài khoản</span>
            </button>

            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <span>Thông báo</span>
            </button>

            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'orders' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              <span>Lịch sử đơn hàng</span>
            </button>

            <button 
              onClick={() => setActiveTab('vouchers')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'vouchers' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
              <span>Kho Voucher</span>
            </button>

            <button 
              onClick={() => setActiveTab('change-password')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'change-password' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <span>Thay đổi mật khẩu</span>
            </button>
          </div>
        </div>

        {/* Right Content Panels */}
        <div className="lg:col-span-3">
          
          {/* Panel: Profile editing */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">Thông tin tài khoản</h2>
              
              {(() => {
                const tier = points >= 300 
                  ? { name: 'Thành viên Vàng 🥇', badge: 'bg-amber-500 text-white', msg: 'Hạng cao nhất' }
                  : points >= 100 
                  ? { name: 'Thành viên Bạc 🥈', badge: 'bg-slate-500 text-white', msg: `Cần thêm ${300 - points} điểm để lên Hạng Vàng` }
                  : { name: 'Thành viên Đồng 🥉', badge: 'bg-amber-700 text-white', msg: `Cần thêm ${100 - points} điểm để lên Hạng Bạc` };

                return (
                  <div className="mt-6 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white rounded-2xl p-4 border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center max-w-md mb-6 gap-3 shadow-2xs">
                    <div>
                      <p className="text-xxs font-bold text-indigo-600 uppercase">Điểm tích lũy thành viên</p>
                      <p className="text-2xl font-black text-indigo-700 mt-0.5">{points} điểm</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{tier.msg}</p>
                    </div>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-2xs ${tier.badge}`}>
                      {tier.name}
                    </span>
                  </div>
                );
              })()}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Họ và tên *</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ Email</label>
                    <input 
                      type="email" 
                      value={currentUser.email}
                      disabled
                      className="mt-2 block w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Số điện thoại *</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ giao hàng mặc định *</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-xs text-xs"
                >
                  Lưu thay đổi
                </button>
              </form>
            </div>
          )}

          {/* Panel: Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 pb-4 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-black text-gray-900 uppercase tracking-wider">Thông Báo Của Tôi</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Cập nhật thời gian thực về trạng thái đơn hàng, thanh toán và sự kiện.</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-bold text-indigo-650 hover:text-indigo-850 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Đánh dấu tất cả là đã đọc
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <p className="text-gray-400 text-xs font-bold">Bạn chưa có thông báo nào.</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const isRead = readNotifIds.has(notif.id);

                    return (
                      <div 
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isRead ? 'bg-white border-gray-100 text-gray-600' : 'bg-indigo-50/40 border-indigo-100 text-gray-900 shadow-2xs'
                        }`}
                      >
                        <div className="flex-grow space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`text-xs font-bold ${isRead ? 'text-gray-800' : 'text-indigo-950 font-black'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
                        </div>
                        {!isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5 shadow-2xs"></span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Panel: Order history */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider mb-4">Lịch sử đơn hàng</h2>

              {/* Order Status Nav Tabs */}
              <div className="flex border-b border-gray-200 overflow-x-auto text-xs font-bold scrollbar-none mb-6">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'Chờ thanh toán', label: 'Chờ thanh toán' },
                  { key: 'Chờ xác nhận', label: 'Chờ xác nhận' },
                  { key: 'Đang vận chuyển', label: 'Vận chuyển' },
                  { key: 'Đã hoàn thành', label: 'Hoàn thành' },
                  { key: 'Đã hủy', label: 'Đã hủy/Hoàn trả' }
                ].map(nav => {
                  const count = nav.key === 'ALL' 
                    ? orders.length 
                    : orders.filter(o => (o.trangthaidonhang || o.trangThaiDonHang) === nav.key).length;
                  const isActive = orderStatusNavFilter === nav.key;
                  
                  return (
                    <button
                      key={nav.key}
                      onClick={() => setOrderStatusNavFilter(nav.key)}
                      className={`py-3 px-4 whitespace-nowrap border-b-2 transition-all select-none flex items-center gap-1.5 cursor-pointer ${
                        isActive 
                          ? 'border-indigo-600 text-indigo-600 font-black' 
                          : 'border-transparent text-gray-500 hover:text-gray-800 font-semibold'
                      }`}
                    >
                      <span>{nav.label}</span>
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          isActive ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-gray-100 text-gray-500 font-semibold'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {orders.length === 0 ? (
                <p className="text-gray-400 text-sm mt-6 italic">Bạn chưa thực hiện đơn đặt hàng nào.</p>
              ) : (
                <div className="mt-6 space-y-6">
                  {orders
                    .filter(order => {
                      if (orderStatusNavFilter === 'ALL') return true;
                      const status = order.trangthaidonhang || order.trangThaiDonHang;
                      return status === orderStatusNavFilter;
                    })
                    .map(order => (
                    <div key={order.donhangid} className="border border-gray-100 rounded-2xl p-5 shadow-xs bg-gray-50/20">
                      
                      {/* Order info header */}
                      <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 mb-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-extrabold text-gray-800">Đơn hàng #{order.donhangid}</p>
                          <p className="text-gray-400">Ngày đặt: {new Date(order.ngaydat).toLocaleDateString('vi-VN')} {new Date(order.ngaydat).toLocaleTimeString('vi-VN')}</p>
                        </div>
                        <div className="flex gap-2 items-center mt-2 sm:mt-0">
                          {/* Order Status Badge */}
                          <span className={`px-3 py-1 rounded-full font-black uppercase text-[10px] ${
                            order.trangThaiDonHang === 'Chờ thanh toán' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            order.trangThaiDonHang === 'Chờ xác nhận' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            order.trangThaiDonHang === 'Đang vận chuyển' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                            order.trangThaiDonHang === 'Đã hoàn thành' ? 'bg-green-50 text-green-600 border border-green-200' :
                            'bg-red-50 text-red-650 border border-red-200'
                          }`}>
                            {order.trangThaiDonHang}
                          </span>
                        </div>
                      </div>

                      {/* Order items list */}
                      <div className="space-y-3">
                        {getOrderItems(order.donhangid).map(item => {
                          const itemReview = reviews.find(r => (r.nguoidungid || r.nguoidungID || r.nguoiDungID) === currentUser?.nguoiDungID && (r.sachid || r.sachID) === item.sachid);

                          return (
                            <div key={item.idchitietdonhang} className="border-b border-gray-100/50 pb-3 last:border-b-0 last:pb-0">
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center space-x-2">
                                  {item.hinhAnh && (
                                      <img src={item.hinhAnh} alt={item.tenSach} className="w-8 h-10 object-cover rounded border border-gray-100" />
                                  )}
                                  <span className="font-bold text-gray-700">{item.tenSach} <span className="text-indigo-600 font-extrabold">x{item.soluong}</span></span>
                                </div>
                                <span className="font-semibold text-gray-800">{formatPrice(item.donGia * item.soluong)}</span>
                              </div>

                              {/* Render submitted review ONLY if order is completed / delivered */}
                              {(order.trangThaiDonHang === 'Đã hoàn thành' || order.trangThaiDonHang === 'Đã giao') && itemReview && (
                                <div className="mt-2 bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 text-xs space-y-1 ml-10">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1.5 text-amber-700 font-bold text-xxs">
                                      <span>Đánh giá của bạn:</span>
                                      <div className="flex text-amber-400">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <svg key={i} className={`w-3 h-3 ${i < (itemReview.sosao || itemReview.soSao) ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                          </svg>
                                        ))}
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium">{new Date(itemReview.ngaydanhgia || itemReview.ngayDanhGia || Date.now()).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <p className="text-gray-700 italic font-medium">"{itemReview.noidung || itemReview.noiDung}"</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Total and actions */}
                      <div className="border-t border-gray-100 mt-4 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="text-xs">
                          {order.lydohuy && <p className="text-red-500 font-semibold italic">Lý do hủy: {order.lydohuy}</p>}
                          {order.ghichu && <p className="text-gray-400 font-medium">Ghi chú: {order.ghichu}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
                          <span className="text-xs text-gray-500">Tổng tiền: <span className="text-sm font-black text-indigo-700">{formatPrice(order.tongTien)}</span></span>
                          
                          {(order.trangThaiDonHang === 'Chờ xác nhận' || order.trangThaiDonHang === 'Chờ thanh toán') && (
                            <>
                              {order.trangThaiDonHang === 'Chờ thanh toán' && (
                                <button
                                  onClick={async () => {
                                    if (order.phuongthucthanhtoan === 'ZaloPay') {
                                      try {
                                        triggerToast('Đang kết nối ZaloPay Gateway...', 'info');
                                        const res = await fetch(`http://localhost:3001/api/zalopay/create-payment`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ donhangID: order.donhangid })
                                        });
                                        const data = await res.json();
                                        if (data.order_url) {
                                          window.location.href = data.order_url;
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    } else {
                                      router.push(`/checkout-qr?orderId=${order.donhangid}`);
                                    }
                                  }}
                                  className="text-xxs font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-all select-none shadow-xs cursor-pointer"
                                >
                                  Thanh toán ngay
                                </button>
                              )}
                              
                              <button 
                                onClick={() => handleOpenCancelModal(order)}
                                className="text-xxs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded transition-all select-none"
                              >
                                Hủy đơn
                              </button>
                            </>
                          )}
                          {(order.trangThaiDonHang === 'Đã hoàn thành' || order.trangThaiDonHang === 'Đã giao') && (
                            <button 
                              onClick={() => handleOpenFeedbackModal(order)}
                              className="text-xxs font-bold text-indigo-650 hover:text-indigo-850 border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded transition-all select-none"
                            >
                              Phản hồi sản phẩm
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}

                  {orders.filter(order => {
                    if (orderStatusNavFilter === 'ALL') return true;
                    const status = order.trangthaidonhang || order.trangThaiDonHang;
                    return status === orderStatusNavFilter;
                  }).length === 0 && (
                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <p className="text-gray-400 text-xs font-bold">Không có đơn hàng nào thuộc trạng thái này.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Panel: Kho Voucher */}
          {activeTab === 'vouchers' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-8 animate-fade-in">
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-base font-black text-gray-900 uppercase tracking-wider">Kho Voucher Của Tôi</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Tổng hợp tất cả mã ưu đãi & quà tặng từ LSBook Store dành riêng cho bạn.</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full border border-indigo-150">
                  {vouchers.length} mã khả dụng
                </span>
              </div>

              {/* KHUNG TRÊN: MÃ GIẢM ĐƠN HÀNG */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    🏷️
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Mã Giảm Đơn Hàng</h3>
                    <p className="text-xxs text-gray-400">Áp dụng trực tiếp vào tổng giá trị đơn hàng khi thanh toán (Mỗi TK dùng 1 lần)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vouchers.filter(v => (v.maGiam || v.magiam || '').toUpperCase() !== 'FREESHIP' && !(v.ten || '').toLowerCase().includes('miễn phí vận chuyển')).length === 0 ? (
                    <div className="col-span-full bg-gray-50 rounded-2xl p-6 text-center text-xs text-gray-400 italic border border-dashed border-gray-200">
                      Hiện chưa có mã giảm đơn hàng mới.
                    </div>
                  ) : (
                    vouchers
                      .filter(v => (v.maGiam || v.magiam || '').toUpperCase() !== 'FREESHIP' && !(v.ten || '').toLowerCase().includes('miễn phí vận chuyển'))
                      .map(v => {
                        const vId = v.magiamID || v.magiamid;
                        const code = v.maGiam || v.magiam || '';
                        const title = v.ten || '';
                        const rate = v.tiLe !== undefined ? v.tiLe : (v.tile || 0);
                        const quantity = v.soLuong !== undefined ? v.soLuong : (v.soluong || 0);
                        const endDate = v.ngayKetThuc || v.ngayketthuc;
                        const usedVoucherIds = new Set(orders.map(o => o.magiamid || o.maGiamID).filter(Boolean));
                        const isUsed = usedVoucherIds.has(vId);

                        return (
                          <div key={vId} className={`relative bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white border border-indigo-100 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3 transition-all ${isUsed ? 'opacity-60 bg-gray-50' : 'hover:shadow-md'}`}>
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-block font-mono font-black text-xs px-2.5 py-1 rounded-lg shadow-2xs tracking-wider uppercase ${isUsed ? 'bg-gray-400 text-white' : 'bg-indigo-600 text-white'}`}>
                                    {code}
                                  </span>
                                  {isUsed && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Đã dùng</span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-gray-800 line-clamp-1 pt-1">{title}</h4>
                              </div>
                              <span className={`text-lg font-black ${isUsed ? 'text-gray-400' : 'text-indigo-700'}`}>-{rate}%</span>
                            </div>

                            <div className="border-t border-indigo-100/60 pt-3 flex justify-between items-center text-[10px]">
                              <span className="text-gray-400 font-medium">
                                Còn {quantity} lượt • HSD: {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                              </span>
                              {isUsed ? (
                                <button disabled className="text-xxs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg cursor-not-allowed">
                                  Đã dùng
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(code);
                                    triggerToast(`Đã sao chép mã ${code}!`, 'success');
                                  }}
                                  className="text-xxs font-extrabold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg transition-all shadow-2xs cursor-pointer select-none"
                                >
                                  Sao chép mã
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* KHUNG DƯỚI: MÃ FREESHIP */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    🚚
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Mã Freeship (Miễn Phí Vận Chuyển)</h3>
                    <p className="text-xxs text-gray-400">Giảm trừ trực tiếp chi phí giao hàng toàn quốc (Mỗi TK dùng 1 lần)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vouchers.filter(v => (v.maGiam || v.magiam || '').toUpperCase() === 'FREESHIP' || (v.ten || '').toLowerCase().includes('miễn phí vận chuyển')).length === 0 ? (
                    <div className="col-span-full bg-gray-50 rounded-2xl p-6 text-center text-xs text-gray-400 italic border border-dashed border-gray-200">
                      Hiện chưa có mã Freeship mới.
                    </div>
                  ) : (
                    vouchers
                      .filter(v => (v.maGiam || v.magiam || '').toUpperCase() === 'FREESHIP' || (v.ten || '').toLowerCase().includes('miễn phí vận chuyển'))
                      .map(v => {
                        const vId = v.magiamID || v.magiamid;
                        const code = v.maGiam || v.magiam || '';
                        const title = v.ten || '';
                        const quantity = v.soLuong !== undefined ? v.soLuong : (v.soluong || 0);
                        const endDate = v.ngayKetThuc || v.ngayketthuc;
                        const usedVoucherIds = new Set(orders.map(o => o.magiamid || o.maGiamID).filter(Boolean));
                        const isUsed = usedVoucherIds.has(vId);

                        return (
                          <div key={vId} className={`relative bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white border border-emerald-100 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3 transition-all ${isUsed ? 'opacity-60 bg-gray-50' : 'hover:shadow-md'}`}>
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-block font-mono font-black text-xs px-2.5 py-1 rounded-lg shadow-2xs tracking-wider uppercase ${isUsed ? 'bg-gray-400 text-white' : 'bg-emerald-600 text-white'}`}>
                                    {code}
                                  </span>
                                  {isUsed && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Đã dùng</span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-gray-800 line-clamp-1 pt-1">{title}</h4>
                              </div>
                              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md">FREE SHIP</span>
                            </div>

                            <div className="border-t border-emerald-100/60 pt-3 flex justify-between items-center text-[10px]">
                              <span className="text-gray-400 font-medium">
                                Còn {quantity} lượt • HSD: {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                              </span>
                              {isUsed ? (
                                <button disabled className="text-xxs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg cursor-not-allowed">
                                  Đã dùng
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(code);
                                    triggerToast(`Đã sao chép mã ${code}!`, 'success');
                                  }}
                                  className="text-xxs font-extrabold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg transition-all shadow-2xs cursor-pointer select-none"
                                >
                                  Sao chép mã
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Panel: Thay đổi mật khẩu */}
          {activeTab === 'change-password' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 animate-fade-in max-w-xl">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-black text-gray-900 uppercase tracking-wider">Thay Đổi Mật Khẩu</h2>
                <p className="text-xs text-gray-400 mt-0.5">Bảo vệ tài khoản cá nhân bằng cách thay đổi mật khẩu định kỳ.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Mật khẩu hiện tại *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Mật khẩu mới *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Xác nhận mật khẩu mới *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                  <div className="flex justify-end mt-1.5">
                    <button 
                      type="button"
                      onClick={handleOpenForgotModal}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-xs"
                >
                  Cập nhật mật khẩu
                </button>
              </form>
            </div>
          )}
        </div>
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

      {/* Forgot Password OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-gray-100 shadow-2xl animate-scale-up space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                {forgotStep === 1 && 'Khôi phục mật khẩu qua Email'}
                {forgotStep === 2 && 'Xác nhận mã OTP'}
                {forgotStep === 3 && 'Cài đặt mật khẩu mới'}
              </h3>
              <button 
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleProfileRequestOtp} className="space-y-4">
                <p className="text-xs text-gray-400">
                  Vui lòng kiểm tra email của bạn. Hệ thống sẽ tạo và gửi mã OTP gồm 4 chữ số tới email: <span className="font-bold text-indigo-600">{forgotEmail}</span>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingForgot}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs transition-all shadow-md"
                  >
                    {isSubmittingForgot ? 'Đang gửi...' : 'Tiếp tục'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleProfileVerifyOtp} className="space-y-4">
                <p className="text-xs text-gray-400">
                  Mã OTP (4 chữ số) đã được gửi đến email <span className="font-bold text-indigo-600">{forgotEmail}</span>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Mã OTP (4 số)</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    placeholder="1234"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center tracking-[12px] font-mono text-2xl font-black bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button 
                    type="button" 
                    onClick={handleProfileRequestOtp}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Gửi lại mã OTP
                  </button>
                  <div className="flex space-x-2">
                    <button 
                      type="button" 
                      onClick={() => setShowForgotModal(false)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmittingForgot}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      {isSubmittingForgot ? 'Đang xác thực...' : 'Xác nhận'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleProfileResetPassword} className="space-y-4">
                <p className="text-xs text-gray-400">
                  Nhập mật khẩu mới cho tài khoản <span className="font-bold text-indigo-600">{forgotEmail}</span>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Mật khẩu mới *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Xác nhận mật khẩu mới *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingForgot}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    {isSubmittingForgot ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
