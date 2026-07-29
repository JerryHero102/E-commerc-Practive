import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { API_URL } from '../config';

export default function Header() {
  const [currentUser, setCurrentUser] = useState(null);
  const [actingRole, setActingRole] = useState('Khách hàng');
  const [dbUserIsAdmin, setDbUserIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Load user, cart, categories
  useEffect(() => {
    const loadUserAndCart = () => {
      const userStr = localStorage.getItem('LS_currentUser');
      const roleStr = localStorage.getItem('LS_actingRole') || 'Khách hàng';
      setActingRole(roleStr);

      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        // Verify role with NestJS backend
        fetch(`${API_URL}/nguoidung`)
          .then(res => res.json())
          .then(users => {
            const dbUser = users.find(u => u.nguoiDungID === user.nguoiDungID);
            if (dbUser && dbUser.vaiTro === 'Quản trị viên') {
              setDbUserIsAdmin(true);
            } else {
              setDbUserIsAdmin(false);
            }
          })
        // Calculate unread notifications count
        Promise.all([
          fetch(`${API_URL}/donhang`).then(r => r.json()).catch(() => []),
          fetch(`${API_URL}/thanhtoan`).then(r => r.json()).catch(() => [])
        ]).then(([ordersRes, paymentsRes]) => {
          const userOrders = ordersRes.filter(o => o.nguoidungid === user.nguoiDungID);
          const readSet = new Set(JSON.parse(localStorage.getItem(`LS_read_notifs_${user.nguoiDungID}`) || '[]'));
          let total = 0;
          let read = 0;

          userOrders.forEach(o => {
            const orderId = o.donhangid;
            const status = o.trangthaidonhang || o.trangThaiDonHang;

            total++;
            if (readSet.has(`notif_create_${orderId}`)) read++;

            const pay = paymentsRes.find(p => p.donhangid === orderId);
            if (pay && (pay.trangthaithanhtoan === 'Đã thanh toán' || pay.trangThaiThanhToan === 'Đã thanh toán')) {
              total++;
              if (readSet.has(`notif_pay_${orderId}`)) read++;
            }

            if (status === 'Đã hủy') {
              total++;
              if (readSet.has(`notif_cancel_${orderId}`)) read++;
            }

            if (status === 'Đã hoàn thành' || status === 'Đã giao') {
              total++;
              if (readSet.has(`notif_delivered_${orderId}`)) read++;
            }
          });

          setUnreadNotifCount(Math.max(0, total - read));
        });
      } else {
        setCurrentUser(null);
        setDbUserIsAdmin(false);
        setUnreadNotifCount(0);
      }

      // Fetch cart count from LocalStorage dynamically
      const userObj = userStr ? JSON.parse(userStr) : null;
      const cartKey = userObj ? `LS_cart_${userObj.nguoiDungID}` : 'LS_cart_guest';
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    loadUserAndCart();

    // Listen to storage and custom events for real-time updates
    window.addEventListener('storage', loadUserAndCart);
    window.addEventListener('cart-updated', loadUserAndCart);
    window.addEventListener('notif-updated', loadUserAndCart);

    // Fetch categories from NestJS Backend
    fetch(`${API_URL}/danhmuc`)
      .then(res => res.json())
      .then(data => {
        setCategories(data.filter(c => c.trangThai === 'Hoạt động'));
      })
      .catch(err => console.error('Failed to fetch categories:', err));

    return () => {
      window.removeEventListener('storage', loadUserAndCart);
      window.removeEventListener('cart-updated', loadUserAndCart);
      window.removeEventListener('notif-updated', loadUserAndCart);
    };
  }, []);

  // Sync search input text with router query parameter
  useEffect(() => {
    setSearchQuery(router.query.search || '');
  }, [router.query.search]);

  const handleSignOut = () => {
    localStorage.removeItem('LS_currentUser');
    localStorage.removeItem('LS_actingRole');
    localStorage.removeItem('LS_guestName');
    localStorage.removeItem('LS_guestSessionID');
    setCurrentUser(null);
    setActingRole('Khách hàng');
    setDbUserIsAdmin(false);
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  const switchRole = (role) => {
    const newRole = role === 'admin' ? 'Quản trị viên' : 'Khách hàng';
    localStorage.setItem('LS_actingRole', newRole);
    setActingRole(newRole);
    // Refresh page or push route
    if (newRole === 'Quản trị viên') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo & Core Nav */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-black tracking-wider text-indigo-700 font-sans">LSBOOK STORE</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className={`transition-colors ${router.pathname === '/' ? 'text-indigo-650 font-black' : 'text-gray-700 hover:text-indigo-600'}`}>Trang chủ</Link>
              <div className="relative group">
                <button className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center space-x-1 py-5">
                  <span>Thể loại</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {/* Category Dropdown */}
                <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 hidden group-hover:block transition-all duration-150">
                  <Link href="/" className="block px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Tất cả sách</Link>
                  {categories.map(c => (
                    <Link key={c.danhmucID} href={`/?danhmuc=${c.danhmucID}`} className="block px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                      {c.tenDanhMuc}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Search input located next to Thể loại */}
              <form onSubmit={handleSearch} className="relative max-w-xs hidden sm:block">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm sách..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 focus:w-56 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-300"
                />
                <button type="submit" className="absolute right-3 top-2 text-gray-400 hover:text-indigo-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
              </form>
            </div>
          </div>

          {/* Right: Cart, Clipboard Lookup, Account dropdown */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon with badge */}
            <Link href="/cart" className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-0.5 text-xxs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/3 -translate-y-1/3 shadow-sm">{cartCount}</span>
              )}
            </Link>

            {/* Clipboard order lookup icon with tooltip */}
            <div className="relative group/tooltip">
              <Link href="/order-lookup" className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors block">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              </Link>
              <span className="absolute top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 pointer-events-none z-[999] whitespace-nowrap">
                Tìm kiếm đơn hàng
              </span>
            </div>

            {/* Notification Bell Icon with Badge */}
            {currentUser && (
              <div className="relative group/tooltip">
                <Link 
                  href="/profile?tab=notifications" 
                  className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors block"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </Link>
                <span className="absolute top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 pointer-events-none z-[999] whitespace-nowrap">
                  Thông báo
                </span>
              </div>
            )}

            {/* Account & Role Switcher OR Login/Register button */}
            {currentUser ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors py-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    {currentUser.hoTen ? currentUser.hoTen.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline-block font-bold">{currentUser.hoTen}</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">{actingRole}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {/* Account Dropdown */}
                <div className="absolute right-0 mt-0 w-64 bg-white border border-gray-100 rounded-lg shadow-xl py-2 hidden group-hover:block transition-all duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400 font-bold">Đang đăng nhập:</p>
                    <p className="text-sm font-bold text-gray-800">{currentUser.hoTen}</p>
                    <p className="text-xs text-gray-500">{currentUser.email}</p>
                  </div>
                  
                  {/* Links */}
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                    Thông tin cá nhân & Đơn hàng
                  </Link>
                  
                  {dbUserIsAdmin && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors font-semibold">
                      Trang quản trị (Admin)
                    </Link>
                  )}

                  <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-2 pt-2">
                    Đăng xuất
                  </button>

                  {/* Switcher */}
                  {dbUserIsAdmin && (
                    <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                      <p className="text-xxs font-bold tracking-wider text-gray-400 uppercase mb-1">Thay đổi:</p>
                      <div className="grid grid-cols-1">
                        {actingRole === 'Khách hàng' ? (
                          <button onClick={() => switchRole('admin')} className="w-full text-center text-xxs font-extrabold py-2 rounded transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                            Quản trị viên
                          </button>
                        ) : (
                          <button onClick={() => switchRole('customer')} className="w-full text-center text-xxs font-extrabold py-2 rounded transition-all bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700">
                            Khách hàng
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth?tab=login" className="text-xs text-gray-700 hover:text-indigo-600 font-bold px-3 py-2 rounded-lg border border-gray-200 transition-colors">
                  Đăng nhập
                </Link>
                <Link href="/auth?tab=register" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg transition-colors shadow-xs">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
