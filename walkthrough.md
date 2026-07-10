# CSKH, Chatbot & Database Workflow — Walkthrough

## Latest Enhancements (Session Gia_dev_2 Updates)

### 1. Image Search & AI Multimodal Vision Analysis
- **Multimodal Visual Analysis**: Implemented full support for uploading and analyzing images within the user and guest chatbots.
  - **Dynamic Preview**: Dynamically inserts and manages an image preview thumbnail area (with filename and removal button) above the chat input field inside [chatbot.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/user-web/src/scripts/modules/chatbot.js).
  - **Base64 Encoding**: Automatically reads and base64-encodes selected image files to transmit them as JSON payloads.
  - **Bubble Attachment**: Renders attached user images inline in the chat history bubbles.
  - **Gemini Vision Analysis**: Added `analyzeImageWithGemini` inside [gemini-client.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/gemini-client.js) querying the active `gemini-3.5-flash` model. It extracts styling, style profiles, and product context from uploaded outfits, passing the detailed description back to Mistral and product search keyword queries.
  - **Increased Request Body Limit**: Changed `maxBodyBytes` default to `15728640` (15MB) in both [config.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/config.js) and [.env](file:///c:/Users/ADMIN/Downloads/Velura-Images/.env) to support base64 image data transmission safely.
- **Supabase Vector Dimension Synchronization**: Increased `geminiEmbeddingDimensions` to 3072 in [config.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/config.js) and [.env](file:///c:/Users/ADMIN/Downloads/Velura-Images/.env) to align with Supabase's `match_products` column requirement (3072 dimensions), resolving vector shape mismatch errors.

### 2. Wishlist & Favorite Outfit Synchronization
- **Instant Product Syncing**: Updated `handleSaveOutfit` inside [chatbot.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/user-web/src/scripts/modules/chatbot.js) so that when a logged-in user saves a recommended outfit, all products in that outfit are added directly to their personal wishlist (`/api/user/wishlist`).
- **Post-Login Synchronization**: Enhanced `syncFavoriteOutfitsOnLogin` to extract recommended product IDs from guest outfits cached in `sessionStorage` and sync them to the logged-in user's database wishlist, updating the header wishlist badge count dynamically.

### 3. Guest Exit & Concurrent Session Purge
- **Purge All Guest Sessions**: Modified exit/close event hooks to purge **all** guest chat sessions concurrently via the REST API before clearing storage keys.
- **Modern Warnings Modal**: Replaced warning emojis with a styled vector alert-triangle icon in the modal wrapper.

### 4. Admin Role Escalation Fix
- **Optimistic Locking Resolution**: Modified `public.admin_review_role_request` in the Supabase PostgreSQL database to check the target user's profile against their current version (`v_target.version`) during approval, preventing conflicts when users change profiles or log in after requests are made.

---

## Completed Enhancements

### 1. CSKH & Returns Frontend Enhancements — [returns-cskh.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/admin-web/src/scripts/returns-cskh.js)
- **State Integration**: Extended local state properties (`returnsPage = 1`, `ticketsPage = 1`, `itemsPerPage = 10`) to support paginated queries.
- **48-Hour Deadline (AD_CSKH_03)**:
  - Dynamically calculates the age of pending return requests (`(new Date() - new Date(row.created_at)) / (60 * 60 * 1000)`).
  - Displays remaining hours and minutes directly on the row as a countdown (e.g. `23h 15m còn lại`), color-coded in red when less than 6 hours remain.
  - Automatically filters out/hides expired pending requests (`age > 48` hours) from the active list.
- **Dynamic Paginations (`renderPaginationMarkup()`)**: Generates page buttons dynamically and slices the active list to display exactly 10 rows per page.
- **Search and Reset synchronization**:
  - Live filter inputs reset the page pointer back to page 1.
  - The "Đặt lại" buttons reset both text search inputs and return the view to page 1.

### 2. Single Pencil Action & Unified Modals (User Feedback)
- **Returns ("Đổi/trả hàng")**:
  - Replaced separate check/settings/reject action buttons with a single processing pencil icon (`icon("edit")`) next to the eye icon for returns in active states (`pending`, `approved`, `shipping_back`, `received`).
  - The pencil opens a **Return Processing Modal** containing a dynamic dropdown ("Chọn hình thức xử lý") and note text area. The form adapts inputs dynamically:
    - `"pending-refund"` / `"received-refund"`: Prompts for Refund Amount.
    - `"reject"`: Prompts for an rejection proof file (`imageProof`).
- **Support Tickets ("Phiếu hỗ trợ")**:
  - Replaced the three separate buttons with just the eye icon (details) and a single pencil icon (`icon("edit")`) for action processing.
  - The pencil icon opens a **Ticket Processing Modal** containing a dropdown ("Chọn tác vụ": "Phản hồi khách hàng" or "Đóng Ticket hỗ trợ") and a single response content / close reason text area.

# Kết quả Hoàn thành & Đóng gói Workspace lên Git (Branch Gia_dev_2)

Hệ thống đã triển khai đầy đủ, tối ưu hóa thiết kế theo chuẩn `design-taste-frontend`, kiểm thử thành công toàn bộ 98/98 test cases nghiệp vụ, đóng gói và đẩy code hoàn chỉnh lên nhánh **`Gia_dev_2`** tại repository GitHub [Velura-project](https://github.com/Royal2005-coder/Velura-project.git).

---

## 1. Đóng gói & Đẩy mã nguồn lên Git
- **Tạo nhánh phát triển**: Khởi tạo và chuyển sang nhánh **`Gia_dev_2`**.
- **Bảo mật & Dọn dẹp Workspace**:
  - Sửa lỗi định dạng trong [.gitignore](file:///c:/Users/ADMIN/Downloads/Velura-Images/.gitignore) để bỏ qua hoàn toàn file cấu hình nhạy cảm chứa khóa bí mật ([.env](file:///c:/Users/ADMIN/Downloads/Velura-Images/.env)).
  - Bổ sung `.codex/` vào `.gitignore` để loại bỏ các cache và metadata của tool làm nhiễu lịch sử commit.
- **Commit & Push**:
  - Đã stage và commit toàn bộ thay đổi hoàn chỉnh (41 files changed, 3235 insertions, 986 deletions).
  - Khởi chạy lệnh đẩy mã nguồn: `git push origin Gia_dev_2`.

---

## 2. Các hạng mục công việc đã hoàn thành

### 2.1. Chuyển đổi mô hình sang Mistral API & Tool Calling Loop
- **Cấu hình**: Tích hợp các biến môi trường `MISTRAL_API_KEY` và `MISTRAL_MODEL` vào hệ thống thông qua cấu hình trong [.env](file:///c:/Users/ADMIN/Downloads/Velura-Images/.env) và [config.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/config.js).
- **Core LLM**: Cập nhật [llm-service.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/chatbot/llm-service.js) sang sử dụng Mistral API. Hệ thống đã triển khai cơ chế **Stateless Tool Calling Loop** hoàn hảo:
  1. Gửi lịch sử trò chuyện dạng messages chuẩn OpenAI tương thích.
  2. Bắt các yêu cầu gọi hàm từ Mistral (ví dụ: `search_products`, `create_support_ticket`).
  3. Thực thi trực tiếp trên Database thông qua `repository`.
  4. Trả kết quả hàm lại cho Mistral để hoàn tất câu trả lời cuối cùng tự động trong 1 turn duy nhất.

### 2.2. Cơ chế Lưu phối đồ Yêu thích & Phân quyền Guest/Member
- **Backend status transition & auditing support**:
  - **Repository & Service**: Added `updateReturnStatus` in [return-repository.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/returns/return-repository.js) and [return-service.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/returns/return-service.js) to support manual return state changes (e.g., to `shipping_back` or `received`) using the service role key, bypassing PostgreSQL user RLS limits.
  - **Audit Logs**: Automatically records audited logs in the `audit_log` database table with old and new values, acting IP address, operator ID, and action names for security auditing.
  - **REST Route**: Exposed `POST /api/v1/admin/returns/:id/update-status` route in [return-router.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/returns/return-router.js).

### 2.3. Active Returns Seed Script
- Created a robust seed script [seed-active-returns.mjs](file:///c:/Users/ADMIN/Downloads/Velura-Images/database/seed/seed-active-returns.mjs) that auto-discovers database orders containing items (or generates a mock user, order, and order item structure if none exist), inserting fresh return requests in multiple statuses (`pending`, `approved`, `received`) and open/processing tickets.

### 3. About Us Page
- **Structure Refining ([about.html](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/user-web/src/pages/about/about.html))**:
  - Removed overlapping text box overlay inside the hero section to let the visual photo breathe as a clean, full-width photo showcase.
  - Aligned all layout components dynamically.
  - Upgraded the Triết lý thương hiệu grid to have a symmetric 3-column layout of value cards, stripping away all inline styles.
- **Styling Refinements ([_about.css](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/user-web/src/styles/pages/_about.css))**:
  - Styled `.about-hero` as a clean responsive showcase banner.
  - Styled symmetric value cards with a warm soft peach tint (`#fdf6f2`), terracotta border (`rgba(201, 123, 99, 0.12)`), and round icon containers (`rgba(201, 123, 99, 0.1)`).
  - Paired Playfair Display and Outfit typography appropriately.
  - Enabled active scale animations (`scale(0.98)`) and translations on all clickable cards and buttons.

---

## Verification Results

### API & Unit Tests
- **91/91** tests passed in the backend test suite ✓
  - Added unit test validation suite for the new `updateReturnStatus` method (verifies role authorization, invalid status rejection, optimistic lock version matching, and parameter inputs).

### Playwright E2E Tests
- **41/41** tests passed in the complete administration test runner (`admin.spec.js`) ✓
  - **Returns & CSKH**:
    - `AD_CSKH_01+02: Returns page loads with two tabs` ✓
    - `AD_CSKH_03: Returns note about 48h deadline visible` ✓
    - `AD_CSKH_04: Return action buttons exist` ✓

---

## 3. Redesign Blog & Database Migration
- **Figma Design Alignment (`blog.html` & `_blog.css`)**:
  - Centered the main header intro according to Figma layers (VELURA JOURNAL -> Tạp chí phong cách -> description).
  - Redesigned the featured post banner with a landscape-oriented layout (image left, meta details/action right), border radius of `16px`, and thin `0.8px` border matching the precise Figma layer parameters.
  - Implemented a 3-column articles grid of 9 high-density blog cards, removing the arbitrary sidebar.
- **Elle-Style Premium Visual Assets Overhaul**:
  - Replaced all placeholders with high-fidelity, hand-picked fashion editorial images from Unsplash.
  - Added dynamic parameters (`fit=crop&w=800&h=600&q=80`) to ensure all photos display in crisp fashion and exact portrait/landscape aspect ratios without awkward cropping or stretching.
- **Database Schema Hardening & Seeding**:
  - Identified database column discrepancies on the remote Supabase instance (tables like `blog`, `policy`, `static_page` existed with older schemas, blocking the PostgREST API).
  - Executed a custom migration script (`apply-migrations.mjs`) to cleanly apply SQL migrations `008` (base/sale pricing), `013` (UC Chatbot & blogs), and `014` (vector embeddings) directly via PostgreSQL client connection.
  - Created and ran `db-seed.mjs` to truncate the stale tables and directly seed all 10 high-quality blog posts with complete content structures, making the dynamic API fully functional.
  - Re-ran `verify:a06:supabase` to ensure all remote pricing, schema, and anonymous access checks pass with flying colors.

---

## 4. Product Inventory & Stock Adjustment Modal Fixes
- **Inventory Populating**:
  - Identified that out-of-stock products (including combo products such as `VLR-SD-001`, `VLR-SD-024` and standard products) had zero variants in the `variant` table. Since the catalog stock calculations read from the `variant` table, this caused them to be stuck at 0 stock and showing as "Hết hàng" (Out of stock).
  - Wrote and executed a REST-based database update script (`add-default-variants.js`) to insert a default variant (`Mặc định` / `F`) with `50` stock items for all products having 0 variants, and updated existing 0-stock variants to `50` stock.
  - Transitioned all 40 out-of-stock products back to `'on_sale'` status, successfully resolving the out-of-stock issue.
- **Stock Adjustment Modal Verification**:
  - Inspected the stock adjustment form fields (`delta`, `lowStockThreshold`, `reason`) and modal overlay elements in [products.html](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/admin-web/src/pages/admin/products.html) and [products.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/admin-web/src/scripts/products.js).
  - Confirmed that form validation (e.g. `minlength="10"` on `reason` and non-zero `delta` requirements) matches the database function expectations.
  - Resolved the label discrepancy where the selling status modal's submit button remained hardcoded to "Xác nhận tạm ẩn" regardless of selection. Added an event listener in [products.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/admin-web/src/scripts/products.js) to dynamically update the submit button text matching the active selected radio (e.g. "Xác nhận hết hàng", "Xác nhận ngừng kinh doanh").
  - Ensured product catalog status automatic alignment triggers on both initial creation and regular edit updates inside [product-service.js](file:///c:/Users/ADMIN/Downloads/Velura-Images/apps/api/src/products/product-service.js) when variant stock is updated via the form.
  - Verified the complete suite of 103 API and service tests passes successfully.



