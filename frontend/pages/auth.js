import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { triggerToast } from '../components/Toast';

const API_URL = 'http://localhost:3001/api';

export default function Auth() {
  const [activeTab, setActiveTab] = useState('login');
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form states
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerAddress, setRegisterAddress] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerGender, setRegisterGender] = useState('Nam');
  const [registerDob, setRegisterDob] = useState('');

  // Forgot Password Flow States
  const [mode, setMode] = useState('auth'); // 'auth' | 'forgot'
  const [forgotStep, setForgotStep] = useState(1); // 1, 2, 3
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const router = useRouter();
  const { tab, redirect } = router.query;

  useEffect(() => {
    if (tab === 'register') {
      setActiveTab('register');
    } else {
      setActiveTab('login');
    }
  }, [tab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      triggerToast('Vui lòng điền đầy đủ email và mật khẩu!', 'warning');
      return;
    }

    try {
      const users = await fetch(`${API_URL}/nguoidung`).then(r => r.json());
      const matched = users.find(
        u => u.email.toLowerCase() === loginEmail.trim().toLowerCase() && u.matKhauHash === loginPassword
      );

      if (!matched) {
        triggerToast('Email hoặc mật khẩu không chính xác!', 'error');
        return;
      }

      if (matched.trangThai !== 'Hoạt động') {
        triggerToast('Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên.', 'error');
        return;
      }

      // Map DB object naming to JS keys expected in LocalStorage
      const userPayload = {
        nguoiDungID: matched.nguoiDungID,
        hoTen: matched.hoTen,
        email: matched.email,
        soDienThoai: matched.soDienThoai,
        vaiTro: matched.vaiTro,
        diaChi: matched.diaChi,
        diemTichLuy: matched.diemTichLuy
      };

      localStorage.setItem('LS_currentUser', JSON.stringify(userPayload));
      localStorage.setItem('LS_actingRole', 'Khách hàng'); // Default to Customer on sign in

      triggerToast(`Đăng nhập thành công! Chào mừng ${userPayload.hoTen}.`, 'success');
      
      // Redirect
      window.dispatchEvent(new Event('cart-updated'));
      if (redirect === 'checkout') {
        router.push('/checkout');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Đăng nhập thất bại!', 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword || !registerConfirmPassword || !registerPhone.trim()) {
      triggerToast('Vui lòng điền đầy đủ các trường thông tin bắt buộc!', 'warning');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      triggerToast('Mật khẩu và Xác nhận mật khẩu không trùng khớp!', 'warning');
      return;
    }

    try {
      // 1. Check if email already registered
      const users = await fetch(`${API_URL}/nguoidung`).then(r => r.json());
      if (users.some(u => u.email.toLowerCase() === registerEmail.trim().toLowerCase())) {
        triggerToast('Email này đã được sử dụng để đăng ký tài khoản!', 'warning');
        return;
      }

      // 2. Send registration to NestJS Database
      const payload = {
        hoTen: registerName.trim(),
        email: registerEmail.trim(),
        matKhauHash: registerPassword,
        soDienThoai: registerPhone.trim(),
        diaChi: registerAddress.trim() || 'Chưa cập nhật',
        gioiTinh: registerGender,
        ngaySinh: registerDob || null,
        vaiTro: 'Khách hàng',
        diemTichLuy: 0
      };

      const res = await fetch(`${API_URL}/nguoidung`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newUser = await res.json();
        
        // Map naming for browser session
        const userPayload = {
          nguoiDungID: newUser.nguoiDungID,
          hoTen: newUser.hoTen,
          email: newUser.email,
          soDienThoai: newUser.soDienThoai,
          vaiTro: newUser.vaiTro,
          diaChi: newUser.diaChi,
          diemTichLuy: newUser.diemTichLuy
        };

        localStorage.setItem('LS_currentUser', JSON.stringify(userPayload));
        localStorage.setItem('LS_actingRole', 'Khách hàng');
        
        triggerToast('Đăng ký tài khoản thành công!', 'success');
        window.dispatchEvent(new Event('cart-updated'));
        router.push('/');
      } else {
        triggerToast('Đăng ký thất bại!', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Đăng ký thất bại!', 'error');
    }
  };

  const handleRequestOtp = async (e) => {
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

  const handleVerifyOtp = async (e) => {
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

  const handleResetPassword = async (e) => {
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
        triggerToast('Cài đặt lại mật khẩu thành công! Vui lòng đăng nhập.', 'success');
        setLoginEmail(forgotEmail.trim());
        setMode('auth');
        setActiveTab('login');
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

  return (
    <div className={`w-full mx-auto px-4 py-12 transition-all duration-300 ${activeTab === 'register' && mode === 'auth' ? 'max-w-xl' : 'max-w-md'}`}>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-6 md:p-8">
        
        {mode === 'forgot' ? (
          <div className="space-y-5 animate-fade-in">
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <h2 className="text-base font-black text-gray-900 uppercase tracking-wider mb-1">
                    Vui lòng điền email để cài lại mật khẩu
                  </h2>
                  <p className="text-xs text-gray-400">
                    Hệ thống sẽ tạo và gửi mã OTP gồm 4 chữ số tới email của bạn.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmittingForgot}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md text-sm cursor-pointer"
                  >
                    {isSubmittingForgot ? 'Đang gửi mã OTP...' : 'Tiếp tục'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setMode('auth');
                      setForgotStep(1);
                    }}
                    className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 py-2 transition-colors cursor-pointer"
                  >
                    &larr; Quay lại Đăng nhập
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <h2 className="text-base font-black text-gray-900 uppercase tracking-wider mb-1">
                    Nhập mã OTP xác nhận
                  </h2>
                  <p className="text-xs text-gray-400">
                    Mã OTP (4 chữ số) đã được gửi đến email <span className="font-bold text-indigo-600">{forgotEmail}</span>.
                  </p>
                </div>

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

                <div className="flex flex-col space-y-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmittingForgot}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md text-sm cursor-pointer"
                  >
                    {isSubmittingForgot ? 'Đang xác nhận...' : 'Xác nhận'}
                  </button>
                  <div className="flex justify-between items-center text-xs px-1">
                    <button 
                      type="button" 
                      onClick={handleRequestOtp}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Gửi lại mã OTP
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setMode('auth');
                        setForgotStep(1);
                      }}
                      className="font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <h2 className="text-base font-black text-gray-900 uppercase tracking-wider mb-1">
                    Cài đặt mật khẩu mới
                  </h2>
                  <p className="text-xs text-gray-400">
                    Vui lòng nhập mật khẩu mới cho tài khoản <span className="font-bold text-indigo-600">{forgotEmail}</span>.
                  </p>
                </div>

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

                <div className="flex flex-col space-y-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmittingForgot}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md text-sm cursor-pointer"
                  >
                    {isSubmittingForgot ? 'Đang cập nhật...' : 'Xác nhận cài lại mật khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Navigation tabs */}
            <div className="flex border-b border-gray-100 mb-8">
              <button 
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 text-center font-bold text-sm pb-4 transition-all focus:outline-none ${activeTab === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Đăng nhập
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 text-center font-bold text-sm pb-4 transition-all focus:outline-none ${activeTab === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Đăng ký
              </button>
            </div>

            {/* Tab content: Login */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Mật khẩu</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotStep(1);
                        setForgotEmail(loginEmail || '');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-sm pt-3.5"
                >
                  Đăng nhập ngay
                </button>
              </form>
            ) : (
              /* Tab content: Register */
              <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Họ và tên *</label>
                <input 
                  type="text" 
                  placeholder="Nguyễn Văn A"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ Email *</label>
                <input 
                  type="email" 
                  placeholder="email@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Số điện thoại *</label>
                <input 
                  type="tel" 
                  placeholder="0901234567"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Giới tính</label>
                <select 
                  value={registerGender}
                  onChange={(e) => setRegisterGender(e.target.value)}
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Ngày sinh</label>
                <input 
                  type="date" 
                  value={registerDob}
                  onChange={(e) => setRegisterDob(e.target.value)}
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Địa chỉ nhận hàng (Không bắt buộc)</label>
                <input 
                  type="text" 
                  placeholder="Số nhà, tên đường..."
                  value={registerAddress}
                  onChange={(e) => setRegisterAddress(e.target.value)}
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Mật khẩu *</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Xác nhận mật khẩu *</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className="mt-2 block w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-sm pt-3.5 mt-2"
            >
              Đăng ký tài khoản
            </button>
          </form>
        )}
        </>
        )}
      </div>
    </div>
  );
}
