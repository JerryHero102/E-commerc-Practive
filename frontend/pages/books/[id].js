import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { triggerToast } from "../../components/Toast";
import { API_URL } from "../../config";

export default function BookDetail() {
  const [book, setBook] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Review states
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewerName, setReviewerName] = useState("");

  const router = useRouter();
  const { id } = router.query;

  // Load details
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [booksRes, catsRes, authorsRes, pubsRes, reviewsRes] =
          await Promise.all([
            fetch(`${API_URL}/sach`).then((r) => r.json()),
            fetch(`${API_URL}/danhmuc`).then((r) => r.json()),
            fetch(`${API_URL}/tacgia`).then((r) => r.json()),
            fetch(`${API_URL}/nhaxuatban`).then((r) => r.json()),
            fetch(`${API_URL}/danhgia`).then((r) => r.json()),
          ]);

        const currentBook = booksRes.find((b) => b.sachID === parseInt(id));
        setBook(currentBook);
        setAllBooks(booksRes);
        setCategories(catsRes);
        setAuthors(authorsRes);
        setPublishers(pubsRes);

        // Fetch users to map display names for reviews
        const usersRes = await fetch(`${API_URL}/nguoidung`).then((r) =>
          r.json(),
        );
        const filteredReviews = reviewsRes
          .filter((r) => (r.sachid || r.sachID) === parseInt(id))
          .map((r) => {
            const u = usersRes.find(
              (user) =>
                (user.nguoidungid || user.nguoiDungID) ===
                (r.nguoidungid || r.nguoiDungID),
            );
            let displayName = "Khách ẩn danh";
            let content = r.noidung || "";

            if (u) {
              displayName = u.hoTen || u.hoten || "Thành viên";
            } else if (content.startsWith("[Khách vãng lai:")) {
              const match = content.match(
                /^\[Khách vãng lai:\s*([^\]]+)\]\s*(.*)$/,
              );
              if (match) {
                displayName = match[1];
                content = match[2];
              } else {
                displayName = "Khách vãng lai";
              }
            }
            return {
              ...r,
              danhgiaid: r.danhgiaid || r.danhGiaID,
              sosao: r.sosao || r.soSao,
              hoTen: displayName,
              noidung: content,
            };
          });
        setReviews(filteredReviews);

        // Load session user
        const userStr = localStorage.getItem("LS_currentUser");
        if (userStr) setCurrentUser(JSON.parse(userStr));
      } catch (err) {
        console.error("Error fetching book details:", err);
      }
    };
    fetchData();
  }, [id]);

  const handleQuantityChange = (type) => {
    if (type === "plus") {
      if (quantity < book.soLuongTon) setQuantity((prev) => prev + 1);
    } else {
      if (quantity > 1) setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!book) return;

    const cartKey = currentUser
      ? `LS_cart_${currentUser.nguoiDungID}`
      : "LS_cart_guest";
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

    const existingIdx = cart.findIndex((item) => item.sachID === book.sachID);
    const currentQty = existingIdx !== -1 ? cart[existingIdx].quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > book.soLuongTon) {
      triggerToast(
        `Xin lỗi, chỉ còn ${book.soLuongTon} cuốn trong kho!`,
        "warning",
      );
      return;
    }

    if (existingIdx !== -1) {
      cart[existingIdx].quantity = newQty;
    } else {
      cart.push({
        sachID: book.sachID,
        tenSach: book.tenSach,
        giaBan: book.giaBan,
        hinhAnh: book.hinhAnh,
        quantity: quantity,
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    triggerToast("Đã thêm sách vào giỏ hàng!", "success");
  };

  const handleAddReview = async (e) => {
    e.preventDefault();

    if (!currentUser && !reviewerName.trim()) {
      triggerToast("Vui lòng nhập họ và tên của bạn!", "warning");
      return;
    }

    if (!reviewContent.trim()) {
      triggerToast("Vui lòng nhập nội dung đánh giá!", "warning");
      return;
    }

    let finalContent = reviewContent.trim();
    if (!currentUser) {
      finalContent = `[Khách vãng lai: ${reviewerName.trim()}] ${finalContent}`;
    }

    try {
      const payload = {
        nguoiDungID: currentUser ? currentUser.nguoiDungID : null,
        sachID: book.sachID,
        soSao: rating,
        noiDung: finalContent,
      };

      const res = await fetch(`${API_URL}/danhgia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        triggerToast("Đánh giá của bạn đã được gửi thành công!", "success");
        setReviewContent("");
        setReviewerName("");
        setShowReviewModal(false);

        // Reload reviews list
        const updatedReviews = await fetch(`${API_URL}/danhgia`).then((r) =>
          r.json(),
        );
        const usersRes = await fetch(`${API_URL}/nguoidung`).then((r) =>
          r.json(),
        );
        const mapped = updatedReviews
          .filter((r) => (r.sachid || r.sachID) === parseInt(id))
          .map((r) => {
            const u = usersRes.find(
              (user) =>
                (user.nguoidungid || user.nguoiDungID) ===
                (r.nguoidungid || r.nguoiDungID),
            );
            let displayName = "Khách ẩn danh";
            let content = r.noidung || "";

            if (u) {
              displayName = u.hoTen || u.hoten || "Thành viên";
            } else if (content.startsWith("[Khách vãng lai:")) {
              const match = content.match(
                /^\[Khách vãng lai:\s*([^\]]+)\]\s*(.*)$/,
              );
              if (match) {
                displayName = match[1];
                content = match[2];
              } else {
                displayName = "Khách vãng lai";
              }
            }
            return {
              ...r,
              danhgiaid: r.danhgiaid || r.danhGiaID,
              sosao: r.sosao || r.soSao,
              hoTen: displayName,
              noidung: content,
            };
          });
        setReviews(mapped);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gửi đánh giá thất bại!", "error");
    }
  };

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Đang tải chi tiết sách...</p>
      </div>
    );
  }

  const categoryName =
    categories.find((c) => c.danhmucID === book.danhmucID)?.tenDanhMuc ||
    "Đang tải...";
  const authorName =
    authors.find((a) => a.tacgiaID === book.tacgiaID)?.tenTacGia ||
    "Đang tải...";
  const publisherName =
    publishers.find((p) => p.nxbID === book.nxbID)?.tenNXB || "Đang tải...";
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.sosao, 0) / reviews.length).toFixed(
          1,
        )
      : 0;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-6 group"
      >
        <svg
          className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        Trở về danh sách sách
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left: Book Cover Image */}
          <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-[4/5] max-w-md mx-auto w-full shadow-inner border border-gray-100">
            <img
              src={book.hinhAnh}
              alt={book.tenSach}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Right: Book Meta details & Purchasing action */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-indigo-50 text-indigo-650 px-3 py-1 rounded-full text-xxs font-extrabold uppercase border border-indigo-100">
                  {categoryName}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xxs font-extrabold uppercase ${book.soLuongTon > 0 ? "bg-green-50 text-green-700 border border-green-150" : "bg-red-50 text-red-700 border border-red-150"}`}
                >
                  {book.soLuongTon > 0 ? `Còn hàng` : "Hết hàng"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-4 leading-tight">
                {book.tenSach}
              </h1>

              {/* Detailed specification table */}
              <div className="mt-6 border-y border-gray-100 py-4 grid grid-cols-2 gap-y-3 text-xs leading-relaxed">
                <div>
                  <p className="text-gray-400 font-medium">Tác giả:</p>
                  <p className="font-bold text-gray-800 mt-0.5">{authorName}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Nhà xuất bản:</p>
                  <p className="font-bold text-gray-800 mt-0.5">
                    {publisherName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Năm xuất bản:</p>
                  <p className="font-bold text-gray-800 mt-0.5">
                    {book.namXuatBan}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Mã sản phẩm:</p>
                  <p className="font-bold text-gray-800 mt-0.5 font-mono">
                    BOOK-000{book.sachID}
                  </p>
                </div>
              </div>

              {/* Price display */}
              <div className="mt-6">
                <span className="text-3xl font-black text-indigo-700">
                  {formatPrice(book.giaBan)}
                </span>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Giới thiệu tác phẩm
                </h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed whitespace-pre-line">
                  {book.moTa || "Đang cập nhật nội dung giới thiệu tác phẩm..."}
                </p>
              </div>
            </div>

            {/* Quantity Selector and Purchase button */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              {book.soLuongTon > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-gray-200 rounded-xl max-w-fit overflow-hidden bg-gray-50 h-11">
                    <button
                      onClick={() => handleQuantityChange("minus")}
                      className="px-4 py-2 hover:bg-gray-100 text-gray-600 font-bold focus:outline-none"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-black text-gray-800">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange("plus")}
                      className="px-4 py-2 hover:bg-gray-100 text-gray-600 font-bold focus:outline-none"
                    >
                      +
                    </button>
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-center text-sm h-11"
                  >
                    Thêm vào giỏ hàng
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 text-red-650 border border-red-100 text-xs font-bold p-3.5 rounded-xl text-center">
                  Sản phẩm tạm thời hết hàng. Vui lòng quay lại sau!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Books Section (Same Category) */}
      {(() => {
        const catId = book ? book.danhMucID || book.danhmucid : null;
        const categoryObj = categories.find(
          (c) => (c.danhMucID || c.danhmucid) === catId,
        );
        const categoryName = categoryObj
          ? categoryObj.tenDanhMuc || categoryObj.tendanhmuc
          : "cùng thể loại";

        let relatedBooks = allBooks.filter(
          (b) =>
            (b.danhMucID || b.danhmucid) === catId &&
            (b.sachID || b.sachid) !== parseInt(id),
        );

        if (relatedBooks.length < 4) {
          const extraBooks = allBooks.filter(
            (b) =>
              (b.sachID || b.sachid) !== parseInt(id) &&
              !relatedBooks.some(
                (rb) => (rb.sachID || rb.sachid) === (b.sachID || b.sachid),
              ),
          );
          relatedBooks = [...relatedBooks, ...extraBooks];
        }

        relatedBooks = relatedBooks.slice(0, 4);

        if (relatedBooks.length === 0) return null;

        return (
          <div className="mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <div>
                <h2 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  Gợi ý sách liên quan
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Các tác phẩm cùng danh mục{" "}
                  <span className="font-bold text-indigo-650">
                    {categoryName}
                  </span>{" "}
                  có thể bạn sẽ thích.
                </p>
              </div>
              <Link
                href="/"
                className="text-xs font-bold text-indigo-650 hover:text-indigo-850 hover:underline"
              >
                Xem tất cả &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedBooks.map((item) => {
                const itemId = item.sachID || item.sachid;
                const itemAuthor = authors.find(
                  (a) =>
                    (a.tacGiaID || a.tacgiaid) ===
                    (item.tacGiaID || item.tacgiaid),
                );

                return (
                  <Link
                    key={itemId}
                    href={`/books/${itemId}`}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md transition-all p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-50 border border-gray-100 relative mb-3">
                        {item.hinhAnh ? (
                          <img
                            src={item.hinhAnh}
                            alt={item.tenSach}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xs">
                            Bìa sách
                          </div>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {item.tenSach}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                        {itemAuthor
                          ? itemAuthor.tenTacGia || itemAuthor.tentacgia
                          : "Nhiều tác giả"}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-700">
                        {formatPrice(item.giaBan)}
                      </span>
                      <span className="text-xxs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        Xem
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Reviews Section */}
      <div className="mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 flex-wrap gap-4">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider flex items-center">
            Khách hàng đánh giá
            <span className="bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded text-xs ml-2 font-black">
              {reviews.length}
            </span>
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center space-x-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-2">
              <span className="text-sm font-black text-indigo-700">
                {avgRating} / 5.0
              </span>
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-current" : "text-gray-200"}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Existing reviews list */}
        <div className="mt-6 space-y-6">
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm italic">
              Chưa có đánh giá nào cho cuốn sách này. Hãy là người đầu tiên chia
              sẻ cảm nghĩ!
            </p>
          ) : (
            reviews.map((review) => (
              <div
                key={review.danhgiaid}
                className="border-b border-gray-50 pb-5 last:border-b-0 last:pb-0"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {(review.hoTen || "K").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-800">
                        {review.hoTen}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        {new Date(review.ngaydanhgia).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Stars */}
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < review.sosao ? "fill-current" : "text-gray-200"}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-650 leading-relaxed pl-10">
                  {review.noidung}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Write review trigger button */}
        <div className="mt-8 border-t border-gray-100 pt-6 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Chia sẻ cảm nhận của bạn
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Đánh giá của bạn sẽ giúp những độc giả khác chọn được sách phù
              hợp.
            </p>
          </div>
          <button
            onClick={() => {
              setRating(5);
              setReviewContent("");
              setReviewerName("");
              setShowReviewModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-xs select-none"
          >
            Viết đánh giá
          </button>
        </div>

        {/* Review Dialog Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl animate-scale-up space-y-4 text-left">
              {/* Title */}
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Viết nhận xét của bạn
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Cuốn sách:{" "}
                  <span className="font-bold text-gray-700">
                    {book.tenSach}
                  </span>
                </p>
              </div>

              <form onSubmit={handleAddReview} className="space-y-4">
                {/* Guest name input if not logged in */}
                {!currentUser && (
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase">
                      Họ và tên của bạn *
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Nhập họ tên đầy đủ..."
                      className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                )}

                {/* Rating selection */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase">
                    Đánh giá số sao *
                  </label>
                  <div className="flex space-x-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl focus:outline-none transition-colors ${star <= rating ? "text-amber-400" : "text-gray-200 hover:text-amber-300"}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-500 self-center ml-2">
                      {rating} / 5 sao
                    </span>
                  </div>
                </div>

                {/* Comment text area */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase">
                    Nội dung nhận xét *
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Hãy chia sẻ cảm nhận thực tế của bạn về cuốn sách này..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="mt-1 block w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                    required
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-2 px-4 rounded-xl border border-gray-250 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-xs text-center"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-bold transition-all text-xs text-center shadow-sm"
                  >
                    Gửi nhận xét
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
