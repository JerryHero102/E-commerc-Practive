import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { triggerToast } from '../components/Toast';

const API_URL = 'http://localhost:3001/api';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProductSubmenu, setShowProductSubmenu] = useState(true);
  const [showOrderSubmenu, setShowOrderSubmenu] = useState(true);

  // Database states
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [discountSearch, setDiscountSearch] = useState('');
  
  // Discount Form states
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountTitle, setDiscountTitle] = useState('');
  const [discountRate, setDiscountRate] = useState(10);
  const [discountQuantity, setDiscountQuantity] = useState(50);
  const [discountStartDate, setDiscountStartDate] = useState('');
  const [discountEndDate, setDiscountEndDate] = useState('');
  const [discountStatus, setDiscountStatus] = useState('Hoạt động');
  
  // Stats states
  const [stats, setStats] = useState({
    totalRevenue: 0,
    codRevenue: 0,
    bankRevenue: 0,
    counts: { choXacNhan: 0, dangVanChuyen: 0, daHoanThanh: 0, daHuy: 0 },
    topSellingBooks: []
  });

  // Book Form states
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookCategory, setBookCategory] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookPublisher, setBookPublisher] = useState('');
  const [bookPrice, setBookPrice] = useState(0);
  const [bookImportPrice, setBookImportPrice] = useState(0);
  const [bookStock, setBookStock] = useState(0);
  const [bookDesc, setBookDesc] = useState('');
  const [bookImage, setBookImage] = useState('');
  const [bookYear, setBookYear] = useState(new Date().getFullYear());
  const [bookStatus, setBookStatus] = useState('Bán');

  // Category Form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Order Edit Form states
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editOrderName, setEditOrderName] = useState('');
  const [editOrderPhone, setEditOrderPhone] = useState('');
  const [editOrderAddress, setEditOrderAddress] = useState('');
  const [editOrderStatus, setEditOrderStatus] = useState('');

  // Order Search & Filter states
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');

  // Warning Modal State for Completing Shipping Orders
  const [showCompleteWarningModal, setShowCompleteWarningModal] = useState(false);
  const [pendingCompleteOrder, setPendingCompleteOrder] = useState(null);

  // Customer Service Filter states
  const [csRatingFilter, setCsRatingFilter] = useState('');
  const [csStartDate, setCsStartDate] = useState('');
  const [csEndDate, setCsEndDate] = useState('');

  // User Edit Modal States
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');
  const [editUserRole, setEditUserRole] = useState('Khách hàng');
  const [editUserStatus, setEditUserStatus] = useState('Hoạt động');
  const [editUserPoints, setEditUserPoints] = useState(0);

  // Admin CSKH Chat states
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSessionID, setSelectedSessionID] = useState(null);
  const [selectedSessionName, setSelectedSessionName] = useState('');
  const [adminChatMessages, setAdminChatMessages] = useState([]);
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);
  const adminChatEndRef = useRef(null);

  // Fetch all chat sessions when tab is 'support-chat'
  useEffect(() => {
    if (activeTab !== 'support-chat') return;

    const fetchSessions = () => {
      fetch(`${API_URL}/chat/sessions`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setChatSessions(data);
            if (!selectedSessionID && data.length > 0) {
              setSelectedSessionID(data[0].sessionID);
              setSelectedSessionName(data[0].senderName);
            }
          }
        })
        .catch(err => console.error(err));
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [activeTab, selectedSessionID]);

  // Fetch messages for selected session
  useEffect(() => {
    if (activeTab !== 'support-chat' || !selectedSessionID) return;

    const fetchMessages = () => {
      fetch(`${API_URL}/chat/messages?sessionID=${encodeURIComponent(selectedSessionID)}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAdminChatMessages(data);
          }
        })
        .catch(err => console.error(err));
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeTab, selectedSessionID]);

  // Auto scroll admin chat
  useEffect(() => {
    if (activeTab === 'support-chat') {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminChatMessages, activeTab]);

  const handleSelectSession = (s) => {
    setSelectedSessionID(s.sessionID);
    setSelectedSessionName(s.senderName);
    fetch(`${API_URL}/chat/read/${encodeURIComponent(s.sessionID)}`, { method: 'PUT' }).catch(console.error);
    setChatSessions(prev => prev.map(item => item.sessionID === s.sessionID ? { ...item, unreadCount: 0 } : item));
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!adminReplyMessage.trim() || !selectedSessionID || isSendingAdminReply) return;

    const text = adminReplyMessage.trim();
    setAdminReplyMessage('');
    setIsSendingAdminReply(true);

    try {
      const res = await fetch(`${API_URL}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionID: selectedSessionID,
          senderType: 'ADMIN',
          senderName: 'Quản trị viên',
          message: text
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setAdminChatMessages(prev => [...prev, saved]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingAdminReply(false);
    }
  };

  const router = useRouter();

  // 1. Authorization check & Initial fetch
  useEffect(() => {
    const userStr = localStorage.getItem('LS_currentUser');

    if (!userStr) {
      triggerToast('Quyền truy cập bị từ chối! Bạn cần đăng nhập tài khoản Quản trị viên.', 'error');
      router.push('/');
      return;
    }

    const user = JSON.parse(userStr);
    
    // Call backend to verify role
    fetch(`${API_URL}/nguoidung`)
      .then(res => res.json())
      .then(usersList => {
        const dbUser = usersList.find(u => u.nguoiDungID === user.nguoiDungID);
        if (dbUser && dbUser.vaiTro === 'Quản trị viên') {
          // Sync acting role to Quản trị viên automatically
          localStorage.setItem('LS_actingRole', 'Quản trị viên');
          setIsAdmin(true);
          setLoading(false);
          // Initial fetches
          fetchAdminData();
        } else {
          triggerToast('Quyền truy cập bị từ chối! Bạn không có quyền Quản trị viên.', 'error');
          router.push('/');
        }
      })
      .catch(err => {
        console.error(err);
        router.push('/');
      });
  }, []);

  const fetchAdminData = async () => {
    try {
      const [booksRes, catsRes, authorsRes, pubsRes, ordersRes, detailsRes, usersRes, reviewsRes, discountsRes] = await Promise.all([
        fetch(`${API_URL}/sach`).then(r => r.json()),
        fetch(`${API_URL}/danhmuc`).then(r => r.json()),
        fetch(`${API_URL}/tacgia`).then(r => r.json()),
        fetch(`${API_URL}/nhaxuatban`).then(r => r.json()),
        fetch(`${API_URL}/donhang`).then(r => r.json()),
        fetch(`${API_URL}/chitietdonhang`).then(r => r.json()),
        fetch(`${API_URL}/nguoidung`).then(r => r.json()),
        fetch(`${API_URL}/danhgia`).then(r => r.json()),
        fetch(`${API_URL}/magiamgia`).then(r => r.json()).catch(() => [])
      ]);

      setBooks(booksRes);
      setCategories(catsRes);
      setAuthors(authorsRes);
      setPublishers(pubsRes);
      setOrders(ordersRes);
      setOrderDetails(detailsRes);
      setUsers(usersRes);
      setReviews(reviewsRes);
      setDiscounts(discountsRes);

      // Compute statistics
      computeStats(ordersRes, detailsRes, booksRes);
    } catch (err) {
      console.error('Error fetching admin panels data:', err);
    }
  };

  const computeStats = (ordersList, detailsList, booksList) => {
    const activeOrders = ordersList.filter(o => o.trangThaiDonHang === 'Đã hoàn thành');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + parseFloat(o.tongTien), 0);
    
    // Revenue by payment method
    const codRevenue = activeOrders
      .filter(o => o.phuongthucthanhtoan === 'COD')
      .reduce((sum, o) => sum + parseFloat(o.tongTien), 0);

    const bankRevenue = activeOrders
      .filter(o => o.phuongthucthanhtoan !== 'COD')
      .reduce((sum, o) => sum + parseFloat(o.tongTien), 0);
    
    const counts = {
      choXacNhan: ordersList.filter(o => o.trangThaiDonHang === 'Chờ xác nhận').length,
      dangVanChuyen: ordersList.filter(o => o.trangThaiDonHang === 'Đang vận chuyển').length,
      daHoanThanh: ordersList.filter(o => o.trangThaiDonHang === 'Đã hoàn thành').length,
      daHuy: ordersList.filter(o => o.trangThaiDonHang === 'Đã hủy').length
    };

    const validOrders = ordersList.filter(o => o.trangThaiDonHang !== 'Đã hủy');
    const bookSales = {};

    validOrders.forEach(o => {
      const items = detailsList.filter(d => d.donhangid === o.donhangid);
      items.forEach(item => {
        const bookId = item.sachid || item.sachID;
        if (!bookSales[bookId]) {
          const book = booksList.find(b => b.sachID === bookId || b.sachid === bookId);
          bookSales[bookId] = {
            sachID: bookId,
            tenSach: book ? book.tenSach : `Sách #${bookId}`,
            hinhAnh: book ? book.hinhAnh : '',
            giaBan: book ? book.giaBan : (item.donGia || item.dongia || 0),
            quantity: 0,
            revenue: 0
          };
        }
        bookSales[bookId].quantity += item.soluong;
        bookSales[bookId].revenue += item.soluong * (item.donGia || item.dongia || 0);
      });
    });

    const topSellingBooks = Object.values(bookSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    setStats({
      totalRevenue,
      codRevenue,
      bankRevenue,
      counts,
      topSellingBooks
    });
  };

  // --- Category Actions ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/danhmuc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenDanhMuc: newCatName.trim(),
          moTa: newCatDesc.trim() || null,
          trangThai: 'Hoạt động'
        })
      });

      if (res.ok) {
        triggerToast('Thêm danh mục thành công!', 'success');
        setNewCatName('');
        setNewCatDesc('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Thêm danh mục thất bại!', 'error');
    }
  };

  // --- Book Form Handling ---
  const handleSaveBook = async (e) => {
    e.preventDefault();

    if (!bookTitle.trim() || !bookCategory || !bookAuthor || !bookPublisher || bookPrice <= 0 || bookStock < 0) {
      triggerToast('Vui lòng điền đầy đủ các thông tin sách hợp lệ!', 'warning');
      return;
    }

    const payload = {
      danhmucID: parseInt(bookCategory),
      tacgiaID: parseInt(bookAuthor),
      nxbID: parseInt(bookPublisher),
      tenSach: bookTitle.trim(),
      giaBan: parseFloat(bookPrice),
      giaNhap: parseFloat(bookImportPrice),
      soLuongTon: parseInt(bookStock),
      moTa: bookDesc.trim(),
      hinhAnh: bookImage.trim() || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=387&auto=format&fit=crop',
      namXuatBan: parseInt(bookYear),
      trangThai: bookStatus
    };

    try {
      let res;
      if (editingBookId) {
        // Edit existing book
        res = await fetch(`${API_URL}/sach/${editingBookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Add new book
        res = await fetch(`${API_URL}/sach`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        triggerToast(editingBookId ? 'Cập nhật sách thành công!' : 'Thêm sách mới thành công!', 'success');
        resetBookForm();
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Lưu sách thất bại!', 'error');
    }
  };

  const handleEditBook = (book) => {
    setEditingBookId(book.sachID);
    setBookTitle(book.tenSach);
    setBookCategory(book.danhmucID);
    setBookAuthor(book.tacgiaID);
    setBookPublisher(book.nxbID);
    setBookPrice(book.giaBan);
    setBookImportPrice(book.giaNhap);
    setBookStock(book.soLuongTon);
    setBookDesc(book.moTa || '');
    setBookImage(book.hinhAnh || '');
    setBookYear(book.namXuatBan);
    setBookStatus(book.trangThai);
    
    // Smooth scroll to top book form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cuốn sách này khỏi hệ thống?')) return;

    try {
      const res = await fetch(`${API_URL}/sach/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast('Xóa sách thành công!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Xóa sách thất bại!', 'error');
    }
  };

  const resetBookForm = () => {
    setEditingBookId(null);
    setBookTitle('');
    setBookCategory('');
    setBookAuthor('');
    setBookPublisher('');
    setBookPrice(0);
    setBookImportPrice(0);
    setBookStock(0);
    setBookDesc('');
    setBookImage('');
    setBookYear(new Date().getFullYear());
    setBookStatus('Bán');
  };

  // --- Order Actions & Filtering ---
  const handleUpdateOrderStatus = async (orderId, status) => {
    const currentOrder = orders.find(o => o.donhangid === orderId);
    if (status === 'Đã hoàn thành' && currentOrder && (currentOrder.trangThaiDonHang === 'Đang vận chuyển' || currentOrder.trangthaidonhang === 'Đang vận chuyển')) {
      setPendingCompleteOrder(currentOrder);
      setShowCompleteWarningModal(true);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/donhang/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        triggerToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Cập nhật đơn hàng thất bại!', 'error');
    }
  };

  const handleConfirmCompleteOrder = async () => {
    if (!pendingCompleteOrder) return;
    const orderId = pendingCompleteOrder.donhangid;
    try {
      const res = await fetch(`${API_URL}/donhang/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Đã hoàn thành' })
      });

      if (res.ok) {
        triggerToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
        setShowCompleteWarningModal(false);
        setPendingCompleteOrder(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Cập nhật đơn hàng thất bại!', 'error');
    }
  };

  const handleEditOrder = (o) => {
    setEditingOrderId(o.donhangid);
    setEditOrderName(o.tennguoinhan);
    setEditOrderPhone(o.sdtnguoinhan);
    setEditOrderAddress(o.diachigiao);
    setEditOrderStatus(o.trangThaiDonHang);
    
    // Smooth scroll to order edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!editOrderName.trim() || !editOrderPhone.trim() || !editOrderAddress.trim()) {
      triggerToast('Thông tin đơn hàng không hợp lệ!', 'warning');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/donhang/${editingOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenNguoiNhan: editOrderName.trim(),
          sdtNguoiNhan: editOrderPhone.trim(),
          diaChiGiao: editOrderAddress.trim(),
          trangThaiDonHang: editOrderStatus
        })
      });

      if (res.ok) {
        triggerToast('Cập nhật đơn hàng thành công!', 'success');
        setEditingOrderId(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Lỗi cập nhật đơn hàng!', 'error');
    }
  };

  const getFilteredOrders = (statusFilter) => {
    let list = [...orders];

    if (statusFilter) {
      list = list.filter(o => o.trangThaiDonHang === statusFilter);
    }

    // Filter by Order ID
    if (orderIdSearch.trim()) {
      list = list.filter(o => o.donhangid.toString().includes(orderIdSearch.trim()));
    }

    // Filter by start date
    if (orderStartDate) {
      const start = new Date(orderStartDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter(o => new Date(o.ngaydat) >= start);
    }

    // Filter by end date
    if (orderEndDate) {
      const end = new Date(orderEndDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(o => new Date(o.ngaydat) <= end);
    }

    return list;
  };

  // --- User management actions ---
  // --- User Edit Modal Actions ---
  const handleOpenUserEditModal = (u) => {
    setEditingUser(u);
    setEditUserName(u.hoTen || '');
    setEditUserEmail(u.email || '');
    setEditUserPhone(u.soDienThoai || '');
    setEditUserAddress(u.diaChi || '');
    setEditUserRole(u.vaiTro || 'Khách hàng');
    setEditUserStatus(u.trangThai || 'Hoạt động');
    setEditUserPoints(u.diemTichLuy || 0);
    setShowUserEditModal(true);
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUserName.trim() || !editUserEmail.trim() || !editUserPhone.trim()) {
      triggerToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'warning');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/nguoidung/${editingUser.nguoiDungID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoTen: editUserName.trim(),
          email: editUserEmail.trim(),
          soDienThoai: editUserPhone.trim(),
          diaChi: editUserAddress.trim(),
          vaiTro: editUserRole,
          trangThai: editUserStatus,
          diemTichLuy: parseInt(editUserPoints) || 0
        })
      });

      if (res.ok) {
        triggerToast(`Cập nhật thông tin tài khoản thành công!`, 'success');
        setShowUserEditModal(false);
        setEditingUser(null);
        fetchAdminData();
      } else {
        triggerToast('Cập nhật thất bại!', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Lỗi khi cập nhật tài khoản!', 'error');
    }
  };

  const handleToggleUserStatus = async (u) => {
    const newStatus = u.trangThai === 'Hoạt động' ? 'Khóa' : 'Hoạt động';
    if (!confirm(`Bạn có chắc chắn muốn ${newStatus === 'Khóa' ? 'khóa' : 'mở khóa'} tài khoản ${u.hoTen}?`)) return;

    try {
      const res = await fetch(`${API_URL}/nguoidung/${u.nguoiDungID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trangThai: newStatus })
      });

      if (res.ok) {
        triggerToast('Cập nhật trạng thái người dùng thành công!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Lỗi cập nhật!', 'error');
    }
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    if (!discountCode.trim() || !discountTitle.trim()) {
      triggerToast('Vui lòng nhập đầy đủ mã và tên giảm giá!', 'warning');
      return;
    }

    const payload = {
      maGiam: discountCode.trim().toUpperCase(),
      ten: discountTitle.trim(),
      tiLe: parseFloat(discountRate),
      soLuong: parseInt(discountQuantity),
      ngayBatDau: discountStartDate || new Date().toISOString(),
      ngayKetThuc: discountEndDate || new Date(Date.now() + 365*86400000).toISOString(),
      trangThai: discountStatus
    };

    try {
      const url = editingDiscountId ? `${API_URL}/magiamgia/${editingDiscountId}` : `${API_URL}/magiamgia`;
      const method = editingDiscountId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast(editingDiscountId ? 'Cập nhật mã giảm giá thành công!' : 'Thêm mã giảm giá mới thành công!', 'success');
        resetDiscountForm();
        fetchAdminData();
      } else {
        const err = await res.json();
        triggerToast(`Lỗi: ${err.message || 'Không thể lưu mã giảm giá'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Đã xảy ra lỗi khi kết nối server!', 'error');
    }
  };

  const resetDiscountForm = () => {
    setEditingDiscountId(null);
    setDiscountCode('');
    setDiscountTitle('');
    setDiscountRate(10);
    setDiscountQuantity(50);
    setDiscountStartDate('');
    setDiscountEndDate('');
    setDiscountStatus('Hoạt động');
  };

  const handleEditDiscount = (d) => {
    const id = d.magiamID || d.magiamid;
    setEditingDiscountId(id);
    setDiscountCode(d.maGiam || d.magiam || '');
    setDiscountTitle(d.ten || '');
    setDiscountRate(d.tiLe !== undefined ? d.tiLe : (d.tile !== undefined ? d.tile : 10));
    setDiscountQuantity(d.soLuong !== undefined ? d.soLuong : (d.soluong !== undefined ? d.soluong : 50));
    const start = d.ngayBatDau || d.ngaybatdau;
    const end = d.ngayKetThuc || d.ngayketthuc;
    setDiscountStartDate(start ? new Date(start).toISOString().slice(0, 16) : '');
    setDiscountEndDate(end ? new Date(end).toISOString().slice(0, 16) : '');
    setDiscountStatus(d.trangThai || d.trangthai || 'Hoạt động');
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <p className="text-gray-500 font-bold">Đang kiểm tra quyền hạn và tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* 1. Left Sidebar Navigation */}
      <div className="w-full md:w-64 bg-gray-900 text-gray-400 flex flex-col justify-between border-r border-gray-850">
        <div>
          <div className="p-6 border-b border-gray-800">
            <span className="text-xl font-black text-white tracking-widest block text-center">LSBOOK ADMIN</span>
            <p className="text-[10px] text-indigo-400 text-center font-bold tracking-wider mt-1 uppercase">Hệ thống quản lý</p>
          </div>
          
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center space-x-3 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"></path></svg>
              <span>Thống kê & Tổng quan</span>
            </button>

            {/* Parent: Quản lý sản phẩm */}
            <div className="space-y-1">
              <button 
                onClick={() => setShowProductSubmenu(!showProductSubmenu)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-gray-800 hover:text-white ${activeTab === 'books' || activeTab === 'categories' ? 'text-white bg-gray-800/40' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  <span>Quản lý sản phẩm</span>
                </div>
                <svg className={`w-3 h-3 transition-transform ${showProductSubmenu ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
              </button>

              {showProductSubmenu && (
                <div className="pl-6 space-y-1">
                  <button 
                    onClick={() => setActiveTab('books')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'books' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                    <span>Quản lý Sách</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('categories')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                    <span>Quản lý Danh mục</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quản lý Mã giảm (nằm ngay dưới Quản lý sản phẩm) */}
            <button 
              onClick={() => setActiveTab('discounts')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center space-x-3 ${activeTab === 'discounts' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              <span>Quản lý Mã giảm</span>
            </button>

            {/* Parent: Quản lý theo dõi đơn hàng */}
            <div className="space-y-1">
              <button 
                onClick={() => setShowOrderSubmenu(!showOrderSubmenu)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between hover:bg-gray-800 hover:text-white ${activeTab.startsWith('orders') ? 'text-white bg-gray-800/40' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                  <span>Theo dõi đơn hàng</span>
                </div>
                <svg className={`w-3 h-3 transition-transform ${showOrderSubmenu ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
              </button>

              {showOrderSubmenu && (
                <div className="pl-6 space-y-1">
                  <button 
                    onClick={() => setActiveTab('orders-all')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'orders-all' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                    <span>Tất cả đơn hàng</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders-pending')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'orders-pending' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Chưa xác nhận</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders-shipping')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'orders-shipping' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Đang giao</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders-completed')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'orders-completed' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span>Đã giao</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders-cancelled')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'orders-cancelled' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>Hủy đơn</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center space-x-3 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              <span>Quản lý Khách hàng</span>
            </button>

            <button 
              onClick={() => setActiveTab('customer-service')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center space-x-3 ${activeTab === 'customer-service' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
              <span>Đánh giá khách hàng</span>
            </button>

            <button 
              onClick={() => setActiveTab('support-chat')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center space-x-3 ${activeTab === 'support-chat' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              <span>Chăm sóc khách hàng</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="w-full text-center block px-4 py-2.5 bg-gray-800 hover:bg-gray-700 hover:text-white text-gray-300 font-bold rounded-xl text-xs transition-all border border-gray-700">
            Quay lại trang chủ
          </Link>
        </div>
      </div>

      {/* 2. Right Workspace Panels */}
      <div className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full overflow-hidden">
        
        {/* PANEL 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-3 uppercase tracking-wider">Tổng quan kinh doanh</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* FRAME A: DOANH THU */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Doanh thu cửa hàng</h2>
                  <span className="text-xxs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-150">Đã hoàn thành</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/40">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tổng doanh thu</span>
                    <span className="text-lg font-black text-indigo-700 block mt-1">{formatPrice(stats.totalRevenue)}</span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tiền mặt (COD)</span>
                    <span className="text-lg font-black text-gray-750 block mt-1">{formatPrice(stats.codRevenue)}</span>
                  </div>
                  <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/20">
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Ngân hàng (QR)</span>
                    <span className="text-lg font-black text-indigo-700 block mt-1">{formatPrice(stats.bankRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* FRAME B: ĐƠN HÀNG */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Trạng thái đơn hàng</h2>
                  <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Tổng hợp số lượng</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/30 text-center">
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Chờ duyệt</span>
                    <span className="text-xl font-black text-amber-600 block mt-1">{stats.counts.choXacNhan} đơn</span>
                  </div>
                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/30 text-center">
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">Đang giao</span>
                    <span className="text-xl font-black text-blue-600 block mt-1">{stats.counts.dangVanChuyen} đơn</span>
                  </div>
                  <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100/30 text-center">
                    <span className="text-[10px] text-green-600 font-bold uppercase block">Thành công</span>
                    <span className="text-xl font-black text-green-600 block mt-1">{stats.counts.daHoanThanh} đơn</span>
                  </div>
                  <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100/30 text-center">
                    <span className="text-[10px] text-red-500 font-bold uppercase block">Đã hủy</span>
                    <span className="text-xl font-black text-red-500 block mt-1">{stats.counts.daHuy} đơn</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Top selling books */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">🔥 Top Sách bán chạy nhất</h3>
                  <p className="text-xxs text-gray-400 mt-0.5">Xếp hạng theo tổng số lượng đơn mua thực tế toàn shop.</p>
                </div>
                <span className="text-xxs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {stats.topSellingBooks.length} tác phẩm
                </span>
              </div>

              <div className="space-y-3">
                {stats.topSellingBooks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">Chưa phát sinh dữ liệu bán hàng.</p>
                ) : (
                  stats.topSellingBooks.map((item, idx) => {
                    const maxQty = stats.topSellingBooks[0]?.quantity || 1;
                    const percent = Math.round((item.quantity / maxQty) * 100);

                    return (
                      <div key={idx} className="bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl p-3.5 transition-all space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            {/* Rank badge */}
                            <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center border shadow-2xs ${
                              idx === 0 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              idx === 1 ? 'bg-slate-200 text-slate-700 border-slate-300' :
                              idx === 2 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              #{idx + 1}
                            </span>

                            {/* Book cover image */}
                            {item.hinhAnh ? (
                              <img src={item.hinhAnh} alt={item.tenSach} className="w-9 h-11 object-cover rounded-lg border border-gray-200 shadow-2xs" />
                            ) : (
                              <div className="w-9 h-11 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xxs font-bold">Bản</div>
                            )}

                            <div>
                              <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.tenSach}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Đơn giá: <span className="font-bold text-gray-600">{formatPrice(item.giaBan)}</span></p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-black text-indigo-700 block">Đã bán: {item.quantity} cuốn</span>
                            <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">{formatPrice(item.revenue)}</span>
                          </div>
                        </div>

                        {/* Relative sales progress bar */}
                        <div className="w-full bg-gray-200/60 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0 ? 'bg-indigo-600' :
                              idx === 1 ? 'bg-blue-500' :
                              idx === 2 ? 'bg-emerald-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
 
        {/* PANEL 2: BOOKS MANAGEMENT */}
        {activeTab === 'books' && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-3 uppercase tracking-wider">Quản lý kho sách</h1>

            {/* Book form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {editingBookId ? 'Cập nhật thông tin sách' : 'Thêm sách mới vào kho'}
              </h3>
              <form onSubmit={handleSaveBook} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-500">Tên sách *</label>
                  <input type="text" value={bookTitle} onChange={e => setBookTitle(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required />
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Danh mục *</label>
                  <select value={bookCategory} onChange={e => setBookCategory(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required>
                    <option value="">Chọn danh mục</option>
                    {categories.map(c => <option key={c.danhmucID} value={c.danhmucID}>{c.tenDanhMuc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Tác giả *</label>
                  <select value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required>
                    <option value="">Chọn tác giả</option>
                    {authors.map(a => <option key={a.tacGiaID} value={a.tacGiaID}>{a.tenTacGia}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Nhà xuất bản *</label>
                  <select value={bookPublisher} onChange={e => setBookPublisher(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required>
                    <option value="">Chọn nhà xuất bản</option>
                    {publishers.map(p => <option key={p.nxbID} value={p.nxbID}>{p.tenNXB}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Giá bán (VND) *</label>
                  <input type="number" value={bookPrice} onChange={e => setBookPrice(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required min="1000" />
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Giá nhập (VND)</label>
                  <input type="number" value={bookImportPrice} onChange={e => setBookImportPrice(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" min="0" />
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Số lượng tồn kho *</label>
                  <input type="number" value={bookStock} onChange={e => setBookStock(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required min="0" />
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Năm xuất bản</label>
                  <input type="number" value={bookYear} onChange={e => setBookYear(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Trạng thái bán</label>
                  <select value={bookStatus} onChange={e => setBookStatus(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
                    <option value="Bán">Đang bán</option>
                    <option value="Ngừng bán">Ngừng bán</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-gray-500">Link hình ảnh</label>
                  <input type="text" value={bookImage} onChange={e => setBookImage(e.target.value)} placeholder="https://..." className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                </div>
                <div className="sm:col-span-3">
                  <label className="font-semibold text-gray-500">Mô tả tác phẩm</label>
                  <input type="text" value={bookDesc} onChange={e => setBookDesc(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                </div>
                
                <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-gray-50 mt-2">
                  {editingBookId && (
                    <button type="button" onClick={resetBookForm} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-bold">Hủy bỏ</button>
                  )}
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-xs">
                    {editingBookId ? 'Lưu cập nhật' : 'Thêm sách'}
                  </button>
                </div>
              </form>
            </div>

            {/* Books table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs leading-normal">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3">Ảnh</th>
                    <th className="px-6 py-3">Tên sách</th>
                    <th className="px-6 py-3">Giá bán</th>
                    <th className="px-6 py-3">Tồn kho</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {books.map(book => (
                    <tr key={book.sachID} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3">
                        <img src={book.hinhAnh} className="w-8 h-10 object-cover rounded border" />
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold block text-gray-900">{book.tenSach}</span>
                        <span className="text-[10px] text-gray-400">ID: {book.sachID}</span>
                      </td>
                      <td className="px-6 py-3 font-bold text-indigo-600">{formatPrice(book.giaBan)}</td>
                      <td className="px-6 py-3 font-mono">{book.soLuongTon} cuốn</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${book.trangThai === 'Bán' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-750'}`}>{book.trangThai}</span>
                      </td>
                      <td className="px-6 py-3 text-center space-x-2">
                        <button onClick={() => handleEditBook(book)} className="text-indigo-650 hover:text-indigo-850 font-bold">Sửa</button>
                        <button onClick={() => handleDeleteBook(book.sachID)} className="text-red-500 hover:text-red-750 font-bold">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL 3: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-3 uppercase tracking-wider">Quản lý danh mục sách</h1>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tạo danh mục mới</h3>
              <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-gray-500">Tên danh mục *</label>
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required />
                </div>
                <div>
                  <label className="font-semibold text-gray-500">Mô tả ngắn</label>
                  <input type="text" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-xs">Tạo danh mục</button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-xl">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs leading-normal">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3">Mã ID</th>
                    <th className="px-6 py-3">Tên danh mục</th>
                    <th className="px-6 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {categories.map(c => (
                    <tr key={c.danhmucID}>
                      <td className="px-6 py-3 font-mono">#{c.danhmucID}</td>
                      <td className="px-6 py-3 font-bold text-gray-900">{c.tenDanhMuc}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700">{c.trangThai}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL 4: ORDERS (TRACKING MANAGEMENT) */}
        {activeTab.startsWith('orders') && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-3 uppercase tracking-wider">
              {activeTab === 'orders-all' && 'Danh sách đơn hàng'}
              {activeTab === 'orders-pending' && 'Danh sách đơn hàng Chưa xác nhận'}
              {activeTab === 'orders-shipping' && 'Danh sách đơn hàng Đang giao'}
              {activeTab === 'orders-completed' && 'Danh sách đơn hàng Đã giao'}
              {activeTab === 'orders-cancelled' && 'Danh sách đơn hàng Hủy'}
            </h1>

            {/* Order Edit Form (only visible when editing) */}
            {editingOrderId && (
              <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-6 max-w-xl animate-fade-in">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">Cập nhật đơn hàng #{editingOrderId}</h3>
                <form onSubmit={handleSaveOrder} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-gray-500">Tên người nhận</label>
                    <input type="text" value={editOrderName} onChange={e => setEditOrderName(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-500">Số điện thoại</label>
                    <input type="text" value={editOrderPhone} onChange={e => setEditOrderPhone(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-gray-500">Địa chỉ giao hàng</label>
                    <input type="text" value={editOrderAddress} onChange={e => setEditOrderAddress(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-500">Trạng thái đơn hàng</label>
                    <select value={editOrderStatus} onChange={e => setEditOrderStatus(e.target.value)} className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
                      <option value="Chờ xác nhận">Chờ xác nhận</option>
                      <option value="Đang vận chuyển">Đang vận chuyển</option>
                      <option value="Đã hoàn thành">Đã hoàn thành</option>
                      <option value="Đã hủy">Đã hủy</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2 mt-2 border-t border-gray-50">
                    <button type="button" onClick={() => setEditingOrderId(null)} className="bg-gray-150 hover:bg-gray-250 px-4 py-2 rounded-lg font-bold">Hủy bỏ</button>
                    <button type="submit" className="bg-indigo-650 hover:bg-indigo-750 text-white px-4 py-2 rounded-lg font-bold shadow-xs">Lưu cập nhật</button>
                  </div>
                </form>
              </div>
            )}

            {/* Search & Date Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-end text-xs">
              <div className="flex-1 min-w-[200px]">
                <label className="font-bold text-gray-400 block mb-1.5 uppercase text-[9px]">Tìm kiếm theo mã đh</label>
                <input 
                  type="text" 
                  placeholder="Nhập mã đơn hàng..." 
                  value={orderIdSearch}
                  onChange={(e) => setOrderIdSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white transition-all text-xs font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1.5 uppercase text-[9px]">Từ ngày</label>
                <input 
                  type="date" 
                  value={orderStartDate}
                  onChange={(e) => setOrderStartDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white transition-all text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1.5 uppercase text-[9px]">Đến ngày</label>
                <input 
                  type="date" 
                  value={orderEndDate}
                  onChange={(e) => setOrderEndDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white transition-all text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setOrderIdSearch('');
                    setOrderStartDate('');
                    setOrderEndDate('');
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-4 py-2 rounded-lg transition-all"
                >
                  Đặt lại
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs leading-normal">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3">Đơn hàng</th>
                    <th className="px-6 py-3">Người nhận / SĐT</th>
                    <th className="px-6 py-3">Địa chỉ giao</th>
                    <th className="px-6 py-3">Tổng cộng</th>
                    <th className="px-6 py-3">Phương thức</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3 text-center">Xử lý / Sửa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {getFilteredOrders(
                    activeTab === 'orders-pending' ? 'Chờ xác nhận' :
                    activeTab === 'orders-shipping' ? 'Đang vận chuyển' :
                    activeTab === 'orders-completed' ? 'Đã hoàn thành' :
                    activeTab === 'orders-cancelled' ? 'Đã hủy' : null
                  ).map(o => (
                    <tr key={o.donhangid} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3">
                        <span className="font-bold block text-gray-900">#{o.donhangid}</span>
                        <span className="text-[10px] text-gray-400">{new Date(o.ngaydat).toLocaleDateString('vi-VN')}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="block font-bold">{o.tennguoinhan}</span>
                        <span className="text-[10px] text-gray-400">{o.sdtnguoinhan}</span>
                      </td>
                      <td className="px-6 py-3 max-w-[150px] truncate">{o.diachigiao}</td>
                      <td className="px-6 py-3 font-bold text-indigo-700">{formatPrice(o.tongTien)}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-150">
                          {o.phuongthucthanhtoan}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.trangThaiDonHang === 'Chờ thanh toán' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          o.trangThaiDonHang === 'Chờ xác nhận' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          o.trangThaiDonHang === 'Đang vận chuyển' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          o.trangThaiDonHang === 'Đã hoàn thành' ? 'bg-green-50 text-green-700 border border-green-200' :
                          'bg-red-50 text-red-750 border border-red-200'
                        }`}>{o.trangThaiDonHang}</span>
                      </td>
                      <td className="px-6 py-3 text-center space-x-2 whitespace-nowrap">
                        {o.trangThaiDonHang === 'Chờ xác nhận' && (
                          <button onClick={() => handleUpdateOrderStatus(o.donhangid, 'Đang vận chuyển')} className="text-xxs bg-blue-600 text-white font-bold px-2 py-1 rounded hover:bg-blue-700 shadow-xs">Giao hàng</button>
                        )}
                        {o.trangThaiDonHang === 'Đang vận chuyển' && (
                          <button onClick={() => handleUpdateOrderStatus(o.donhangid, 'Đã hoàn thành')} className="text-xxs bg-green-600 text-white font-bold px-2 py-1 rounded hover:bg-green-700 shadow-xs">Hoàn thành</button>
                        )}
                        <button 
                          onClick={() => handleEditOrder(o)}
                          className="text-xxs border border-gray-250 text-gray-600 font-bold px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL 5: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-3 uppercase tracking-wider">Quản lý thành viên</h1>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs leading-normal">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3">Họ và tên</th>
                    <th className="px-6 py-3">Địa chỉ Email</th>
                    <th className="px-6 py-3">Số điện thoại</th>
                    <th className="px-6 py-3">Vai trò</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {users.map(u => (
                    <tr key={u.nguoiDungID} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3">
                        <span className="font-bold text-gray-900 block">{u.hoTen}</span>
                        <span className="text-[10px] text-gray-455">ID: {u.nguoiDungID}</span>
                      </td>
                      <td className="px-6 py-3">{u.email}</td>
                      <td className="px-6 py-3 font-mono">{u.soDienThoai}</td>
                      <td className="px-6 py-3 font-bold text-indigo-650">{u.vaiTro}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.trangThai === 'Hoạt động' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-755'}`}>{u.trangThai}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleOpenUserEditModal(u)}
                            className="text-xxs font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                          {u.vaiTro !== 'Quản trị viên' ? (
                            <button onClick={() => handleToggleUserStatus(u)} className={`text-xxs font-bold px-2 py-1 rounded transition-colors ${u.trangThai === 'Hoạt động' ? 'text-red-500 border border-red-200 hover:bg-red-50' : 'text-green-600 border border-green-200 hover:bg-green-50'}`}>
                              {u.trangThai === 'Hoạt động' ? 'Khóa TK' : 'Kích hoạt'}
                            </button>
                          ) : (
                            <span className="text-xxs text-gray-400 italic">Admin</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL 6: CUSTOMER SERVICE (REVIEWS) */}
        {activeTab === 'customer-service' && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-3 uppercase tracking-wider">Đánh giá khách hàng</h1>
            
            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end text-xs">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Số sao đánh giá</label>
                <select
                  value={csRatingFilter}
                  onChange={(e) => setCsRatingFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                >
                  <option value="">Tất cả số sao</option>
                  <option value="5">5 sao ★★★★★</option>
                  <option value="4">4 sao ★★★★</option>
                  <option value="3">3 sao ★★★</option>
                  <option value="2">2 sao ★★</option>
                  <option value="1">1 sao ★</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Từ ngày</label>
                <input
                  type="date"
                  value={csStartDate}
                  onChange={(e) => setCsStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Đến ngày</label>
                <input
                  type="date"
                  value={csEndDate}
                  onChange={(e) => setCsEndDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {(csRatingFilter || csStartDate || csEndDate) && (
                <button
                  onClick={() => {
                    setCsRatingFilter('');
                    setCsStartDate('');
                    setCsEndDate('');
                  }}
                  className="bg-red-50 text-red-650 font-bold px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-100 transition-all select-none"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs leading-normal">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3">Mã đơn hàng</th>
                    <th className="px-6 py-3">Sản phẩm</th>
                    <th className="px-6 py-3">Khách hàng</th>
                    <th className="px-6 py-3">Số sao</th>
                    <th className="px-6 py-3">Nội dung nhận xét</th>
                    <th className="px-6 py-3">Ngày đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {reviews
                    .filter(r => {
                      if (csRatingFilter && r.sosao !== parseInt(csRatingFilter)) {
                        return false;
                      }

                      const reviewDate = new Date(r.ngaydanhgia);
                      
                      if (csStartDate) {
                        const start = new Date(csStartDate);
                        start.setHours(0, 0, 0, 0);
                        if (reviewDate < start) return false;
                      }
                      
                      if (csEndDate) {
                        const end = new Date(csEndDate);
                        end.setHours(23, 59, 59, 999);
                        if (reviewDate > end) return false;
                      }

                      return true;
                    })
                    .map(r => {
                    const u = users.find(user => user.nguoiDungID === r.nguoidungid);
                    let displayName = 'Khách ẩn danh';
                    let content = r.noidung || '';
                    if (u) {
                      displayName = u.hoTen || 'Thành viên';
                    } else if (content.startsWith('[Khách vãng lai:')) {
                      const match = content.match(/^\[Khách vãng lai:\s*([^\]]+)\]\s*(.*)$/);
                      if (match) {
                        displayName = match[1];
                        content = match[2];
                      } else {
                        displayName = 'Khách vãng lai';
                      }
                    }

                    const book = books.find(b => b.sachID === r.sachid);
                    const bookName = book ? book.tenSach : `Sách #${r.sachid}`;

                    let orderId = '';
                    let matchingOrders = [];
                    if (r.nguoidungid) {
                      matchingOrders = orders.filter(o => o.nguoidungid === r.nguoidungid);
                    } else {
                      matchingOrders = orders.filter(o => 
                        (o.tennguoinhan && o.tennguoinhan.trim().toLowerCase() === displayName.trim().toLowerCase()) ||
                        (o.tenNguoiNhan && o.tenNguoiNhan.trim().toLowerCase() === displayName.trim().toLowerCase())
                      );
                    }

                    const matchedOrder = matchingOrders.find(o => {
                      const items = orderDetails.filter(d => d.donhangid === o.donhangid);
                      return items.some(item => item.sachid === r.sachid);
                    });

                    if (matchedOrder) {
                      orderId = `#${matchedOrder.donhangid}`;
                    } else {
                      orderId = 'N/A';
                    }

                    return (
                      <tr key={r.danhgiaid} className="hover:bg-gray-50/55">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[10px]">
                            {orderId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 block">{bookName}</span>
                          <span className="text-[10px] text-gray-450 block mt-0.5">Mã: BOOK-000{r.sachid}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800">{displayName}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{r.nguoidungid ? 'Thành viên' : 'Khách vãng lai'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <svg key={idx} className={`w-3.5 h-3.5 ${idx < r.sosao ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-gray-650">
                          {content}
                        </td>
                        <td className="px-6 py-4 text-gray-450 text-[10px]">
                          {new Date(r.ngaydanhgia).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                  {reviews.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400 italic">Chưa có đánh giá nào của khách hàng.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL: DISCOUNTS MANAGEMENT (QUẢN LÝ MÃ GIẢM) */}
        {activeTab === 'discounts' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap justify-between items-center border-b border-gray-200 pb-3 gap-3">
              <div>
                <h1 className="text-xl font-black text-gray-900 uppercase tracking-wider">Quản lý Mã giảm</h1>
                <p className="text-xs text-gray-400 mt-0.5">Tạo, cập nhật và truy vấn các chương trình mã giảm giá toàn shop.</p>
              </div>
              <button 
                onClick={resetDiscountForm}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                + Thêm mã giảm mới
              </button>
            </div>

            {/* Discount Code Form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {editingDiscountId ? `Cập nhật mã giảm #${editingDiscountId}` : 'Tạo mới mã giảm giá'}
                </h3>
                {editingDiscountId && (
                  <button onClick={resetDiscountForm} className="text-xxs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg cursor-pointer">
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveDiscount} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-500 block mb-1">Mã giảm (Voucher Code) *</label>
                  <input 
                    type="text" 
                    value={discountCode} 
                    onChange={e => setDiscountCode(e.target.value)} 
                    placeholder="VD: SUMMER2026..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-700 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    required 
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-500 block mb-1">Tên / Nội dung chương trình *</label>
                  <input 
                    type="text" 
                    value={discountTitle} 
                    onChange={e => setDiscountTitle(e.target.value)} 
                    placeholder="VD: Giảm 15% tổng đơn..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    required 
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-500 block mb-1">Tỉ lệ giảm (%) *</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={discountRate} 
                    onChange={e => setDiscountRate(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    required 
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-500 block mb-1">Số lượng phát hành *</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={discountQuantity} 
                    onChange={e => setDiscountQuantity(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    required 
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-500 block mb-1">Ngày bắt đầu</label>
                  <input 
                    type="datetime-local" 
                    value={discountStartDate} 
                    onChange={e => setDiscountStartDate(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-500 block mb-1">Ngày kết thúc</label>
                  <input 
                    type="datetime-local" 
                    value={discountEndDate} 
                    onChange={e => setDiscountEndDate(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-500 block mb-1">Trạng thái phát hành</label>
                  <select 
                    value={discountStatus} 
                    onChange={e => setDiscountStatus(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                    <option value="Hết hạn">Hết hạn</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button 
                    type="submit" 
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer"
                  >
                    {editingDiscountId ? 'Cập nhật mã giảm' : 'Lưu mã giảm mới'}
                  </button>
                </div>
              </form>
            </div>

            {/* Discount Codes Table View (Truy vấn) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Danh sách mã giảm giá ({discounts.length})</h3>
                
                {/* Search query input */}
                <input 
                  type="text" 
                  value={discountSearch} 
                  onChange={e => setDiscountSearch(e.target.value)} 
                  placeholder="Tìm theo mã hoặc tên mã giảm..." 
                  className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 uppercase text-[10px] font-bold text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Mã giảm</th>
                      <th className="px-4 py-3">Tên chương trình</th>
                      <th className="px-4 py-3">Mức giảm</th>
                      <th className="px-4 py-3 text-center">Số lượng</th>
                      <th className="px-4 py-3">Thời gian áp dụng</th>
                      <th className="px-4 py-3 text-center">Trạng thái</th>
                      <th className="px-4 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {discounts
                      .filter(d => {
                        if (!discountSearch.trim()) return true;
                        const q = discountSearch.toLowerCase().trim();
                        const code = d.maGiam || d.magiam || '';
                        const name = d.ten || '';
                        return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
                      })
                      .map((d, index) => {
                        const id = d.magiamID || d.magiamid || (index + 1);
                        const code = d.maGiam || d.magiam || '';
                        const title = d.ten || '';
                        const rate = d.tiLe !== undefined ? d.tiLe : (d.tile !== undefined ? d.tile : 0);
                        const quantity = d.soLuong !== undefined ? d.soLuong : (d.soluong !== undefined ? d.soluong : 0);
                        const start = d.ngayBatDau || d.ngaybatdau;
                        const end = d.ngayKetThuc || d.ngayketthuc;
                        const status = d.trangThai || d.trangthai || 'Hoạt động';

                        return (
                          <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-gray-400">#{id}</td>
                            <td className="px-4 py-3">
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 font-black font-mono px-2.5 py-1 rounded-lg">
                                {code}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-800">{title}</td>
                            <td className="px-4 py-3 font-black text-emerald-600">-{rate}%</td>
                            <td className="px-4 py-3 text-center font-bold text-gray-700">{quantity} lượt</td>
                            <td className="px-4 py-3 text-gray-500 font-medium">
                              <span className="block text-xxs text-gray-400">Từ: {start ? new Date(start).toLocaleDateString('vi-VN') : '---'}</span>
                              <span className="block text-xxs text-gray-400">Đến: {end ? new Date(end).toLocaleDateString('vi-VN') : '---'}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                status === 'Hoạt động' ? 'bg-green-50 text-green-700 border border-green-200' :
                                status === 'Tạm dừng' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button 
                                onClick={() => handleEditDiscount(d)}
                                className="text-xxs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                Sửa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {discounts.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-gray-400 italic">Chưa có mã giảm giá nào trong hệ thống.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: CSKH CHAT DASHBOARD */}
        {activeTab === 'support-chat' && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-3 uppercase tracking-wider">Chăm sóc khách hàng</h1>
            
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-[680px]">
              
              {/* Left: Chat Sessions List */}
              <div className="w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-100 bg-white">
                  <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">Danh sách hội thoại</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Khách hàng cần tư vấn</p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {chatSessions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 font-bold">
                      Chưa có cuộc trò chuyện nào.
                    </div>
                  ) : (
                    chatSessions.map(session => {
                      const isSelected = session.sessionID === selectedSessionID;

                      return (
                        <div
                          key={session.sessionID}
                          onClick={() => handleSelectSession(session)}
                          className={`p-4 transition-all cursor-pointer flex items-start space-x-3 ${
                            isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-gray-100/60 bg-white'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                            {session.senderName ? session.senderName.charAt(0).toUpperCase() : 'K'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="text-xs font-bold text-gray-900 truncate">
                                {session.senderName}
                              </h4>
                              {session.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                  {session.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{session.lastMessage}</p>
                            <span className="text-[10px] text-gray-400 block mt-1">
                              {session.lastTime ? new Date(session.lastTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Selected Chat Conversation */}
              <div className="flex-1 flex flex-col bg-white">
                {!selectedSessionID ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                    <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <p className="text-xs font-bold">Chọn một cuộc trò chuyện từ danh sách bên trái để phản hồi.</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          {selectedSessionName ? selectedSessionName.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">{selectedSessionName}</h3>
                          <p className="text-[10px] text-gray-400 font-mono">Session: {selectedSessionID}</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-gray-50/20">
                      {adminChatMessages.length === 0 ? (
                        <div className="text-center py-12 text-xs text-gray-400 font-bold">
                          Chưa có tin nhắn nào trong cuộc trò chuyện này.
                        </div>
                      ) : (
                        adminChatMessages.map(msg => {
                          const isAdminMsg = msg.senderType === 'ADMIN';

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                            >
                              <span className="text-[10px] text-gray-400 px-1 mb-0.5 font-medium">
                                {isAdminMsg ? 'Quản trị viên' : msg.senderName}
                              </span>
                              <div
                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                  isAdminMsg
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white border border-gray-150 text-gray-800 rounded-bl-none'
                                }`}
                              >
                                {msg.message}
                              </div>
                              <span className="text-[9px] text-gray-400 mt-1 px-1">
                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })
                      )}
                      <div ref={adminChatEndRef} />
                    </div>

                    {/* Chat Reply Form */}
                    <form onSubmit={handleSendAdminReply} className="p-4 border-t border-gray-100 flex items-center space-x-3 bg-white">
                      <input
                        type="text"
                        value={adminReplyMessage}
                        onChange={(e) => setAdminReplyMessage(e.target.value)}
                        placeholder="Nhập câu trả lời tư vấn cho khách hàng..."
                        className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!adminReplyMessage.trim() || isSendingAdminReply}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider cursor-pointer flex-shrink-0"
                      >
                        Gửi trả lời
                      </button>
                    </form>
                  </>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Warning Confirmation Modal for Completing Shipping Orders */}
      {showCompleteWarningModal && pendingCompleteOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-gray-100 shadow-2xl animate-scale-up space-y-5 text-left">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Xác nhận hoàn thành đơn hàng</h3>
                <p className="text-xxs text-gray-400">Đơn hàng #{pendingCompleteOrder.donhangid}</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-black text-amber-900 leading-relaxed">
                Cảnh báo nhân viên thao tác sẽ chịu trách nhiệm nếu làm sai đơn hàng
              </p>
              <p className="text-xxs text-amber-700 leading-relaxed">
                Vui lòng đảm bảo đơn hàng #{pendingCompleteOrder.donhangid} đã được đơn vị vận chuyển giao tận tay khách hàng và thu đủ tiền trước khi bấm hoàn thành.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 border border-gray-100">
              <p><span className="text-gray-400 font-semibold">Khách nhận:</span> <span className="font-bold text-gray-800">{pendingCompleteOrder.tennguoinhan} ({pendingCompleteOrder.sdtnguoinhan})</span></p>
              <p><span className="text-gray-400 font-semibold">Tổng tiền:</span> <span className="font-bold text-indigo-700">{formatPrice(pendingCompleteOrder.tongTien)}</span></p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button 
                type="button"
                onClick={() => {
                  setShowCompleteWarningModal(false);
                  setPendingCompleteOrder(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={handleConfirmCompleteOrder}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Tôi chịu trách nhiệm & Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Dialog Modal */}
      {showUserEditModal && editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-gray-100 shadow-2xl animate-scale-up space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Chỉnh sửa thông tin tài khoản</h3>
                <p className="text-xxs text-gray-400">Mã ID: #{editingUser.nguoiDungID}</p>
              </div>
              <button 
                onClick={() => setShowUserEditModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Họ và tên *</label>
                  <input 
                    type="text" 
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="mt-1.5 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ Email *</label>
                  <input 
                    type="email" 
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="mt-1.5 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Số điện thoại *</label>
                  <input 
                    type="tel" 
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    className="mt-1.5 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Điểm tích lũy</label>
                  <input 
                    type="number" 
                    value={editUserPoints}
                    onChange={(e) => setEditUserPoints(e.target.value)}
                    className="mt-1.5 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ giao hàng</label>
                <input 
                  type="text" 
                  value={editUserAddress}
                  onChange={(e) => setEditUserAddress(e.target.value)}
                  className="mt-1.5 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Vai trò tài khoản</label>
                  <select 
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="mt-1.5 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="Khách hàng">Khách hàng</option>
                    <option value="Nhân viên">Nhân viên</option>
                    <option value="Quản trị viên">Quản trị viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Trạng thái tài khoản</label>
                  <select 
                    value={editUserStatus}
                    onChange={(e) => setEditUserStatus(e.target.value)}
                    className="mt-1.5 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Bị khóa">Bị khóa</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowUserEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
