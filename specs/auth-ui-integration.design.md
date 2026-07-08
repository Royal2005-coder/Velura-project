# Feature: Tích hợp UI xác thực Velura

## Requirements

- Khi người dùng mở trang đăng nhập, đăng ký hoặc quên mật khẩu, hệ thống phải hiển thị giao diện từ `login_project_v3_final` trên các URL xác thực hiện có.
- Khi người dùng gửi biểu mẫu, hệ thống phải tiếp tục dùng nguyên luồng `auth-client.js`, payload API, OTP, thông báo lỗi, khóa tài khoản và lưu phiên hiện có.
- Trang đăng nhập không hiển thị nút Test Phone/Test Email; người dùng tự tạo và đăng nhập bằng tài khoản thật.
- CSS của bộ giao diện mới phải nằm dưới `.velura-auth-page` để không ảnh hưởng các trang khác.

## Architecture

### Frontend

- Giữ nguyên toàn bộ ID, name và class trạng thái mà `auth-client.js` và `main.js` sử dụng.
- Dùng cấu trúc, màu sắc, hình ảnh và lớp trình bày của bộ `login_project_v3_final`.
- Giữ vùng lỗi trực tiếp, trạng thái loading, chỉ báo mật khẩu, khóa tài khoản và OTP.
- Giữ nhãn, autocomplete, inputmode và aria-live để hỗ trợ bàn phím, trình đọc màn hình và trình quản lý mật khẩu.

### Backend

- Không thay đổi endpoint, request schema hoặc response schema.
- Đăng nhập tiếp tục gửi `{ phone, password }` hoặc `{ email, password }`.
- Đăng ký tiếp tục gửi `{ full_name, phone, email?, password }`.
- Quên mật khẩu tiếp tục gửi `{ identity }` qua luồng OTP hiện có.

### Security

- Không đưa logic xác thực hoặc bí mật xuống HTML.
- Không dùng JavaScript demo trong `login_project_v3_final`.
- Tiếp tục dựa vào kiểm tra phía máy chủ; kiểm tra phía trình duyệt chỉ hỗ trợ trải nghiệm.
- Giữ thông báo lỗi an toàn qua `textContent`, không chèn phản hồi API bằng HTML.

## Implementation Plan

- [x] Lập bản đồ selector và payload của ba trang hiện có.
- [x] Ghép cấu trúc UI mới vào các URL xác thực chính.
- [x] Cô lập CSS bằng `.velura-auth-page`.
- [x] Kiểm tra selector bằng test tự động.
- [x] Build ứng dụng người dùng và kiểm tra trực quan trên desktop/mobile.
