import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Guest name registration state
  const [guestName, setGuestName] = useState('');
  const [inputGuestName, setInputGuestName] = useState('');
  const [sessionID, setSessionID] = useState('');

  // Chat message states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const chatWidgetRef = useRef(null);

  // Close chat widget when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatWidgetRef.current && !chatWidgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Sync user session and guest state dynamically from localStorage/sessionStorage
  const updateSessionFromStorage = () => {
    const userStr = localStorage.getItem('LS_currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const newSessionID = `user_${user.nguoiDungID}`;
        setCurrentUser(user);
        setGuestName(user.hoTen || user.tenDangNhap || 'Khách hàng');
        if (newSessionID !== sessionID) {
          setSessionID(newSessionID);
          setMessages([]);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // If was previously logged in as a registered user and just logged out:
      if (currentUser) {
        setCurrentUser(null);
        setIsOpen(false);
        setMessages([]);
        sessionStorage.removeItem('LS_guestName');
        sessionStorage.removeItem('LS_guestSessionID');
        localStorage.removeItem('LS_guestName');
        localStorage.removeItem('LS_guestSessionID');
      }

      // Guest flow using sessionStorage (persists until browser tab/browser is closed)
      let gSession = sessionStorage.getItem('LS_guestSessionID') || localStorage.getItem('LS_guestSessionID');
      if (!gSession) {
        gSession = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        sessionStorage.setItem('LS_guestSessionID', gSession);
        localStorage.setItem('LS_guestSessionID', gSession);
      }

      const gName = sessionStorage.getItem('LS_guestName') || localStorage.getItem('LS_guestName') || '';

      if (gSession !== sessionID) {
        setSessionID(gSession);
        setMessages([]);
      }
      setGuestName(gName);
    }
  };

  useEffect(() => {
    updateSessionFromStorage();
    window.addEventListener('storage', updateSessionFromStorage);
    window.addEventListener('cart-updated', updateSessionFromStorage);
    return () => {
      window.removeEventListener('storage', updateSessionFromStorage);
      window.removeEventListener('cart-updated', updateSessionFromStorage);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateSessionFromStorage();
    }
  }, [isOpen]);

  // Fetch messages polling when open
  useEffect(() => {
    if (!isOpen || !sessionID || (!currentUser && !guestName)) return;

    const fetchMessages = () => {
      fetch(`${API_URL}/chat/messages?sessionID=${encodeURIComponent(sessionID)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(data);
          }
        })
        .catch(err => console.error(err));
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, sessionID, currentUser, guestName]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleStartGuestChat = (e) => {
    e.preventDefault();
    if (!inputGuestName.trim()) return;
    const name = inputGuestName.trim();
    setGuestName(name);
    sessionStorage.setItem('LS_guestName', name);
    localStorage.setItem('LS_guestName', name);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const msgText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const senderName = currentUser ? currentUser.hoTen : guestName;

    try {
      const res = await fetch(`${API_URL}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionID,
          senderType: 'CUSTOMER',
          senderName,
          message: msgText
        })
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages(prev => [...prev, savedMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const activeSenderName = currentUser ? currentUser.hoTen : guestName;

  return (
    <div ref={chatWidgetRef} className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative group"
          title="Trò chuyện với CSKH"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
        </button>
      )}

      {/* Floating Chat Panel (~1/5 screen width, approx 360px) */}
      {isOpen && (
        <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-[350px] sm:w-[380px] h-[520px] max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-white border border-white/30">
                  CS
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-indigo-700 rounded-full"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Hỗ trợ LSBook Store</h3>
                <p className="text-[11px] text-indigo-100/90 font-medium">Hỗ trợ trực tuyến 24/7</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Content Area */}
          {!activeSenderName ? (
            /* Guest Name Prompt Step */
            <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-4 bg-gray-50/50">
              <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-1">
                💬
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Xin chào quý khách!</h4>
                <p className="text-xs text-gray-500 mt-1">Vui lòng nhập tên của bạn để bắt đầu trò chuyện với nhân viên tư vấn.</p>
              </div>

              <form onSubmit={handleStartGuestChat} className="w-full space-y-3 pt-2">
                <input 
                  type="text" 
                  value={inputGuestName}
                  onChange={(e) => setInputGuestName(e.target.value)}
                  placeholder="Nhập họ tên của bạn..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider cursor-pointer"
                >
                  Bắt đầu trò chuyện
                </button>
              </form>
            </div>
          ) : (
            /* Active Chat View */
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
              
              {/* Messages List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs font-bold text-gray-400">Xin chào <span className="text-indigo-600">{activeSenderName}</span>!</p>
                    <p className="text-xxs text-gray-400">Hãy gửi tin nhắn bên dưới để nhận hỗ trợ từ LSBook Store.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isCustomer = msg.senderType === 'CUSTOMER';

                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-gray-400 px-1 mb-0.5 font-medium">
                          {isCustomer ? 'Bạn' : msg.senderName || 'LSBook CSKH'}
                        </span>
                        <div 
                          className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isCustomer 
                              ? 'bg-indigo-600 text-white rounded-br-none' 
                              : 'bg-white border border-gray-150 text-gray-800 rounded-bl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl p-2 transition-all shadow-sm cursor-pointer flex-shrink-0"
                >
                  <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              </form>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
