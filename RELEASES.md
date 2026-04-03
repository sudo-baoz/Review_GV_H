# 📦 Release Notes

## v1.0.0 — Phiên bản đầu tiên
> Phát hành: 2025

### ✨ Tính năng mới

- **Điền form tự động bằng AI** — Chỉ cần nhập một nhận xét ngắn, AI sẽ tự động điền tất cả câu hỏi trắc nghiệm đánh giá giảng viên
- **Giao diện người dùng hiện đại** — Thiết kế popup trực quan, dễ sử dụng với CSS thuần (không phụ thuộc CDN bên ngoài)
- **Quản lý API Key** — Lưu và tải Gemini API Key từ bộ nhớ cục bộ của trình duyệt (`chrome.storage.local`)
- **Kiểm tra API Key** — Nút "Kiểm tra key" giúp xác nhận API Key hoạt động trước khi sử dụng
- **Trạng thái xử lý rõ ràng** — Thanh tiến trình, spinner, thông báo thành công/lỗi trực tiếp trên popup
- **Tương thích Angular** — Sử dụng `click()` + `dispatchEvent()` để kích hoạt Angular two-way binding thay vì chỉ gán `checked = true`
- **Retry khi Rate Limit** — Tự động thử lại tối đa 3 lần với exponential backoff khi gặp lỗi 429

### 🔒 Bảo mật

- API Key được lưu cục bộ trong trình duyệt — không gửi đi đâu ngoài Google Gemini API
- Không thu thập hay chia sẻ dữ liệu người dùng
- Không sử dụng CDN bên ngoài — loại bỏ rủi ro từ third-party scripts

### 🛠️ Kỹ thuật

- **Manifest V3** — Đạt chuẩn Chrome Extension mới nhất
- **Không phụ thuộc npm/node** — Chỉ cần text editor để chỉnh sửa
- **Mã nguồn mở MIT** — Tự do sử dụng, chỉnh sửa, phân phối lại

### 🐛 Đã sửa

- Lỗi `chrome.storage is undefined` khi reload extension
- Lỗi `Cannot read properties of undefined` do thao tác DOM không an toàn
- Lỗi rate limit 429 với model Gemini cũ
- Lỗi mất visual feedback khi lưu API Key

---

## Kế hoạch phát triển (Roadmap)

- [ ] Hỗ trợ nhiều loại form đánh giá khác nhau
- [ ] Chế độ tối (Dark Mode)
- [ ] Lưu nhận xét đã sử dụng để tái sử dụng nhanh
- [ ] Xuất kết quả điền ra file để đối chiếu
