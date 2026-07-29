export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-black text-white tracking-widest font-sans">LSBOOK STORE</span>
            <p className="mt-4 text-sm text-gray-400 max-w-sm leading-relaxed">
              Hệ thống cửa hàng sách trực tuyến hàng đầu, cung cấp các tác phẩm sách giấy có bản quyền chính thức từ các nhà xuất bản uy tín hàng đầu Việt Nam.
            </p>
          </div>
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Hỗ trợ khách hàng</h3>
            <ul className="mt-4 space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách vận chuyển</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách đổi trả</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Thông tin liên hệ</h3>
            <ul className="mt-4 space-y-2 text-xs">
              <li>Địa chỉ: 828 Sư Vạn Hạnh, Phường 13, Quận 10, TP.HCM</li>
              <li>Điện thoại: 090 123 4567</li>
              <li>Email: hotro@lsbookstore.com</li>
              <li className="pt-2"><span className="text-indigo-400 bg-indigo-950/50 px-2.5 py-1 border border-indigo-900/55 rounded font-mono">Bản thảo Next.js + NestJS</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-900 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs">
          <p>&copy; 2026 LSBook Store - Hệ thống bán sách trực tuyến. Tất cả quyền được bảo lưu.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Zalo</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
