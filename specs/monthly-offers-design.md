# Thiết kế triển khai hệ thống ưu đãi Velura

## Phạm vi

Triển khai bằng HTML, CSS và JavaScript module hiện hữu. Dữ liệu trung tâm được lấy từ các bảng `voucher`, `orders` và hồ sơ người dùng; không tạo thêm bảng wishlist. Các ưu đãi chưa có bảng riêng được biểu diễn dưới dạng trạng thái suy ra, để không làm thay đổi lược đồ hiện tại.

## Luồng chính

1. Trang ưu đãi và widget đọc danh sách sáu banner, sau đó xếp hạng một lần theo trạng thái phiên, ngày sinh, giỏ hàng và lịch sử tương tác.
2. Member truy cập `/src/pages/account/offers.html` để xem quyền lợi, trạng thái, điều kiện, hạn dùng và tiến trình.
3. API `/api/user/offers` yêu cầu phiên member, đọc voucher và đơn hàng của chính người dùng, rồi trả về dữ liệu đã chuẩn hóa.
4. Giỏ hàng tiếp tục là nơi tính giá cuối cùng và áp voucher. Frontend không được tự quyết định mức giảm cuối cùng.

## Bảo mật

- API kiểm tra JWT ở backend và chỉ truy vấn đơn hàng theo `context.profile.user_id`.
- Không trả về mật khẩu, token hoặc dữ liệu người dùng khác.
- Giá trị giảm giá hiển thị chỉ là thông tin tham khảo; backend hiện hữu vẫn kiểm tra lại khi áp voucher và tạo đơn.
- Dữ liệu ngày sinh không ghi thêm vào localStorage ngoài giá trị tạm thời do luồng A1 đang dùng.
