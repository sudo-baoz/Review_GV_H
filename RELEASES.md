# 📦 Release Notes

## v1.1.0 — Phiên bản nâng cấp lớn
> Phát hành: 2026

### ✨ Tính năng mới

- **Lịch sử nhận xét** — Tự động lưu nhận xét thành công vào bộ nhớ cục bộ. Người dùng có thể chọn lại nhận xét đã dùng trước đó từ dropdown. Hỗ trợ tối đa 20 nhận xét, tự động loại bỏ trùng lặp.
- **Xuất kết quả ra CSV** — Sau khi AI điền form, nút "Xuất kết quả (.csv)" cho phép tải file CSV chứa: STT, ID câu hỏi, nội dung câu hỏi, điểm AI đã chấm, và mức độ tương ứng. File có hỗ trợ tiếng Việt (UTF-8 BOM).
- **Giao diện chia section** — Popup được tổ chức thành 3 phần có thể thu gọn: Cấu hình API, Lịch sử & Nhận xét, Thao tác.
- **Nút xóa nhận xét** — Thêm nút "Xóa" bên cạnh textarea để xóa nhanh nội dung.
- **Nút xóa lịch sử** — Xóa toàn bộ lịch sử nhận xét đã lưu.

### 🔄 Thay đổi

- Giao diện được thiết kế lại với collapsible sections rõ ràng
- Nút Xuất kết quả chỉ enabled sau khi điền form thành công
- Prompt LLM được rút gọn và chính xác hơn
- Storage key nhất quán: `apiKey` và `reviewHistory`

### 🔒 Bảo mật

- API Key và lịch sử nhận xét được lưu cục bộ trong trình duyệt
- Không gửi dữ liệu đi đâu ngoài Google Gemini API
- Không sử dụng CDN bên ngoài

### 🛠️ Kỹ thuật

- Manifest V3 — đạt chuẩn Chrome Extension mới nhất
- Không phụ thuộc npm/node — chỉ cần text editor
- CSV export sử dụng Blob + hidden `<a>` tag (không cần `downloads` permission)
- LLM retry với exponential backoff (3 lần)

---

## v1.0.0 — Phiên bản đầu tiên
> Phát hành: 2025

### ✨ Tính năng

- Điền form tự động bằng AI chỉ với một nhận xét
- Quản lý API Key với lưu trữ cục bộ
- Kiểm tra tính hợp lệ của API Key
- Trạng thái xử lý rõ ràng với spinner
- Tương thích Angular (click() + dispatchEvent)
- Retry khi Rate Limit (429)

---

## Kế hoạch phát triển (Roadmap)

- [ ] Chế độ tối (Dark Mode)
- [ ] Hỗ trợ nhiều loại form đánh giá khác nhau
- [ ] Tùy chỉnh prompt LLM
- [ ] Chế độ xem trước kết quả trước khi điền
