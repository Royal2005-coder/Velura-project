# Feature: Khôi phục tích hợp Chatbot sau merge

## Requirements

- Khi trang có widget chatbot được mở, nút chat phải cố định ở góc phải dưới của viewport.
- Khi widget hoặc trang chatbot khởi tạo, hệ thống phải hiển thị ngay lời chào mặc định trước khi request lịch sử hoàn tất.
- Khi người dùng gửi tin nhắn, frontend phải giữ nguyên payload `{ sessionId?, guestId, mode, message }`.
- Khi database chat chưa được cấu hình, frontend phải hiển thị thông báo khả dụng thay vì chuỗi kỹ thuật `Chat database operation failed`.
- Dữ liệu chat phải tiếp tục đi qua API và service role; không mở quyền trực tiếp bảng chat cho trình duyệt.

## Architecture

### Frontend

- Khởi tạo `state.messages` bằng greeting cục bộ để UI không phụ thuộc vào request đầu tiên.
- Đồng bộ greeting cục bộ với greeting do backend lưu cho session mới.
- Giữ optimistic user message, typing state, session ID, guest ID và render escaping hiện có.
- Khóa vị trí widget bằng rule cuối cascade, hỗ trợ safe-area và mobile.
- Bảo toàn thay đổi bố cục hiện có trong `chatbot.html`.

### Backend

- Giữ endpoint `GET /api/v1/chat/sessions` và `POST /api/v1/chat/messages`.
- Repository chat yêu cầu rõ service-role key cho mọi thao tác database.
- Khi service role thiếu, trả code ổn định để frontend phân loại lỗi; không fallback sang anon.

### Security

- Không hardcode hoặc commit service-role key.
- Không cấp lại quyền `anon` cho `chat_session` và `chat_message`.
- Giữ validate UUID, giới hạn độ dài tin nhắn, rate limit và kiểm tra quyền sở hữu session.
- Giữ output encoding trong frontend bằng `escapeHtml`.

## Implementation Plan

- [x] Xác định selector CSS và luồng khởi tạo frontend.
- [x] Tái hiện lỗi database và xác định mã Supabase `42501`.
- [x] Sửa vị trí widget và greeting fallback.
- [x] Bắt buộc service role cho repository chat và chuẩn hóa lỗi client.
- [x] Thêm kiểm thử hồi quy, build và kiểm tra trực quan.
