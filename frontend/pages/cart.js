import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { triggerToast } from '../components/Toast';

const API_URL = 'http://localhost:3001/api';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [books, setBooks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  // Load cart data
  useEffect(() => {
    const userStr = localStorage.getItem('LS_currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    setCurrentUser(user);

    const cartKey = user ? `LS_cart_${user.nguoiDungID}` : 'LS_cart_guest';
    const localCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    setCart(localCart);

    // Fetch up-to-date book stock/details
    fetch(`${API_URL}/sach`)
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error('Failed to load books details:', err));
  }, []);

  const getCartKey = () => {
    return currentUser ? `LS_cart_${currentUser.nguoiDungID}` : 'LS_cart_guest';
  };

  const updateQuantity = (sachID, newQty) => {
    const book = books.find(b => b.sachID === sachID);
    if (!book) return;

    if (newQty > book.soLuongTon) {
      triggerToast(`Xin lỗi, chỉ còn ${book.soLuongTon} cuốn trong kho!`, 'warning');
      return;
    }

    let updatedCart = [...cart];
    const idx = updatedCart.findIndex(item => item.sachID === sachID);
    if (idx !== -1) {
      if (newQty <= 0) {
        updatedCart.splice(idx, 1);
      } else {
        updatedCart[idx].quantity = parseInt(newQty);
      }
      setCart(updatedCart);
      localStorage.setItem(getCartKey(), JSON.stringify(updatedCart));
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  const removeItem = (sachID) => {
    const updatedCart = cart.filter(item => item.sachID !== sachID);
    setCart(updatedCart);
    localStorage.setItem(getCartKey(), JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem(getCartKey(), JSON.stringify([]));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.giaBan * item.quantity), 0);
  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-wider">Giỏ hàng của bạn</h1>

      {cart.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <h3 className="mt-4 text-lg font-bold text-gray-800">Giỏ hàng của bạn đang trống</h3>
          <p className="text-sm text-gray-400 mt-2">Vui lòng quay lại trang chủ để lựa chọn những cuốn sách ưng ý.</p>
          <Link href="/" className="inline-block mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-xs text-xs">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase">Sản phẩm trong giỏ</span>
                <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">Xóa sạch giỏ hàng</button>
              </div>

              <div className="divide-y divide-gray-55 space-y-4">
                {cart.map((item, index) => (
                  <div key={item.sachID} className={`flex items-center space-x-4 py-4 ${index === 0 ? 'pt-0' : ''}`}>
                    <img 
                      src={item.hinhAnh} 
                      alt={item.tenSach} 
                      className="w-16 h-20 object-cover rounded-lg border border-gray-100"
                    />
                    <div className="flex-grow">
                      <Link href={`/books/${item.sachID}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
                        {item.tenSach}
                      </Link>
                      <p className="text-xs text-indigo-600 font-bold mt-1">{formatPrice(item.giaBan)}</p>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-w-fit">
                      <button 
                        onClick={() => updateQuantity(item.sachID, item.quantity - 1)}
                        className="px-2.5 py-1.5 hover:bg-gray-150 text-gray-600 font-bold focus:outline-none"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-black text-gray-700">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.sachID, item.quantity + 1)}
                        className="px-2.5 py-1.5 hover:bg-gray-150 text-gray-600 font-bold focus:outline-none"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete button */}
                    <button 
                      onClick={() => removeItem(item.sachID)}
                      className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                      title="Xóa sản phẩm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary box */}
          <div className="col-span-1">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">Tổng giá trị đơn hàng</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-gray-800">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-gray-800 text-xs uppercase text-green-600">Miễn phí</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <span className="font-black text-gray-900">Tổng cộng</span>
                  <span className="text-2xl font-black text-indigo-700">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="pt-2">
                <a href="/checkout" className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-sm">
                  Thanh toán ngay
                </a>
                <Link href="/" className="block w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-4 transition-colors">
                  Tiếp tục lựa sách
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
