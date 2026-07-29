CREATE TABLE DanhMuc (                                                                                                                                                                                        
        danhmucID SERIAL PRIMARY KEY,                                                                                                                                                                             
        tenDanhMuc VARCHAR(100) NOT NULL UNIQUE,                                                                                                                                                                  
        moTa VARCHAR(255),                                                                                                                                                                                        
        trangThai VARCHAR(50) NOT NULL DEFAULT 'Hoạt động'                                                                                                                                                        
    );                                                                                                                                                                                                            
                                                                                                                                                                                                                  
    -- 2. Bảng TacGia                                                                                                                       
    CREATE TABLE TacGia (                                                                                                                                                                                         
        tacgiaID SERIAL PRIMARY KEY,                                                                                                                                                                              
        tenTacGia VARCHAR(100) NOT NULL,
        ngaySinh DATE,
        quocGia VARCHAR(100)                                                                                                                                                                       
    );                                                                                                                                                                                                            
                                                                                                                                                                                                                  
    -- 3. Bảng NhaXuatBan                                                                                                                        
    CREATE TABLE NhaXuatBan (                                                                                                                                                                                     
        nxbID SERIAL PRIMARY KEY,                                                                                                                                                                                 
        tenNXB VARCHAR(100) NOT NULL,      
        diaChi VARCHAR(255),
        soDienThoai VARCHAR(15),
        email VARCHAR(150) UNIQUE                                                                                                                                                                        
    );                                                                                                                                                                                                            
                                                                                                                                                                                                                  
    -- 4. Bảng Sach                                                                                                                                                            
    CREATE TABLE Sach (                                                                                                                                                                                           
        sachID SERIAL PRIMARY KEY,                                                                                                                                                                                
        danhmucID INT NOT NULL,                                                                                                                                                                                   
        tacgiaID INT NOT NULL,                                                                                                                                                                                    
        nxbID INT NOT NULL,                                                                                                                                                                                       
        tenSach VARCHAR(255) NOT NULL,                                                                                                                                                                            
        giaBan DECIMAL(18,2) NOT NULL CHECK (giaBan >= 0),                                                                                                                                                        
        giaNhap DECIMAL(18,2) NOT NULL CHECK (giaNhap >= 0),                                                                                                                                                      
        soLuongTon INT NOT NULL DEFAULT 0 CHECK (soLuongTon >= 0),                                                                                                                                                
        moTa TEXT,                                                                                                                                                                                                
        hinhAnh VARCHAR(500),                                                                                                                                                                                     
        namXuatBan INT,                                                                                                                                                                                           
        trangThai VARCHAR(50) NOT NULL DEFAULT 'Bán',                                                                                                                                                             
        CONSTRAINT fk_sach_danhmuc FOREIGN KEY (danhmucID) REFERENCES DanhMuc(danhmucID) ON DELETE CASCADE,                                                                                                       
        CONSTRAINT fk_sach_tacgia FOREIGN KEY (tacgiaID) REFERENCES TacGia(tacgiaID) ON DELETE CASCADE,                                                                                                           
        CONSTRAINT fk_sach_nxb FOREIGN KEY (nxbID) REFERENCES NhaXuatBan(nxbID) ON DELETE CASCADE                                                                                                                 
    );                                                                                                                                                                                                            
  
    -- 5. Bảng NguoiDung
    CREATE TABLE NguoiDung (
        nguoiDungID SERIAL PRIMARY KEY,
        hoTen VARCHAR(100) NOT NULL,
        diaChi VARCHAR(255) NOT NULL,
        gioiTinh VARCHAR(10) CHECK (gioiTinh IN ('Nam', 'Nữ', 'Khác')),
        ngaySinh DATE,
        diemTichLuy INT NOT NULL DEFAULT 0 CHECK (diemTichLuy >= 0),
        email VARCHAR(150) NOT NULL UNIQUE,
        matKhauHash VARCHAR(255) NOT NULL,
        soDienThoai VARCHAR(15),
        vaiTro VARCHAR(50) NOT NULL DEFAULT 'Khách hàng',
        -- Vai trò là nhân viên
        luong DECIMAL(18,2) CHECK (luong >= 0),
        ngayVaoLam DATE,
        -- Khác
        trangThai VARCHAR(50) NOT NULL DEFAULT 'Hoạt động',
        ngayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  
    -- 6. Bảng DonHang - Thanh toán - Quản lý đơn hàng
    CREATE TABLE DonHang (
        donhangID SERIAL PRIMARY KEY,
        nguoiDungID INT NOT NULL,
        maGiamID INT,
        ngayDat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        diaChiGiao VARCHAR(255) NOT NULL,
        sdtNguoiNhan VARCHAR(15) NOT NULL,
        tenNguoiNhan VARCHAR(100) NOT NULL,
        tongTien DECIMAL(18,2) NOT NULL CHECK (tongTien >= 0),
        phuongThucThanhToan VARCHAR(50) NOT NULL DEFAULT 'COD',
        ghiChu TEXT,
        lyDoHuy TEXT,
        trangThaiDonHang VARCHAR(50) NOT NULL DEFAULT 'Chờ xác nhận',
       
        CONSTRAINT fk_donhang_nguoidung FOREIGN KEY (nguoidungID) REFERENCES NguoiDung(nguoidungID) ON DELETE CASCADE
    );

    CREATE TABLE MaGiamGia (
        maGiamID SERIAL PRIMARY KEY,
        maGiam VARCHAR(50) NOT NULL UNIQUE,
        ten VARCHAR(100) NOT NULL,
        tiLe DECIMAL(18,2) NOT NULL CHECK (tiLe >= 0),
        soLuong INT NOT NULL CHECK (soLuong >= 0),
        ngayBatDau TIMESTAMP NOT NULL,
        ngayKetThuc TIMESTAMP NOT NULL,
        trangThai VARCHAR(50) NOT NULL DEFAULT 'Hoạt động'
    );

    CREATE TABLE ThanhToan (
        thanhtoanID SERIAL PRIMARY KEY,
        donhangID INT NOT NULL,
        ngayThanhToan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tienThanhToan DECIMAL(18,2) NOT NULL CHECK (tienThanhToan >= 0),
        noiDungThanhToan TEXT,
        maThanhToan VARCHAR(255) NOT NULL,
        trangThaiThanhToan VARCHAR(50) NOT NULL DEFAULT 'Chưa thanh toán',
        CONSTRAINT fk_thanhtoan_donhang FOREIGN KEY (donhangID) REFERENCES DonHang(donhangID) ON DELETE CASCADE
    );
  
    -- 7. Bảng ChiTietDonHang
    CREATE TABLE ChiTietDonHang (
        idChiTietDonHang SERIAL PRIMARY KEY,
        donhangID INT NOT NULL,
        sachID INT NOT NULL,
        soLuong INT NOT NULL CHECK (soLuong > 0),
        donGia DECIMAL(18,2) NOT NULL CHECK (donGia >= 0),
        CONSTRAINT fk_ctdh_donhang FOREIGN KEY (donhangID) REFERENCES DonHang(donhangID) ON DELETE CASCADE,
        CONSTRAINT fk_ctdh_sach FOREIGN KEY (sachID) REFERENCES Sach(sachID) ON DELETE CASCADE
    );

    CREATE TABLE GioHang (
        giohangID SERIAL PRIMARY KEY,
        nguoiDungID INT NOT NULL,
        ngayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_giohang_nguoidung FOREIGN KEY (nguoiDungID) REFERENCES NguoiDung(nguoiDungID) ON DELETE CASCADE
    );

    CREATE TABLE DanhGia (
        danhgiaID SERIAL PRIMARY KEY,
        nguoiDungID INT NOT NULL,
        sachID INT,
        soSao INT NOT NULL CHECK (soSao >= 1 AND soSao <= 5),
        noiDung TEXT,
        ngayDanhGia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_danhgia_nguoidung FOREIGN KEY (nguoiDungID) REFERENCES NguoiDung(nguoiDungID) ON DELETE CASCADE,
        CONSTRAINT fk_danhgia_sach FOREIGN KEY (sachID) REFERENCES Sach(sachID) ON DELETE CASCADE
    );

    CREATE TABLE PhanHoi (
        phanhoiID SERIAL PRIMARY KEY,
        danhgiaID INT NOT NULL,
        nguoiDungID INT NOT NULL,
        noiDung TEXT NOT NULL,
        ngayPhanHoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_phanhoi_danhgia FOREIGN KEY (danhgiaID) REFERENCES DanhGia(danhgiaID) ON DELETE CASCADE,
        CONSTRAINT fk_phanhoi_nguoidung FOREIGN KEY (nguoiDungID) REFERENCES NguoiDung(nguoiDungID) ON DELETE CASCADE
    );

    -- 8. Bảng BangTamOTP
    CREATE TABLE BangTamOTP (
        id SERIAL PRIMARY KEY,
        nguoiDungID INT NOT NULL,
        email VARCHAR(150) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes'),
        CONSTRAINT fk_otp_nguoidung FOREIGN KEY (nguoiDungID) REFERENCES NguoiDung(nguoiDungID) ON DELETE CASCADE
    );

-- =========================================================================
-- DỮ LIỆU MẪU CHI TIẾT (THỰC TẾ) CHO CÁC BẢNG DỰA TRÊN PRODUCTS.SQL
-- =========================================================================

-- 1. Chèn dữ liệu Danh mục (DanhMuc)
INSERT INTO DanhMuc (danhmucID, tenDanhMuc, moTa, trangThai) VALUES
(1, 'Lịch sử - Văn hóa', 'Sách lịch sử nhân loại, thế giới và Việt Nam', 'Hoạt động'),
(2, 'Tâm lý học - Xã hội', 'Sách khoa học, phân tích tâm lý con người và xã hội', 'Hoạt động'),
(3, 'Phát triển bản thân - Kỹ năng', 'Sách kỹ năng sống, rèn luyện tư duy và thói quen', 'Hoạt động'),
(4, 'Sách Thiếu nhi', 'Truyện tranh, truyện kể và sách giáo dục dành cho trẻ em', 'Hoạt động'),
(5, 'Kinh tế - Đầu tư', 'Sách về đầu tư tài chính, bất động sản, chứng khoán và khởi nghiệp', 'Hoạt động'),
(6, 'Kỹ năng quản trị & Triết lý', 'Sách đúc kết kinh nghiệm quản trị doanh nghiệp và triết lý sống', 'Hoạt động'),
(7, 'Chính trị - Pháp luật', 'Sách chính trị, pháp luật Việt Nam qua các thời kỳ', 'Hoạt động');

-- 2. Chèn dữ liệu Tác giả (TacGia)
INSERT INTO TacGia (tacgiaID, tenTacGia, ngaySinh, quocGia) VALUES
(1, 'Sơn Tùng', '1928-01-01', 'Nghệ An, Việt Nam'),
(2, 'Diệp Hồng Vũ', '1980-01-01', 'Trung Quốc'),
(3, 'Brian Tracy', '1944-01-01', 'Canada'),
(4, 'Yuval Noah Harari', '1976-01-01', 'Israel'),
(5, 'Napoleon Hill', '1883-01-01', 'Mỹ'),
(6, 'Phan Văn Trường', '1946-01-01', 'Việt Nam'),
(7, 'Gia Cát Vàng (Nhóm tác giả)', NULL, 'Việt Nam'),
(8, 'Giản Tư Trung', '1974-01-01', 'Việt Nam'),
(9, 'Rosie Nguyễn', '1987-01-01', 'Việt Nam'),
(10, 'Hạo Dương', NULL, 'Trung Quốc'),
(11, 'Đặng Hoàng Giang', '1965-01-01', 'Việt Nam'),
(12, 'Alan Phan', '1945-01-01', 'Việt Nam'),
(13, 'Eric Ries', '1978-09-22', 'Mỹ'),
(14, 'Nguyễn Xuân Thành', NULL, 'Việt Nam'),
(15, 'Trần Văn Thọ', '1949-01-01', 'Việt Nam'),
(16, 'Trần Trọng Kim', '1883-01-01', 'Việt Nam'),
(17, 'Nguyễn Văn Huyên', '1908-01-01', 'Việt Nam'),
(18, 'Đào Duy Anh', '1904-01-01', 'Việt Nam'),
(19, 'Hồ Chí Minh', '1890-05-19', 'Việt Nam'),
(20, 'Nguyễn Sĩ Dũng', '1955-01-01', 'Việt Nam'),
(21, 'Nguyễn Đình Lộc', '1935-01-01', 'Việt Nam'),
(22, 'Trần Thắng', NULL, 'Việt Nam'),
(23, 'Nguyễn Duy Cần', '1907-01-01', 'Việt Nam');

-- 3. Chèn dữ liệu Nhà xuất bản (NhaXuatBan)
INSERT INTO NhaXuatBan (nxbID, tenNXB, diaChi, soDienThoai, email) VALUES
(1, 'NXB Trẻ', '161B Lý Chính Thắng, Quận 3, TP. Hồ Chí Minh', '02839316653', 'hopthu@nxbtre.com.vn'),
(8, 'NXB Chính trị quốc gia Sự thật', '24 Quang Trung, Hoàn Kiếm, Hà Nội', '02438221581', 'suthatorg@nxbctqg.org.vn');

-- 4. Chèn dữ liệu Sách (Sach)
INSERT INTO Sach (sachID, danhmucID, tacgiaID, nxbID, tenSach, giaBan, giaNhap, soLuongTon, moTa, hinhAnh, namXuatBan, trangThai) VALUES
(2, 5, 7, 1, 'Đầu tư vàng thực chiến', 185000.00, 130000.00, 100, 'Cẩm nang toàn diện về thị trường vàng Việt Nam, hướng dẫn cách phân bổ vốn, nhận diện chu kỳ và quản trị rủi ro khi đầu tư kim loại quý.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459591/Picture1_jbydvh.png', 2024, 'Bán'),
(3, 3, 8, 1, 'Đúng việc', 160000.00, 110000.00, 100, 'Một cuốn sách về ''khai minh'' giúp mỗi người tự định nghĩa lại các khái niệm công việc, làm người, làm dân và làm nghề trong bối cảnh hiện đại.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459591/Picture3_mumdca.png', 2015, 'Bán'),
(4, 3, 9, 1, 'Tuổi trẻ đáng giá bao nhiêu?', 90000.00, 60000.00, 100, 'Kim chỉ nam giúp các bạn trẻ giải quyết ba vấn đề lớn: Học gì, Làm gì và Đi đâu, cổ vũ tinh thần tự học, dấn thân trải nghiệm.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459592/Picture4_lgy4j2.png', 2016, 'Bán'),
(5, 3, 10, 1, 'Khéo ăn khéo nói sẽ có được thiên hạ', 120000.00, 80000.00, 100, 'Bộ cẩm nang toàn diện về kỹ năng giao tiếp ứng dụng, đưa ra những tình huống thực tế và các quy tắc để làm chủ mọi cuộc đối thoại.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459592/Picture5_f4vphm.png', 2014, 'Bán'),
(6, 2, 11, 1, 'Tìm mình trong thế giới hậu tuổi thơ', 140000.00, 95000.00, 100, 'Hành trình đi sâu vào thế giới nội tâm, phơi bày những đứt gãy gia đình và tổn thương tâm lý của người trẻ Việt Nam để tìm con đường chữa lành.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459592/Picture6_tb25er.png', 2020, 'Bán'),
(7, 6, 6, 1, 'Một Đời Như Kẻ Tìm Đường', 170000.00, 120000.00, 100, 'Sách nghiêng hẳn về triết lý sống và định vị giá trị cá nhân, giúp người đọc thấu hiểu cách lựa chọn lối đi và nghề nghiệp dựa trên sự tử tế.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459592/Picture7_jwcc6g.png', 2020, 'Bán'),
(8, 6, 6, 1, 'Một Đời Thương Thuyết', 165000.00, 115000.00, 100, 'Tác phẩm đúc kết kinh nghiệm từ hàng trăm cuộc đàm phán quốc tế lớn, khẳng định cốt lõi của thương thuyết là tạo lập niềm tin và sự chân thành.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459593/Picture8_b86rqy.png', 2016, 'Bán'),
(9, 6, 6, 1, 'Một Đời Quản Trị', 175000.00, 125000.00, 100, 'Cuốn sách làm rõ ranh giới giữa quản lý công việc và quản trị con người, đưa tư duy phương Đông vào xây dựng văn hóa doanh nghiệp.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459593/Picture9_jkuyr5.png', 2017, 'Bán'),
(10, 5, 12, 1, 'Góc Nhìn Alan: Dành Cho Doanh Nhân Việt Trong Thế Cuộc Mới', 150000.00, 100000.00, 100, 'Tập hợp các bài viết phân tích kinh tế sắc sảo, đưa ra cảnh báo và bài học thực tế về quản trị dòng tiền, tư duy khởi nghiệp cho doanh nghiệp.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459593/Picture10_gqdseb.png', 2015, 'Bán'),
(11, 5, 12, 1, 'Đừng Hoang Tưởng Về Kinh Tế Việt Nam', 135000.00, 95000.00, 100, 'Cuốn sách phản biện thẳng thắn về các bong bóng tài chính, thực trạng bất động sản và các thói quen kinh doanh ngắn hạn tại thị trường nội địa.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459594/Picture11_yqstzg.png', 2014, 'Bán'),
(12, 5, 13, 1, 'Khởi Nghiệp Tinh Gọn Tại Việt Nam', 145000.00, 100000.00, 100, 'Áp dụng phương pháp khởi nghiệp tinh gọn toàn cầu vào bối cảnh văn hóa, thói quen tiêu dùng và rào cản pháp lý của môi trường Việt Nam.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459594/Picture12_cqohnh.png', 2022, 'Bán'),
(13, 5, 14, 1, 'Kinh Tế Vĩ Mô Ứng Dụng', 190000.00, 130000.00, 100, 'Giải thích các chỉ số kinh tế vĩ mô ảnh hưởng trực tiếp đến túi tiền của doanh nghiệp và cá nhân: Lạm phát, tỷ giá, lãi suất...', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459594/Picture13_om40bn.png', 2023, 'Bán'),
(14, 5, 15, 1, 'Bẫy Thu Nhập Trung Bình Và Lối Thoát Cho Việt Nam', 210000.00, 145000.00, 100, 'Phân tích sâu sắc về những thách thức nội tại của nền kinh tế Việt Nam và đưa ra giải pháp phát triển công nghiệp phụ trợ, nguồn nhân lực.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459595/Picture14_kggo3e.png', 2018, 'Bán'),
(15, 1, 16, 1, 'Việt Nam Sử Lược', 180000.00, 125000.00, 100, 'Cuốn sách lịch sử viết bằng chữ Quốc ngữ đầu tiên hệ thống lại toàn bộ tiến trình lịch sử, chính trị, bộ máy cai trị của các triều đại một cách khách quan.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459595/Picture15_eorr0v.png', 1920, 'Bán'),
(16, 1, 17, 1, 'Văn Minh Việt Nam', 165000.00, 115000.00, 100, 'Công trình khảo cứu toàn diện về cấu trúc chính trị nông thôn, luật tục và mô hình tổ chức xã hội của người Việt xưa dưới góc nhìn khoa học phương Tây.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459595/Picture16_mgv3nf.png', 1944, 'Bán'),
(17, 1, 18, 1, 'Xã Hội Việt Nam Từ Thế Kỷ XVII Đến Thế Kỷ XIX', 155000.00, 110000.00, 100, 'Phân tích sự biến đổi của hệ thống kinh tế, các xung đột chính trị và kết cấu giai tầng xã hội Việt Nam trong các giai đoạn lịch sử phong kiến quan trọng.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459595/Picture17_kl7nrf.png', 1938, 'Bán'),
(18, 1, 18, 1, 'Việt Nam Văn Hóa Sử Cương', 140000.00, 95000.00, 100, 'Công trình nền tảng phân tích cấu trúc chính trị, pháp luật, giáo dục và kinh tế truyền thống của Việt Nam trước làn sóng văn hóa phương Tây.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459595/Picture18_fhqfs4.png', 1938, 'Bán'),
(19, 7, 19, 8, 'Tư Tưởng Hồ Chí Minh Về Đại Đoàn Kết Toàn Dân Tộc', 95000.00, 65000.00, 100, 'Hệ thống hóa các quan điểm, bài viết chính trị cốt lõi của Chủ tịch Hồ Chí Minh về chiến lược tập hợp lực lượng, xây dựng khối đại đoàn kết toàn dân.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459591/Picture19_qlb9fw.png', 2024, 'Bán'),
(21, 7, 21, 1, 'Nhà Nước Và Pháp Luật Việt Nam Qua Các Thời Kỳ Lịch Sử', 250000.00, 180000.00, 100, 'Tài liệu tra cứu hệ thống về sự hình thành bộ máy nhà nước, luật pháp từ triều Lê (Luật Hồng Đức), triều Nguyễn (Luật Gia Long) đến Hiến pháp hiện đại.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459591/Picture20_bshl5t.png', 2019, 'Bán'),
(22, 7, 22, 8, 'Chủ Quyền Biển Đảo Việt Nam: Minh Chứng Lịch Sử Và Cơ Sở Pháp Lý', 195000.00, 140000.00, 100, 'Lưu trữ tư liệu chính trị quan trọng, tập hợp các bản đồ, tờ chiếu phong kiến và văn bản quốc tế chứng minh chủ quyền đối với Hoàng Sa và Trường Sa.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459592/Picture21_cckoab.png', 2020, 'Bán'),
(23, 2, 11, 1, 'Bức Xúc Không Làm Ta Vô Can', 115000.00, 80000.00, 100, 'Cuốn sách mổ xẻ những vấn đề thời sự, tâm lý đám đông tại Việt Nam, khuyến khích người đọc rèn luyện tư duy phản biện và chịu trách nhiệm cá nhân.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459592/Picture22_js0axb.png', 2015, 'Bán'),
(24, 2, 11, 1, 'Thiện, Ác Và Smartphone', 125000.00, 85000.00, 100, 'Đi sâu vào tâm lý con người trong thời đại số, phân tích cơ chế của các cuộc "ném đá" trên mạng và kêu gọi xây dựng không gian mạng văn minh.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459593/Picture23_vu2nnw.png', 2017, 'Bán'),
(25, 2, 11, 1, 'Đại Dương Đen', 160000.00, 110000.00, 100, 'Một cuốn sách can đảm nói về thế giới của những người trầm cảm tại Việt Nam, giúp xã hội xóa bỏ định kiến về sức khỏe tâm thần.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459593/Picture24_cvppfj.png', 2021, 'Bán'),
(26, 2, 11, 1, 'Điểm Đến Của Cuộc Đời', 110000.00, 75000.00, 100, 'Đối diện với chủ đề cận tử, hành trình đồng hành cùng các bệnh nhân giai đoạn cuối giúp người đọc nhận ra giá trị đích thực của sự sống.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459593/Picture25_ilndzl.png', 2019, 'Bán'),
(27, 3, 9, 1, 'Mình Nói Gì Khi Nói Về Hạnh Phúc?', 85000.00, 60000.00, 100, 'Tập hợp những bài tùy bút nhẹ nhàng nhưng sâu sắc về hành trình nội tâm, học cách chấp nhận những điều không hoàn hảo và tự định nghĩa hạnh phúc.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459594/Picture26_oeawbk.png', 2018, 'Bán'),
(28, 3, 23, 1, 'Tôi Tự Học', 75000.00, 50000.00, 100, 'Tác phẩm kinh điển nhấn mạnh học không phải để lấy bằng cấp mà để mở mang trí tuệ, rèn luyện nhân cách và làm chủ tri thức suốt đời.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459594/Picture27_wcd2uf.png', 1959, 'Bán'),
(29, 3, 23, 1, 'Óc Sáng Suốt', 70000.00, 45000.00, 100, 'Cung cấp phương pháp khoa học để rèn luyện trí não, trí nhớ, khả năng quan sát và tư duy logic khách quan.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459594/Picture28_r4xbmx.png', 1952, 'Bán'),
(30, 3, 23, 1, 'Thuật Xử Thế Của Người Xưa', 80000.00, 55000.00, 100, 'Trích lọc những câu chuyện lịch sử kinh điển để rút ra bài học về sự nhẫn nại, khiêm nhường và nghệ thuật đắc nhân tâm Á Đông.', 'https://res.cloudinary.com/dj4ktkr2t/image/upload/q_auto/f_auto/v1780459595/Picture29_bk5if5.png', 1954, 'Bán');

-- 5. Chèn dữ liệu Người dùng (NguoiDung)
INSERT INTO NguoiDung (hoTen, diaChi, gioiTinh, ngaySinh, diemTichLuy, email, matKhauHash, soDienThoai, vaiTro, luong, ngayVaoLam, trangThai) VALUES
('Quản trị viên', 'Hệ thống IsBook', 'Khác', '1990-01-01', 0, 'admin@lsbookstore.com', 'admin123', '0123456789', 'Quản trị viên', 15000000.00, '2025-01-01', 'Hoạt động');

-- 6. Chèn dữ liệu Mã giảm giá (MaGiamGia)
INSERT INTO MaGiamGia (maGiam, ten, tiLe, soLuong, ngayBatDau, ngayKetThuc, trangThai) VALUES
('KM10', 'Giảm giá 10% tổng đơn hàng', 10.00, 50, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 'Hoạt động'),
('FREESHIP', 'Miễn phí vận chuyển', 5.00, 100, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 'Hoạt động');

-- 12. Cập nhật các Serial Sequence Values của PostgreSQL
SELECT setval('danhmuc_danhmucid_seq', COALESCE(max(danhmucID), 1)) FROM DanhMuc;
SELECT setval('tacgia_tacgiaid_seq', COALESCE(max(tacgiaID), 1)) FROM TacGia;
SELECT setval('nhaxuatban_nxbid_seq', COALESCE(max(nxbID), 1)) FROM NhaXuatBan;
SELECT setval('sach_sachid_seq', COALESCE(max(sachID), 1)) FROM Sach;
SELECT setval('nguoidung_nguoidungid_seq', COALESCE(max(nguoiDungID), 1)) FROM NguoiDung;
SELECT setval('magiamgia_magiamid_seq', COALESCE(max(maGiamID), 1)) FROM MaGiamGia;
SELECT setval('donhang_donhangid_seq', COALESCE(max(donhangID), 1)) FROM DonHang;
SELECT setval('thanhtoan_thanhtoanid_seq', COALESCE(max(thanhtoanID), 1)) FROM ThanhToan;
SELECT setval('chitietdonhang_idchitietdonhang_seq', COALESCE(max(idChiTietDonHang), 1)) FROM ChiTietDonHang;
SELECT setval('giohang_giohangid_seq', COALESCE(max(giohangID), 1)) FROM GioHang;
SELECT setval('danhgia_danhgiaid_seq', COALESCE(max(danhgiaID), 1)) FROM DanhGia;