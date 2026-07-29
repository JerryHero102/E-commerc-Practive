"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("./database.service");
const crypto_1 = require("crypto");
const nodemailer = require("nodemailer");
let AppController = class AppController {
    constructor(db) {
        this.db = db;
    }
    async sendEmail(to, subject, textContent, htmlContent) {
        console.log(`\n================== [SENDING EMAIL] ==================`);
        console.log(`TO: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`TEXT CONTENT:\n${textContent}`);
        console.log(`=====================================================\n`);
        try {
            const smtpUser = process.env.SMTP_USER || 'knahhpc@gmail.com';
            const smtpPass = process.env.SMTP_PASS || 'jmtxhhcohlhqqztx';
            const host = process.env.SMTP_HOST || 'smtp.gmail.com';
            const port = parseInt(process.env.SMTP_PORT || '587');
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: false,
                requireTLS: true,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
                family: 4,
                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 20000,
                tls: {
                    rejectUnauthorized: false
                }
            });
            await transporter.sendMail({
                from: `"LSBook Store" <${smtpUser}>`,
                to,
                subject,
                text: textContent,
                html: htmlContent || textContent.replace(/\n/g, '<br>')
            });
            console.log(`[EMAIL DISPATCHED VIA SMTP TO ${to}]`);
        }
        catch (err) {
            console.error(`[EMAIL SEND NOTICE] Failed to send email to ${to}: ${err.message}`);
        }
    }
    async sendOrderNotificationEmail(orderId, type) {
        try {
            const orderRes = await this.db.query('SELECT * FROM DonHang WHERE donhangID = $1', [orderId]);
            if (orderRes.rows.length === 0)
                return;
            const order = orderRes.rows[0];
            let recipientEmail = order.email;
            if (!recipientEmail && order.nguoidungid) {
                const userRes = await this.db.query('SELECT email FROM NguoiDung WHERE nguoiDungID = $1', [order.nguoidungid]);
                if (userRes.rows.length > 0) {
                    recipientEmail = userRes.rows[0].email;
                }
            }
            if (!recipientEmail) {
                recipientEmail = 'khachhang@lsbookstore.com';
            }
            const itemsRes = await this.db.query('SELECT d.*, s.tenSach FROM ChiTietDonHang d JOIN Sach s ON d.sachID = s.sachID WHERE d.donhangID = $1', [orderId]);
            const items = itemsRes.rows;
            let discountAmount = 0;
            if (order.magiamid) {
                const voucherRes = await this.db.query('SELECT tile FROM MaGiamGia WHERE maGiamID = $1', [order.magiamid]);
                if (voucherRes.rows.length > 0) {
                    const rate = parseFloat(voucherRes.rows[0].tile || 0);
                    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.dongia) * parseInt(i.soluong)), 0);
                    discountAmount = (subtotal * rate) / 100;
                }
            }
            const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
            const bookLinesText = items.map(item => `Sách tên: ${item.tensach} + Số lượng: ${item.soluong} + Giá: ${formatPrice(parseFloat(item.dongia))}`).join('\n');
            const bookLinesHtml = items.map(item => `<li style="margin-bottom: 6px;"><b>Sách tên:</b> ${item.tensach} + <b>Số lượng:</b> ${item.soluong} + <b>Giá:</b> ${formatPrice(parseFloat(item.dongia))}</li>`).join('');
            let subject = '';
            let textContent = '';
            let htmlContent = '';
            if (type === 'CANCELLED' || order.trangthaidonhang === 'Đã hủy') {
                const reasonText = order.lydohuy ? `Lý do hủy: ${order.lydohuy}` : 'Lý do hủy: Người dùng hoặc Quản trị viên đã thực hiện hủy đơn hàng.';
                subject = `[LSBook Store] Thông báo đơn hàng #${order.donhangid} đã bị hủy`;
                textContent = `Kính chào quý khách, cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ tại website của chúng tôi. Thông báo đơn hàng #${order.donhangid} của quý khách đã bị hủy.
${reasonText}
Nguời nhận: ${order.tennguoinhan}
Số điện thoại người nhận: ${order.sdtnguoinhan}
Địa chỉ nhận: ${order.diachigiao}
${bookLinesText}
Phí ship: 0 đ
Giảm giá phí ship: 0 đ
Giảm giá đơn hàng: ${formatPrice(discountAmount)}
Tổng thanh toán: ${formatPrice(parseFloat(order.tongtien))}`;
                htmlContent = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
<h2 style="color: #dc2626; margin-top: 0;">LSBook Store - Thông Báo Hủy Đơn Hàng</h2>
<p>Kính chào quý khách, cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ tại website của chúng tôi. Thông báo đơn hàng <b>#${order.donhangid}</b> của quý khách đã bị hủy.</p>
<p style="background-color: #fef2f2; color: #991b1b; padding: 10px 14px; border-radius: 8px; font-size: 13px;"><b>${reasonText}</b></p>
<ul style="list-style: none; padding-left: 0; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
  <li><b>Nguời nhận:</b> ${order.tennguoinhan}</li>
  <li><b>Số điện thoại người nhận:</b> ${order.sdtnguoinhan}</li>
  <li><b>Địa chỉ nhận:</b> ${order.diachigiao}</li>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
  ${bookLinesHtml}
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
  <li><b>Phí ship:</b> 0 đ</li>
  <li><b>Giảm giá phí ship:</b> 0 đ</li>
  <li><b>Giảm giá đơn hàng:</b> ${formatPrice(discountAmount)}</li>
  <li><b>Tổng thanh toán:</b> <span style="color: #dc2626; font-size: 16px; font-weight: bold;">${formatPrice(parseFloat(order.tongtien))}</span></li>
</ul>
</div>`;
            }
            else if (type === 'UNSUCCESSFUL') {
                subject = `[LSBook Store] Thông báo đơn hàng #${order.donhangid} chưa thanh toán thành công`;
                textContent = `Kính chào quý khách, cảm ơn quý khách đã tin tưởng và đặt hàng tại website của chúng tôi. Hiện tại đơn hàng #${order.donhangid} chưa thanh toán thành công, vui lòng bấm vào "Link này" ( http://localhost:3000/order-lookup ) tìm kiếm đơn hàng bằng số điện thoại + ${order.sdtnguoinhan} này kiểm tra đơn hàng với thông tin chính xác như sau:
Nguời nhận: ${order.tennguoinhan}
Số điện thoại người nhận: ${order.sdtnguoinhan}
Địa chỉ nhận: ${order.diachigiao}
${bookLinesText}
Phí ship: 0 đ
Giảm giá phí ship: 0 đ
Giảm giá đơn hàng: ${formatPrice(discountAmount)}
Tổng thanh toán: ${formatPrice(parseFloat(order.tongtien))}`;
                htmlContent = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
<h2 style="color: #4f46e5; margin-top: 0;">LSBook Store - Thông Báo Đơn Hàng</h2>
<p>Kính chào quý khách, cảm ơn quý khách đã tin tưởng và đặt hàng tại website của chúng tôi. Hiện tại đơn hàng <b>#${order.donhangid}</b> chưa thanh toán thành công, vui lòng bấm vào <a href="http://localhost:3000/order-lookup" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Link này</a> tìm kiếm đơn hàng bằng số điện thoại + <b>${order.sdtnguoinhan}</b> này kiểm tra đơn hàng với thông tin chính xác như sau:</p>
<ul style="list-style: none; padding-left: 0; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
  <li><b>Nguời nhận:</b> ${order.tennguoinhan}</li>
  <li><b>Số điện thoại người nhận:</b> ${order.sdtnguoinhan}</li>
  <li><b>Địa chỉ nhận:</b> ${order.diachigiao}</li>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
  ${bookLinesHtml}
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
  <li><b>Phí ship:</b> 0 đ</li>
  <li><b>Giảm giá phí ship:</b> 0 đ</li>
  <li><b>Giảm giá đơn hàng:</b> ${formatPrice(discountAmount)}</li>
  <li><b>Tổng thanh toán:</b> <span style="color: #4f46e5; font-size: 16px; font-weight: bold;">${formatPrice(parseFloat(order.tongtien))}</span></li>
</ul>
</div>`;
            }
            else {
                subject = `[LSBook Store] Thông báo đơn hàng #${order.donhangid} đã thanh toán thành công`;
                textContent = `Kính chào quý khách, cảm ơn quý khách đã tin tưởng và đặt hàng tại website của chúng tôi. Hiện tại đơn hàng #${order.donhangid} đã thanh toán thành công với đơn hàng như sau:
Nguời nhận: ${order.tennguoinhan}
Số điện thoại người nhận: ${order.sdtnguoinhan}
Địa chỉ nhận: ${order.diachigiao}
${bookLinesText}
Phí ship: 0 đ
Giảm giá phí ship: 0 đ
Giảm giá đơn hàng: ${formatPrice(discountAmount)}
Tổng thanh toán: ${formatPrice(parseFloat(order.tongtien))}`;
                htmlContent = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
<h2 style="color: #16a34a; margin-top: 0;">LSBook Store - Xác Nhận Đơn Hàng Thành Công</h2>
<p>Kính chào quý khách, cảm ơn quý khách đã tin tưởng và đặt hàng tại website của chúng tôi. Hiện tại đơn hàng <b>#${order.donhangid}</b> đã thanh toán thành công với đơn hàng như sau:</p>
<ul style="list-style: none; padding-left: 0; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
  <li><b>Nguời nhận:</b> ${order.tennguoinhan}</li>
  <li><b>Số điện thoại người nhận:</b> ${order.sdtnguoinhan}</li>
  <li><b>Địa chỉ nhận:</b> ${order.diachigiao}</li>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
  ${bookLinesHtml}
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
  <li><b>Phí ship:</b> 0 đ</li>
  <li><b>Giảm giá phí ship:</b> 0 đ</li>
  <li><b>Giảm giá đơn hàng:</b> ${formatPrice(discountAmount)}</li>
  <li><b>Tổng thanh toán:</b> <span style="color: #16a34a; font-size: 16px; font-weight: bold;">${formatPrice(parseFloat(order.tongtien))}</span></li>
</ul>
</div>`;
            }
            await this.sendEmail(recipientEmail, subject, textContent, htmlContent);
        }
        catch (err) {
            console.error(`[ORDER EMAIL ERROR] Failed to send order email for #${orderId}:`, err);
        }
    }
    async getCategories() {
        try {
            const result = await this.db.query('SELECT * FROM DanhMuc ORDER BY danhmucID');
            return result.rows.map(c => ({
                danhmucID: c.danhmucid,
                tenDanhMuc: c.tendanhmuc,
                moTa: c.mota,
                trangThai: c.trangthai
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createCategory(body) {
        const { tenDanhMuc, moTa, trangThai } = body;
        try {
            const result = await this.db.query('INSERT INTO DanhMuc (tenDanhMuc, moTa, trangThai) VALUES ($1, $2, $3) RETURNING *', [tenDanhMuc, moTa || null, trangThai || 'Hoạt động']);
            const c = result.rows[0];
            return {
                danhmucID: c.danhmucid,
                tenDanhMuc: c.tendanhmuc,
                moTa: c.mota,
                trangThai: c.trangthai
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAuthors() {
        try {
            const result = await this.db.query('SELECT * FROM TacGia ORDER BY tacgiaID');
            return result.rows.map(a => ({
                tacgiaID: a.tacgiaid,
                tenTacGia: a.tentacgia,
                tieuSu: a.tieusu
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPublishers() {
        try {
            const result = await this.db.query('SELECT * FROM NhaXuatBan ORDER BY nxbID');
            return result.rows.map(p => ({
                nxbID: p.nxbid,
                tenNXB: p.tennxb,
                diaChi: p.diachi,
                soDienThoai: p.sodienthoai
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBooks() {
        try {
            const result = await this.db.query('SELECT * FROM Sach ORDER BY sachID');
            return result.rows.map(b => ({
                sachID: b.sachid,
                danhmucID: b.danhmucid,
                tacgiaID: b.tacgiaid,
                nxbID: b.nxbid,
                tenSach: b.tensach,
                giaBan: parseFloat(b.giaban),
                giaNhap: parseFloat(b.gianhap),
                soLuongTon: parseInt(b.soluongton),
                moTa: b.mota,
                hinhAnh: b.hinhanh,
                namXuatBan: b.namxuatban,
                trangThai: b.trangthai
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createBook(body) {
        const { danhmucID, tacgiaID, nxbID, tenSach, giaBan, giaNhap, soLuongTon, moTa, hinhAnh, namXuatBan, trangThai } = body;
        try {
            const result = await this.db.query(`INSERT INTO Sach (danhmucID, tacgiaID, nxbID, tenSach, giaBan, giaNhap, soLuongTon, moTa, hinhAnh, namXuatBan, trangThai) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`, [danhmucID, tacgiaID, nxbID, tenSach, giaBan, giaNhap, soLuongTon, moTa || null, hinhAnh || null, namXuatBan || null, trangThai || 'Bán']);
            const b = result.rows[0];
            return {
                sachID: b.sachid,
                danhmucID: b.danhmucid,
                tacgiaID: b.tacgiaid,
                nxbID: b.nxbid,
                tenSach: b.tensach,
                giaBan: parseFloat(b.giaban),
                giaNhap: parseFloat(b.gianhap),
                soLuongTon: parseInt(b.soluongton),
                moTa: b.mota,
                hinhAnh: b.hinhanh,
                namXuatBan: b.namxuatban,
                trangThai: b.trangthai
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateBook(id, body) {
        const { danhmucID, tacgiaID, nxbID, tenSach, giaBan, giaNhap, soLuongTon, moTa, hinhAnh, namXuatBan, trangThai } = body;
        try {
            const result = await this.db.query(`UPDATE Sach SET danhmucID=$1, tacgiaID=$2, nxbID=$3, tenSach=$4, giaBan=$5, giaNhap=$6, soLuongTon=$7, moTa=$8, hinhAnh=$9, namXuatBan=$10, trangThai=$11 
         WHERE sachID=$12 RETURNING *`, [danhmucID, tacgiaID, nxbID, tenSach, giaBan, giaNhap, soLuongTon, moTa, hinhAnh, namXuatBan, trangThai, parseInt(id)]);
            const b = result.rows[0];
            return {
                sachID: b.sachid,
                danhmucID: b.danhmucid,
                tacgiaID: b.tacgiaid,
                nxbID: b.nxbid,
                tenSach: b.tensach,
                giaBan: parseFloat(b.giaban),
                giaNhap: parseFloat(b.gianhap),
                soLuongTon: parseInt(b.soluongton),
                moTa: b.mota,
                hinhAnh: b.hinhanh,
                namXuatBan: b.namxuatban,
                trangThai: b.trangthai
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteBook(id) {
        try {
            await this.db.query('DELETE FROM Sach WHERE sachID = $1', [parseInt(id)]);
            return { success: true };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUsers() {
        try {
            const result = await this.db.query('SELECT * FROM NguoiDung ORDER BY nguoiDungID');
            return result.rows.map(u => ({
                nguoiDungID: u.nguoidungid,
                hoTen: u.hoten,
                email: u.email,
                matKhauHash: u.matkhauhash,
                soDienThoai: u.sodienthoai,
                vaiTro: u.vaitro,
                luong: u.luong ? parseFloat(u.luong) : null,
                ngayVaoLam: u.ngayvaolam,
                diaChi: u.diachi,
                trangThai: u.trangthai,
                ngaySinh: u.ngaysinh,
                gioiTinh: u.gioitinh,
                diemTichLuy: u.diemtichluy
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createUser(body) {
        const { hoTen, email, matKhauHash, soDienThoai, vaiTro, luong, ngayVaoLam, diaChi, trangThai, ngaySinh, gioiTinh, diemTichLuy } = body;
        try {
            const result = await this.db.query(`INSERT INTO NguoiDung (hoTen, email, matKhauHash, soDienThoai, vaiTro, luong, ngayVaoLam, diaChi, trangThai, ngaySinh, gioiTinh, diemTichLuy) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`, [hoTen, email, matKhauHash, soDienThoai, vaiTro || 'Khách hàng', luong || null, ngayVaoLam || null, diaChi || null, trangThai || 'Hoạt động', ngaySinh || null, gioiTinh || 'Khác', diemTichLuy || 0]);
            const u = result.rows[0];
            return {
                nguoiDungID: u.nguoidungid,
                hoTen: u.hoten,
                email: u.email,
                matKhauHash: u.matkhauhash,
                soDienThoai: u.sodienthoai,
                vaiTro: u.vaitro,
                luong: u.luong ? parseFloat(u.luong) : null,
                ngayVaoLam: u.ngayvaolam,
                diaChi: u.diachi,
                trangThai: u.trangthai,
                ngaySinh: u.ngaysinh,
                gioiTinh: u.gioitinh,
                diemTichLuy: u.diemtichluy
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateUser(id, body) {
        const { hoTen, email, soDienThoai, vaiTro, luong, ngayVaoLam, diaChi, trangThai, ngaySinh, gioiTinh, diemTichLuy } = body;
        try {
            const result = await this.db.query(`UPDATE NguoiDung SET hoTen=COALESCE($1, hoTen), email=COALESCE($2, email), soDienThoai=COALESCE($3, soDienThoai), 
         vaiTro=COALESCE($4, vaiTro), luong=COALESCE($5, luong), ngayVaoLam=COALESCE($6, ngayVaoLam), diaChi=COALESCE($7, diaChi), 
         trangThai=COALESCE($8, trangThai), ngaySinh=COALESCE($9, ngaySinh), gioiTinh=COALESCE($10, gioiTinh), diemTichLuy=COALESCE($11, diemTichLuy) 
         WHERE nguoiDungID=$12 RETURNING *`, [hoTen, email, soDienThoai, vaiTro, luong, ngayVaoLam, diaChi, trangThai, ngaySinh, gioiTinh, diemTichLuy, parseInt(id)]);
            const u = result.rows[0];
            return {
                nguoiDungID: u.nguoidungid,
                hoTen: u.hoten,
                email: u.email,
                matKhauHash: u.matkhauhash,
                soDienThoai: u.sodienthoai,
                vaiTro: u.vaitro,
                luong: u.luong ? parseFloat(u.luong) : null,
                ngayVaoLam: u.ngayvaolam,
                diaChi: u.diachi,
                trangThai: u.trangthai,
                ngaySinh: u.ngaysinh,
                gioiTinh: u.gioitinh,
                diemTichLuy: u.diemtichluy
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async changePassword(id, body) {
        const { oldPassword, newPassword } = body;
        if (!oldPassword || !newPassword) {
            throw new common_1.HttpException('Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới!', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const userRes = await this.db.query('SELECT matKhauHash FROM NguoiDung WHERE nguoiDungID = $1', [parseInt(id)]);
            if (userRes.rows.length === 0) {
                throw new common_1.HttpException('Tài khoản không tồn tại!', common_1.HttpStatus.NOT_FOUND);
            }
            const currentHash = userRes.rows[0].matkhauhash;
            if (currentHash !== oldPassword) {
                throw new common_1.HttpException('Mật khẩu hiện tại không chính xác!', common_1.HttpStatus.BAD_REQUEST);
            }
            await this.db.query('UPDATE NguoiDung SET matKhauHash = $1 WHERE nguoiDungID = $2', [newPassword, parseInt(id)]);
            return { success: true, message: 'Đổi mật khẩu thành công!' };
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Đổi mật khẩu thất bại!', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCoupons() {
        try {
            const result = await this.db.query('SELECT * FROM MaGiamGia ORDER BY maGiamID');
            return result.rows.map(c => ({
                magiamid: c.magiamid,
                magiam: c.magiam,
                ten: c.ten,
                tile: parseFloat(c.tile),
                soluong: parseInt(c.soluong),
                ngaybatdau: c.ngaybatdau,
                ngayketthuc: c.ngayketthuc,
                trangthai: c.trangthai
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getOrders() {
        try {
            const result = await this.db.query('SELECT * FROM DonHang ORDER BY donhangID');
            return result.rows.map(o => ({
                donhangid: o.donhangid,
                nguoidungid: o.nguoidungid,
                magiamid: o.magiamid,
                ngaydat: o.ngaydat,
                diachigiao: o.diachigiao,
                sdtnguoinhan: o.sdtnguoinhan,
                tennguoinhan: o.tennguoinhan,
                tongTien: parseFloat(o.tongtien),
                phuongthucthanhtoan: o.phuongthucthanhtoan,
                ghichu: o.ghichu,
                lydohuy: o.lydohuy,
                trangThaiDonHang: o.trangthaidonhang
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getOrderDetails() {
        try {
            const result = await this.db.query('SELECT * FROM ChiTietDonHang ORDER BY idChiTietDonHang');
            return result.rows.map(d => ({
                idchitietdonhang: d.idchitietdonhang,
                donhangid: d.donhangid,
                sachid: d.sachid,
                soluong: parseInt(d.soluong),
                donGia: parseFloat(d.dongia)
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPayments() {
        try {
            const result = await this.db.query('SELECT * FROM ThanhToan ORDER BY thanhtoanID');
            return result.rows.map(p => ({
                thanhtoanid: p.thanhtoanid,
                donhangid: p.donhangid,
                ngaythanhtoan: p.ngaythanhtoan,
                tienthanhtoan: parseFloat(p.tienthanhtoan),
                noidungthanhtoan: p.noidungthanhtoan,
                mathanhtoan: p.mathanhtoan,
                trangthaithanhtoan: p.trangthaithanhtoan
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createOrder(body) {
        const { nguoiDungID, email, maGiamID, diaChiGiao, sdtNguoiNhan, tenNguoiNhan, tongTien, phuongThucThanhToan, ghiChu, items } = body;
        const client = await this.db.getClient();
        try {
            await client.query('BEGIN');
            let actualUserID = nguoiDungID;
            let orderEmail = email ? email.trim() : null;
            if (!actualUserID) {
                const guestRes = await client.query("SELECT nguoiDungID FROM NguoiDung WHERE email = 'guest@lsbookstore.com'");
                if (guestRes.rows.length > 0) {
                    actualUserID = guestRes.rows[0].nguoidungid;
                }
                else {
                    const newGuestRes = await client.query(`INSERT INTO NguoiDung (hoTen, email, matKhauHash, soDienThoai, vaiTro, diaChi, trangThai, diemTichLuy) 
             VALUES ('Khách vãng lai', 'guest@lsbookstore.com', 'guest', '0000000000', 'Khách hàng', 'Chưa cập nhật', 'Hoạt động', 0) RETURNING nguoiDungID`);
                    actualUserID = newGuestRes.rows[0].nguoidungid;
                }
            }
            else if (!orderEmail) {
                const uRes = await client.query('SELECT email FROM NguoiDung WHERE nguoiDungID = $1', [actualUserID]);
                if (uRes.rows.length > 0) {
                    orderEmail = uRes.rows[0].email;
                }
            }
            if (maGiamID && actualUserID) {
                const usedRes = await client.query('SELECT donhangID FROM DonHang WHERE nguoiDungID = $1 AND maGiamID = $2', [actualUserID, parseInt(maGiamID)]);
                if (usedRes.rows.length > 0) {
                    throw new common_1.HttpException('Tài khoản của bạn đã sử dụng mã giảm giá này rồi!', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            const initialStatus = phuongThucThanhToan === 'COD' ? 'Chờ xác nhận' : 'Chờ thanh toán';
            const orderRes = await client.query(`INSERT INTO DonHang (nguoiDungID, email, maGiamID, ngayDat, diaChiGiao, sdtNguoiNhan, tenNguoiNhan, tongTien, phuongThucThanhToan, ghiChu, trangThaiDonHang) 
         VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10) RETURNING *`, [actualUserID, orderEmail, maGiamID || null, diaChiGiao, sdtNguoiNhan, tenNguoiNhan, tongTien, phuongThucThanhToan, ghiChu || null, initialStatus]);
            const newOrder = orderRes.rows[0];
            const orderId = newOrder.donhangid;
            if (maGiamID) {
                await client.query('UPDATE MaGiamGia SET soLuong = GREATEST(soLuong - 1, 0) WHERE maGiamID = $1', [parseInt(maGiamID)]);
            }
            for (const item of items) {
                await client.query('INSERT INTO ChiTietDonHang (donhangID, sachID, soLuong, donGia) VALUES ($1, $2, $3, $4)', [orderId, item.sachID, item.quantity, item.giaBan]);
                await client.query('UPDATE Sach SET soLuongTon = soLuongTon - $1 WHERE sachID = $2', [item.quantity, item.sachID]);
            }
            const isOnline = phuongThucThanhToan === 'Online (VNPAY)' || phuongThucThanhToan === 'QR(ngân hàng)';
            const paymentUUID = (0, crypto_1.randomUUID)();
            await client.query(`INSERT INTO ThanhToan (donhangID, ngayThanhToan, tienThanhToan, noiDungThanhToan, maThanhToan, trangThaiThanhToan) 
         VALUES ($1, $2, $3, $4, $5, $6)`, [
                orderId,
                isOnline ? new Date() : null,
                tongTien,
                isOnline ? `Thanh toán qua cổng QR đơn hàng số ${orderId}` : `Thanh toán đơn hàng số ${orderId} khi nhận hàng (COD)`,
                paymentUUID,
                isOnline ? 'Đã thanh toán' : 'Chưa thanh toán'
            ]);
            await client.query('UPDATE NguoiDung SET diemTichLuy = COALESCE(diemTichLuy, 0) + 10 WHERE nguoiDungID = $1', [actualUserID]);
            await client.query('COMMIT');
            if (phuongThucThanhToan === 'COD') {
                this.sendOrderNotificationEmail(orderId, 'SUCCESS');
            }
            return {
                donhangID: orderId,
                nguoiDungID: newOrder.nguoidungid,
                email: newOrder.email,
                maGiamID: newOrder.magiamid,
                ngayDat: newOrder.ngaydat,
                diaChiGiao: newOrder.diachigiao,
                sdtNguoiNhan: newOrder.sdtnguoinhan,
                tenNguoiNhan: newOrder.tennguoinhan,
                tongTien: parseFloat(newOrder.tongtien),
                phuongThucThanhToan: newOrder.phuongthucthanhtoan,
                ghiChu: newOrder.ghichu,
                lyDoHuy: newOrder.lydohuy,
                trangThaiDonHang: newOrder.trangthaidonhang
            };
        }
        catch (err) {
            console.error('ERROR IN CREATEORDER:', err);
            await client.query('ROLLBACK');
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        finally {
            client.release();
        }
    }
    async sendUnsuccessfulEmail(id) {
        try {
            await this.sendOrderNotificationEmail(parseInt(id), 'UNSUCCESSFUL');
            return { success: true };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateOrder(id, body) {
        const { tenNguoiNhan, sdtNguoiNhan, diaChiGiao, trangThaiDonHang } = body;
        try {
            const result = await this.db.query(`UPDATE DonHang 
         SET tenNguoiNhan = COALESCE($1, tenNguoiNhan), 
             sdtNguoiNhan = COALESCE($2, sdtNguoiNhan), 
             diaChiGiao = COALESCE($3, diaChiGiao), 
             trangThaiDonHang = COALESCE($4, trangThaiDonHang) 
         WHERE donhangID = $5 RETURNING *`, [tenNguoiNhan, sdtNguoiNhan, diaChiGiao, trangThaiDonHang, parseInt(id)]);
            if (trangThaiDonHang === 'Đã hoàn thành') {
                await this.db.query(`UPDATE ThanhToan SET trangThaiThanhToan = 'Đã thanh toán', ngayThanhToan = NOW() 
           WHERE donhangID = $1 AND trangThaiThanhToan = 'Chưa thanh toán'`, [parseInt(id)]);
                this.sendOrderNotificationEmail(parseInt(id), 'SUCCESS');
            }
            else if (trangThaiDonHang === 'Đã hủy') {
                this.sendOrderNotificationEmail(parseInt(id), 'CANCELLED');
            }
            return result.rows[0];
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateOrderStatus(id, body) {
        const { status } = body;
        const client = await this.db.getClient();
        try {
            await client.query('BEGIN');
            const currentRes = await client.query('SELECT trangThaiDonHang FROM DonHang WHERE donhangID = $1', [parseInt(id)]);
            const prevStatus = currentRes.rows.length > 0 ? currentRes.rows[0].trangthaidonhang : null;
            await client.query('UPDATE DonHang SET trangThaiDonHang = $1 WHERE donhangID = $2', [status, parseInt(id)]);
            if (status === 'Đã hoàn thành') {
                await client.query(`UPDATE ThanhToan SET trangThaiThanhToan = 'Đã thanh toán', ngayThanhToan = NOW() 
           WHERE donhangID = $1 AND trangThaiThanhToan = 'Chưa thanh toán'`, [parseInt(id)]);
            }
            else if (status === 'Đã hủy' && prevStatus !== 'Đã hủy') {
                const itemsRes = await client.query('SELECT sachID, soLuong FROM ChiTietDonHang WHERE donhangID = $1', [parseInt(id)]);
                for (const item of itemsRes.rows) {
                    await client.query('UPDATE Sach SET soLuongTon = soLuongTon + $1 WHERE sachID = $2', [item.soluong, item.sachid]);
                }
                await client.query('UPDATE ThanhToan SET trangThaiThanhToan = \'Chưa thanh toán\', tienThanhToan = 0 WHERE donhangID = $1', [parseInt(id)]);
            }
            await client.query('COMMIT');
            if ((status === 'Chờ xác nhận' || status === 'Đã hoàn thành') && prevStatus !== status) {
                this.sendOrderNotificationEmail(parseInt(id), 'SUCCESS');
            }
            else if (status === 'Đã hủy' && prevStatus !== 'Đã hủy') {
                this.sendOrderNotificationEmail(parseInt(id), 'UNSUCCESSFUL');
            }
            return { success: true };
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        finally {
            client.release();
        }
    }
    async cancelOrder(id, body) {
        const { reason } = body;
        const client = await this.db.getClient();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE DonHang SET trangThaiDonHang = \'Đã hủy\', lyDoHuy = $1 WHERE donhangID = $2', [reason, parseInt(id)]);
            const itemsRes = await client.query('SELECT sachID, soLuong FROM ChiTietDonHang WHERE donhangID = $1', [parseInt(id)]);
            for (const item of itemsRes.rows) {
                await client.query('UPDATE Sach SET soLuongTon = soLuongTon + $1 WHERE sachID = $2', [item.soluong, item.sachid]);
            }
            await client.query('UPDATE ThanhToan SET trangThaiThanhToan = \'Chưa thanh toán\', tienThanhToan = 0 WHERE donhangID = $1', [parseInt(id)]);
            await client.query('COMMIT');
            this.sendOrderNotificationEmail(parseInt(id), 'CANCELLED');
            return { success: true };
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        finally {
            client.release();
        }
    }
    async getReviews() {
        try {
            const result = await this.db.query('SELECT * FROM DanhGia ORDER BY danhgiaID');
            return result.rows.map(r => ({
                danhgiaid: r.danhgiaid,
                nguoidungid: r.nguoidungid,
                sachid: r.sachid,
                sosao: parseInt(r.sosao),
                noidung: r.noidung,
                ngaydanhgia: r.ngaydanhgia
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createReview(body) {
        const { nguoiDungID, sachID, soSao, noiDung } = body;
        try {
            const result = await this.db.query(`INSERT INTO DanhGia (nguoiDungID, sachID, soSao, noiDung, ngayDanhGia) 
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`, [nguoiDungID, sachID, soSao, noiDung]);
            const r = result.rows[0];
            return {
                danhgiaid: r.danhgiaid,
                nguoidungid: r.nguoidungid,
                sachid: r.sachid,
                sosao: parseInt(r.sosao),
                noidung: r.noidung,
                ngaydanhgia: r.ngaydanhgia
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createZaloPayPayment(body) {
        const { donhangID } = body;
        try {
            const orderRes = await this.db.query('SELECT * FROM DonHang WHERE donhangID = $1', [donhangID]);
            if (orderRes.rows.length === 0) {
                throw new common_1.HttpException('Đơn hàng không tồn tại!', common_1.HttpStatus.NOT_FOUND);
            }
            const order = orderRes.rows[0];
            const itemsRes = await this.db.query('SELECT d.*, s.tenSach FROM ChiTietDonHang d JOIN Sach s ON d.sachID = s.sachID WHERE d.donhangID = $1', [donhangID]);
            const items = itemsRes.rows.map(item => ({
                itemid: String(item.sachid),
                itemname: item.tensach,
                itemprice: parseInt(item.dongia),
                itemquantity: parseInt(item.soluong)
            }));
            const config = {
                app_id: '2553',
                key1: 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
                key2: 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
                endpoint: 'https://sb-openapi.zalopay.vn/v2/create'
            };
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const transDate = `${yy}${mm}${dd}`;
            const app_trans_id = `${transDate}_${order.donhangid}_${Date.now()}`;
            const app_time = Date.now();
            const app_user = order.tennguoinhan || 'LSBookStore_User';
            const amount = Math.round(parseFloat(order.tongtien));
            const description = `LSBookStore - Thanh toán đơn hàng #${order.donhangid}`;
            const bank_code = '';
            await this.db.query('UPDATE ThanhToan SET maThanhToan = $1 WHERE donhangID = $2', [app_trans_id, order.donhangid]);
            const embed_data = JSON.stringify({
                redirecturl: `http://localhost:3000/thankyou?orderId=${order.donhangid}`,
                store_name: 'LSBook Store'
            });
            const itemsStr = JSON.stringify(items);
            const dataToMac = `${config.app_id}|${app_trans_id}|${app_user}|${amount}|${app_time}|${embed_data}|${itemsStr}`;
            const mac = (0, crypto_1.createHmac)('sha256', config.key1).update(dataToMac).digest('hex');
            const payload = {
                app_id: parseInt(config.app_id),
                app_trans_id,
                app_user,
                app_time,
                item: itemsStr,
                embed_data,
                amount,
                description,
                bank_code,
                mac
            };
            const response = await fetch(config.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            return {
                ...result,
                donhangID: order.donhangid,
                amount
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async checkZaloPayStatus(body) {
        const { donhangID } = body;
        try {
            const paymentRes = await this.db.query('SELECT * FROM ThanhToan WHERE donhangID = $1 ORDER BY thanhToanID DESC LIMIT 1', [parseInt(donhangID)]);
            if (paymentRes.rows.length === 0 || !paymentRes.rows[0].mathanhtoan) {
                return { success: false, status: 'NO_TRANS_ID', message: 'Không tìm thấy mã giao dịch ZaloPay' };
            }
            const app_trans_id = paymentRes.rows[0].mathanhtoan;
            const config = {
                app_id: 2553,
                key1: 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
                queryEndpoint: 'https://sb-openapi.zalopay.vn/v2/query'
            };
            const dataToMac = `${config.app_id}|${app_trans_id}|${config.key1}`;
            const mac = (0, crypto_1.createHmac)('sha256', config.key1).update(dataToMac).digest('hex');
            const queryPayload = {
                app_id: config.app_id,
                app_trans_id,
                mac
            };
            const response = await fetch(config.queryEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(queryPayload).toString()
            });
            const zlpData = await response.json();
            console.log(`[Real-time ZaloPay Query] Order #${donhangID} (${app_trans_id}) =>`, zlpData);
            if (zlpData.return_code === 1) {
                await this.db.query(`UPDATE DonHang SET trangThaiDonHang = 'Chờ xác nhận' WHERE donhangID = $1`, [parseInt(donhangID)]);
                await this.db.query(`UPDATE ThanhToan SET trangThaiThanhToan = 'Đã thanh toán', ngayThanhToan = NOW() WHERE donhangID = $1`, [parseInt(donhangID)]);
                this.sendOrderNotificationEmail(parseInt(donhangID), 'SUCCESS');
                return { success: true, status: 'SUCCESS', message: 'Thanh toán ZaloPay thành công!', zlpData };
            }
            else {
                await this.db.query(`UPDATE DonHang SET trangThaiDonHang = 'Chờ thanh toán' WHERE donhangID = $1`, [parseInt(donhangID)]);
                this.sendOrderNotificationEmail(parseInt(donhangID), 'UNSUCCESSFUL');
                return { success: false, status: 'FAILED', message: zlpData.return_message || 'Thanh toán chưa thành công', zlpData };
            }
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async forgotPassword(body) {
        const { email } = body;
        if (!email || !email.trim()) {
            throw new common_1.HttpException('Vui lòng nhập địa chỉ email!', common_1.HttpStatus.BAD_REQUEST);
        }
        const targetEmail = email.trim().toLowerCase();
        const userRes = await this.db.query('SELECT nguoiDungID, hoTen, email FROM NguoiDung WHERE LOWER(email) = $1', [targetEmail]);
        if (userRes.rows.length === 0) {
            throw new common_1.HttpException('Email chưa được đăng ký trong hệ thống!', common_1.HttpStatus.NOT_FOUND);
        }
        const user = userRes.rows[0];
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        await this.db.query('DELETE FROM BangTamOTP WHERE nguoiDungID = $1 OR LOWER(email) = $2', [user.nguoidungid, targetEmail]);
        await this.db.query(`INSERT INTO BangTamOTP (nguoiDungID, email, otp, created_at, expires_at) 
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '15 minutes')`, [user.nguoidungid, targetEmail, otp]);
        const subject = '[LSBook Store] Mã OTP xác thực cài đặt lại mật khẩu';
        const textContent = `Kính chào ${user.hoten || 'Quý khách'},\n\nBạn đã yêu cầu cài đặt lại mật khẩu cho tài khoản ${targetEmail} tại LSBook Store.\n\nMã OTP xác nhận của bạn là: ${otp}\n(Mã có hiệu lực trong vòng 15 phút).\n\nNếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.`;
        const htmlContent = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
<h2 style="color: #4f46e5; margin-top: 0;">LSBook Store - Xác Thực OTP</h2>
<p>Kính chào <b>${user.hoten || 'Quý khách'}</b>,</p>
<p>Bạn đã yêu cầu cài đặt lại mật khẩu cho tài khoản <b>${targetEmail}</b> tại LSBook Store.</p>
<div style="background-color: #f1f5f9; text-align: center; padding: 15px; border-radius: 8px; margin: 15px 0;">
  <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4f46e5;">${otp}</span>
</div>
<p style="font-size: 13px; color: #64748b;">Mã OTP có hiệu lực trong vòng 15 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
</div>`;
        this.sendEmail(targetEmail, subject, textContent, htmlContent).catch(console.error);
        return {
            success: true,
            message: 'Mã OTP đã được gửi thành công đến email của bạn!',
            email: targetEmail
        };
    }
    async verifyOTP(body) {
        const { email, otp } = body;
        if (!email || !otp) {
            throw new common_1.HttpException('Vui lòng nhập đầy đủ email và mã OTP!', common_1.HttpStatus.BAD_REQUEST);
        }
        const targetEmail = email.trim().toLowerCase();
        const targetOtp = otp.trim();
        const otpRes = await this.db.query(`SELECT * FROM BangTamOTP WHERE LOWER(email) = $1 AND otp = $2 AND expires_at > NOW() ORDER BY id DESC LIMIT 1`, [targetEmail, targetOtp]);
        if (otpRes.rows.length === 0) {
            throw new common_1.HttpException('Mã OTP không hợp lệ hoặc đã hết hạn!', common_1.HttpStatus.BAD_REQUEST);
        }
        return {
            success: true,
            message: 'Mã OTP chính xác!'
        };
    }
    async resetPassword(body) {
        const { email, otp, newPassword } = body;
        if (!email || !otp || !newPassword) {
            throw new common_1.HttpException('Vui lòng nhập đầy đủ thông tin!', common_1.HttpStatus.BAD_REQUEST);
        }
        if (newPassword.length < 4) {
            throw new common_1.HttpException('Mật khẩu phải có ít nhất 4 ký tự!', common_1.HttpStatus.BAD_REQUEST);
        }
        const targetEmail = email.trim().toLowerCase();
        const targetOtp = otp.trim();
        const otpRes = await this.db.query(`SELECT * FROM BangTamOTP WHERE LOWER(email) = $1 AND otp = $2 AND expires_at > NOW() ORDER BY id DESC LIMIT 1`, [targetEmail, targetOtp]);
        if (otpRes.rows.length === 0) {
            throw new common_1.HttpException('Mã OTP không hợp lệ hoặc đã hết hạn!', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.db.query('UPDATE NguoiDung SET matKhauHash = $1 WHERE LOWER(email) = $2', [newPassword, targetEmail]);
        await this.db.query('DELETE FROM BangTamOTP WHERE LOWER(email) = $1', [targetEmail]);
        return {
            success: true,
            message: 'Cài đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.'
        };
    }
    async getDiscountCodes() {
        try {
            const result = await this.db.query('SELECT * FROM MaGiamGia ORDER BY maGiamID DESC');
            return result.rows.map(m => ({
                magiamID: m.magiamid,
                magiamid: m.magiamid,
                maGiam: m.magiam,
                magiam: m.magiam,
                ten: m.ten,
                tiLe: parseFloat(m.tile),
                tile: parseFloat(m.tile),
                soLuong: parseInt(m.soluong),
                soluong: parseInt(m.soluong),
                ngayBatDau: m.ngaybatdau,
                ngaybatdau: m.ngaybatdau,
                ngayKetThuc: m.ngayketthuc,
                ngayketthuc: m.ngayketthuc,
                trangThai: m.trangthai,
                trangthai: m.trangthai
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createDiscountCode(body) {
        const { maGiam, ten, tiLe, soLuong, ngayBatDau, ngayKetThuc, trangThai } = body;
        try {
            const result = await this.db.query(`INSERT INTO MaGiamGia (maGiam, ten, tiLe, soLuong, ngayBatDau, ngayKetThuc, trangThai)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [
                maGiam.trim().toUpperCase(),
                ten.trim(),
                parseFloat(tiLe),
                parseInt(soLuong),
                ngayBatDau,
                ngayKetThuc,
                trangThai || 'Hoạt động'
            ]);
            const m = result.rows[0];
            return {
                magiamID: m.magiamid,
                maGiam: m.magiam,
                ten: m.ten,
                tiLe: parseFloat(m.tile),
                soLuong: parseInt(m.soluong),
                ngayBatDau: m.ngaybatdau,
                ngayKetThuc: m.ngayketthuc,
                trangThai: m.trangthai
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateDiscountCode(id, body) {
        const { maGiam, ten, tiLe, soLuong, ngayBatDau, ngayKetThuc, trangThai } = body;
        try {
            const result = await this.db.query(`UPDATE MaGiamGia 
         SET maGiam = $1, ten = $2, tiLe = $3, soLuong = $4, ngayBatDau = $5, ngayKetThuc = $6, trangThai = $7 
         WHERE maGiamID = $8 RETURNING *`, [
                maGiam.trim().toUpperCase(),
                ten.trim(),
                parseFloat(tiLe),
                parseInt(soLuong),
                ngayBatDau,
                ngayKetThuc,
                trangThai,
                parseInt(id)
            ]);
            if (result.rows.length === 0) {
                throw new common_1.HttpException('Mã giảm giá không tồn tại!', common_1.HttpStatus.NOT_FOUND);
            }
            const m = result.rows[0];
            return {
                magiamID: m.magiamid,
                maGiam: m.magiam,
                ten: m.ten,
                tiLe: parseFloat(m.tile),
                soLuong: parseInt(m.soluong),
                ngayBatDau: m.ngaybatdau,
                ngayKetThuc: m.ngayketthuc,
                trangThai: m.trangthai
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateDiscountCode(body) {
        const { code, userID } = body;
        if (!code) {
            return { valid: false, message: 'Vui lòng nhập mã giảm giá!' };
        }
        try {
            const result = await this.db.query(`SELECT * FROM MaGiamGia WHERE UPPER(maGiam) = UPPER($1) AND trangThai = 'Hoạt động'`, [code.trim()]);
            if (result.rows.length === 0) {
                return { valid: false, message: 'Mã giảm giá không tồn tại hoặc đã bị ẩn!' };
            }
            const m = result.rows[0];
            const now = new Date();
            if (m.ngaybatdau && new Date(m.ngaybatdau) > now) {
                return { valid: false, message: 'Mã giảm giá chưa bắt đầu thời gian áp dụng!' };
            }
            if (m.ngayketthuc && new Date(m.ngayketthuc) < now) {
                return { valid: false, message: 'Mã giảm giá đã hết hạn sử dụng!' };
            }
            if (parseInt(m.soluong) <= 0) {
                return { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng!' };
            }
            if (userID) {
                const usedRes = await this.db.query('SELECT donhangID FROM DonHang WHERE nguoiDungID = $1 AND maGiamID = $2', [parseInt(userID), parseInt(m.magiamid)]);
                if (usedRes.rows.length > 0) {
                    return { valid: false, message: 'Tài khoản của bạn đã sử dụng mã giảm giá này rồi!' };
                }
            }
            return {
                valid: true,
                voucher: {
                    magiamID: m.magiamid,
                    magiamid: m.magiamid,
                    maGiam: m.magiam,
                    magiam: m.magiam,
                    ten: m.ten,
                    tiLe: parseFloat(m.tile),
                    tile: parseFloat(m.tile),
                    soLuong: parseInt(m.soluong),
                    trangThai: m.trangthai
                }
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getChatMessages(sessionID) {
        try {
            if (!sessionID) {
                throw new common_1.HttpException('sessionID là bắt buộc!', common_1.HttpStatus.BAD_REQUEST);
            }
            const result = await this.db.query('SELECT * FROM TinNhanCSKH WHERE sessionID = $1 ORDER BY created_at ASC', [sessionID]);
            return result.rows.map(m => ({
                id: m.id,
                sessionID: m.sessionid,
                senderType: m.sendertype,
                senderName: m.sendername,
                message: m.message,
                createdAt: m.created_at,
                isRead: m.isread
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendChatMessage(body) {
        const { sessionID, senderType, senderName, message } = body;
        if (!sessionID || !senderType || !senderName || !message || !message.trim()) {
            throw new common_1.HttpException('Vui lòng điền đầy đủ thông tin tin nhắn!', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.db.query(`INSERT INTO TinNhanCSKH (sessionID, senderType, senderName, message, created_at, isRead) 
         VALUES ($1, $2, $3, $4, NOW(), FALSE) RETURNING *`, [sessionID.trim(), senderType.trim(), senderName.trim(), message.trim()]);
            const m = result.rows[0];
            return {
                id: m.id,
                sessionID: m.sessionid,
                senderType: m.sendertype,
                senderName: m.sendername,
                message: m.message,
                createdAt: m.created_at,
                isRead: m.isread
            };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getChatSessions() {
        try {
            const result = await this.db.query(`
        SELECT 
          t.sessionID,
          COALESCE(
            (
              SELECT u.hoTen FROM NguoiDung u 
              WHERE ('user_' || u.nguoiDungID::text) = t.sessionID
            ),
            (
              SELECT senderName FROM TinNhanCSKH 
              WHERE sessionID = t.sessionID AND senderType = 'CUSTOMER' 
              ORDER BY created_at DESC LIMIT 1
            ),
            'Khách hàng'
          ) AS senderName,
          (
            SELECT message FROM TinNhanCSKH 
            WHERE sessionID = t.sessionID 
            ORDER BY created_at DESC LIMIT 1
          ) AS lastMessage,
          (
            SELECT created_at FROM TinNhanCSKH 
            WHERE sessionID = t.sessionID 
            ORDER BY created_at DESC LIMIT 1
          ) AS lastTime,
          (
            SELECT COUNT(*)::int FROM TinNhanCSKH 
            WHERE sessionID = t.sessionID AND senderType = 'CUSTOMER' AND isRead = FALSE
          ) AS unreadCount
        FROM TinNhanCSKH t
        GROUP BY t.sessionID
        ORDER BY lastTime DESC
      `);
            return result.rows.map(r => ({
                sessionID: r.sessionid,
                senderName: r.sendername || 'Khách hàng',
                lastMessage: r.lastmessage || '',
                lastTime: r.lasttime,
                unreadCount: parseInt(r.unreadcount || 0)
            }));
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async markChatSessionRead(sessionID) {
        try {
            await this.db.query(`UPDATE TinNhanCSKH SET isRead = TRUE WHERE sessionID = $1 AND senderType = 'CUSTOMER'`, [sessionID]);
            return { success: true };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('danhmuc'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('danhmuc'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('tacgia'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAuthors", null);
__decorate([
    (0, common_1.Get)('nhaxuatban'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublishers", null);
__decorate([
    (0, common_1.Get)('sach'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBooks", null);
__decorate([
    (0, common_1.Post)('sach'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createBook", null);
__decorate([
    (0, common_1.Put)('sach/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateBook", null);
__decorate([
    (0, common_1.Delete)('sach/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteBook", null);
__decorate([
    (0, common_1.Get)('nguoidung'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('nguoidung'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('nguoidung/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Put)('nguoidung/:id/password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('magiamgia'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getCoupons", null);
__decorate([
    (0, common_1.Get)('donhang'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('chitietdonhang'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOrderDetails", null);
__decorate([
    (0, common_1.Get)('thanhtoan'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Post)('donhang'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('donhang/:id/unsuccessful-email'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "sendUnsuccessfulEmail", null);
__decorate([
    (0, common_1.Put)('donhang/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Put)('donhang/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Put)('donhang/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Get)('danhgia'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Post)('danhgia'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createReview", null);
__decorate([
    (0, common_1.Post)('zalopay/create-payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createZaloPayPayment", null);
__decorate([
    (0, common_1.Post)('zalopay/check-status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "checkZaloPayStatus", null);
__decorate([
    (0, common_1.Post)('auth/forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('auth/verify-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "verifyOTP", null);
__decorate([
    (0, common_1.Post)('auth/reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('magiamgia'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getDiscountCodes", null);
__decorate([
    (0, common_1.Post)('magiamgia'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createDiscountCode", null);
__decorate([
    (0, common_1.Put)('magiamgia/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateDiscountCode", null);
__decorate([
    (0, common_1.Post)('magiamgia/validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "validateDiscountCode", null);
__decorate([
    (0, common_1.Get)('chat/messages'),
    __param(0, (0, common_1.Query)('sessionID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getChatMessages", null);
__decorate([
    (0, common_1.Post)('chat/messages'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "sendChatMessage", null);
__decorate([
    (0, common_1.Get)('chat/sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getChatSessions", null);
__decorate([
    (0, common_1.Put)('chat/read/:sessionID'),
    __param(0, (0, common_1.Param)('sessionID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "markChatSessionRead", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AppController);
//# sourceMappingURL=app.controller.js.map