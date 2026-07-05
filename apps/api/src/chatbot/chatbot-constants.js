export const CHAT_SESSION_SELECT = [
  "session_id",
  "user_id",
  "profile_user_id",
  "guest_id",
  "title",
  "source",
  "is_active",
  "handoff_status",
  "support_ticket_id",
  "last_message_preview",
  "last_message_at",
  "metadata",
  "assigned_to",
  "created_at",
  "updated_at",
  "support_ticket:support_ticket(ticket_id,status,priority,admin_reply,created_at,resolved_at,version)"
].join(",");

export const CHAT_MESSAGE_SELECT = [
  "message_id",
  "session_id",
  "sender",
  "text",
  "metadata",
  "product_ids",
  "created_at"
].join(",");

export const CHAT_PRODUCT_SELECT = [
  "product_id",
  "sku",
  "is_combo",
  "name",
  "slug",
  "description",
  "category_id",
  "brand",
  "base_price",
  "sale_price",
  "images",
  "style_tags",
  "color_tone",
  "occasions",
  "suitable_body_shapes",
  "status",
  "is_featured",
  "collection",
  "category:category(category_id,name,slug)",
  "variants:variant(variant_id,color,color_hex,size,stock_quantity,reserved_quantity)"
].join(",");

export const CHAT_SUPPORT_ROLES = [
  "super_admin",
  "admin_operator_cskh_dt"
];

export const DEFAULT_ASSISTANT_GREETING =
  "Chào bạn, mình là AI Stylist của Velura. Bạn cần tìm outfit, chọn size hay muốn được gợi ý sản phẩm hôm nay?";

export const HANDOFF_REPLY =
  "Mình đã ghi nhận yêu cầu gặp nhân viên chăm sóc khách hàng. Velura sẽ nối bạn với tư vấn viên ngay, bạn vui lòng chờ trong giây lát nhé.";
