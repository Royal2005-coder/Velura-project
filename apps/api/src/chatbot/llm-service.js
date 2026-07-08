import { config } from "../config.js";

const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

const SYSTEM_PROMPT = `Bạn là AI Stylist của Velura - thương hiệu thời trang cao cấp Việt Nam. Bạn tư vấn thời trang, gợi ý sản phẩm, kiểm tra đơn hàng, và hỗ trợ khách hàng.

NGUYÊN TẮC:
- Luôn trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp
- Khi khách hỏi về sản phẩm, PHẢI dùng tool search_products để tìm sản phẩm thật từ database
- Khi khách hỏi về danh mục, dùng tool get_categories
- Khi khách hỏi kiểm tra đơn hàng (hoặc hỏi về đơn hàng), hãy hỏi mã đơn hàng hoặc số điện thoại, sau đó dùng tool get_order_status để kiểm tra
- Bảng size: S(eo 62-66cm, ngực 80-84cm), M(eo 66-70cm, ngực 84-88cm), L(eo 70-74cm, ngực 88-92cm), XL(eo 74-78cm, ngực 92-96cm)
- Miễn phí vận chuyển đơn từ 500.000đ. Đơn dưới 500.000đ phí ship 30.000đ
- Chính sách đổi trả: 7 ngày, sản phẩm chưa sử dụng, còn tem nhãn
- KHÔNG bịa đặt thông tin sản phẩm. Luôn dùng tool để lấy dữ liệu thật
- Khi khách hàng muốn khiếu nại, phản ánh hoặc tạo ticket hỗ trợ (phiếu hỗ trợ), hãy sử dụng tool create_support_ticket để tạo phiếu hỗ trợ và báo lại mã ticket chi tiết cho khách hàng theo dõi.
- Khi khách hàng chia sẻ thông tin số đo (chiều cao, cân nặng, ngực, eo, mông), dáng người hoặc tông da, hãy đề xuất cập nhật và sử dụng tool update_style_profile để lưu lại các thông tin này vào hồ sơ phong cách của họ.
- Trả lời ngắn gọn, súc tích, tập trung vào câu hỏi của khách`;

const GEMINI_TOOLS = [
  {
    type: "function",
    name: "search_products",
    description: "Tìm kiếm sản phẩm thời trang trong database theo từ khóa. Trả về danh sách sản phẩm thật.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Từ khóa tìm kiếm (VD: 'váy dự tiệc', 'áo blazer', 'đầm công sở')"
        },
        limit: {
          type: "number",
          description: "Số lượng sản phẩm (mặc định 6)"
        }
      },
      required: ["query"]
    }
  },
  {
    type: "function",
    name: "get_categories",
    description: "Lấy danh sách tất cả danh mục sản phẩm",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    type: "function",
    name: "get_product_detail",
    description: "Lấy thông tin chi tiết một sản phẩm theo ID",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "ID sản phẩm (UUID)" }
      },
      required: ["product_id"]
    }
  },
  {
    type: "function",
    name: "get_order_status",
    description: "Kiểm tra trạng thái đơn hàng của khách hàng theo mã đơn hàng (UUID) hoặc số điện thoại.",
    parameters: {
      type: "object",
      properties: {
        order_query: { type: "string", description: "Mã đơn hàng (UUID) hoặc Số điện thoại nhận hàng của khách" }
      },
      required: ["order_query"]
    }
  },
  {
    type: "function",
    name: "update_style_profile",
    description: "Cập nhật hồ sơ phong cách thời trang của người dùng hiện tại (số đo ngực/eo/mông, chiều cao, cân nặng, dáng người, tông da) khi họ cung cấp thông tin.",
    parameters: {
      type: "object",
      properties: {
        height_cm: { type: "number", description: "Chiều cao tính bằng cm (VD: 165)" },
        weight_kg: { type: "number", description: "Cân nặng tính bằng kg (VD: 55)" },
        chest_cm: { type: "number", description: "Số đo vòng ngực tính bằng cm (VD: 85)" },
        waist_cm: { type: "number", description: "Số đo vòng eo tính bằng cm (VD: 64)" },
        hip_cm: { type: "number", description: "Số đo vòng mông tính bằng cm (VD: 90)" },
        body_shape: { type: "string", description: "Dáng người (pear, hourglass, rectangle, apple, inverted_triangle)" },
        skin_tone: { type: "string", description: "Tông da (fair, medium, dark)" }
      }
    }
  },
  {
    type: "function",
    name: "create_support_ticket",
    description: "Tạo một ticket hỗ trợ mới khi người dùng gặp sự cố phức tạp, lỗi hệ thống, khiếu nại hoặc cần người liên hệ.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Tiêu đề của ticket hỗ trợ (VD: Lỗi giao hàng, Hỗ trợ size đầm dạ hội)" },
        description: { type: "string", description: "Mô tả chi tiết sự cố hoặc yêu cầu hỗ trợ" },
        email: { type: "string", description: "Email liên hệ của khách hàng" },
        phone: { type: "string", description: "Số điện thoại liên hệ của khách hàng" }
      },
      required: ["title", "description"]
    }
  }
];

export function createLLMService({ repository }) {
  if (!repository) throw new TypeError("repository is required");
  return {
    async chat(messages, contextProducts = [], previousInteractionId = null, styleProfile = null, userId = null) {
      return callMistralChat(messages, repository, contextProducts, styleProfile, userId);
    }
  };
}

async function callMistralChat(messages, repository, contextProducts = [], styleProfile = null, userId = null) {
  const apiKey = config.mistralApiKey;
  console.log("[LLM] callMistralChat called, apiKey:", apiKey ? apiKey.substring(0, 8) + "..." : "MISSING");
  if (!apiKey) {
    console.log("[LLM] No API key, skipping");
    return { text: "", productIds: [], used: false, intent: "" };
  }

  let styleContext = "";
  if (styleProfile) {
    styleContext = `\n\nStyle Profile của Khách hàng:
- Chiều cao: ${styleProfile.height_cm || "chưa rõ"} cm
- Cân nặng: ${styleProfile.weight_kg || "chưa rõ"} kg
- Số đo 3 vòng: Ngực ${styleProfile.chest_cm || "chưa rõ"}cm, Eo ${styleProfile.waist_cm || "chưa rõ"}cm, Mông ${styleProfile.hip_cm || "chưa rõ"}cm
- Dáng người: ${styleProfile.body_shape || "chưa rõ"}
- Tông da: ${styleProfile.skin_tone || "chưa rõ"}
- Phong cách: ${(styleProfile.style_tags || []).join(", ") || "chưa rõ"}
- Dịp ưa thích: ${(styleProfile.preferred_occasions || []).join(", ") || "chưa rõ"}
- Ngân sách: ${styleProfile.budget_range || "chưa rõ"}`;
  }

  const productContext = contextProducts.length
    ? `\n\nSản phẩm có sẵn trong database:\n${contextProducts.map(p => `- ID: ${p.product_id}, Tên: ${p.name}, Giá: ${(p.sale_price || p.base_price).toLocaleString('vi-VN')}đ, SKU: ${p.sku}`).join('\n')}`
    : "";

  const systemContent = SYSTEM_PROMPT + styleContext + productContext;

  const apiMessages = [
    { role: "system", content: systemContent }
  ];

  const historyMessages = messages.filter(m => !m.metadata?.system);
  for (const m of historyMessages) {
    const role = m.sender === "user" ? "user" : "assistant";
    apiMessages.push({ role, content: m.text });
  }

  const MISTRAL_TOOLS = GEMINI_TOOLS.map(t => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));

  try {
    console.log("[LLM] Calling Mistral API:", config.mistralModel);

    const body = {
      model: config.mistralModel || "mistral-large-latest",
      messages: apiMessages,
      tools: MISTRAL_TOOLS,
      tool_choice: "auto"
    };

    let response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[LLM] Mistral error:", response.status, err.substring(0, 300));
      return { text: "", productIds: [], used: false, intent: "llm_error", metadata: { error: err } };
    }

    let data = await response.json();
    console.log("[LLM] Response ID:", data.id);

    let choice = data.choices?.[0];
    let assistantMessage = choice?.message;
    let finalText = assistantMessage?.content || "";
    let allProductIds = [];
    let usedTools = [];
    let createdTicket = null;

    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("[LLM] Tool calls found:", assistantMessage.tool_calls.length);
      
      apiMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const name = toolCall.function.name;
        let args = {};
        try {
          args = typeof toolCall.function.arguments === "string" 
            ? JSON.parse(toolCall.function.arguments) 
            : (toolCall.function.arguments || {});
        } catch (e) {
          console.error("[LLM] Failed to parse arguments for tool", name, e);
        }

        usedTools.push(name);
        console.log("[LLM] Tool call:", name, JSON.stringify(args));
        
        const toolResult = await executeToolCall(name, args, repository, userId);
        if (toolResult.products) {
          allProductIds.push(...toolResult.products.map(p => p.product_id));
        }
        if (name === "create_support_ticket" && toolResult.ticket) {
          createdTicket = toolResult.ticket;
        }

        apiMessages.push({
          role: "tool",
          name: name,
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      console.log("[LLM] Calling Mistral again after tool execution...");
      response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.mistralModel || "mistral-large-latest",
          messages: apiMessages
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("[LLM] Mistral follow-up error:", response.status, err.substring(0, 300));
        return { text: "", productIds: [], used: false, intent: "llm_error", metadata: { error: err } };
      }

      data = await response.json();
      choice = data.choices?.[0];
      finalText = choice?.message?.content || "";
    }

    console.log("[LLM] Final reply length:", finalText.length, "Products:", allProductIds.length);
    return {
      text: finalText.trim().slice(0, 4000),
      productIds: [...new Set(allProductIds)].slice(0, 6),
      used: true,
      intent: detectIntent(usedTools, messages),
      interactionId: data.id,
      createdTicket,
      metadata: { tools_used: usedTools, model: config.mistralModel || "mistral-large-latest" }
    };
  } catch (error) {
    console.error("[LLM] Error in callMistralChat:", error.message);
    return { text: "", productIds: [], used: false, intent: "llm_error", metadata: { error: error.message } };
  }
}

async function executeToolCall(name, args, repository, userId = null) {
  switch (name) {
    case "search_products": {
      const result = await repository.searchProducts(args.query || "", args.limit || 6);
      const products = (result.rows || []).slice(0, args.limit || 6);
      return {
        products,
        summary: products.length
          ? products.map(p => `${p.name} - ${(p.sale_price || p.base_price).toLocaleString('vi-VN')}đ`).join('\n')
          : "Không tìm thấy sản phẩm phù hợp"
      };
    }
    case "get_categories": {
      const result = await repository.listCategories?.() || { rows: [] };
      return { categories: result.rows || [], summary: (result.rows || []).map(c => c.name).join(', ') };
    }
    case "get_product_detail": {
      const result = await repository.getProductById?.(args.product_id) || null;
      return {
        product: result,
        summary: result ? `${result.name} - ${(result.sale_price || result.base_price).toLocaleString('vi-VN')}đ` : 'Không tìm thấy'
      };
    }
    case "get_order_status": {
      const q = String(args.order_query || "").trim();
      if (!q) return { error: "Yêu cầu mã đơn hàng hoặc số điện thoại" };
      
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q);
      const filter = {};
      if (isUuid) {
        filter.order_id = `eq.${q}`;
      } else {
        filter.or = `(tracking_code.eq.${q},shipping_phone.eq.${q})`;
      }
      
      const result = await repository.searchOrders?.(filter) || { rows: [] };
      const orders = result.rows || [];
      if (!orders.length) {
        return { summary: `Không tìm thấy đơn hàng nào khớp với thông tin "${q}".` };
      }
      
      const details = orders.map(o => {
        const dateStr = new Date(o.order_date).toLocaleDateString("vi-VN");
        const amountStr = Number(o.total_amount || 0).toLocaleString("vi-VN") + "đ";
        const statusMap = {
          pending: "Đang chờ xử lý",
          confirmed: "Đã xác nhận",
          preparing: "Đang chuẩn bị hàng",
          shipping: "Đang giao hàng",
          delivered: "Đã giao hàng thành công",
          failed_delivery: "Giao hàng thất bại",
          cancelled: "Đã hủy đơn",
          completed: "Đơn hàng hoàn tất"
        };
        const statusText = statusMap[o.status] || o.status;
        return `Đơn hàng ${o.order_id.substring(0, 8)}... (${dateStr}): Trạng thái: ${statusText}, Tổng tiền: ${amountStr}, Mã vận đơn: ${o.tracking_code || 'Chưa có'}`;
      }).join("\n");
      
      return { orders, summary: details };
    }
    case "update_style_profile": {
      if (!userId) {
        return { error: "Bạn cần đăng nhập dưới quyền Thành viên để lưu trữ vĩnh viễn hồ sơ phong cách này." };
      }
      const updated = await repository.updateStyleProfile(userId, args);
      return {
        profile: updated,
        summary: `Đã cập nhật hồ sơ phong cách thành công với các thông số: ${Object.entries(args).map(([k, v]) => `${k}: ${v}`).join(', ')}.`
      };
    }
    case "create_support_ticket": {
      const ticket = await repository.createSupportTicket({
        profileUserId: userId || null,
        guestEmail: args.email || null,
        guestPhone: args.phone || null,
        title: args.title,
        description: args.description,
        priority: "high"
      });
      return {
        ticket,
        summary: `Tạo ticket thành công. Mã ticket hỗ trợ của bạn là: ${ticket.ticket_id}. CSKH của Velura đã được thông báo và sẽ phản hồi qua email ${args.email || 'của bạn'} trong vòng 24 giờ. Bạn có thể theo dõi ticket này.`
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function detectIntent(tools, messages) {
  const last = messages[messages.length - 1]?.text?.toLowerCase() || "";
  if (tools.includes("get_order_status")) return "order_query";
  if (tools.includes("search_products")) return "product_search";
  if (tools.includes("get_categories")) return "category_browse";
  if (tools.includes("get_product_detail")) return "product_detail";
  if (tools.includes("update_style_profile")) return "style_update";
  if (tools.includes("create_support_ticket")) return "ticket_creation";
  if (/(đơn hàng|order|tracking)/.test(last)) return "order_query";
  if (/(size|kích cỡ)/.test(last)) return "size_query";
  if (/(chính sách|đổi trả|bảo hành)/.test(last)) return "policy_query";
  return "general";
}
