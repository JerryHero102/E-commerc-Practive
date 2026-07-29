import { DatabaseService } from './database.service';
export declare class AppController {
    private readonly db;
    constructor(db: DatabaseService);
    private sendEmail;
    private sendOrderNotificationEmail;
    getCategories(): Promise<any>;
    createCategory(body: any): Promise<{
        danhmucID: any;
        tenDanhMuc: any;
        moTa: any;
        trangThai: any;
    }>;
    getAuthors(): Promise<any>;
    getPublishers(): Promise<any>;
    getBooks(): Promise<any>;
    createBook(body: any): Promise<{
        sachID: any;
        danhmucID: any;
        tacgiaID: any;
        nxbID: any;
        tenSach: any;
        giaBan: number;
        giaNhap: number;
        soLuongTon: number;
        moTa: any;
        hinhAnh: any;
        namXuatBan: any;
        trangThai: any;
    }>;
    updateBook(id: string, body: any): Promise<{
        sachID: any;
        danhmucID: any;
        tacgiaID: any;
        nxbID: any;
        tenSach: any;
        giaBan: number;
        giaNhap: number;
        soLuongTon: number;
        moTa: any;
        hinhAnh: any;
        namXuatBan: any;
        trangThai: any;
    }>;
    deleteBook(id: string): Promise<{
        success: boolean;
    }>;
    getUsers(): Promise<any>;
    createUser(body: any): Promise<{
        nguoiDungID: any;
        hoTen: any;
        email: any;
        matKhauHash: any;
        soDienThoai: any;
        vaiTro: any;
        luong: number;
        ngayVaoLam: any;
        diaChi: any;
        trangThai: any;
        ngaySinh: any;
        gioiTinh: any;
        diemTichLuy: any;
    }>;
    updateUser(id: string, body: any): Promise<{
        nguoiDungID: any;
        hoTen: any;
        email: any;
        matKhauHash: any;
        soDienThoai: any;
        vaiTro: any;
        luong: number;
        ngayVaoLam: any;
        diaChi: any;
        trangThai: any;
        ngaySinh: any;
        gioiTinh: any;
        diemTichLuy: any;
    }>;
    changePassword(id: string, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getCoupons(): Promise<any>;
    getOrders(): Promise<any>;
    getOrderDetails(): Promise<any>;
    getPayments(): Promise<any>;
    createOrder(body: any): Promise<{
        donhangID: any;
        nguoiDungID: any;
        email: any;
        maGiamID: any;
        ngayDat: any;
        diaChiGiao: any;
        sdtNguoiNhan: any;
        tenNguoiNhan: any;
        tongTien: number;
        phuongThucThanhToan: any;
        ghiChu: any;
        lyDoHuy: any;
        trangThaiDonHang: any;
    }>;
    sendUnsuccessfulEmail(id: string): Promise<{
        success: boolean;
    }>;
    updateOrder(id: string, body: any): Promise<any>;
    updateOrderStatus(id: string, body: any): Promise<{
        success: boolean;
    }>;
    cancelOrder(id: string, body: any): Promise<{
        success: boolean;
    }>;
    getReviews(): Promise<any>;
    createReview(body: any): Promise<{
        danhgiaid: any;
        nguoidungid: any;
        sachid: any;
        sosao: number;
        noidung: any;
        ngaydanhgia: any;
    }>;
    createZaloPayPayment(body: any): Promise<any>;
    checkZaloPayStatus(body: any): Promise<{
        success: boolean;
        status: string;
        message: string;
        zlpData?: undefined;
    } | {
        success: boolean;
        status: string;
        message: any;
        zlpData: any;
    }>;
    forgotPassword(body: any): Promise<{
        success: boolean;
        message: string;
        email: any;
    }>;
    verifyOTP(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getDiscountCodes(): Promise<any>;
    createDiscountCode(body: any): Promise<{
        magiamID: any;
        maGiam: any;
        ten: any;
        tiLe: number;
        soLuong: number;
        ngayBatDau: any;
        ngayKetThuc: any;
        trangThai: any;
    }>;
    updateDiscountCode(id: string, body: any): Promise<{
        magiamID: any;
        maGiam: any;
        ten: any;
        tiLe: number;
        soLuong: number;
        ngayBatDau: any;
        ngayKetThuc: any;
        trangThai: any;
    }>;
    validateDiscountCode(body: any): Promise<{
        valid: boolean;
        message: string;
        voucher?: undefined;
    } | {
        valid: boolean;
        voucher: {
            magiamID: any;
            magiamid: any;
            maGiam: any;
            magiam: any;
            ten: any;
            tiLe: number;
            tile: number;
            soLuong: number;
            trangThai: any;
        };
        message?: undefined;
    }>;
    getChatMessages(sessionID: string): Promise<any>;
    sendChatMessage(body: any): Promise<{
        id: any;
        sessionID: any;
        senderType: any;
        senderName: any;
        message: any;
        createdAt: any;
        isRead: any;
    }>;
    getChatSessions(): Promise<any>;
    markChatSessionRead(sessionID: string): Promise<{
        success: boolean;
    }>;
}
