# 🛍️ Velura Fashion Shop

> **Đồ án môn học** — Ứng dụng thương mại điện tử thời trang tích hợp AI  
> Đại học Kinh tế — Luật (UEL), TP. Hồ Chí Minh

[![Node.js](https://img.shields.io/badge/Node.js-≥22-green?logo=node.js)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-blue?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange?logo=supabase)](https://supabase.com/)

---

## 📋 Tổng quan

**Velura** là một nền tảng thương mại điện tử thời trang cao cấp, được xây dựng bằng **Vanilla JavaScript** + **Vite** cho frontend và **Node.js HTTP API** + **Supabase PostgreSQL** cho backend. Dự án bao gồm:

- 🛒 **Trang khách hàng (User Web)** — Duyệt sản phẩm, giỏ hàng, thanh toán, đánh giá, blog thời trang
- 🤖 **Chatbot AI** — Tư vấn phong cách với RAG + Gemini AI, gợi ý sản phẩm thông minh
- ⚙️ **Trang quản trị (Admin Web)** — Quản lý sản phẩm, đơn hàng, tài khoản, khuyến mãi, thống kê
- 🗄️ **Backend API** — RESTful API với RBAC, audit logs, xử lý đơn hàng, hệ thống email

---

## 👥 Thành viên nhóm

| STT | Họ và tên | Vai trò |
|:---:|-----------|---------|
| 1 | **Nguyễn Trần Dạ Uyên** | Nhà sáng lập & Giám đốc sáng tạo |
| 2 | **Trần Diễm Quỳnh** | Trưởng phòng phong cách |
| 3 | **Nguyễn Như Khải** | Trưởng phòng công nghệ |
| 4 | **Nguyễn Tô Hoàng Gia** | Giám đốc thiết kế |
| 5 | **Nguyễn Phan Ngọc Hân** | Giám đốc vận hành |
| 6 | **Đoàn Phương Ninh** | Thành viên nhóm sáng tạo |

---

## 🏗️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Vite 5.x |
| Backend API | Node.js ≥22 (native HTTP, zero-framework) |
| Database | PostgreSQL (Supabase hosted), pgvector |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| AI/Chatbot | Google Gemini API, RAG embeddings, n8n workflow |
| Deployment | Cloudflare Tunnel, Vite static build |
| Testing | Node.js built-in test runner (116 tests) |
| Package Manager | npm workspaces (monorepo) |

---

## 📁 Cấu trúc thư mục

```text
Velura-project/
├── apps/
│   ├── api/                    # Backend API (Node.js HTTP server)
│   │   └── src/
│   │       ├── server.js       # Entry point (port 8787)
│   │       ├── chatbot/        # Chatbot AI + RAG service
│   │       ├── orders/         # Quản lý đơn hàng
│   │       ├── products/       # Quản lý sản phẩm
│   │       ├── pricing/        # Quản lý giá & khuyến mãi
│   │       ├── returns/        # Xử lý đổi trả
│   │       ├── reviews/        # Đánh giá sản phẩm
│   │       └── user/           # Xác thực & tài khoản
│   ├── admin-web/              # Trang quản trị (Vite)
│   │   ├── src/
│   │   │   ├── pages/admin/    # Các trang quản trị
│   │   │   ├── scripts/        # JavaScript modules
│   │   │   └── styles/         # CSS stylesheets
│   │   └── vite.config.js
│   └── user-web/               # Trang khách hàng (Vite)
│       ├── src/
│       │   ├── pages/          # Trang sản phẩm, blog, chatbot...
│       │   ├── scripts/        # JavaScript modules
│       │   ├── styles/         # CSS stylesheets
│       │   ├── assets/         # Hình ảnh, icons
│       │   └── components/     # HTML components (header, footer...)
│       └── vite.config.js
├── database/
│   ├── migrations/             # SQL migration files (001→021)
│   ├── database_user/          # Schema + seed data cho User DB
│   └── seed/                   # Scripts seed dữ liệu mẫu
├── packages/
│   ├── shared-types/           # Shared enums/constants
│   ├── utils/                  # Shared helpers
│   └── validation/             # Shared validation
├── tests/
│   ├── api/                    # 16 file test (116 test cases)
│   └── e2e/                    # End-to-end tests
├── docs/                       # Tài liệu kiến trúc & nghiệp vụ
├── infra/                      # Docker, Nginx configs
├── scripts/                    # Scripts tiện ích (dev, seed, migrate)
├── .env.example                # Template biến môi trường
├── package.json                # Root monorepo config
└── README.md                   # File này
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy Local

### Yêu cầu hệ thống

- **Node.js** ≥ 22 ([tải tại đây](https://nodejs.org/))
- **npm** ≥ 10 (đi kèm Node.js)
- **Git** ([tải tại đây](https://git-scm.com/))
- Tài khoản **Supabase** (miễn phí tại [supabase.com](https://supabase.com/))

### Bước 1: Clone dự án

```bash
git clone https://github.com/Royal2005-coder/Velura-project.git
cd Velura-project
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình biến môi trường

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Mở file `.env` và điền các giá trị:

| Biến | Mô tả | Bắt buộc? |
|------|--------|:---------:|
| `VELURA_SUPABASE_URL` | URL dự án Supabase | ✅ |
| `VELURA_SUPABASE_ANON_KEY` | Anon key từ Supabase Dashboard | ✅ |
| `VELURA_SUPABASE_SERVICE_ROLE_KEY` | Service role key (bảo mật) | ✅ |
| `SUPABASE_DB_URL` | Connection string PostgreSQL | ⚙️ Migration |
| `GEMINI_API_KEY` | Google Gemini API key | 🤖 Chatbot AI |
| `N8N_CHAT_WEBHOOK_URL` | n8n webhook URL | 🤖 Chatbot |
| `SMTP_USER` / `SMTP_APP_PASSWORD` | Gmail SMTP credentials | 📧 Email |

### Bước 4: Thiết lập Database (lần đầu)

```bash
# Chạy migration tạo bảng
npm run db:migrate

# Tạo tài khoản admin mẫu
npm run db:seed:admins

# (Tùy chọn) Seed dữ liệu blog
npm run db:seed:blogs
```

### Bước 5: Khởi động dự án

```bash
npm start
```

Lệnh này sẽ khởi động **đồng thời** cả 3 service:

| Service | URL | Mô tả |
|---------|-----|-------|
| 🔗 API Server | `http://localhost:8787` | Backend API |
| 🔗 Admin Panel | `http://localhost:5174` | Trang quản trị |
| 🔗 User Shop | `http://localhost:3001` | Trang khách hàng |

---

## 🔑 Tài khoản Test

| Loại | Email | Mật khẩu | Ghi chú |
|------|-------|----------|---------|
| Super Admin | *(tạo bằng `npm run db:seed:admins`)* | *(xem trong script)* | Quyền cao nhất |
| Khách hàng | Tự đăng ký trên trang User | — | Đăng ký tại `/pages/auth/signup.html` |

---

## ✨ Tính năng chính

### 🛒 Trang Khách hàng (User Web)
- Đăng ký / Đăng nhập (Email + Google OAuth)
- Duyệt sản phẩm theo danh mục, bộ sưu tập
- Xem chi tiết sản phẩm, đánh giá, hình ảnh
- Giỏ hàng và thanh toán (thành viên + khách)
- Quản lý đơn hàng, lịch sử mua hàng
- Yêu cầu đổi trả sản phẩm
- Blog thời trang & Style Quiz AI
- **Chatbot AI** tư vấn phong cách với RAG

### ⚙️ Trang Quản trị (Admin Web)
- Dashboard thống kê tổng quan
- Quản lý sản phẩm (CRUD, nhập/xuất CSV)
- Quản lý đơn hàng & trạng thái
- Quản lý tài khoản người dùng (RBAC)
- Quản lý khuyến mãi & mã giảm giá
- Xử lý đổi trả & CSKH
- Quản lý đánh giá sản phẩm
- Nhật ký hoạt động (Audit logs)

### 🤖 Chatbot AI
- Tìm kiếm sản phẩm bằng ngôn ngữ tự nhiên
- Gợi ý outfit theo phong cách, dịp, ngân sách
- Hiển thị card sản phẩm với hình ảnh, giá, nút thêm giỏ hàng
- RAG embedding với pgvector cho độ chính xác cao

---

## 🌐 Deployment (Production)

Dự án đã được triển khai thực tế tại:

| Service | URL |
|---------|-----|
| 🛍️ Trang khách hàng | [https://velura.royalai.dev](https://velura.royalai.dev) |
| ⚙️ Trang quản trị | [https://admin.royalai.dev](https://admin.royalai.dev) |

---

## 🧪 Kiểm thử

```bash
# Chạy toàn bộ 116 bài test
npm test

# Smoke test API endpoints
npm run smoke:api

# Build production
npm run build
```

---

## 📝 Các lệnh NPM hữu ích

| Lệnh | Mô tả |
|-------|--------|
| `npm start` | Khởi động tất cả (API + Admin + User) |
| `npm run dev` | Tương tự `npm start` |
| `npm run dev:api` | Chỉ chạy API server |
| `npm run dev:admin` | Chỉ chạy Admin web |
| `npm run dev:user` | Chỉ chạy User web |
| `npm run build` | Build production cả User + Admin |
| `npm test` | Chạy 116 unit tests |
| `npm run db:migrate` | Chạy database migrations |
| `npm run db:seed:admins` | Seed tài khoản admin |
| `npm run ai:embed:products` | Tạo AI embeddings cho sản phẩm |

---

## 📄 Giấy phép

Dự án này được phát triển cho mục đích học tập tại Đại học Kinh tế — Luật (UEL).

---

> **Velura** — *Thanh lịch có thể đồng hành qua nhiều mùa* ✨
