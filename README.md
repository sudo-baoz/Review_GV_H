# AI Evaluation Filler — Chrome Extension

> Hỗ trợ sinh viên HUTECH điền form đánh giá giảng viên tự động bằng AI.

## Tính năng

- **Tự động điền form** — Chỉ cần một nhận xét ngắn, AI tự động điền tất cả câu trắc nghiệm
- **Lịch sử nhận xét** — Lưu và chọn lại nhận xét đã dùng trước đó (tối đa 20, tự loại trùng lặp)
- **Xuất kết quả CSV** — Tải file CSV chứa đầy đủ: STT, câu hỏi, điểm AI, mức độ
- **Quản lý API Key** — Lưu an toàn trong trình duyệt, kiểm tra key trước khi dùng
- **Tương thích Angular** — Kích hoạt đúng sự kiện two-way binding
- **Retry tự động** — Thử lại khi gặp lỗi rate limit (429)

## Cài đặt

1. Mở `chrome://extensions/`
2. Bật **Developer mode**
3. Bấm **Load unpacked** → chọn thư mục extension
4. Bấm **📌** ở thanh công cụ Chrome để ghim extension

## Hướng dẫn sử dụng

### 1. Cấu hình API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey) → **Create API Key**
2. Dán key vào ô **Gemini API Key** → bấm **Lưu**
3. *(Tùy chọn)* Bấm **Kiểm tra key** để xác nhận

### 2. Điền form

1. Mở trang form đánh giá giảng viên
2. Nhập nhận xét của bạn (hoặc chọn từ **Lịch sử nhận xét**)
3. Bấm **Điền form bằng AI**
4. Chờ vài giây — tất cả đáp án sẽ được điền tự động

### 3. Xuất kết quả

1. Sau khi điền thành công, bấm **Xuất kết quả (.csv)**
2. File sẽ được tải về với tên `ket_qua_danh_gia_YYYY-MM-DD.csv`
3. File hỗ trợ tiếng Việt, mở được trong Excel/Google Sheets

## Thang điểm

| Điểm | Mức độ |
|------|--------|
| 5 | Rất hài lòng |
| 4 | Hài lòng *(mặc định nếu không nhắc đến)* |
| 3 | Phân vân |
| 2 | Không hài lòng |
| 1 | Rất không hài lòng |

## Cấu trúc file

```
Extension_dg/
├── manifest.json   — Cấu hình extension (Manifest V3)
├── popup.html     — Giao diện popup
├── popup.css      — Styling (CSS thuần, không CDN)
├── popup.js       — Logic: scrape → LLM → điền → export
├── content.js     — Tài liệu tham khảo DOM/Angular
├── README.md      — Tài liệu hướng dẫn
├── RELEASES.md    — Lịch sử phát hành
└── .gitignore     — Git ignore
```

## Bảo mật

- API Key và lịch sử nhận xét **chỉ** được lưu trong trình duyệt của bạn
- Dữ liệu **không** được gửi đi đâu ngoài Google Gemini API
- Mã nguồn **không** sử dụng CDN bên ngoài

## Giấy phép

```
MIT License — Mã nguồn mở

Copyright (c) 2025 AI Evaluation Filler Contributors
```

Đóng góp code, báo lỗi, hoặc đề xuất tính năng mới luôn được chào đón!
