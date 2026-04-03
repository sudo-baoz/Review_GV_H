# AI Evaluation Filler — Chrome Extension

> Hỗ trợ sinh viên HUTECH điền form đánh giá giảng viên tự động bằng AI.

## Tính năng

- Tự động điền tất cả câu hỏi trắc nghiệm đánh giá giảng viên chỉ với một nhận xét ngắn
- Giao diện đơn giản, dễ sử dụng
- API Key được lưu an toàn trong trình duyệt — không chia sẻ với bất kỳ ai
- Kiểm tra tính hợp lệ của API Key trước khi sử dụng
- Hoạt động tương thích với Angular form (tự động kích hoạt sự kiện two-way binding)

## Hướng dẫn cài đặt

### 1. Tải extension vào Chrome

1. Mở **Chrome**, gõ vào thanh địa chỉ:
   ```
   chrome://extensions/
   ```
2. Bật **Developer mode** (Chế độ nhà phát triển) ở góc phải trên
3. Bấm **Load unpacked** (Tải tiện ích đã giải nén)
4. Chọn thư mục chứa source code extension này
5. Bấm biểu tượng **ghim** (📌) ở thanh công cụ Chrome để ghim extension ra thanh toolbar

### 2. Lấy API Key Gemini

1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Đăng nhập tài khoản Google
3. Bấm **Create API Key** → **Create key in new project**
4. Copy API Key (bắt đầu bằng `AIzaSy...`)

### 3. Đăng ký API Key vào extension

1. Bấm biểu tượng extension trên thanh toolbar
2. Dán API Key vào ô **Gemini API Key**
3. Bấm **Lưu**
4. *(Tùy chọn)* Bấm **Kiểm tra key** để xác nhận key hoạt động

## Cách sử dụng

1. Mở trang **form đánh giá giảng viên** trên hệ thống HUTECH
2. Bấm biểu tượng **AI Evaluation Filler** trên thanh toolbar
3. Nhập **nhận xét** của bạn về giảng viên vào ô trống

   > Ví dụ: *"Giảng viên nhiệt tình, giảng bài dễ hiểu, cung cấp đầy đủ tài liệu tham khảo."*

4. Bấm **Điền form bằng AI**
5. Chờ vài giây — extension sẽ:
   - Tự động đọc tất cả câu hỏi trên form
   - Gửi nhận xét của bạn đến Gemini AI
   - Điền tất cả đáp án phù hợp

## Giải thích điểm số

AI sẽ đánh giá dựa trên nhận xét của bạn:

| Điểm | Nghĩa |
|------|-------|
| 5 | Rất hài lòng |
| 4 | Hài lòng *(mặc định nếu không nhắc đến)* |
| 3 | Phân vân |
| 2 | Không hài lòng |
| 1 | Rất không hài lòng |

## Cấu trúc file

```
Extension_dg/
├── manifest.json   — Cấu hình extension (Manifest V3)
├── popup.html      — Giao diện popup
├── popup.css       — Styling giao diện (CSS thuần, không CDN)
├── popup.js        — Logic chính: scrape → gọi LLM → điền form
├── content.js      — Hàm xử lý DOM (tương thích Angular)
├── README.md       — Tài liệu hướng dẫn
└── .gitignore      — Git ignore file
```

## Giấy phép

```
Mã nguồn mở — MIT License

Copyright (c) 2025 AI Evaluation Filler Contributors

Dự án này được phát hành miễn phí theo giấy phép MIT.
Bạn có thể sử dụng, chỉnh sửa, phân phối lại mã nguồn này
với điều kiện giữ nguyên thông báo bản quyền.

LƯU Ý QUAN TRỌNG:
- API Key của người dùng được lưu trữ cục bộ trong trình duyệt
  thông qua chrome.storage.local. Mã nguồn KHÔNG thu thập
  hay gửi API Key đi bất kỳ đâu ngoài Google Gemini API.
- Extension chỉ hoạt động trên trang form đánh giá giảng viên.
- Tác giả không chịu trách nhiệm về bất kỳ thiệt hại nào
  gây ra bởi việc sử dụng extension này.
```

---

Đóng góp code, báo lỗi, hoặc đề xuất tính năng mới luôn được chào đón!
