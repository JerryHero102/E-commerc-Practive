import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { triggerToast } from '../components/Toast';
import { API_URL } from '../config';

// Helper to remove Vietnamese accents for accent-insensitive search
function removeVietnameseAccents(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');

  const router = useRouter();
  const { danhmuc, search } = router.query;

  // Load Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, catsRes, authorsRes, pubsRes] = await Promise.all([
          fetch(`${API_URL}/sach`).then(r => r.json()),
          fetch(`${API_URL}/danhmuc`).then(r => r.json()),
          fetch(`${API_URL}/tacgia`).then(r => r.json()),
          fetch(`${API_URL}/nhaxuatban`).then(r => r.json())
        ]);

        setBooks(booksRes.filter(b => b.trangThai === 'Bán'));
        setCategories(catsRes.filter(c => c.trangThai === 'Hoạt động'));
        setAuthors(authorsRes);
        setPublishers(pubsRes);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  // Update Category from router query parameter
  useEffect(() => {
    if (danhmuc) {
      setSelectedCategory(danhmuc);
    } else {
      setSelectedCategory('');
    }
  }, [danhmuc]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...books];

    // Filter by Category
    if (selectedCategory) {
      result = result.filter(b => b.danhmucID === parseInt(selectedCategory));
    }

    // Accent-insensitive & case-insensitive Search Query
    const query = search || '';
    if (query) {
      const cleanQuery = removeVietnameseAccents(query);
      result = result.filter(b => {
        const cat = categories.find(c => c.danhmucID === b.danhmucID);
        const author = authors.find(a => a.tacgiaID === b.tacgiaID);
        const pub = publishers.find(p => p.nxbID === b.nxbID);
        
        const cleanTitle = removeVietnameseAccents(b.tenSach);
        const cleanCat = cat ? removeVietnameseAccents(cat.tenDanhMuc) : '';
        const cleanAuthor = author ? removeVietnameseAccents(author.tenTacGia) : '';
        const cleanPub = pub ? removeVietnameseAccents(pub.tenNXB) : '';

        return (
          cleanTitle.includes(cleanQuery) ||
          cleanCat.includes(cleanQuery) ||
          cleanAuthor.includes(cleanQuery) ||
          cleanPub.includes(cleanQuery)
        );
      });
    }

    // Filter by Price Range
    if (selectedPriceRange) {
      if (selectedPriceRange === 'under-100') {
        result = result.filter(b => b.giaBan < 100000);
      } else if (selectedPriceRange === '100-200') {
        result = result.filter(b => b.giaBan >= 100000 && b.giaBan <= 200000);
      } else if (selectedPriceRange === 'over-200') {
        result = result.filter(b => b.giaBan > 200000);
      }
    }

    // Apply Sorting
    if (selectedSort === 'price-asc') {
      result.sort((a, b) => a.giaBan - b.giaBan);
    } else if (selectedSort === 'price-desc') {
      result.sort((a, b) => b.giaBan - a.giaBan);
    } else if (selectedSort === 'name-asc') {
      result.sort((a, b) => a.tenSach.localeCompare(b.tenSach));
    } else {
      // Default: newest (by ID desc)
      result.sort((a, b) => b.sachID - a.sachID);
    }

    setFilteredBooks(result);
  }, [books, selectedCategory, selectedPriceRange, selectedSort, search]);

  const handleAddToCart = (book) => {
    const userStr = localStorage.getItem('LS_currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const cartKey = user ? `LS_cart_${user.nguoiDungID}` : 'LS_cart_guest';
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');

    const existingIdx = cart.findIndex(item => item.sachID === book.sachID);
    const currentQty = existingIdx !== -1 ? cart[existingIdx].quantity : 0;
    
    if (currentQty + 1 > book.soLuongTon) {
      triggerToast(`Xin lỗi, chỉ còn ${book.soLuongTon} cuốn trong kho!`, 'warning');
      return;
    }

    if (existingIdx !== -1) {
      cart[existingIdx].quantity = currentQty + 1;
    } else {
      cart.push({
        sachID: book.sachID,
        tenSach: book.tenSach,
        giaBan: book.giaBan,
        hinhAnh: book.hinhAnh,
        quantity: 1
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    triggerToast('Đã thêm sách vào giỏ hàng!', 'success');
  };

  const getAuthorName = (authorId) => {
    const author = authors.find(a => a.tacgiaID === authorId);
    return author ? author.tenTacGia : 'Chưa cập nhật';
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner / Hero Slider */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 p-8 md:p-12 text-white overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Chào mừng đến với LSBook Store</span>
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">Khám Phá Thế Giới Tri Thức Bao La</h1>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">Hàng ngàn cuốn sách hấp dẫn từ các tác giả nổi tiếng hàng đầu đang chờ đón bạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="col-span-1 space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thể loại sách</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === '' ? 'bg-indigo-50 text-indigo-650' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Tất cả thể loại
              </button>
              {categories.map(c => (
                <button
                  key={c.danhmucID}
                  onClick={() => setSelectedCategory(String(c.danhmucID))}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === String(c.danhmucID) ? 'bg-indigo-50 text-indigo-650' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {c.tenDanhMuc}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Khoảng giá</h3>
            <div className="space-y-1">
              {[
                { key: '', label: 'Tất cả giá' },
                { key: 'under-100', label: 'Dưới 100.000đ' },
                { key: '100-200', label: '100.000đ - 200.000đ' },
                { key: 'over-200', label: 'Trên 200.000đ' }
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPriceRange(p.key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedPriceRange === p.key ? 'bg-indigo-50 text-indigo-650' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sắp xếp</h3>
            <select 
              value={selectedSort} 
              onChange={(e) => setSelectedSort(e.target.value)}
              className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            >
              <option value="newest">Sách mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="name-asc">Tên từ A-Z</option>
            </select>
          </div>
        </div>

        {/* Right column: Book List Grid */}
        <div className="col-span-1 lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm font-bold text-gray-500">Tìm thấy <span className="text-indigo-600 font-extrabold">{filteredBooks.length}</span> cuốn sách</p>
            {(selectedCategory || selectedPriceRange || selectedSort !== 'newest' || search) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedPriceRange('');
                  setSelectedSort('newest');
                  if (search) {
                    router.push('/');
                  }
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-xl transition-all select-none"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          {filteredBooks.length === 0 ? (
            <div className="space-y-8">
              {/* No match notice */}
              <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-xs space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <h3 className="text-base font-bold text-gray-800">Không tìm thấy sách kết quả trực tiếp cho từ khóa "{search || 'đang chọn'}"</h3>
                <p className="text-xs text-gray-400">Dưới đây là một số tác phẩm nổi bật gợi ý dành riêng cho bạn:</p>
              </div>

              {/* Related/Suggested Books Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  Gợi ý sách có thể bạn quan tâm
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {books.slice(0, 8).map(book => (
                    <div key={book.sachID} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      <Link href={`/books/${book.sachID}`} className="relative block bg-gray-50 overflow-hidden pt-[125%] cursor-pointer">
                        <img 
                          src={book.hinhAnh} 
                          alt={book.tenSach} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <p className="text-xxs font-bold text-indigo-600 uppercase tracking-widest">
                            {getAuthorName(book.tacgiaID)}
                          </p>
                          <Link href={`/books/${book.sachID}`} className="block mt-1 text-sm font-bold text-gray-900 line-clamp-2 hover:text-indigo-600 transition-colors">
                            {book.tenSach}
                          </Link>
                        </div>

                        <div className="mt-4 border-t border-gray-50 pt-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-base font-black text-indigo-700">{formatPrice(book.giaBan)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Link href={`/books/${book.sachID}`} className="w-full text-center text-xs font-bold py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-lg transition-colors border border-gray-100">
                              Chi tiết
                            </Link>
                            <button 
                              onClick={() => handleAddToCart(book)}
                              className="w-full text-xs font-bold py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
                            >
                              Thêm vào
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredBooks.map(book => (
                <div key={book.sachID} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <Link href={`/books/${book.sachID}`} className="relative block bg-gray-50 overflow-hidden pt-[125%] cursor-pointer">
                    <img 
                      src={book.hinhAnh} 
                      alt={book.tenSach} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {book.soLuongTon === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-3 py-1 rounded bg-red-650">Hết hàng</span>
                      </div>
                    )}
                  </Link>

                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-xxs font-bold text-indigo-600 uppercase tracking-widest">
                        {getAuthorName(book.tacgiaID)}
                      </p>
                      <Link href={`/books/${book.sachID}`} className="block mt-1 text-sm font-bold text-gray-900 line-clamp-2 hover:text-indigo-600 transition-colors">
                        {book.tenSach}
                      </Link>
                    </div>

                    <div className="mt-4 border-t border-gray-50 pt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-black text-indigo-700">{formatPrice(book.giaBan)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Link href={`/books/${book.sachID}`} className="w-full text-center text-xs font-bold py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-lg transition-colors border border-gray-100">
                          Chi tiết
                        </Link>
                        {book.soLuongTon > 0 ? (
                          <button 
                            onClick={() => handleAddToCart(book)}
                            className="w-full text-xs font-bold py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
                          >
                            Thêm vào
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="w-full text-xs font-bold py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                          >
                            Hết hàng
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
