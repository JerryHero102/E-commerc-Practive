# LSBook Store - Hệ thống bán sách trực tuyến

Đây là dự án thiết kế giao diện và luồng hoạt động (Prototype Frontend) cho website thương mại điện tử nhà sách trực tuyến **LSBook Store**. Dự án được xây dựng dựa trên các bản thiết kế Paper Prototype và sơ đồ luồng hoạt động (Activity Diagrams) từ thiết kế hệ thống.

## 🛠️ Công nghệ sử dụng
1. **HTML5 & Semantic Elements** - Đảm bảo cấu trúc chuẩn SEO.
2. **Tailwind CSS (CDN v3)** - Sử dụng tiện ích CSS hiện đại, màu sắc chủ đạo Indigo sang trọng, hỗ trợ Responsive hoàn chỉnh cho Mobile & Desktop.
3. **Vanilla JavaScript** - Xử lý logic nghiệp vụ và đồng bộ cơ sở dữ liệu giả lập.
4. **HTML5 Local Storage** - Đồng bộ hóa trạng thái ứng dụng (Giỏ hàng, Sách, Danh mục, Đơn hàng, Đánh giá) giữa các trang độc lập mà không cần backend.

---

## 📂 Cấu trúc thư mục dự án
Dự án được phân chia rõ ràng để dễ dàng quản lý và nâng cấp:

```text
Project/
├── assets/                         # Thư mục chứa tài nguyên ảnh thiết kế
│   └── images/
│       ├── activity diagrams/      # 14 Sơ đồ luồng hoạt động (transparent)
│       └── paper prototype/        # 5 Ảnh phác thảo giao diện giấy mẫu
├── js/                             # Các file điều khiển Javascript
│   ├── db.js                       # Mô phỏng database, khởi tạo & API CRUD LocalStorage
│   ├── main.js                     # Xử lý dùng chung (Header, Footer, Vai trò, Định dạng tiền)
│   ├── home.js                     # Xử lý Trang chủ (Tìm kiếm, Lọc thể loại/giá, Sắp xếp)
│   ├── book_detail.js              # Xử lý Chi tiết sách (Tăng giảm số lượng, Đánh giá 5 sao)
│   ├── cart.js                     # Xử lý Giỏ hàng (Thay đổi số lượng trực tiếp, Xóa mặt hàng)
│   ├── checkout.js                 # Xử lý Thanh toán (Điền thông tin, Áp mã giảm giá, Check kho)
│   ├── profile.js                  # Xử lý Hồ sơ cá nhân & Lịch sử mua hàng (Hủy đơn chờ duyệt)
│   └── admin.js                    # Xử lý Bảng quản trị Admin (CRUD sách, Thêm danh mục, Cập nhật trạng thái đơn, Thống kê)
├── pages/                          # Các trang giao diện phụ
│   ├── book_detail.html            # Trang chi tiết sản phẩm sách & nhận xét
│   ├── cart.html                   # Trang giỏ hàng người dùng
│   ├── checkout.html               # Trang điền địa chỉ giao nhận & thanh toán
│   ├── profile.html                # Trang quản lý cá nhân, tích lũy điểm & lịch sử đơn hàng
│   └── admin.html                  # Bảng quản trị Admin tích hợp (4 Tab chính)
├── index.html                      # Trang chủ cửa hàng (Danh sách sách bán chạy & Bộ lọc)
└── db.sql                          # File SQL tạo bảng & chèn dữ liệu thực tế (PostgreSQL)
```

---

## 💡 Hướng dẫn kiểm tra và chạy thử nghiệm

### 1. Cách chạy thử giao diện Web (Frontend)
1. Hãy mở file [index.html](file:///home/maivankhanh/Documents/E-commerce/practice/Project/index.html) bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Safari).
2. Trải nghiệm luồng mua sắm của **Khách hàng** (Mai Văn Khánh):
   - Duyệt danh sách sách, lọc theo danh mục hoặc lọc giá (Dưới 100k, 100k-300k) ở thanh bên trái.
   - Tìm kiếm sách ở ô tìm kiếm góc phải trên cùng.
   - Click xem chi tiết sách, đổi số lượng, viết nhận xét đánh giá số sao.
   - Thêm vào giỏ, vào giỏ hàng điều chỉnh số lượng.
   - Tiến hành thanh toán, nhập mã giảm giá `KM10` (giảm 10% đơn hàng) và chọn phương thức thanh toán.
   - Xác nhận đặt hàng. Đơn hàng sẽ được chuyển vào mục **Lịch sử đơn hàng** trong **Thông tin cá nhân**.
   - Tại trang lịch sử đơn hàng, bạn có thể thực hiện **Hủy đơn hàng** đối với các đơn hàng có trạng thái *Chờ xác nhận* (yêu cầu nhập lý do hủy, sách sẽ được tự động hoàn trả lại kho tồn kho của hệ thống).
3. Trải nghiệm tính năng **Quản trị viên (Admin)**:
   - Click vào menu **Tài khoản** ở góc trên cùng bên phải màn hình.
   - Tại mục **Giả lập đổi vai trò**, chọn **Quản trị viên**. Giao diện sẽ tự động chuyển đổi sang vai trò Admin và hiển thị thêm nút **Quản trị** trên thanh điều hướng.
   - Truy cập vào trang Quản trị để trải nghiệm:
     - **Quản lý Sách:** Thêm sách mới (Popup form), sửa thông tin sách có sẵn hoặc xóa sách.
     - **Quản lý Danh mục:** Thêm danh mục mới (Kiểm tra trùng lặp tự động).
     - **Quản lý Đơn hàng:** Xem toàn bộ đơn hàng của tất cả khách hàng trên hệ thống, thay đổi trạng thái đơn (Chờ xác nhận -> Đang vận chuyển -> Đã hoàn thành -> Đã hủy). Việc thay đổi này sẽ ảnh hưởng trực tiếp đến trạng thái thanh toán và lượng tồn kho sách tương ứng.
     - **Thống kê Doanh thu:** Xem tổng tiền thu được từ các đơn hàng thành công, tỉ lệ phần trăm hủy đơn, tỉ lệ giao đơn thành công dưới dạng biểu đồ và top 5 sách bán chạy nhất kèm chi tiết giá vốn/lợi nhuận thực tế.

### 2. Cách Import CSDL vào pgAdmin4 (PostgreSQL)
1. Mở **pgAdmin4** và kết nối đến máy chủ PostgreSQL của bạn.
2. Tạo mới một cơ sở dữ liệu tên là `lsbookstore` (hoặc tên tùy chọn).
3. Mở công cụ **Query Tool** trên cơ sở dữ liệu vừa tạo.
4. Mở file [db.sql](file:///home/maivankhanh/Documents/E-commerce/practice/Project/db.sql), sao chép toàn bộ nội dung dán vào Query Tool hoặc chọn nút mở file trực tiếp trong pgAdmin4.
5. Nhấn **Execute (F5)** để chạy.
   - Hệ thống sẽ tạo lần lượt 11 bảng cơ sở dữ liệu quan hệ có ràng buộc khóa ngoại chặt chẽ.
   - Sau đó chèn dữ liệu thực tế (bao gồm 5 danh mục thật, 6 tác giả thật, 5 nhà xuất bản thật, 10 đầu sách thực tế, mã giảm giá, tài khoản giả lập, đơn hàng và các đánh giá mẫu).
