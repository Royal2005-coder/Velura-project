# Velura — Cơ sở dữ liệu PostgreSQL

> **Cơ sở dữ liệu:** PostgreSQL (Supabase)
> **Phiên bản schema:** 2026-06-18
> **Tổng số bảng:** ~35 bảng
> **Tổng số ENUM type:** 23
> **Tổng số hàm RPC:** ~40+
> **Tổng số RLS policy:** ~30+

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Nhóm 1: Người dùng & Xác thực (Users & Auth)](#2-nhóm-1-người-dùng--xác-thực-users--auth)
3. [Nhóm 2: Danh mục & Sản phẩm (Category & Product)](#3-nhóm-2-danh-mục--sản-phẩm-category--product)
4. [Nhóm 3: Khuyến mãi & Voucher (Promotions & Vouchers)](#4-nhóm-3-khuyến-mãi--voucher-promotions--vouchers)
5. [Nhóm 4: Đơn hàng & Thanh toán (Orders & Payment)](#5-nhóm-4-đơn-hàng--thanh-toán-orders--payment)
6. [Nhóm 5: Giỏ hàng (Cart)](#6-nhóm-5-giỏ-hàng-cart)
7. [Nhóm 6: Đánh giá sản phẩm (Reviews)](#7-nhóm-6-đánh-giá-sản-phẩm-reviews)
8. [Nhóm 7: Đổi trả & Hỗ trợ CSKH (Returns & Support)](#8-nhóm-7-đổi-trả--hỗ-trợ-cskh-returns--support)
9. [Nhóm 8: AI & Trí tuệ nhân tạo (AI & Intelligence)](#9-nhóm-8-ai--trí-tuệ-nhân-tạo-ai--intelligence)
10. [Nhóm 9: Kiểm toán & Phê duyệt (Audit & Approval)](#10-nhóm-9-kiểm-toán--phê-duyệt-audit--approval)
11. [Nhóm 10: Thông báo (Notifications)](#11-nhóm-10-thông-báo-notifications)
12. [Nhóm 11: Kiến thức & Vector Embeddings (Knowledge & RAG)](#12-nhóm-11-kiến-thức--vector-embeddings-knowledge--rag)
13. [ENUM Types đầy đủ](#13-enum-types-đầy-đủ)
14. [Indexes](#14-indexes)
15. [Hàm RPC (Stored Functions)](#15-hàm-rpc-stored-functions)
16. [Row Level Security (RLS)](#16-row-level-security-rls)
17. [Triggers](#17-triggers)
18. [Seed Data](#18-seed-data)

---

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  auth.users  ──(trigger)──►  public.users                      │
│                                 │                               │
│  ┌─────────────┬───────────────┼───────────────┬──────────┐    │
│  │             │               │               │          │    │
│  ▼             ▼               ▼               ▼          ▼    │
│ Style Profile  Cart         Orders         Reviews    AI Log   │
│ Guest Session  Products     Payments       Returns    Chatbot  │
│                Variants     Order Items    Tickets    Vectors  │
│                Combos       Vouchers       Evidence            │
│                Promotions   Audit Log      Notifications       │
│                Categories   Approval Req   Knowledge           │
│                Price History                               │    │
└─────────────────────────────────────────────────────────────────┘

Storage Buckets:
  ├── return-evidence   (ảnh bằng chứng đổi trả)
  └── avatars           (ảnh đại diện người dùng)
```

### Nguyên tắc thiết kế

| Nguyên tắc | Mô tả |
|------------|-------|
| **UUID Primary Key** | Tất cả bảng dùng `UUID DEFAULT gen_random_uuid()` |
| **Optimistic Locking** | Bảng quan trọng có cột `version INTEGER` để tránh lost update |
| **Audit Trail** | `audit_log` ghi lại mọi thay đổi quan trọng |
| **RLS (Row Level Security)** | Supabase RLS kiểm soát quyền truy cập ở tầng database |
| **RPC-only Mutations** | INSERT/UPDATE/DELETE chỉ qua hàm RPC (security definer) |
| **No Physical Delete** | Dùng soft delete (`is_active`, `status`) thay vì DELETE |
| **JSONB cho dữ liệu linh hoạt** | `saved_addresses`, `wishlist`, `items` trong cart dùng JSONB |

---

## 2. Nhóm 1: Người dùng & Xác thực (Users & Auth)

### Bảng `users`

Bảng trung tâm của toàn bộ hệ thống. Mỗi auth.users record sẽ tự động tạo user record qua trigger.

```sql
CREATE TABLE users (
  user_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email             VARCHAR(255) UNIQUE,
  phone             VARCHAR(15)  UNIQUE,
  password_hash     VARCHAR(255),              -- Legacy, Supabase Auth owns passwords
  full_name         VARCHAR(100) NOT NULL,
  date_of_birth     DATE,
  gender            VARCHAR(20),
  avatar            VARCHAR(255),
  role              user_role    NOT NULL DEFAULT 'member',
  admin_role        admin_role_type,
  is_active         BOOLEAN      NOT NULL DEFAULT true,
  is_verified       BOOLEAN      NOT NULL DEFAULT false,
  -- Bảo mật
  otp_code          VARCHAR(10),
  otp_expires_at    TIMESTAMP,
  login_fail_count  SMALLINT     NOT NULL DEFAULT 0,
  locked_until      TIMESTAMP,
  lock_type         TEXT         CHECK (lock_type IN ('temporary', 'permanent')),
  lock_reason       TEXT,
  unlock_reason     TEXT,
  locked_by         UUID         REFERENCES users(user_id) ON DELETE SET NULL,
  locked_at         TIMESTAMP,
  -- Dữ liệu linh hoạt
  saved_addresses   JSONB        NOT NULL DEFAULT '[]',
  wishlist          JSONB        NOT NULL DEFAULT '[]',
  -- Thành viên
  tier              VARCHAR(20)  NOT NULL DEFAULT 'Standard',
  loyalty_points    INT          NOT NULL DEFAULT 0,
  -- Version control
  version           INTEGER      NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
```

**Các cột quan trọng:**

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `user_id` | UUID PK | Khóa chính, trùng với `auth.users.id` |
| `auth_user_id` | UUID FK | Liên kết Supabase Auth, unique index |
| `email` | VARCHAR(255) UNIQUE | Email đăng nhập |
| `phone` | VARCHAR(15) UNIQUE | Số điện thoại đăng nhập |
| `role` | user_role enum | `guest` / `member` / `admin` |
| `admin_role` | admin_role_type enum | Vai trò quản trị chi tiết |
| `is_active` | BOOLEAN | Trạng thái kích hoạt (false = bị khóa) |
| `saved_addresses` | JSONB | Mảng địa chỉ giao hàng `[{}]` |
| `wishlist` | JSONB | Mảng sản phẩm yêu thích `["product_id"]` |
| `tier` | VARCHAR(20) | Hạng thành viên: Standard/Silver/Gold/Platinum |
| `loyalty_points` | INT | Điểm tích lũy |
| `version` | INTEGER |乐观锁 version, tăng mỗi lần update |

### Bảng `guest_session`

Lưu thông tin phiên của khách vãng lai (chưa đăng nhập).

```sql
CREATE TABLE guest_session (
  session_id        VARCHAR(100) PRIMARY KEY,
  converted_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at        TIMESTAMP NOT NULL
);
```

| Cột | Mô tả |
|-----|-------|
| `session_id` | ID phiên, thường là fingerprint hoặc UUID |
| `converted_user_id` | Khi guest đăng ký thành viên, lưu user_id để hợp nhất dữ liệu |

### Bảng `style_profile`

Lưu kết quả bài trắc nghiệm phong cách cá nhân (Style Quiz).

```sql
CREATE TABLE style_profile (
  profile_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  height_cm           SMALLINT,
  weight_kg           SMALLINT,
  chest_cm            SMALLINT,
  waist_cm            SMALLINT,
  hip_cm              SMALLINT,
  body_shape          body_shape,        -- enum
  skin_tone           skin_tone,         -- enum
  style_tags          VARCHAR(50)[],     -- mảng tags phong cách
  preferred_occasions VARCHAR(50)[],     -- dịp thường mặc
  favorite_brands     VARCHAR(100)[],    -- thương hiệu yêu thích
  budget_range        budget_range,      -- enum khoảng giá
  age_group           VARCHAR(20),       -- nhóm tuổi
  favorite_colors     VARCHAR(20)[],     -- màu sắc yêu thích
  quiz_completed_at   TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `email_outbox`

Hàng đợi gửi email (email queue pattern). Worker poll và gửi email, hỗ trợ retry.

```sql
CREATE TABLE email_outbox (
  email_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient        TEXT NOT NULL,
  template_code    TEXT NOT NULL,         -- mã template: 'account_locked', 'order_status_changed', ...
  subject          TEXT NOT NULL,
  body             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts         INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  next_attempt_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error       TEXT,
  related_user_id  UUID REFERENCES users(user_id) ON DELETE SET NULL,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Index đặc biệt:**
```sql
CREATE INDEX idx_email_outbox_dispatch
  ON email_outbox(status, next_attempt_at)
  WHERE status IN ('pending', 'failed') AND attempts < 3;
```

---

## 3. Nhóm 2: Danh mục & Sản phẩm (Category & Product)

### Bảng `category`

Danh mục sản phẩm, hỗ trợ cây phân cấp (parent-child).

```sql
CREATE TABLE category (
  category_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  parent_id     UUID REFERENCES category(category_id) ON DELETE SET NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  display_order INT          NOT NULL DEFAULT 0
);
```

**Mô hình phân cấp:**
```
Áo (ao)
├── Áo sơ mi
├── Áo thun
├── Áo khoác
Quần (quan)
├── Quần jeans
├── Quần短裤
Đầm & Váy (dam-vay)
├── Đầm dự tiệc
├── Váy midi
...
```

### Bảng `product`

Bảng sản phẩm chính. Mỗi sản phẩm thuộc một danh mục, có nhiều variant.

```sql
CREATE TABLE product (
  product_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                  VARCHAR(50)   UNIQUE NOT NULL,
  is_combo             BOOLEAN       NOT NULL DEFAULT false,
  name                 VARCHAR(200)  NOT NULL,
  slug                 VARCHAR(200)  UNIQUE NOT NULL,
  description          TEXT,
  category_id          UUID          NOT NULL REFERENCES category(category_id),
  brand                VARCHAR(100)  DEFAULT 'Velura',
  base_price           DECIMAL(12,0) NOT NULL,      -- giá gốc (VND)
  sale_price           DECIMAL(12,0) NOT NULL,      -- giá bán hiện tại
  images               VARCHAR(255)[] NOT NULL DEFAULT '{}',  -- mảng URL ảnh
  style_tags           VARCHAR(50)[],               -- tags phong cách
  color_tone           skin_tone,                   -- tone màu phù hợp
  occasions            VARCHAR(50)[],               -- dịp sử dụng
  suitable_body_shapes body_shape[],                -- dáng người phù hợp
  status               product_status NOT NULL DEFAULT 'on_sale',
  is_featured          BOOLEAN        NOT NULL DEFAULT false,
  collection           VARCHAR(100),                -- bộ sưu tập
  seo_title            VARCHAR(255),
  seo_description      TEXT,
  version              INTEGER        NOT NULL DEFAULT 1,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Các cột quan trọng:**

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `sku` | VARCHAR(50) UNIQUE | Mã sản phẩm (VD: `VL-AO-SM-001`) |
| `is_combo` | BOOLEAN | Sản phẩm combo (set đồ) |
| `base_price` | DECIMAL(12,0) | Giá gốc (đơn vị VND, không decimal) |
| `sale_price` | DECIMAL(12,0) | Giá bán hiện tại |
| `images` | VARCHAR(255)[] | Mảng URL ảnh sản phẩm |
| `style_tags` | VARCHAR(50)[] | Tags: 'thanh_lich', 'cong_so', 'du_tiec' |
| `status` | product_status | `on_sale` / `hidden` / `out_of_stock` / `discontinued` |

### Bảng `variant`

Bi thể sản phẩm (màu sắc + kích thước). Mỗi product có nhiều variant.

```sql
CREATE TABLE variant (
  variant_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID         NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
  color               VARCHAR(50)  NOT NULL,
  color_hex           VARCHAR(7),          -- mã hex màu: '#FF5733'
  size                VARCHAR(10)  NOT NULL,
  size_measurements   JSONB,               -- số đo chi tiết: {"chest": 90, "length": 70}
  stock_quantity      INT          NOT NULL DEFAULT 0,
  reserved_quantity   INT          NOT NULL DEFAULT 0,
  low_stock_threshold INT          NOT NULL DEFAULT 5,
  version             INTEGER      NOT NULL DEFAULT 1,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (product_id, color, size)
);
```

**Inventory Logic:**
- `stock_quantity`: Số lượng tồn kho thực tế
- `reserved_quantity`: Số lượng đã đặt nhưng chưa thanh toán (hold trong giỏ hàng)
- `available = stock_quantity - reserved_quantity`
- Khi `stock_quantity <= low_stock_threshold` → cảnh báo hết hàng sớm

### Bảng `combo_item`

Các thành phần trong một combo/sét đồ.

```sql
CREATE TABLE combo_item (
  combo_item_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_product_id     UUID NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
  component_product_id UUID NOT NULL REFERENCES product(product_id) ON DELETE RESTRICT,
  component_variant_id UUID REFERENCES variant(variant_id) ON DELETE RESTRICT,
  quantity             INT  NOT NULL DEFAULT 1
);
```

---

## 4. Nhóm 3: Khuyến mãi & Voucher (Promotions & Vouchers)

### Bảng `promotion`

Chương trình khuyến mãi tổng thể.

```sql
CREATE TABLE promotion (
  promo_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_name            VARCHAR(200)  NOT NULL,
  promo_type            promo_type    NOT NULL,
  applicable_categories JSONB,               -- danh mục áp dụng
  start_date            TIMESTAMP     NOT NULL,
  end_date              TIMESTAMP     NOT NULL,
  is_active             BOOLEAN       NOT NULL DEFAULT true,
  budget_limit          DECIMAL(12,0),       -- ngân sách tối đa
  max_vouchers_allowed  INT,                 -- số voucher tối đa
  total_discount_issued DECIMAL(12,0) NOT NULL DEFAULT 0,
  created_by            UUID          NOT NULL REFERENCES users(user_id)
);
```

### Bảng `voucher`

Mã giảm giá cụ thể, thuộc về một promotion hoặc độc lập.

```sql
CREATE TABLE voucher (
  voucher_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id              UUID REFERENCES promotion(promo_id) ON DELETE SET NULL,
  code                  VARCHAR(50)  UNIQUE NOT NULL,     -- mã giảm giá: 'SALE30K'
  name                  VARCHAR(200) NOT NULL,
  discount_type         discount_type NOT NULL,           -- 'fixed_amount' / 'percentage' / 'free_shipping'
  discount_value        DECIMAL(12,2) NOT NULL,           -- giá trị giảm
  max_discount_amount   DECIMAL(10,0),                    -- giảm tối đa (cho percentage)
  min_order_value       DECIMAL(10,0) NOT NULL DEFAULT 0, -- đơn tối thiểu
  usage_limit_total     INT,                              -- tổng lượt dùng
  usage_limit_per_user  INT          NOT NULL DEFAULT 1,  -- lượt/người
  used_count            INT          NOT NULL DEFAULT 0,
  applicable_categories JSONB,
  applicable_user_group applicable_user_group NOT NULL DEFAULT 'all_users',
  start_date            TIMESTAMP    NOT NULL,
  end_date              TIMESTAMP    NOT NULL,
  is_active             BOOLEAN      NOT NULL DEFAULT true,
  created_by            UUID         NOT NULL REFERENCES users(user_id)
);
```

### Bảng `promotion_product`

Liên kết Promotion ↔ Product (N:N) với mức giảm riêng.

```sql
CREATE TABLE promotion_product (
  promo_id       UUID NOT NULL REFERENCES promotion(promo_id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
  discount_type  discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (promo_id, product_id)
);
```

### Bảng `price_history`

Lịch sử thay đổi giá sản phẩm (audit trail cho giá).

```sql
CREATE TABLE price_history (
  price_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID          NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
  variant_id       UUID          REFERENCES variant(variant_id) ON DELETE CASCADE,
  old_base_price   DECIMAL(12,0) NOT NULL,
  new_base_price   DECIMAL(12,0) NOT NULL,
  old_sale_price   DECIMAL(12,0) NOT NULL,
  new_sale_price   DECIMAL(12,0) NOT NULL,
  changed_by       UUID          NOT NULL REFERENCES users(user_id),
  changed_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason           TEXT
);
```

---

## 5. Nhóm 4: Đơn hàng & Thanh toán (Orders & Payment)

### Bảng `orders`

Bảng đơn hàng chính.

```sql
CREATE TABLE orders (
  order_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID           NOT NULL REFERENCES users(user_id),
  order_date       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status           order_status   NOT NULL DEFAULT 'pending',
  shipping_name    VARCHAR(100)   NOT NULL,
  shipping_phone   VARCHAR(15)    NOT NULL,
  shipping_address TEXT           NOT NULL,       -- địa chỉ giao hàng đầy đủ
  shipping_fee     DECIMAL(10,0)  NOT NULL DEFAULT 0,
  voucher_id       UUID           REFERENCES voucher(voucher_id) ON DELETE RESTRICT,
  discount_amount  DECIMAL(10,0)  NOT NULL DEFAULT 0,
  subtotal         DECIMAL(12,0)  NOT NULL,       -- tổng trước giảm giá
  total_amount     DECIMAL(12,0)  NOT NULL,       -- tổng thanh toán
  payment_method   payment_method NOT NULL,       -- 'COD' / 'ONLINE_PAYMENT'
  ai_source        ai_source,                     -- nguồn đơn: 'for_you_feed' / 'chatbot' / ...
  tracking_code    VARCHAR(100),                  -- mã vận đơn
  internal_note    TEXT,
  cancelled_reason TEXT,
  delivered_at     TIMESTAMP,
  version          INTEGER        NOT NULL DEFAULT 1,
  created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Trạng thái đơn hàng (order_status):**
```
pending → confirmed → preparing → shipping → delivered → completed
                ↓           ↓           ↓
            cancelled   cancelled   failed_delivery → shipping (retry)
```

### Bảng `order_item`

Chi tiết từng sản phẩm trong đơn hàng.

```sql
CREATE TABLE order_item (
  item_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID          NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  variant_id       UUID          NOT NULL REFERENCES variant(variant_id),
  product_name     VARCHAR(200)  NOT NULL,       -- snapshot tên SP tại thời điểm đặt
  product_image    VARCHAR(255),                 -- snapshot ảnh SP
  applied_promo_id UUID          REFERENCES promotion(promo_id) ON DELETE SET NULL,
  quantity         INT           NOT NULL CHECK (quantity > 0),
  unit_price       DECIMAL(12,0) NOT NULL,       -- giá tại thời điểm đặt
  subtotal_item    DECIMAL(12,0) NOT NULL        -- quantity × unit_price
);
```

### Bảng `order_status_history`

Lịch sử chuyển trạng thái đơn hàng.

```sql
CREATE TABLE order_status_history (
  history_id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID         NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  old_status   order_status NOT NULL,
  new_status   order_status NOT NULL,
  trigger_type trigger_type,            -- 'system' / 'manual'
  changed_by   UUID         NOT NULL REFERENCES users(user_id),
  changed_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note         TEXT
);
```

### Bảng `payment`

Thông tin thanh toán cho đơn hàng.

```sql
CREATE TABLE payment (
  payment_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID           NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  payment_method          payment_method NOT NULL,
  payment_provider        VARCHAR(50),           -- cổng thanh toán: 'vnpay', 'momo', ...
  amount                  DECIMAL(12,0)  NOT NULL,
  payment_status          payment_status NOT NULL DEFAULT 'pending',
  payment_channel         VARCHAR(50),
  gateway_transaction_ref VARCHAR(100),          -- mã giao dịch cổng
  gateway_response_code   VARCHAR(10),
  paid_at                 TIMESTAMP,
  refund_amount           DECIMAL(12,0),
  refund_reason           TEXT,
  refund_at               TIMESTAMP,
  has_discrepancy         BOOLEAN        NOT NULL DEFAULT false,
  version                 INTEGER        NOT NULL DEFAULT 1,
  created_at              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Trạng thái thanh toán (payment_status):**
```
pending → paid → refund_pending → refunded
   ↓        ↓
failed   discrepancy (số tiền không khớp)
```

---

## 6. Nhóm 5: Giỏ hàng (Cart)

### Bảng `cart`

Giỏ hàng, thuộc về một user HOẶC một guest session (không thể cả hai).

```sql
CREATE TABLE cart (
  cart_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  session_id VARCHAR(100) UNIQUE REFERENCES guest_session(session_id) ON DELETE CASCADE,
  items      JSONB     NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_cart_owner CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);
```

**Cấu trúc `items` JSONB:**
```json
[
  {
    "variant_id": "uuid",
    "product_id": "uuid",
    "name": "Áo sơ mi lụa",
    "image": "https://...",
    "color": "Trắng",
    "size": "M",
    "price": 1290000,
    "quantity": 2,
    "promo_id": null
  }
]
```

---

## 7. Nhóm 6: Đánh giá sản phẩm (Reviews)

### Bảng `review`

Đánh giá của người dùng cho sản phẩm.

```sql
CREATE TABLE review (
  review_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID          NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
  user_id           UUID          NOT NULL REFERENCES users(user_id),
  order_id          UUID          NOT NULL REFERENCES orders(order_id),
  rating            SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  images            VARCHAR(255)[],          -- ảnh đính kèm
  review_tags       VARCHAR(100)[],          -- tags: 'chinh_sac', 'chat_luong', ...
  status            review_status NOT NULL DEFAULT 'pending',  -- 'pending' / 'approved' / 'rejected'
  rejection_reason  TEXT,
  admin_reply       TEXT,                    -- phản hồi từ admin
  moderated_by      UUID          REFERENCES users(user_id),
  is_flagged_urgent BOOLEAN       NOT NULL DEFAULT false,
  submitted_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderated_at      TIMESTAMP
);
```

---

## 8. Nhóm 7: Đổi trả & Hỗ trợ CSKH (Returns & Support)

### Bảng `return_exchange`

Yêu cầu đổi trả sản phẩm.

```sql
CREATE TABLE return_exchange (
  return_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               UUID          NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT,
  user_id                UUID          NOT NULL REFERENCES users(user_id),
  return_type            return_type   NOT NULL,      -- 'exchange' / 'refund'
  description            TEXT,
  evidence_images        VARCHAR(255)[],              -- ảnh bằng chứng
  status                 return_status NOT NULL DEFAULT 'pending',
  condition_check_result condition_check,             -- 'passed' / 'minor_damage' / 'major_damage'
  admin_note             TEXT,
  rejection_reason       TEXT,
  exchange_order_id      UUID          REFERENCES orders(order_id),  -- đơn hàng đổi mới
  refund_amount          DECIMAL(10,0),
  tracking_return_code   VARCHAR(100),
  created_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at            TIMESTAMP
);
```

**Trạng thái đổi trả (return_status):**
```
pending → approved → shipping_back → received → completed
   ↓                                           
rejected
```

### Bảng `return_item`

Chi tiết sản phẩm trong yêu cầu đổi trả.

```sql
CREATE TABLE return_item (
  return_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id      UUID NOT NULL REFERENCES return_exchange(return_id) ON DELETE CASCADE,
  order_item_id  UUID NOT NULL REFERENCES order_item(item_id) ON DELETE RESTRICT,
  quantity       INT  NOT NULL CHECK (quantity > 0)
);
```

### Bảng `support_ticket`

Ticket hỗ trợ khách hàng.

```sql
CREATE TABLE support_ticket (
  ticket_id   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID            REFERENCES users(user_id),
  guest_phone VARCHAR(15),                -- SDT guest (nếu chưa đăng nhập)
  guest_email VARCHAR(255),               -- email guest
  title       VARCHAR(200)    NOT NULL,
  description TEXT            NOT NULL,
  priority    ticket_priority NOT NULL DEFAULT 'medium',
  status      ticket_status   NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  csat_score  SMALLINT        CHECK (csat_score BETWEEN 1 AND 5),
  ai_log_id   UUID            REFERENCES ai_log(log_id),  -- link đến chat AI
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);
```

---

## 9. Nhóm 8: AI & Trí tuệ nhân tạo (AI & Intelligence)

### Bảng `ai_log`

Ghi lại tương tác với AI (chatbot, recommendation, quiz).

```sql
CREATE TABLE ai_log (
  log_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type             ai_log_type NOT NULL,        -- 'chatbot_session' / 'recommendation_event' / 'quiz_result'
  user_id              UUID        REFERENCES users(user_id),
  session_id           VARCHAR(100) REFERENCES guest_session(session_id) ON DELETE CASCADE,
  messages             JSONB,                       -- lịch sử chat
  image_urls           VARCHAR(255)[],              -- ảnh upload cho AI phân tích
  recommended_products JSONB,                       -- sản phẩm gợi ý
  clicked_products     JSONB,                       -- sản phẩm đã click
  purchased_products   JSONB,                       -- sản phẩm đã mua
  ctr                  DECIMAL(5,4),                -- click-through rate
  quiz_results         JSONB,                       -- kết quả quiz
  escalated_to_human   BOOLEAN   NOT NULL DEFAULT false,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `ai_chatbot_session` (Migration 012)

Phiên chat chatbot chi tiết.

```sql
CREATE TABLE ai_chatbot_session (
  session_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(user_id),
  guest_session_id VARCHAR(100) REFERENCES guest_session(session_id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  escalated     BOOLEAN NOT NULL DEFAULT false,
  summary       TEXT
);
```

### Bảng `ai_chatbot_message` (Migration 012)

Tin nhắn trong phiên chatbot.

```sql
CREATE TABLE ai_chatbot_message (
  message_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES ai_chatbot_session(session_id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       TEXT NOT NULL,
  tokens_used   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Bảng `ai_recommendation_log` (Migration 013)

Log chi tiết các gợi ý AI và kết quả.

```sql
CREATE TABLE ai_recommendation_log (
  log_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(user_id),
  source         TEXT NOT NULL,        -- 'for_you' / 'chatbot' / 'search'
  query_text     TEXT,
  recommended_ids UUID[] NOT NULL,     -- mảng product_id gợi ý
  clicked_ids    UUID[],
  purchased_ids  UUID[],
  feedback_score SMALLINT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10. Nhóm 9: Kiểm toán & Phê duyệt (Audit & Approval)

### Bảng `audit_log`

Nhật ký kiểm toán tất cả thay đổi quan trọng trong hệ thống.

```sql
CREATE TABLE audit_log (
  audit_id   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID            NOT NULL REFERENCES users(user_id),
  actor_role admin_role_type NOT NULL,
  action     audit_action    NOT NULL,         -- 'create' / 'update' / 'delete' / 'approve' / 'reject' / 'lock' / 'unlock'
  module     VARCHAR(50)     NOT NULL,         -- 'accounts' / 'products' / 'orders' / 'reviews' / ...
  target_id  UUID            NOT NULL,         -- ID của bản ghi bị thay đổi
  old_value  JSONB,                            -- giá trị trước khi thay đổi
  new_value  JSONB,                            -- giá trị sau khi thay đổi
  ip_address VARCHAR(45)     NOT NULL,
  timestamp  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Quy tắc:**
- Bảng `audit_log` chỉ INSERT, không UPDATE/DELETE
- RLS policy: chỉ admin_active mới đọc được
- Bị revoke UPDATE/DELETE từ anon/authenticated

### Bảng `approval_admin_request`

Yêu cầu phê duyệt nâng quyền admin (đặc biệt cho super_admin).

```sql
CREATE TABLE approval_admin_request (
  request_id     UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id   UUID            NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  target_user_id UUID            NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  approver_id    UUID            REFERENCES users(user_id) ON DELETE RESTRICT,
  requested_role admin_role_type NOT NULL,
  status         approval_status NOT NULL DEFAULT 'pending',  -- 'pending' / 'approved' / 'rejected' / 'expired'
  reason         TEXT,
  admin_note     TEXT,
  expires_at     TIMESTAMPTZ     NOT NULL DEFAULT (now() + interval '10 days'),
  target_version INTEGER         NOT NULL DEFAULT 1,
  version        INTEGER         NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);
```

**Luồng phê duyệt super_admin:**
```
1. Admin A yêu cầu nâng Admin B lên super_admin
2. Tạo approval_admin_request (status='pending')
3. Email thông báo cho Admin B
4. Super_admin khác duyệt/từ chối
5. Nếu approve → cập nhật role, audit log, email thông báo
6. Nếu không xử lý trong 10 ngày → tự động expire
```

---

## 11. Nhóm 10: Thông báo (Notifications)

### Bảng `notification` (Migration 015)

Thông báo cho người dùng.

```sql
CREATE TABLE notification (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  body            TEXT NOT NULL,
  type            VARCHAR(50) NOT NULL DEFAULT 'info',  -- 'info' / 'warning' / 'success' / 'error'
  is_read         BOOLEAN NOT NULL DEFAULT false,
  action_url      TEXT,                                  -- URL điều hướng khi click
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 12. Nhóm 11: Kiến thức & Vector Embeddings (Knowledge & RAG)

### Bảng `knowledge_content` (Migration 015)

Nội dung kiến thức cho AI chatbot (FAQ, chính sách, blog).

```sql
CREATE TABLE knowledge_content (
  content_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(200) NOT NULL,
  content      TEXT NOT NULL,
  category     VARCHAR(100),           -- 'faq' / 'policy' / 'blog' / 'product_info'
  tags         VARCHAR(50)[],
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Bảng `product_embedding` (Migration 014)

Vector embedding cho sản phẩm (dùng pgvector).

```sql
CREATE TABLE product_embedding (
  product_id   UUID PRIMARY KEY REFERENCES product(product_id) ON DELETE CASCADE,
  embedding    vector(3072),           -- OpenAI text-embedding-3-large
  metadata     JSONB DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index cho similarity search
CREATE INDEX idx_product_embedding_ivfflat
  ON product_embedding USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Bảng `document_chunks` (Migration 014)

Chunks văn bản cho RAG (Retrieval-Augmented Generation).

```sql
CREATE TABLE document_chunks (
  chunk_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type  TEXT NOT NULL,           -- 'product' / 'knowledge' / 'faq'
  source_id    UUID NOT NULL,
  chunk_text   TEXT NOT NULL,
  embedding    vector(1536),           -- OpenAI text-embedding-3-small
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_chunks_ivfflat
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);
```

**Hàm RPC cho similarity search:**
```sql
-- Tìm sản phẩm tương tự
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(3072),
  match_count int DEFAULT 10,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE (product_id uuid, similarity float)

-- Tìm document chunks liên quan
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.3
)
RETURNS TABLE (chunk_id uuid, source_type text, source_id uuid, chunk_text text, similarity float)
```

---

## 13. ENUM Types đầy đủ

```sql
-- Vai trò người dùng
CREATE TYPE user_role AS ENUM ('guest', 'member', 'admin');

CREATE TYPE admin_role_type AS ENUM (
  'admin_viewer',                  -- Chỉ xem
  'admin_operator_sanpham',        -- Quản lý sản phẩm
  'admin_operator_donhang',        -- Quản lý đơn hàng
  'admin_operator_cskh_dt',        -- CSKH & Đổi trả
  'admin_operator_gia_km',         -- Quản lý giá & KM
  'admin_operator_danhgia_review', -- Quản lý đánh giá
  'super_admin'                    -- Toàn quyền
);

-- Phong cách & vóc dáng
CREATE TYPE body_shape AS ENUM ('Hourglass', 'Pear', 'Apple', 'Rectangle', 'Inverted Triangle');
CREATE TYPE skin_tone AS ENUM ('Warm', 'Cool', 'Neutral');
CREATE TYPE budget_range AS ENUM ('under_300k', '300k_700k', '700k_1.5m', 'above_1.5m');

-- Sản phẩm
CREATE TYPE product_status AS ENUM ('on_sale', 'hidden', 'out_of_stock', 'discontinued');

-- Đơn hàng
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing',
  'shipping', 'delivered', 'failed_delivery',
  'cancelled', 'completed'
);

-- Thanh toán
CREATE TYPE payment_method AS ENUM ('COD', 'ONLINE_PAYMENT');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'refund_pending', 'discrepancy');

-- Khuyến mãi
CREATE TYPE promo_type AS ENUM ('flash_sale', 'combo_discount', 'product_discount', 'bulk_discount', 'seasonal_sale');
CREATE TYPE discount_type AS ENUM ('fixed_amount', 'percentage', 'free_shipping');
CREATE TYPE applicable_user_group AS ENUM ('new_user', 'loyal_user', 'churn_risk_user', 'all_users');

-- Đổi trả
CREATE TYPE return_type AS ENUM ('exchange', 'refund');
CREATE TYPE return_status AS ENUM ('pending', 'approved', 'shipping_back', 'received', 'completed', 'rejected');
CREATE TYPE condition_check AS ENUM ('passed', 'minor_damage', 'major_damage');

-- Đánh giá
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- Hỗ trợ
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE ticket_status AS ENUM ('open', 'processing', 'resolved', 'closed');

-- AI
CREATE TYPE ai_source AS ENUM ('for_you_feed', 'chatbot', 'search', 'direct');
CREATE TYPE ai_log_type AS ENUM ('chatbot_session', 'recommendation_event', 'quiz_result');

-- Kiểm toán
CREATE TYPE trigger_type AS ENUM ('system', 'manual');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'approve', 'reject', 'lock', 'unlock');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
```

---

## 14. Indexes

### Users
```sql
CREATE UNIQUE INDEX uq_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_users_admin_account_filter ON users(role, admin_role, is_active, created_at DESC);
CREATE INDEX idx_users_email_lower ON users(lower(email));
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
```

### Products
```sql
CREATE INDEX idx_product_category ON product(category_id);
CREATE INDEX idx_product_status ON product(status);
CREATE INDEX idx_product_featured ON product(is_featured);
CREATE INDEX idx_product_style_tags ON product USING GIN(style_tags);
CREATE INDEX idx_product_body_shapes ON product USING GIN(suitable_body_shapes);
CREATE INDEX idx_product_status_updated ON product(status, updated_at DESC);
CREATE INDEX idx_product_sku ON product(sku);
CREATE INDEX idx_variant_product ON variant(product_id);
CREATE INDEX idx_variant_stock ON variant(stock_quantity, low_stock_threshold);
```

### Orders
```sql
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date DESC);
CREATE INDEX idx_orders_admin_status_date ON orders(status, order_date DESC);
CREATE INDEX idx_orders_admin_user_date ON orders(user_id, order_date DESC);
CREATE INDEX idx_orders_admin_shipping_phone ON orders(shipping_phone);
CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_variant ON order_item(variant_id);
CREATE INDEX idx_order_history_order_changed ON order_status_history(order_id, changed_at DESC);
CREATE INDEX idx_payment_order_created ON payment(order_id, created_at DESC);
CREATE INDEX idx_payment_discrepancy ON payment(has_discrepancy, payment_status)
  WHERE has_discrepancy OR payment_status = 'discrepancy';
```

### Reviews
```sql
CREATE INDEX idx_review_product ON review(product_id);
CREATE INDEX idx_review_status ON review(status);
```

### AI
```sql
CREATE INDEX idx_ai_log_user ON ai_log(user_id);
CREATE INDEX idx_ai_log_type ON ai_log(log_type);
```

### Vector Search
```sql
CREATE INDEX idx_product_embedding_ivfflat ON product_embedding USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_document_chunks_ivfflat ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

---

## 15. Hàm RPC (Stored Functions)

### Nhóm A01: Tài khoản & RBAC

| Hàm | Mô tả | Permission |
|-----|-------|------------|
| `velura_current_user_id()` | Lấy user_id từ auth.uid() | authenticated |
| `velura_is_active_admin()` | Kiểm tra có phải admin đang hoạt động | authenticated |
| `velura_is_super_admin()` | Kiểm tra có phải super_admin | authenticated |
| `admin_lock_user(...)` | Khóa tài khoản (temporary/permanent) | super_admin |
| `admin_unlock_user(...)` | Mở khóa tài khoản | super_admin |
| `admin_change_user_role(...)` | Thay đổi vai trò user/admin | super_admin |
| `admin_review_role_request(...)` | Duyệt/từ chối yêu cầu nâng quyền | super_admin |

### Nhóm A02: Sản phẩm & Kho

| Hàm | Mô tả | Permission |
|-----|-------|------------|
| `admin_create_product(...)` | Tạo sản phẩm mới | super_admin, admin_operator_sanpham |
| `admin_update_product(...)` | Cập nhật sản phẩm | super_admin, admin_operator_sanpham |
| `admin_change_product_status(...)` | Chuyển trạng thái sản phẩm | super_admin, admin_operator_sanpham |
| `admin_update_stock(...)` | Cập nhật tồn kho variant | super_admin, admin_operator_sanpham |
| `admin_list_low_stock(...)` | Danh sách sản phẩm sắp hết hàng | super_admin, admin_operator_sanpham, admin_viewer |

### Nhóm A03: Đơn hàng & Thanh toán

| Hàm | Mô tả | Permission |
|-----|-------|------------|
| `admin_change_order_status(...)` | Chuyển trạng thái đơn hàng | super_admin, admin_operator_donhang |
| `admin_cancel_order(...)` | Hủy đơn hàng + hoàn kho | super_admin, admin_operator_donhang |
| `admin_resolve_payment(...)` | Xử lý thanh toán discrepancy | super_admin, admin_operator_donhang |

### Nhóm A04-A06: Reviews, Voucher, Dashboard

- `admin_moderate_review(...)` — Duyệt/từ chối đánh giá
- `admin_create_voucher(...)` — Tạo voucher
- `admin_create_promotion(...)` — Tạo chương trình khuyến mãi
- `admin_dashboard_stats(...)` — Thống kê dashboard

### Nhóm Vector Search

| Hàm | Mô tả |
|-----|-------|
| `match_products(embedding, count, threshold)` | Tìm sản phẩm tương tự theo vector |
| `match_document_chunks(embedding, count, threshold)` | Tìm document chunks liên quan |

---

## 16. Row Level Security (RLS)

### Nguyên tắc

- **READ**: User chỉ đọc được dữ liệu của mình. Admin đọc được toàn bộ (theo role).
- **WRITE**: Không ai được phép INSERT/UPDATE/DELETE trực tiếp. Tất cả mutation phải qua RPC (security definer).
- **RPC**: Hàm RPC chạy với quyền `security definer` → bypass RLS, kiểm soát quyền bằng code PL/pgSQL.

### RLS Policies chính

| Bảng | Policy | Who | Access |
|------|--------|-----|--------|
| `users` | `velura_users_self_or_account_admin_select` | authenticated | SELECT自己的 + super_admin xem tất cả |
| `users` | `velura_users_admin_mutation_via_rpc_only` | authenticated | UPDATE bị block (dùng RPC) |
| `approval_admin_request` | `velura_admin_requests_super_admin_select` | authenticated | SELECT chỉ super_admin |
| `audit_log` | `velura_audit_active_admin_select` | authenticated | SELECT chỉ active admin |
| `email_outbox` | `velura_email_outbox_super_admin_select` | authenticated | SELECT chỉ super_admin |
| `product` | `product_catalog_select` | anon, authenticated | SELECT on_sale + admin xem tất cả |
| `variant` | `variant_catalog_select` | anon, authenticated | SELECT nếu product on_sale + admin |
| `category` | `category_catalog_select` | anon, authenticated | SELECT mọi lúc |
| `orders` | `velura_orders_select` | authenticated | SELECT自己的 + order_reader xem tất cả |
| `order_item` | `velura_order_item_select` | authenticated | SELECT qua orders ownership |
| `payment` | `velura_payment_select` | authenticated | SELECT qua orders ownership |
| `review` | various | authenticated | SELECT自己的 + admin xem tất cả |

### Revoke Direct Mutations

```sql
-- Không ai được INSERT/UPDATE/DELETE trực tiếp
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON product FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON variant FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON audit_log FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON email_outbox FROM anon, authenticated;
```

---

## 17. Triggers

| Trigger | Bảng | Hàm | Mô tả |
|---------|------|------|-------|
| `trg_velura_auth_user_created` | auth.users | `velura_handle_new_auth_user()` | Auto tạo public.users khi đăng ký Supabase Auth |
| `trg_users_touch_updated_at` | users | `velura_touch_updated_at()` | Auto cập nhật updated_at |
| `trg_email_outbox_touch_updated_at` | email_outbox | `velura_touch_updated_at()` | Auto cập nhật updated_at |
| `trg_product_touch_updated_at` | product | `velura_touch_updated_at()` | Auto cập nhật updated_at |
| `trg_variant_touch_updated_at` | variant | `velura_touch_updated_at()` | Auto cập nhật updated_at |
| `trg_orders_touch_updated_at` | orders | `velura_touch_updated_at()` | Auto cập nhật updated_at |
| `trg_payment_touch_updated_at` | payment | `velura_touch_updated_at()` | Auto cập nhật updated_at |

### Trigger `velura_handle_new_auth_user()`

```sql
-- Khi user đăng ký qua Supabase Auth → tự động tạo record trong public.users
-- Bỏ qua nếu user_id đã tồn tại (ON CONFLICT DO UPDATE)
-- Extract full_name từ raw_user_meta_data
-- Xác nhận email/phone verified
```

---

## 18. Seed Data

### Danh mục (Category)

```sql
INSERT INTO category (name, parent_id, slug, display_order) VALUES
  ('Áo',         NULL, 'ao',        1),
  ('Quần',       NULL, 'quan',      2),
  ('Đầm & Váy',  NULL, 'dam-vay',   3),
  ('Áo khoác',   NULL, 'ao-khoac',  4),
  ('Set đồ',     NULL, 'set-do',    5),
  ('Phụ kiện',   NULL, 'phu-kien',  6),
  ('Giày dép',   NULL, 'giay-dep',  7);
```

### Sản phẩm (Product)

File `seed_data.sql` chứa **16,416+ dòng** dữ liệu mẫu với **100+ sản phẩm** trên 7 danh mục. Bao gồm:
- Các sản phẩm thời trang nữ (áo, quần, đầm, váy, phụ kiện)
- Mỗi sản phẩm có nhiều variant (màu sắc + kích thước)
- Giá từ 390,000₫ đến 4,290,000₫

---

## Tổng kết

| Nhóm | Số bảng | Mô tả |
|------|---------|-------|
| 1. Users & Auth | 4 | users, guest_session, style_profile, email_outbox |
| 2. Category & Product | 4 | category, product, variant, combo_item |
| 3. Promotions & Vouchers | 4 | promotion, voucher, promotion_product, price_history |
| 4. Orders & Payment | 4 | orders, order_item, order_status_history, payment |
| 5. Cart | 1 | cart |
| 6. Reviews | 1 | review |
| 7. Returns & Support | 3 | return_exchange, return_item, support_ticket |
| 8. AI & Intelligence | 4 | ai_log, ai_chatbot_session, ai_chatbot_message, ai_recommendation_log |
| 9. Audit & Approval | 2 | audit_log, approval_admin_request |
| 10. Notifications | 1 | notification |
| 11. Knowledge & Vectors | 3 | knowledge_content, product_embedding, document_chunks |
| **Tổng** | **~31+** | |
