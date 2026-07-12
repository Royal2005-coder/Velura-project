# Đồng bộ ngày sinh giữa Profile và Banner A1

## Tiêu chí nghiệm thu

1. HTML không chứa ngày sinh mẫu. Tài khoản chưa có ngày sinh phải hiển thị ô trống.
2. Profile luôn lấy `date_of_birth` từ API và lưu thay đổi vào bảng `users` của đúng người đang đăng nhập.
3. Sau khi cập nhật, `velura_user`, `velura_profile`, giao diện Profile và Banner A1 cùng nhận một giá trị mới.
4. Guest được nhập ngày sinh để xem luồng nhưng chỉ lưu tạm trong `sessionStorage`; khi bấm nhận ưu đãi phải đăng nhập.
5. Member chưa có ngày sinh được nhập và lưu qua API. Member đã có ngày sinh phải xác nhận trước khi tiếp tục.

## Bảo mật và kiểm tra dữ liệu

- Backend lấy `user_id` từ phiên xác thực, không nhận `user_id` từ frontend.
- Ngày sinh phải đúng định dạng ISO `YYYY-MM-DD`, là ngày có thật và không nằm trong tương lai.
- Dữ liệu tạm của guest không được lưu lâu dài trong `localStorage`.
- Phản hồi API loại bỏ mật khẩu và mã OTP.
