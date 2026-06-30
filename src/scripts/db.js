// Shared state database for Velura Admin Subsystem using LocalStorage

export function getFormattedDate() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

export function getFormattedTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${min}:${s}`;
}

// ─── SEED DATA ──────────────────────────────────────────────

const DEFAULT_ACCOUNTS = [
  { id: "ACC001", name: "Nguyễn Thị Lan", email: "lan.nguyen@email.com", phone: "0901234567", type: "Member", role: "Member", status: "active", last: "20/06/2026 10:30", created: "15/01/2024", avatar: "NL", version: 1 },
  { id: "ACC002", name: "Trần Minh Tuấn", email: "tuan.tran@velura.vn", phone: "0912345678", type: "Admin", role: "Admin quản lý sản phẩm", status: "active", last: "20/06/2026 09:15", created: "01/03/2024", avatar: "TT", version: 1 },
  { id: "ACC003", name: "Phạm Thu Hương", email: "huong.pham@velura.vn", phone: "0923456789", type: "Admin", role: "Admin quản trị", status: "active", last: "19/06/2026 16:45", created: "15/12/2023", avatar: "PH", flag: "super", version: 1 },
  { id: "ACC004", name: "Lê Văn Hùng", email: "hung.le@email.com", phone: "0934567890", type: "Member", role: "Member", status: "locked_temp", last: "18/06/2026 13:55", created: "20/04/2024", avatar: "LH", flag: "", lockType: "Tạm thời", reason: "Vi phạm điều khoản sử dụng", lockedBy: "Phạm Thu Hương", lockedAt: "18/06/2026 14:20", version: 1 },
  { id: "ACC005", name: "Hoàng Thị Mai", email: "mai.hoang@email.com", phone: "0945678901", type: "Member", role: "Member", status: "locked_perm", last: "09/05/2026 22:30", created: "05/06/2023", avatar: "HM", flag: "", lockType: "Vĩnh viễn", reason: "Gian lận đơn hàng nhiều lần", lockedBy: "Phạm Thu Hương", lockedAt: "10/05/2026 09:00", version: 1 },
  { id: "ACC006", name: "Đỗ Quang Nam", email: "nam.do@velura.vn", phone: "0956789012", type: "Admin", role: "Admin quản lý đơn hàng", status: "pending", last: "20/06/2026 08:00", created: "02/02/2025", avatar: "DN", flag: "promotion", version: 1 },
  { id: "ACC007", name: "Vũ Thị Bích", email: "bich.vu@email.com", phone: "0967890123", type: "Member", role: "Admin chỉ xem", status: "active", last: "17/06/2026 11:20", created: "10/08/2024", avatar: "VB", version: 1 },
  { id: "ACC008", name: "Ngô Thanh Sơn", email: "son.ngo@email.com", phone: "0978901234", type: "Member", role: "Member", status: "active", last: "16/06/2026 14:05", created: "22/09/2024", avatar: "NS", version: 1 }
];

const DEFAULT_PRODUCTS = [
  { id: "BCR-004", name: "Blazer cropped bouclé", category: "Áo khoác", originalPrice: 2800000, price: 2450000, stock: 36, minStock: 10, status: "active", updatedAt: "20/06/2026", image: "../../assets/images/product-silk-blazer.png", detail: "2 màu · 4 kích thước", description: "Blazer cropped bouclé cao cấp, form dáng hiện đại, phù hợp outfit công sở và dạo phố.", colors: "Be, Navy", sizes: "S, M, L, XL", version: 1 },
  { id: "VMX-012", name: "Váy maxi tiered", category: "Đầm váy", originalPrice: 1500000, price: 1290000, stock: 7, minStock: 10, status: "active", updatedAt: "19/06/2026", image: "../../assets/images/product-silk-blazer.png", detail: "Hoa xanh kem · Size S–L", description: "Váy maxi dáng tầng nữ tính, chất vải mềm mại, họa tiết hoa nhí.", colors: "Hoa xanh kem", sizes: "S, M, L", version: 1 },
  { id: "LSV-001", name: "Áo sơ mi linen cổ V", category: "Áo", originalPrice: 990000, price: 890000, stock: 0, minStock: 10, status: "hidden", updatedAt: "18/06/2026", image: "../../assets/images/product-silk-blazer.png", detail: "Kem · Size S–XL", description: "Áo sơ mi linen thoáng mát, cổ V thanh lịch, phù hợp mùa hè.", colors: "Kem, Trắng", sizes: "S, M, L, XL", version: 1 },
  { id: "ATR-005", name: "Áo thun cổ tròn oversize", category: "Áo", originalPrice: 500000, price: 450000, stock: 15, minStock: 10, status: "active", updatedAt: "17/06/2026", image: "../../assets/images/product-silk-blazer.png", detail: "Đen, hồng · Size S–XL", description: "Áo thun oversize thoải mái, chất cotton 100%, form rộng.", colors: "Đen, Hồng", sizes: "S, M, L, XL", version: 1 },
  { id: "BCR-006", name: "Blazer linen dáng suông", category: "Áo khoác", originalPrice: 2000000, price: 1850000, stock: 9, minStock: 10, status: "active", updatedAt: "15/06/2026", image: "../../assets/images/product-silk-blazer.png", detail: "Navy · Size S–L", description: "Blazer linen dáng suông, chất liệu cao cấp, phong cách minimal.", colors: "Navy", sizes: "S, M, L", version: 1 }
];

const DEFAULT_ORDERS = [
  { id: "ORD-2026-0081", customer: { name: "Nguyễn Thị Lan", email: "lan.nguyen@email.com", phone: "0901234567", address: "123 Nguyễn Huệ, Q.1, TP.HCM" }, total: 1350000, paymentMethod: "Thanh toán online", orderStatus: "pending", paymentStatus: "unpaid", createdAt: "20/06/2026", updatedAt: "20/06/2026 10:30", canCancel: true, items: [{ name: "Áo sơ mi linen cổ V", sku: "LSV-001", variant: "M / Trắng", qty: 2, price: 450000 }, { name: "Quần culottes lưng cao", sku: "QCL-002", variant: "S / Đen", qty: 1, price: 450000 }], version: 1 },
  { id: "ORD-2026-0080", customer: { name: "Trần Minh Khoa", email: "khoa.tran@email.com", phone: "0912345678", address: "45 Lê Lợi, Q.3, TP.HCM" }, total: 890000, paymentMethod: "COD", orderStatus: "confirmed", paymentStatus: "unpaid", createdAt: "19/06/2026", updatedAt: "19/06/2026 15:00", canCancel: true, items: [{ name: "Blazer cropped bouclé", sku: "BCR-004", variant: "M / Be", qty: 1, price: 890000 }], version: 1 },
  { id: "ORD-2026-0079", customer: { name: "Phạm Thị Hoa", email: "hoa.pham@email.com", phone: "0923456789", address: "78 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM" }, total: 2100000, paymentMethod: "Thẻ ngân hàng", orderStatus: "shipping", paymentStatus: "paid", createdAt: "18/06/2026", updatedAt: "19/06/2026 16:00", canCancel: false, trackingCode: "VN-GHTK-90182", carrier: "GHTK", items: [{ name: "Váy maxi tiered floral", sku: "VMX-012", variant: "L / Họa tiết", qty: 2, price: 680000 }, { name: "Áo thun oversize", sku: "ATR-005", variant: "M / Hồng", qty: 2, price: 185000 }], version: 1 },
  { id: "ORD-2026-0078", customer: { name: "Lê Văn Nam", email: "nam.le@email.com", phone: "0934567890", address: "12 Cách Mạng Tháng 8, Q.10, TP.HCM" }, total: 450000, paymentMethod: "Ví điện tử", orderStatus: "pending", paymentStatus: "error", createdAt: "17/06/2026", updatedAt: "17/06/2026 11:31", canCancel: true, paymentError: { system: 450000, actual: 440000, transaction: "TXN-88291" }, items: [{ name: "Áo sơ mi linen cổ V", sku: "LSV-001", variant: "L / Trắng", qty: 1, price: 450000 }], version: 1 },
  { id: "ORD-2026-0077", customer: { name: "Hoàng Thị Mai", email: "mai.hoang@email.com", phone: "0945678901", address: "55 Hai Bà Trưng, Q.1, TP.HCM" }, total: 680000, paymentMethod: "Thanh toán online", orderStatus: "cancelled", paymentStatus: "refunded", createdAt: "15/06/2026", updatedAt: "16/06/2026 10:00", canCancel: false, prevStatus: "confirmed", cancelReason: "Khách hàng yêu cầu hủy", cancelledBy: "Phạm Thu Hương", refundStatus: "refunded", items: [{ name: "Váy mini pleated satin", sku: "VMP-007", variant: "S / Ngà", qty: 1, price: 390000 }, { name: "Áo thun oversize", sku: "ATR-005", variant: "M / Trắng", qty: 1, price: 290000 }], version: 1 },
  { id: "ORD-2026-0076", customer: { name: "Đỗ Thanh Tú", email: "tu.do@email.com", phone: "0956789012", address: "90 Nam Kỳ Khởi Nghĩa, Q.3, TP.HCM" }, total: 1580000, paymentMethod: "Thẻ ngân hàng", orderStatus: "held", paymentStatus: "paid", createdAt: "14/06/2026", updatedAt: "15/06/2026 09:00", canCancel: true, riskNote: "Địa chỉ nhận hàng không khớp với lịch sử mua.", items: [{ name: "Blazer cropped bouclé", sku: "BCR-004", variant: "L / Be", qty: 1, price: 890000 }, { name: "Sandal cao gót", sku: "SHG-006", variant: "38 / Nâu", qty: 1, price: 690000 }], version: 1 },
  { id: "ORD-2026-0075", customer: { name: "Vũ Thị Bích", email: "bich.vu@email.com", phone: "0967890123", address: "33 Phan Đình Phùng, Phú Nhuận, TP.HCM" }, total: 320000, paymentMethod: "COD", orderStatus: "cancelled", paymentStatus: "no_refund", createdAt: "12/06/2026", updatedAt: "13/06/2026 14:00", canCancel: false, prevStatus: "shipping", cancelReason: "Giao hàng thất bại 3 lần", cancelledBy: "Hệ thống", refundStatus: "no_refund", items: [{ name: "Áo thun oversize", sku: "ATR-005", variant: "L / Xanh", qty: 1, price: 320000 }], version: 1 },
  { id: "ORD-2026-0074", customer: { name: "Ngô Thanh Long", email: "long.ngo@email.com", phone: "0978901234", address: "21 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM" }, total: 780000, paymentMethod: "Ví điện tử", orderStatus: "preparing", paymentStatus: "paid", createdAt: "20/06/2026", updatedAt: "20/06/2026 09:30", canCancel: true, items: [{ name: "Quần culottes lưng cao", sku: "QCL-002", variant: "M / Xám", qty: 1, price: 520000 }, { name: "Áo thun oversize", sku: "ATR-005", variant: "S / Kem", qty: 1, price: 260000 }], version: 1 },
  { id: "ORD-2026-0073", customer: { name: "Lý Minh Châu", email: "chau.ly@email.com", phone: "0989012345", address: "67 Lê Văn Sỹ, Q.3, TP.HCM" }, total: 390000, paymentMethod: "Thanh toán online", orderStatus: "completed", paymentStatus: "paid", createdAt: "10/06/2026", updatedAt: "18/06/2026 14:00", canCancel: false, items: [{ name: "Váy mini pleated satin", sku: "VMP-007", variant: "M / Đen", qty: 1, price: 390000 }], version: 1 }
];

const DEFAULT_REVIEWS = [
  { id: "REV-00126", product: "Áo sơ mi linen cổ V", sku: "LSV-001", customer: "Nguyễn Thị Lan", contact: "lan.nguyen@email.com", stars: 5, text: "Chất vải mát, form đẹp và giao hàng rất nhanh. Sẽ tiếp tục ủng hộ Velura.", status: "pending", alert: "normal", created: "20/06/2026", order: "ORD-2026-0081", attachment: true, version: 1 },
  { id: "REV-00125", product: "Blazer cropped bouclé", sku: "BCR-004", customer: "Trần Minh Khoa", contact: "0912345678", stars: 4, text: "Sản phẩm đúng mô tả, đường may cẩn thận. Màu be hơi đậm hơn ảnh một chút.", status: "pending", alert: "normal", created: "19/06/2026", order: "ORD-2026-0080", version: 1 },
  { id: "REV-00124", product: "Váy maxi tiered", sku: "VMX-012", customer: "Phạm Thị Hoa", contact: "hoa.pham@email.com", stars: 2, text: "Váy nhận được bị lỗi đường chỉ, cần hỗ trợ đổi hàng sớm giúp mình.", status: "pending", alert: "urgent", created: "18/06/2026", order: "ORD-2026-0079", version: 1 },
  { id: "REV-00123", product: "Áo thun cổ tròn oversize", sku: "ATR-005", customer: "Lê Văn Nam", contact: "0934567890", stars: 1, text: "Sản phẩm không giống mô tả, chất lượng rất kém và tôi muốn được liên hệ hỗ trợ.", status: "ticket", alert: "keyword", created: "17/06/2026", order: "ORD-2026-0078", ticket: "CSKH-2048", version: 1 },
  { id: "REV-00122", product: "Áo sơ mi linen cổ V", sku: "LSV-001", customer: "Hoàng Thị Mai", contact: "mai.hoang@email.com", stars: 3, text: "Thiết kế đẹp nhưng sản phẩm giao chậm hơn dự kiến. Mong shop cải thiện thêm.", status: "replied", alert: "negative", created: "15/06/2026", order: "ORD-2026-0077", response: "Velura xin lỗi vì trải nghiệm chưa trọn vẹn. Chúng tôi đã ghi nhận phản hồi của bạn.", version: 1 },
  { id: "REV-00121", product: "Blazer linen dáng suông", sku: "BCR-006", customer: "Đỗ Thanh Tú", contact: "tu.do@email.com", stars: 5, text: "Rất hài lòng, chất liệu tốt và phối đồ dễ. Đã duyệt đánh giá này.", status: "approved", alert: "normal", created: "14/06/2026", order: "ORD-2026-0076", version: 1 },
  { id: "REV-00120", product: "Áo thun cổ tròn oversize", sku: "ATR-005", customer: "Vũ Thị Bích", contact: "bich.vu@email.com", stars: 2, text: "Nội dung quảng cáo không liên quan đến sản phẩm hàng giả.", status: "hidden", alert: "keyword", created: "12/06/2026", order: "ORD-2026-0075", version: 1 }
];

const DEFAULT_REQS = [
  { id: "REQ001", name: "Đỗ Quang Nam", email: "nam.do@velura.vn", current: "Admin quản lý đơn hàng", proposed: "Admin quản trị", by: "Phạm Thu Hương", deadline: "28/06/2026", left: 8, status: "pending" },
  { id: "REQ002", name: "Trần Văn An", email: "an.tran@velura.vn", current: "Admin chỉ xem", proposed: "Admin quản trị", by: "Phạm Thu Hương", deadline: "15/06/2026", left: -5, status: "overdue" },
  { id: "REQ003", name: "Nguyễn Hoài Thu", email: "thu.nh@velura.vn", current: "Admin quản lý sản phẩm", proposed: "Admin quản trị", by: "Phạm Thu Hương", deadline: "20/05/2026", left: -30, status: "approved" }
];

const DEFAULT_LOGS = [
  { id: "AUD-260627-001", type: "admin", time: "27/06/2026", clock: "09:42:18", actor: "Trần Minh Tuấn", actorId: "ADM-012", role: "Admin quản lý sản phẩm", module: "pricing", action: "update", actionLabel: "Cập nhật giá", target: "BCR-004", targetName: "Blazer cropped bouclé", result: "success", severity: "normal", ip: "10.24.8.16", summary: "Cập nhật giá bán BCR-004 từ 450.000đ xuống 390.000đ.", changes: [["Giá bán", "450.000đ", "390.000đ"], ["Lý do", "—", "Điều chỉnh Flash Sale"]], context: { "Sản phẩm": "Blazer cropped bouclé", "SKU": "BCR-004", "Danh mục": "Áo khoác" } },
  { id: "AUD-260627-002", type: "admin", time: "27/06/2026", clock: "09:31:04", actor: "Phạm Thu Hương", actorId: "ADM-001", role: "Admin quản trị", module: "accounts", action: "lock", actionLabel: "Khóa tài khoản", target: "ACC004", targetName: "Lê Văn Hùng", result: "success", severity: "attention", ip: "10.24.8.11", summary: "Tài khoản ACC004 bị khóa tạm thời do vi phạm điều khoản sử dụng.", changes: [["Trạng thái", "Đang hoạt động", "Khóa tạm thời"], ["Thời hạn", "—", "7 ngày"]], context: { "Email": "hung.le@email.com", "Vai trò": "Member" } },
  { id: "AUD-260627-003", type: "admin", time: "27/06/2026", clock: "09:18:37", actor: "Phạm Thu Hương", actorId: "ADM-001", role: "Admin quản trị", module: "orders", action: "update", actionLabel: "Cập nhật trạng thái", target: "ORD-2026-0081", targetName: "Đơn hàng ORD-2026-0081", result: "success", severity: "normal", ip: "10.24.8.21", summary: "Đơn hàng ORD-2026-0081 chuyển từ Chờ xác nhận sang Đang chuẩn bị.", changes: [["Trạng thái đơn", "Chờ xác nhận", "Đang chuẩn bị"]], context: { "Mã đơn": "ORD-2026-0081", "Khách hàng": "Nguyễn Thị Lan", "Tổng tiền": "1.350.000đ" } }
];

const DEFAULT_CAMPAIGNS = [
  { id: "CAMP-001", name: "Summer Sale 2026", code: "SALE-SUMMER", type: "percentage", discountValue: 20, maxDiscount: 80000, conditions: "Đơn từ 500.000đ, danh mục Áo/Váy", scopeType: "category", categories: ["Áo", "Đầm váy"], startAt: "2026-06-20T00:00", endAt: "2026-06-30T23:59", status: "active", budgetLimit: 80000000, budgetUsed: 54400000, productCount: 35, voucherCount: 120, version: 1 },
  { id: "CAMP-002", name: "Member Day", code: "MB-DAY", type: "fixed_amount", discountValue: 100000, maxDiscount: 100000, conditions: "Khách hàng Member", scopeType: "customer_group", customerGroup: "Member", startAt: "2026-06-28T00:00", endAt: "2026-06-29T23:59", status: "scheduled", budgetLimit: 20000000, budgetUsed: 0, productCount: 12, voucherCount: 0, version: 1 },
  { id: "CAMP-003", name: "Free ship nội thành", code: "SHIP-HCM", type: "free_shipping", discountValue: 0, maxDiscount: 30000, conditions: "Đơn từ 300.000đ tại TP.HCM", scopeType: "all", startAt: "2026-06-01T00:00", endAt: "2026-06-30T23:59", status: "active", budgetLimit: 30000000, budgetUsed: 21900000, productCount: 24, voucherCount: 48, version: 1 }
];

const DEFAULT_VOUCHERS = [
  { id: "VCH-001", code: "VELURA20", name: "Chiến dịch khách mới", campaignId: "CAMP-001", type: "percentage", value: 20, maxDiscount: 80000, minOrder: 400000, usageLimit: 500, usageCount: 226, perUserLimit: 1, expiresAt: "2026-06-30", customerGroup: "new_user", status: "active", version: 1 },
  { id: "VCH-002", code: "FREESHIP06", name: "Free ship tháng 6", campaignId: "CAMP-003", type: "free_shipping", value: 30000, maxDiscount: 30000, minOrder: 300000, usageLimit: 1000, usageCount: 730, perUserLimit: 1, expiresAt: "2026-06-30", customerGroup: "all_users", status: "active", version: 1 },
  { id: "VCH-003", code: "VIP100", name: "Ưu đãi VIP", campaignId: "CAMP-002", type: "fixed_amount", value: 100000, maxDiscount: 100000, minOrder: 500000, usageLimit: 100, usageCount: 80, perUserLimit: 1, expiresAt: "2026-06-28", customerGroup: "loyal_user", status: "paused", version: 1 }
];

const DEFAULT_BUNDLES = [
  { id: "BND-001", name: "Office Linen Set", code: "CB-OFFICE", products: ["LSV-001", "QCL-002", "TL-003"], productNames: "Áo linen, quần culottes, thắt lưng", retailTotal: 1580000, bundlePrice: 1390000, saving: 190000, startAt: "2026-06-20", endAt: "2026-06-30", status: "active", salesCount: 86, revenue: 119000000, version: 1 },
  { id: "BND-002", name: "Weekend Dress Kit", code: "CB-DRESS", products: ["VMX-012", "PHK-018"], productNames: "Váy maxi, túi hobo +1 sản phẩm", retailTotal: 2120000, bundlePrice: 1790000, saving: 330000, startAt: "2026-06-28", endAt: "2026-07-07", status: "scheduled", salesCount: 12, revenue: 21000000, version: 1 }
];

const DEFAULT_BUDGETS = [
  { id: "BGT-001", campaignId: "CAMP-001", name: "Ngân sách Summer Sale", scope: "Chương trình", limit: 80000000, used: 54400000, remaining: 25600000, formula: "500 mã x 80.000đ", status: "warning", percent: 68, version: 1 },
  { id: "BGT-002", campaignId: "CAMP-003", name: "Free ship HCM", scope: "Nhóm mã", limit: 30000000, used: 21900000, remaining: 8100000, formula: "1.000 mã x 30.000đ", status: "normal", percent: 73, version: 1 }
];

const DEFAULT_RETURNS = [
  { id: "RTN-1024", createdAt: "20/06/2026", orderId: "ORD-2026-0081", customer: "Nguyễn Thị Lan", contact: "0901234567", type: "Trả hàng hoàn tiền", product: "Áo sơ mi linen cổ V", deadline: "Còn 4 giờ", status: "Chờ xử lý", action: "Cần duyệt", reason: "Sản phẩm bị lỗi đường may, đường chỉ bị bung.", version: 1 },
  { id: "RTN-1023", createdAt: "19/06/2026", orderId: "ORD-2026-0079", customer: "Phạm Thị Hoa", contact: "hoa.pham@email.com", type: "Đổi hàng", product: "Váy maxi tiered +1", deadline: "Còn 18 giờ", status: "Đang xử lý", action: "Kiểm tra hàng hoàn", reason: "Muốn đổi size L sang M.", version: 1 },
  { id: "RTN-1022", createdAt: "19/06/2026", orderId: "ORD-2026-0077", customer: "Hoàng Thị Mai", contact: "0945678901", type: "Trả hàng hoàn tiền", product: "Áo thun cổ tròn oversize", deadline: "Còn 36 giờ", status: "Chờ hàng hoàn", action: "Theo dõi vận chuyển", reason: "Sản phẩm không đúng kích thước.", version: 1 },
  { id: "RTN-1021", createdAt: "18/06/2026", orderId: "ORD-2026-0074", customer: "Lê Văn Nam", contact: "0934567890", type: "Đổi hàng", product: "Blazer cropped bouclé", deadline: "Còn 8 giờ", status: "Đã duyệt", action: "Tạo đơn đổi hàng", reason: "Sai màu sắc so với đặt hàng.", version: 1 },
  { id: "RTN-1020", createdAt: "18/06/2026", orderId: "ORD-2026-0072", customer: "Đỗ Thanh Tú", contact: "tu.do@email.com", type: "Trả hàng hoàn tiền", product: "Áo khoác dạ dáng dài", deadline: "Còn 24 giờ", status: "Đang xử lý", action: "Chờ xác nhận hoàn tiền", reason: "Chất lượng không như mô tả.", version: 1 }
];

const DEFAULT_TICKETS = [
  { id: "CSKH-2048", createdAt: "20/06/2026", customer: "Lê Văn Nam", contact: "0934567890", type: "Khiếu nại", content: "Sản phẩm không giống mô tả, cần hỗ trợ liên hệ sớm.", priority: "Cao", status: "Mới", csat: "Chưa gửi", version: 1 },
  { id: "CSKH-2047", createdAt: "19/06/2026", customer: "Nguyễn Thị Lan", contact: "lan.nguyen@email.com", type: "Hỗ trợ đơn hàng", content: "Cần cập nhật thời gian giao hàng cho đơn ORD-2026-0081.", priority: "Trung bình", status: "Đang xử lý", csat: "Chờ gửi", version: 1 },
  { id: "CSKH-2046", createdAt: "18/06/2026", customer: "Trần Minh Khoa", contact: "0912345678", type: "Sản phẩm", content: "Hỏi về chính sách đổi size sau khi nhận hàng.", priority: "Thấp", status: "Đã giải quyết", csat: "Đã gửi", version: 1 },
  { id: "CSKH-2045", createdAt: "17/06/2026", customer: "Phạm Thị Hoa", contact: "hoa.pham@email.com", type: "Thanh toán", content: "Không nhận được hóa đơn điện tử sau thanh toán.", priority: "Cao", status: "Đã phản hồi", csat: "Chưa gửi", version: 1 },
  { id: "CSKH-2044", createdAt: "16/06/2026", customer: "Hoàng Thị Mai", contact: "0945678901", type: "Đổi trả", content: "Cần hướng dẫn gửi lại sản phẩm bị lỗi.", priority: "Trung bình", status: "Chuyển bộ phận", csat: "Chờ gửi", version: 1 },
  { id: "CSKH-2043", createdAt: "15/06/2026", customer: "Đỗ Thanh Tú", contact: "tu.do@email.com", type: "Khác", content: "Góp ý về trải nghiệm đóng gói đơn hàng.", priority: "Thấp", status: "Đã đóng", csat: "Đã gửi", version: 1 }
];

const DEFAULT_PRICE_HISTORY = [
  { time: "26/06/2026 09:20", actor: "Phạm Thu Hương", productId: "LSV-001", originalOld: 450000, originalNew: 450000, saleOld: 420000, saleNew: 390000, note: "Cập nhật giá bán", result: "Thành công" },
  { time: "25/06/2026 16:10", actor: "Trần Minh Tuấn", productId: "BCR-004", originalOld: 2390000, originalNew: 2450000, saleOld: 2390000, saleNew: 2450000, note: "Chuẩn hóa giá gốc", result: "Thành công" },
  { time: "24/06/2026 08:35", actor: "Hệ thống", productId: "VMX-012", originalOld: 1290000, originalNew: 1290000, saleOld: null, saleNew: null, note: "Import thiếu trường giá bán", result: "Cần kiểm tra" }
];

// ─── DB OBJECT ──────────────────────────────────────────────

const DB_PREFIX = "velura_";

export const db = {
  // Connection and Error Simulators
  isOffline: () => localStorage.getItem("velura_offline") === "true",
  isDbError: () => localStorage.getItem("velura_dberror") === "true",
  isConflictSimulated: () => localStorage.getItem("velura_conflict") === "true",

  toggleOffline: (state) => localStorage.setItem("velura_offline", state ? "true" : "false"),
  toggleDbError: (state) => localStorage.setItem("velura_dberror", state ? "true" : "false"),
  toggleConflictSimulated: (state) => localStorage.setItem("velura_conflict", state ? "true" : "false"),

  // ── Core read/write ──
  init: () => {
    const seeds = {
      accounts: DEFAULT_ACCOUNTS,
      products: DEFAULT_PRODUCTS,
      orders: DEFAULT_ORDERS,
      reviews: DEFAULT_REVIEWS,
      reqs: DEFAULT_REQS,
      logs: DEFAULT_LOGS,
      emails: [],
      campaigns: DEFAULT_CAMPAIGNS,
      vouchers: DEFAULT_VOUCHERS,
      bundles: DEFAULT_BUNDLES,
      budgets: DEFAULT_BUDGETS,
      returns: DEFAULT_RETURNS,
      tickets: DEFAULT_TICKETS,
      priceHistory: DEFAULT_PRICE_HISTORY
    };
    Object.entries(seeds).forEach(([key, value]) => {
      if (!localStorage.getItem(DB_PREFIX + key)) {
        localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
      }
    });
  },

  read: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  },

  write: (key, data) => {
    if (db.isDbError()) {
      throw new Error("DATABASE_CONNECTION_TIMEOUT");
    }
    localStorage.setItem(key, JSON.stringify(data));
  },

  // ── Accounts ──
  getAccounts: () => db.read(DB_PREFIX + "accounts"),
  saveAccounts: (data) => db.write(DB_PREFIX + "accounts", data),

  // ── Products ──
  getProducts: () => db.read(DB_PREFIX + "products"),
  saveProducts: (data) => db.write(DB_PREFIX + "products", data),

  getProductBySku: (sku) => {
    return db.getProducts().find(p => p.id === sku);
  },

  updateProductStock: (sku, qtyDelta) => {
    const products = db.getProducts();
    const product = products.find(p => p.id === sku);
    if (product) {
      product.stock = Math.max(0, product.stock + qtyDelta);
      product.version = (product.version || 0) + 1;
      product.updatedAt = getFormattedDate();
      db.saveProducts(products);
    }
    return product;
  },

  // ── Orders ──
  getOrders: () => db.read(DB_PREFIX + "orders"),
  saveOrders: (data) => db.write(DB_PREFIX + "orders", data),

  getOrderById: (id) => {
    return db.getOrders().find(o => o.id === id);
  },

  // ── Reviews ──
  getReviews: () => db.read(DB_PREFIX + "reviews"),
  saveReviews: (data) => db.write(DB_PREFIX + "reviews", data),

  // ── Requests ──
  getReqs: () => db.read(DB_PREFIX + "reqs"),
  saveReqs: (data) => db.write(DB_PREFIX + "reqs", data),

  // ── Logs ──
  getLogs: () => db.read(DB_PREFIX + "logs"),
  saveLogs: (data) => db.write(DB_PREFIX + "logs", data),

  addLog: (actorName, actorId, role, type, module, action, actionLabel, target, targetName, result, severity, summary, changes = [], context = {}) => {
    const list = db.getLogs();
    const newLog = {
      id: `AUD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      type,
      time: getFormattedDate(),
      clock: getFormattedTime(),
      actor: actorName || "Hệ thống",
      actorId: actorId || "SYSTEM",
      role: role || "Tự động",
      module,
      action,
      actionLabel,
      target,
      targetName,
      result,
      severity,
      ip: "10.24.8.11",
      summary,
      changes,
      context
    };
    list.unshift(newLog);
    db.saveLogs(list);
  },

  // ── Emails ──
  getEmails: () => db.read(DB_PREFIX + "emails"),
  saveEmails: (data) => db.write(DB_PREFIX + "emails", data),

  queueEmail: (to, subject, body) => {
    const queue = db.getEmails();
    const email = {
      id: `MAIL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      to, subject, body,
      status: "pending",
      attempts: 0,
      logs: [],
      timestamp: `${getFormattedDate()} ${getFormattedTime()}`
    };
    queue.unshift(email);
    db.saveEmails(queue);
    db.processEmailQueue();
    return email;
  },

  processEmailQueue: () => {
    let emails = db.getEmails();
    let updated = false;

    emails.forEach((email) => {
      if (email.status === "pending" || (email.status === "failed" && email.attempts < 3)) {
        email.attempts += 1;
        if (db.isOffline()) {
          email.logs.push(`Lần gửi thứ ${email.attempts}: Lỗi kết nối mạng (SMTP_TIMEOUT).`);
          if (email.attempts >= 3) {
            email.status = "failed";
            email.logs.push(`Gửi email thất bại vĩnh viễn sau 3 lần thử.`);
          }
        } else {
          email.status = "success";
          email.logs.push(`Lần gửi thứ ${email.attempts}: Gửi email thành công.`);
        }
        updated = true;
      }
    });

    if (updated) db.saveEmails(emails);
    db.renderEmailMonitor();
  },

  renderEmailMonitor: () => {
    let monitor = document.getElementById("email-monitor-widget");
    if (!monitor) {
      monitor = document.createElement("div");
      monitor.id = "email-monitor-widget";
      monitor.className = "admin-email-monitor";
      document.body.appendChild(monitor);
    }

    const queue = db.getEmails();
    if (queue.length === 0) { monitor.style.display = "none"; return; }

    monitor.style.display = "flex";
    const latest = queue[0];
    let statusClass = "";
    let statusLabel = "";
    if (latest.status === "pending") {
      statusClass = "admin-email-monitor__dot--pending";
      statusLabel = `Đang gửi tới ${latest.to}... (Thử lần ${latest.attempts})`;
    } else if (latest.status === "success") {
      statusLabel = `Đã gửi thành công tới ${latest.to}`;
    } else {
      statusClass = "admin-email-monitor__dot--failed";
      statusLabel = `Gửi tới ${latest.to} thất bại sau 3 lần thử`;
    }

    monitor.innerHTML = `
      <span class="admin-email-monitor__dot ${statusClass}"></span>
      <div>
        <strong>Hệ thống Email</strong>
        <div class="admin-email-monitor__logs">${statusLabel}</div>
      </div>`;

    if (latest.status !== "pending") {
      setTimeout(() => {
        if (db.getEmails()[0]?.id === latest.id) monitor.style.display = "none";
      }, 5000);
    }
  },

  // ── Campaigns ──
  getCampaigns: () => db.read(DB_PREFIX + "campaigns"),
  saveCampaigns: (data) => db.write(DB_PREFIX + "campaigns", data),

  // ── Vouchers ──
  getVouchers: () => db.read(DB_PREFIX + "vouchers"),
  saveVouchers: (data) => db.write(DB_PREFIX + "vouchers", data),

  isVoucherCodeUnique: (code, excludeId) => {
    return !db.getVouchers().some(v => v.code === code && v.id !== excludeId);
  },

  // ── Bundles ──
  getBundles: () => db.read(DB_PREFIX + "bundles"),
  saveBundles: (data) => db.write(DB_PREFIX + "bundles", data),

  validateBundlePrice: (bundlePrice, productSkus) => {
    const products = db.getProducts();
    let retailTotal = 0;
    productSkus.forEach(sku => {
      const p = products.find(x => x.id === sku);
      if (p) retailTotal += p.price;
    });
    return { retailTotal, isValid: bundlePrice < retailTotal, saving: retailTotal - bundlePrice };
  },

  // ── Budgets ──
  getBudgets: () => db.read(DB_PREFIX + "budgets"),
  saveBudgets: (data) => db.write(DB_PREFIX + "budgets", data),

  checkBudgetAutoStop: () => {
    const budgets = db.getBudgets();
    const campaigns = db.getCampaigns();
    let stopped = false;
    budgets.forEach(budget => {
      if (budget.status === "warning" && budget.used >= budget.limit) {
        budget.status = "stopped";
        budget.percent = 100;
        const campaign = campaigns.find(c => c.id === budget.campaignId);
        if (campaign && campaign.status === "active") {
          campaign.status = "stopped";
          stopped = true;
          db.addLog("Hệ thống", "SYSTEM", "Tự động", "admin", "promotions", "auto_stop", "Tự động dừng chiến dịch", campaign.code, campaign.name, "warning", "attention", `Chiến dịch ${campaign.name} tự động dừng do ngân sách đã hết.`);
        }
      }
    });
    if (stopped) {
      db.saveBudgets(budgets);
      db.saveCampaigns(campaigns);
    }
  },

  // ── Returns ──
  getReturns: () => db.read(DB_PREFIX + "returns"),
  saveReturns: (data) => db.write(DB_PREFIX + "returns", data),

  // ── Tickets (CSKH) ──
  getTickets: () => db.read(DB_PREFIX + "tickets"),
  saveTickets: (data) => db.write(DB_PREFIX + "tickets", data),

  createTicketFromReview: (review, priority) => {
    const tickets = db.getTickets();
    const newTicket = {
      id: `CSKH-${Date.now().toString().slice(-4)}`,
      createdAt: getFormattedDate(),
      customer: review.customer,
      contact: review.contact,
      type: "Khiếu nại",
      content: `Đánh giá tiêu cực (${review.stars} sao): ${review.text}`,
      priority: priority || "Cao",
      status: "Mới",
      csat: "Chưa gửi",
      reviewId: review.id,
      version: 1
    };
    tickets.unshift(newTicket);
    db.saveTickets(tickets);
    return newTicket;
  },

  // ── Price History ──
  getPriceHistory: () => db.read(DB_PREFIX + "priceHistory"),
  savePriceHistory: (data) => db.write(DB_PREFIX + "priceHistory", data),

  addPriceHistory: (actor, productId, originalOld, originalNew, saleOld, saleNew, note, result) => {
    const history = db.getPriceHistory();
    history.unshift({
      time: `${getFormattedDate()} ${getFormattedTime()}`,
      actor, productId,
      originalOld, originalNew,
      saleOld, saleNew,
      note, result
    });
    db.savePriceHistory(history);
  },

  // ── Sim Panel ──
  renderSimPanel: () => {
    const sidebar = document.querySelector("#admin-sidebar");
    if (!sidebar || sidebar.querySelector(".admin-sim-panel")) return;

    const panel = document.createElement("section");
    panel.className = "admin-sim-panel";
    const isOff = db.isOffline() ? "checked" : "";
    const isErr = db.isDbError() ? "checked" : "";
    const isConf = db.isConflictSimulated() ? "checked" : "";

    panel.innerHTML = `
      <div class="admin-sim-title">
        <svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#settings"></use></svg>
        <span>Bảng thử nghiệm sandbox</span>
      </div>
      <div class="admin-sim-item">
        <span>Ngoại tuyến (Lỗi Email)</span>
        <label class="admin-sim-switch"><input type="checkbox" id="sim-offline-toggle" ${isOff}><span class="admin-sim-slider"></span></label>
      </div>
      <div class="admin-sim-item">
        <span>Mất kết nối DB (Rollback)</span>
        <label class="admin-sim-switch"><input type="checkbox" id="sim-dberror-toggle" ${isErr}><span class="admin-sim-slider"></span></label>
      </div>
      <div class="admin-sim-item">
        <span>Mô phỏng Xung đột (Lock)</span>
        <label class="admin-sim-switch"><input type="checkbox" id="sim-conflict-toggle" ${isConf}><span class="admin-sim-slider"></span></label>
      </div>`;
    sidebar.appendChild(panel);

    panel.querySelector("#sim-offline-toggle").addEventListener("change", (e) => {
      db.toggleOffline(e.target.checked);
      if (e.target.checked) {
        db.addLog("Hệ thống", "SYSTEM", "Tự động", "system", "system", "offline", "Mất kết nối mạng", "SMTP", "Máy chủ Email", "warning", "attention", "Mô phỏng mất kết nối mạng. Các email thông báo sẽ bị đưa vào hàng đợi gửi lại.");
      } else {
        db.addLog("Hệ thống", "SYSTEM", "Tự động", "system", "system", "online", "Khôi phục mạng", "SMTP", "Máy chủ Email", "success", "normal", "Khôi phục mạng thành công. Hệ thống tự động kích hoạt gửi lại các email trong hàng đợi.");
        db.processEmailQueue();
      }
    });

    panel.querySelector("#sim-dberror-toggle").addEventListener("change", (e) => {
      db.toggleDbError(e.target.checked);
      if (e.target.checked) {
        db.addLog("Hệ thống", "SYSTEM", "Tự động", "system", "system", "dberror", "Bật lỗi Database", "DB", "Cơ sở dữ liệu", "warning", "critical", "Mô phỏng lỗi kết nối Database. Mọi giao dịch lưu/sửa sẽ bị rollback tự động.");
      }
    });

    panel.querySelector("#sim-conflict-toggle").addEventListener("change", (e) => {
      db.toggleConflictSimulated(e.target.checked);
    });

    db.renderEmailMonitor();
  }
};

// Auto initialize
db.init();
