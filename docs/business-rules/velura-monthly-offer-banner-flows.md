# Velura — Đặc tả luồng sau click cho 6 banner Ưu đãi tháng này

Tài liệu này mô tả luồng nghiệp vụ, giao diện đích, form, dữ liệu cần ghi nhận và hành vi frontend/backend cho 6 banner ưu đãi tháng này của Velura.

Phạm vi tài liệu chỉ tập trung vào phần sau khi người dùng nhấn vào banner. 6 ảnh banner hiện đã có trong giao diện, không cần thiết kế lại banner.

## 1. Bối cảnh triển khai hiện tại

Website Velura hiện dùng cấu trúc frontend tĩnh theo module:

```text
apps/user-web/src/pages/offers.html
apps/user-web/src/scripts/modules/hot-banner-slider.js
apps/user-web/src/styles/components/_hot-banner-slider.css
apps/user-web/src/assets/images/banners/
```

Backend hiện dùng Node.js API:

```text
apps/api/src/server.js
apps/api/src/user/
apps/api/src/pricing/
apps/api/src/supabase.js
```

Dữ liệu ưu đãi nên ưu tiên lấy từ database qua các bảng và API đang có:

```text
promotion
voucher
orders
users
cart
```

Nếu cần bổ sung dữ liệu mới cho các luồng chưa có sẵn, nên tạo API riêng, không hardcode logic trong giao diện.

## 2. Nguyên tắc chung cho 6 banner

Các banner chỉ dùng cho nhóm ưu đãi tháng này. Mục tiêu chính là tạo điểm hút mắt, tăng tương tác và dẫn người dùng vào hành động phù hợp, không làm người dùng thấy bị ép nhập quá nhiều thông tin.

Nguyên tắc trải nghiệm:

1. Người dùng luôn được xem ưu đãi trước.
2. Không bắt đăng nhập ngay ở bước đầu, trừ khi người dùng thực sự muốn nhận ưu đãi cá nhân.
3. Với Guest, ưu tiên dùng modal để giải thích lợi ích và dẫn sang đăng nhập hoặc đăng ký.
4. Với Member, ưu tiên mở đúng trạng thái cá nhân của họ.
5. Mỗi luồng sau click không nên quá 2 bước chính.
6. Không chuyển sang trang ngoài làm mất ngữ cảnh mua sắm.
7. Các voucher, điều kiện áp dụng, thời gian hiệu lực phải lấy từ database hoặc API, không ghi cứng trong HTML nếu đã có dữ liệu trong hệ thống.

## 3. Cấu trúc kỹ thuật đề xuất

### 3.1. Frontend

Nên bổ sung một module riêng cho luồng ưu đãi:

```text
apps/user-web/src/scripts/modules/monthly-offers.js
```

Module này chịu trách nhiệm:

1. Lắng nghe click trên các banner trong `offers.html`.
2. Xác định banner được nhấn theo `data-offer-id`.
3. Kiểm tra trạng thái đăng nhập thông qua module auth hiện có.
4. Gọi API khi cần lấy profile, voucher, giỏ hàng hoặc trạng thái ưu đãi.
5. Mở modal hoặc điều hướng sang trang đích tương ứng.

Các modal nên render bằng JavaScript trong cùng module hoặc chia nhỏ nếu file quá dài:

```text
apps/user-web/src/scripts/modules/monthly-offers.js
apps/user-web/src/styles/components/_monthly-offers.css
```

Nếu muốn tách rõ hơn:

```text
apps/user-web/src/scripts/modules/monthly-offers/
  birthday-offer.js
  flash-sale-offer.js
  combo-offer.js
  loyalty-offer.js
  referral-offer.js
  freeship-offer.js
```

### 3.2. Backend API đề xuất

Các API nên đặt dưới nhóm user:

```text
GET  /api/user/offers
POST /api/user/offers/birthday
POST /api/user/offers/birthday/activate
GET  /api/user/offers/loyalty
GET  /api/user/offers/referral
POST /api/user/offers/referral/apply
GET  /api/user/vouchers
POST /api/user/vouchers/apply
```

API `GET /api/user/vouchers` và `POST /api/user/vouchers/apply` hiện đã có trong luồng user orders, nên nên tận dụng lại trước khi tạo mới.

### 3.3. Quy tắc ghi nhận tracking

Mỗi lần người dùng nhấn banner nên ghi nhận:

```json
{
  "event": "offer_banner_click",
  "offer_id": "A1_BIRTHDAY",
  "user_type": "guest/member",
  "user_id": "nếu có",
  "source_page": "home/offers/floating_widget/ticker",
  "created_at": "ISO time"
}
```

Nếu chưa có bảng tracking riêng, trước mắt có thể lưu nhẹ ở frontend bằng `localStorage` để tránh hiện lặp modal quá nhiều. Khi hoàn thiện backend, nên chuyển tracking về database để admin đo hiệu quả từng banner.

## 4. Danh sách 6 banner và route hành động

| Mã banner | Tên banner | Hành động chính sau click |
|---|---|---|
| A1 | Tháng sinh nhật của bạn | Mở modal thu thập hoặc kích hoạt ưu đãi sinh nhật |
| A2 | Chỉ còn 2 ngày | Chuyển đến danh sách sản phẩm đang sale |
| A3 | Combo Phối Đồ Tiết Kiệm | Chuyển đến khu combo/set đồ ưu đãi |
| A4 | Khách hàng thân thiết | Guest mở modal giới thiệu, Member xem tiến trình |
| A5 | Một mình vui không bằng cả hai | Mở luồng giới thiệu bạn bè |
| A6 | FreeShip cho đơn từ 500k | Mở modal chính sách freeship hoặc chuyển đến chính sách vận chuyển |

## 5. Banner A1 — Tháng sinh nhật của bạn

### 5.1. Mục đích nghiệp vụ

Banner này dùng để thu thập ngày sinh một cách tự nhiên. Khi đăng ký tài khoản, Velura không nên bắt người dùng nhập quá nhiều thông tin vì sẽ làm giảm trải nghiệm. Ngày sinh được hỏi sau, dưới dạng một ưu đãi có giá trị, giúp người dùng cảm thấy họ đang nhận được quyền lợi thay vì đang bị yêu cầu bổ sung dữ liệu.

Với người đã có ngày sinh, banner này không hỏi lại mà chuyển sang trạng thái kích hoạt hoặc nhắc trước ưu đãi sinh nhật.

### 5.2. Dữ liệu cần dùng

Từ tài khoản người dùng:

```text
users.user_id
users.full_name
users.email
users.date_of_birth
```

Từ voucher:

```text
voucher.code
voucher.name
voucher.discount_type
voucher.discount_value
voucher.start_date
voucher.end_date
voucher.is_active
voucher.applicable_user_group
voucher.usage_limit_per_user
```

Voucher đề xuất:

```text
Code: BDAY15
Loại: percentage
Giá trị: 15%
Điều kiện: chỉ member, dùng trong tháng sinh nhật
```

### 5.3. Luồng phân nhánh

```text
Người dùng click banner A1
        |
        v
Kiểm tra session hiện tại
        |
        +-- Guest
        |     |
        |     v
        |  Mở modal giới thiệu quà sinh nhật
        |  Cho chọn đăng nhập hoặc đăng ký
        |
        +-- Member
              |
              v
        Kiểm tra date_of_birth
              |
              +-- Chưa có ngày sinh
              |     |
              |     v
              |  Mở modal nhập ngày sinh
              |
              +-- Đã có ngày sinh
                    |
                    v
              Kiểm tra tháng hiện tại
                    |
                    +-- Đúng tháng sinh nhật
                    |     |
                    |     v
                    |  Mở modal kích hoạt voucher
                    |
                    +-- Chưa đến tháng sinh nhật
                          |
                          v
                       Mở modal ghi nhớ và đếm ngược
```

### 5.4. Modal dành cho Guest

Mục tiêu của modal là cho người dùng hiểu lợi ích trước, sau đó mới mời đăng nhập hoặc đăng ký.

Bố cục:

```text
[Ảnh sinh nhật hoặc hoa tone hồng kem]

Tháng sinh nhật của bạn,
Velura có một món quà nhỏ

Nhận ưu đãi sinh nhật riêng trong tháng của bạn:
15% cho đơn hàng trong tháng sinh nhật
Một món quà nhỏ kèm theo đơn đầu tiên trong tháng

[Đăng nhập để nhận quà]
[Tạo tài khoản mới]

Ghi chú nhỏ:
Velura chỉ dùng ngày sinh để gửi ưu đãi sinh nhật, không gửi spam.
```

Hành vi:

1. Nhấn Đăng nhập để nhận quà chuyển đến trang đăng nhập, kèm query:

```text
/src/pages/auth/signin.html?redirect=/src/pages/offers.html&offer=A1_BIRTHDAY
```

2. Nhấn Tạo tài khoản mới chuyển đến trang đăng ký, kèm query tương tự.
3. Sau khi đăng nhập hoặc đăng ký thành công, quay lại `offers.html` và mở lại đúng modal A1 theo trạng thái Member.

### 5.5. Modal dành cho Member chưa có ngày sinh

Bố cục:

```text
Velura chưa biết sinh nhật của bạn

Bổ sung ngày sinh để nhận ưu đãi sinh nhật riêng.
Bạn chỉ cần nhập ngày và tháng. Năm sinh có thể để trống nếu không muốn chia sẻ.

[Ngày] [Tháng] [Năm sinh không bắt buộc]

[Lưu và nhận ưu đãi]
[Để sau]
```

Khuyến nghị nghiệp vụ:

Mặc dù ý tưởng ban đầu chỉ hỏi ngày và tháng, database hiện có `date_of_birth` dạng ngày đầy đủ. Có 2 cách xử lý:

1. Cách ít sửa database: lưu năm mặc định `1900`, ví dụ `1900-08-15`, và ở UI chỉ hiển thị ngày/tháng.
2. Cách chuẩn hơn: bổ sung trường riêng như `birthday_day`, `birthday_month`. Cách này sạch hơn nhưng cần migration.

Với code hiện tại, nên chọn cách 1 để triển khai nhanh, sau này có thể tách trường.

Validation:

| Field | Bắt buộc | Quy tắc |
|---|---:|---|
| Ngày | Có | 1 đến 31 |
| Tháng | Có | 1 đến 12 |
| Năm | Không | Nếu có thì phải là năm hợp lệ |

Sau khi submit:

```text
POST /api/user/profile
body:
{
  "date_of_birth": "1900-MM-DD"
}
```

Sau khi lưu thành công:

1. Nếu tháng hiện tại là tháng sinh nhật, mở modal kích hoạt voucher.
2. Nếu chưa đến tháng sinh nhật, mở modal ghi nhớ.

### 5.6. Modal Member đúng tháng sinh nhật

Bố cục:

```text
Chúc mừng sinh nhật, [Tên]

Velura gửi bạn ưu đãi trong tháng này:

Mã BDAY15
Giảm 15% cho đơn hàng trong tháng sinh nhật
Hiệu lực đến hết ngày [cuối tháng]

[Sao chép mã]
[Mua sắm ngay]
[Lưu lại xem sau]
```

Hành vi:

1. Sao chép mã lưu `BDAY15` vào clipboard và hiện toast `Đã sao chép mã`.
2. Mua sắm ngay:

```text
localStorage.setItem("checkout_voucher_code", "BDAY15")
redirect /src/pages/products/list.html
```

3. Nếu người dùng vào giỏ hàng, voucher sẽ được áp qua API:

```text
POST /api/user/vouchers/apply
body:
{
  "code": "BDAY15",
  "order_value": subtotal
}
```

### 5.7. Modal Member chưa đến tháng sinh nhật

Bố cục:

```text
Velura đã ghi nhớ rồi

Sinh nhật tháng [X] của bạn còn [N] tháng nữa.
Đến tháng sinh nhật, bạn sẽ nhận:

Voucher sinh nhật riêng
Quà nhỏ trong đơn hàng
Email nhắc ưu đãi trước sinh nhật

[Xem ưu đãi tháng này]
[Về trang chủ]
```

Hành vi:

1. Xem ưu đãi tháng này đóng modal và cuộn về danh sách banner ưu đãi.
2. Về trang chủ chuyển đến `/index.html`.

### 5.8. Checklist A1

```text
[ ] Guest click A1 mở modal giới thiệu
[ ] Guest bấm đăng nhập quay lại đúng offer A1
[ ] Member chưa có ngày sinh nhập được ngày/tháng
[ ] Member có ngày sinh đúng tháng thấy mã BDAY15
[ ] Member chưa đến tháng sinh nhật thấy trạng thái ghi nhớ
[ ] Không hỏi lại ngày sinh nếu đã có dữ liệu
[ ] Không hardcode ưu đãi nếu voucher BDAY15 đã có trong database
```

## 6. Banner A2 — Chỉ còn 2 ngày

### 6.1. Mục đích nghiệp vụ

Banner này tạo cảm giác cấp bách nhẹ. Không cần modal vì người dùng đã hiểu thông điệp chính là ưu đãi sắp kết thúc. Hành động tốt nhất là đưa thẳng đến danh sách sản phẩm đang giảm giá.

### 6.2. Trang đích

```text
/src/pages/products/list.html?sale=true&campaign=monthly-last-days
```

### 6.3. Giao diện cần hiển thị ở trang sản phẩm

Khi có query `sale=true`, trang sản phẩm cần có thanh thông báo trên grid:

```text
Chỉ còn 2 ngày
Các thiết kế trong ưu đãi tháng này đang được áp dụng giá tốt.

[Tất cả] [Áo] [Đầm & Váy] [Set đồ] [Phụ kiện]
```

Card sản phẩm:

1. Hiển thị giá sale nếu có `sale_price`.
2. Giá gốc gạch ngang nếu `base_price > sale_price`.
3. Badge nhỏ: `Ưu đãi tháng này`.
4. Không dùng countdown trên từng sản phẩm để tránh rối.

### 6.4. Dữ liệu cần dùng

API có thể tận dụng danh sách sản phẩm hiện tại, lọc theo:

```text
status = on_sale
sale_price is not null
sale_price < base_price
```

Nếu có bảng `promotion_product`, nên lọc đúng sản phẩm thuộc campaign tháng này.

### 6.5. Checklist A2

```text
[ ] Click A2 chuyển đến trang sản phẩm
[ ] Query sale=true được đọc đúng
[ ] Chỉ hiển thị hoặc ưu tiên sản phẩm có giảm giá
[ ] Badge ưu đãi hiện đúng
[ ] Không mở modal không cần thiết
```

## 7. Banner A3 — Combo Phối Đồ Tiết Kiệm

### 7.1. Mục đích nghiệp vụ

Banner này hướng người dùng đến việc mua theo set. Mục tiêu là tăng giá trị đơn hàng và giảm thời gian chọn đồ. Nội dung nên nhấn vào cảm giác đã có stylist chọn sẵn, người dùng chỉ cần chọn set phù hợp.

### 7.2. Trang đích

Ưu tiên dùng trang bộ sưu tập hiện có:

```text
/src/pages/collections.html?type=combo&offer=monthly-combo
```

Nếu sau này tách trang riêng:

```text
/src/pages/offers.html?section=combo
```

### 7.3. Giao diện đích

Bố cục:

```text
Combo phối đồ tiết kiệm

Những set đồ đã được Velura chọn sẵn để bạn dễ mua trọn bộ.
Mua theo set giúp tổng thể đồng bộ hơn và tiết kiệm hơn so với chọn từng món.

[Set công sở] [Set cuối tuần] [Set dự tiệc] [Set tối giản]

Danh sách combo
```

Mỗi combo card:

```text
[Ảnh set đồ hoặc flatlay]
Tên set
Mô tả ngắn

Gồm:
Áo ...
Quần ...
Phụ kiện ...

Tổng giá lẻ
Giá combo
Tiết kiệm bao nhiêu

[Thêm cả set vào giỏ]
[Xem chi tiết từng sản phẩm]
```

### 7.4. Hành vi thêm cả set vào giỏ

Khi nhấn `Thêm cả set vào giỏ`:

1. Lấy danh sách sản phẩm và biến thể trong combo.
2. Kiểm tra tồn kho từng biến thể.
3. Thêm tất cả item vào cart.
4. Nếu có voucher combo, lưu mã voucher vào `localStorage`.
5. Hiện toast:

```text
Đã thêm set [Tên set] vào giỏ hàng.
```

Nếu một món hết hàng:

```text
Set này đang thiếu [Tên sản phẩm]. Bạn có thể xem từng sản phẩm để chọn món thay thế.
```

### 7.5. Dữ liệu cần dùng

Nên dùng các sản phẩm combo hiện có trong bảng `product` nếu có cờ `is_combo`.

Các trường cần:

```text
product.product_id
product.name
product.base_price
product.sale_price
product.image_url
product.is_combo
combo_item.combo_product_id
combo_item.component_product_id
combo_item.component_variant_id
combo_item.quantity
variant.stock_quantity
variant.reserved_quantity
```

### 7.6. Checklist A3

```text
[ ] Click A3 đến đúng khu combo
[ ] Combo hiển thị từ database, không hardcode card cứng
[ ] Có bao nhiêu sản phẩm trong set thì hiển thị bấy nhiêu
[ ] Thêm cả set vào giỏ kiểm tra tồn kho
[ ] Nếu thiếu hàng có thông báo rõ
```

## 8. Banner A4 — Khách hàng thân thiết

### 8.1. Mục đích nghiệp vụ

Banner này giải thích lợi ích thành viên theo cách dễ hiểu. Không nên dùng quá nhiều thuật ngữ như hạng, tier hoặc VIP nếu hệ thống chưa triển khai đầy đủ. Trọng tâm là người dùng mua sắm càng nhiều thì quyền lợi càng rõ.

### 8.2. Luồng phân nhánh

```text
Click A4
  |
  +-- Guest
  |     |
  |     v
  |  Mở modal giới thiệu quyền lợi thành viên
  |
  +-- Member
        |
        v
     Mở khu tài khoản hoặc modal tiến trình quyền lợi
```

### 8.3. Modal dành cho Guest

Bố cục:

```text
Khách hàng thân thiết

Tạo tài khoản để Velura ghi nhớ hành trình mua sắm của bạn.

Quyền lợi:
Miễn phí vận chuyển cho đơn từ 500.000đ
Lưu Style Profile và gợi ý AI cá nhân hóa
Theo dõi đơn hàng và lịch sử mua sắm
Nhận ưu đãi sinh nhật và ưu đãi tháng này

[Tạo tài khoản]
[Đăng nhập]
[Tiếp tục mua sắm]
```

Hành vi:

1. Tạo tài khoản chuyển đến `signup.html`.
2. Đăng nhập chuyển đến `signin.html`.
3. Tiếp tục mua sắm đóng modal.

### 8.4. Giao diện dành cho Member

Nếu chưa có trang loyalty riêng, trước mắt có thể mở modal hoặc tab trong Profile.

Route đề xuất:

```text
/src/pages/account/profile.html?tab=loyalty
```

Nội dung:

```text
Xin chào, [Tên]

Tổng chi tiêu đã ghi nhận: [Số tiền]
Đơn hàng đã hoàn tất: [Số đơn]

Quyền lợi hiện có:
Miễn phí vận chuyển cho đơn từ 500.000đ
Nhận gợi ý AI theo Style Profile
Nhận ưu đãi tháng sinh nhật nếu đã bổ sung ngày sinh

Gợi ý tiếp theo:
Còn [X] để mở ưu đãi tiếp theo trong tháng này.

[Mua sắm ngay]
[Xem voucher của tôi]
```

### 8.5. Dữ liệu cần dùng

```text
users.user_id
users.full_name
orders.total_amount
orders.status = completed hoặc delivered
voucher đang active
```

### 8.6. Checklist A4

```text
[ ] Guest click A4 thấy modal giới thiệu
[ ] Member click A4 không bị bắt đăng nhập lại
[ ] Member thấy đúng dữ liệu cá nhân
[ ] Tổng chi tiêu chỉ tính đơn hợp lệ
[ ] CTA dẫn đúng sản phẩm hoặc voucher
```

## 9. Banner A5 — Một mình vui không bằng cả hai

### 9.1. Mục đích nghiệp vụ

Banner này dùng cho luồng giới thiệu bạn bè. Ý tưởng chính là người dùng chia sẻ ưu đãi cho bạn, cả hai cùng nhận quyền lợi. Đây là luồng giúp tăng lan truyền tự nhiên, nhưng không nên yêu cầu đăng nhập ngay trước khi giải thích lợi ích.

### 9.2. Luồng phân nhánh

```text
Click A5
  |
  +-- Guest
  |     |
  |     v
  |  Mở modal xem trước chương trình giới thiệu bạn bè
  |
  +-- Member
        |
        v
     Mở modal link giới thiệu cá nhân
```

### 9.3. Modal Guest

Bố cục:

```text
Rủ bạn bè, cả hai cùng có quà

Khi bạn chia sẻ Velura cho bạn bè:
Bạn của bạn nhận ưu đãi cho đơn đầu tiên.
Bạn nhận voucher cảm ơn sau khi đơn đầu tiên của bạn bè hoàn tất.

[Đăng nhập để lấy link của tôi]
[Tạo tài khoản]
[Nhập mã bạn bè]
```

Nếu Guest nhấn `Nhập mã bạn bè`:

```text
Field: Mã giới thiệu
Button: Áp dụng
```

Sau khi áp dụng:

1. Lưu referral code vào `localStorage`.
2. Nếu có checkout, gửi kèm code khi tạo đơn.
3. Nếu đăng ký, gắn referral code vào tài khoản mới.

### 9.4. Modal Member

Bố cục:

```text
Link giới thiệu của bạn

[velura.vn/ref/ma-gioi-thieu]
[Sao chép]

Chia sẻ nhanh:
[Facebook] [Zalo] [Copy link]

Thống kê:
Số bạn đã đăng ký: [N]
Voucher đã nhận: [Số tiền]
Voucher đang chờ: [Số tiền]

[Dùng voucher ngay]
```

### 9.5. Dữ liệu cần dùng

Nếu hệ thống chưa có bảng referral, cần bổ sung sau. Cấu trúc đề xuất:

```text
referral_code
- code
- owner_user_id
- created_at
- is_active

referral_event
- referral_event_id
- code
- referred_user_id
- first_order_id
- status
- created_at
```

Nếu chưa muốn thêm bảng ngay, có thể triển khai bản tối giản:

1. Sinh code từ `user_id`.
2. Lưu tạm trong `users.metadata` nếu có.
3. Chỉ hiển thị copy link, chưa tính thưởng tự động.

### 9.6. Checklist A5

```text
[ ] Guest xem được lợi ích trước khi đăng nhập
[ ] Member có link cá nhân
[ ] Copy link hoạt động
[ ] Mã giới thiệu được lưu khi Guest nhập
[ ] Không tạo voucher thưởng khi chưa có đơn đầu tiên hoàn tất
```

## 10. Banner A6 — FreeShip cho đơn từ 500k

### 10.1. Mục đích nghiệp vụ

Banner này giảm lo lắng về phí vận chuyển. Nội dung phải thống nhất với chính sách đã nạp database: đơn từ 500.000đ được miễn phí vận chuyển, đơn dưới 500.000đ áp dụng phí tiêu chuẩn 30.000đ.

### 10.2. Hành vi sau click

Ưu tiên mở modal thông tin ngắn ngay tại trang hiện tại. Không cần form.

Modal có thêm link xem chi tiết chính sách:

```text
/src/pages/policies.html?tab=shipping
```

### 10.3. Modal thông tin

Bố cục:

```text
Miễn phí vận chuyển từ 500.000đ

Đơn từ 500.000đ:
Miễn phí vận chuyển toàn quốc.

Đơn dưới 500.000đ:
Phí vận chuyển tiêu chuẩn 30.000đ.

Thời gian dự kiến:
TP.HCM và Hà Nội: 1 đến 3 ngày làm việc.
Tỉnh thành khác: 3 đến 5 ngày làm việc.

Velura giao tối đa 3 lần. Nếu giao không thành công, đơn có thể chuyển sang trạng thái hủy theo chính sách vận chuyển.

[Mua sắm ngay]
[Xem chính sách vận chuyển]
```

### 10.4. Hành vi CTA

1. Mua sắm ngay:

```text
redirect /src/pages/products/list.html
```

2. Xem chính sách vận chuyển:

```text
redirect /src/pages/policies.html?tab=shipping
```

### 10.5. Dữ liệu cần dùng

Nội dung chính sách vận chuyển phải lấy từ database qua module `policy-tabs.js` hoặc API content/policy hiện có. Không viết lại nội dung cứng nếu trang chính sách đã đọc từ database.

Nếu modal cần hiển thị nhanh, frontend có thể gọi:

```text
GET /api/content/policies?slug=shipping
```

hoặc endpoint đang dùng trong trang `policies.html`.

### 10.6. Checklist A6

```text
[ ] Click A6 mở modal, không cần đăng nhập
[ ] Nội dung đúng: freeship từ 500.000đ, phí tiêu chuẩn 30.000đ
[ ] Link chính sách vận chuyển mở đúng tab shipping
[ ] Không có form không cần thiết
```

## 11. Quy tắc kết nối với trang offers.html hiện tại

Trong `hot-banner-slider.js`, mỗi banner hiện có `ctaLink`. Cần đổi cách xử lý như sau:

1. Với banner chỉ redirect, giữ `href`.
2. Với banner cần modal, chặn hành vi mặc định và gọi handler.

Ví dụ định hướng:

```js
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-banner-id]");
  if (!link) return;

  const bannerId = link.dataset.bannerId;
  if (["A1", "A4", "A5", "A6"].includes(bannerId)) {
    event.preventDefault();
    openMonthlyOfferFlow(bannerId);
  }
});
```

Các banner nên có mapping:

```js
const OFFER_ACTIONS = {
  A1: "modal:birthday",
  A2: "redirect:sale-products",
  A3: "redirect:combo-collections",
  A4: "modal-or-profile:loyalty",
  A5: "modal:referral",
  A6: "modal:freeship"
};
```

## 12. Quy tắc hiển thị modal

Modal chung nên có:

1. Overlay mờ.
2. Bo góc theo design system Velura.
3. Nút đóng rõ ràng.
4. Không đóng khi đang submit form.
5. Có trạng thái loading khi gọi API.
6. Có trạng thái lỗi inline, không dùng alert trình duyệt.
7. Có toast sau khi copy mã hoặc thêm voucher.

Class gợi ý:

```text
.monthly-offer-modal
.monthly-offer-modal__overlay
.monthly-offer-modal__panel
.monthly-offer-modal__media
.monthly-offer-modal__title
.monthly-offer-modal__desc
.monthly-offer-modal__actions
.monthly-offer-modal__error
.monthly-offer-modal__success
```

## 13. Kiểm thử tổng thể

```text
Luồng chung
[ ] Click từ trang chủ ticker đi đúng offers.html
[ ] Floating widget mở đúng offers.html
[ ] Click từng banner trên offers.html gọi đúng flow
[ ] Không banner nào làm mất session đăng nhập
[ ] Không banner nào dùng chính sách sai với database

A1 Birthday
[ ] Guest thấy modal giới thiệu
[ ] Member chưa có ngày sinh lưu được ngày sinh
[ ] Member đúng tháng sinh nhật thấy voucher
[ ] Member chưa đúng tháng thấy modal ghi nhớ

A2 Flash Sale
[ ] Redirect đúng trang sản phẩm sale
[ ] Sản phẩm sale hiển thị đúng

A3 Combo
[ ] Redirect đúng khu combo
[ ] Combo lấy từ database
[ ] Thêm cả set vào giỏ đúng

A4 Loyalty
[ ] Guest thấy quyền lợi thành viên
[ ] Member thấy dữ liệu cá nhân hoặc tab loyalty

A5 Referral
[ ] Guest xem trước chương trình
[ ] Member copy được link cá nhân

A6 Freeship
[ ] Nội dung đúng chính sách vận chuyển
[ ] Link chính sách mở đúng tab shipping
```

## 14. Ghi chú triển khai theo giai đoạn

### Giai đoạn 1

Làm frontend flow trước:

1. Bắt click banner.
2. Mở modal đúng theo Guest hoặc Member.
3. Redirect đúng trang sản phẩm, collection, chính sách.
4. Dùng API voucher hiện có để áp mã.

### Giai đoạn 2

Bổ sung API nếu thiếu:

1. API lưu ngày sinh từ modal A1.
2. API lấy trạng thái loyalty.
3. API sinh referral code.
4. API tracking click banner.

### Giai đoạn 3

Kết nối admin:

1. Admin tạo campaign ưu đãi tháng này.
2. Admin gắn voucher vào từng banner.
3. Admin xem số click, số người nhận voucher, số đơn phát sinh từ từng banner.

