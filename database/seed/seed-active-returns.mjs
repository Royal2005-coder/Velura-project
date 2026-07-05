import fs from "fs";

const SUPABASE_URL = "https://drvkrpoojyncodfytftn.supabase.co";

let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!SERVICE_KEY) {
  try {
    const env = fs.readFileSync(new URL("../../.env", import.meta.url), "utf8");
    const match = env.match(/VELURA_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    if (match) SERVICE_KEY = match[1].trim();
  } catch {}
}

if (!SERVICE_KEY) {
  console.error("Error: Supabase Service Role Key not found in .env!");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  authorization: `Bearer ${SERVICE_KEY}`,
  accept: "application/json",
  prefer: "return=representation",
  "content-type": "application/json"
};

async function run() {
  console.log("Seeding fresh returns and tickets data...");

  // 1. Fetch some existing orders
  const ordersRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?limit=20`, { headers });
  if (!ordersRes.ok) {
    console.error("Failed to fetch orders:", await ordersRes.text());
    process.exit(1);
  }
  let orders = await ordersRes.json();
  console.log(`Fetched ${orders.length} orders from Supabase.`);

  let selectedOrder = null;
  let userId = null;
  let orderItemId = null;

  // Let's loop through existing orders to find one that has order items
  for (const order of orders) {
    const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/order_item?order_id=eq.${order.order_id}&limit=1`, { headers });
    if (itemsRes.ok) {
      const items = await itemsRes.json();
      if (items.length > 0) {
        selectedOrder = order;
        userId = order.user_id;
        orderItemId = items[0].item_id;
        console.log(`Found order with items: ${order.order_id}. User: ${userId}. Item ID: ${orderItemId}`);
        break;
      }
    }
  }

  // If no order with items was found, let's create a mock one
  if (!selectedOrder) {
    console.log("No orders with items found. Creating a mock user, order and order item...");
    
    // Find a user or create one
    const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?limit=1`, { headers });
    const users = await userRes.json();
    if (users.length > 0) {
      userId = users[0].user_id;
    } else {
      userId = "e0000000-0000-4000-8000-000000000001";
      const mockUser = {
        user_id: userId,
        email: "customer@velura.vn",
        full_name: "Nguyễn Văn Khách",
        role: "user",
        is_active: true,
        is_verified: true
      };
      await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(mockUser)
      });
    }

    selectedOrder = {
      order_id: "d0000000-0000-4000-8000-000000000001",
      user_id: userId,
      total_price: 1500000,
      payment_status: "paid",
      order_status: "completed",
      full_name: "Nguyễn Văn Khách",
      phone: "0987654321",
      shipping_address: "123 Đường Láng, Hà Nội"
    };

    // Clean delete if exists
    await fetch(`${SUPABASE_URL}/rest/v1/orders?order_id=eq.${selectedOrder.order_id}`, {
      method: "DELETE",
      headers
    });

    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(selectedOrder)
    });
    
    if (!orderRes.ok) {
      console.error("Failed to insert mock order:", await orderRes.text());
      process.exit(1);
    }
    console.log("Mock order created.");

    // Create a mock order item
    const mockItem = {
      item_id: "c0000000-0000-4000-8000-000000000001",
      order_id: selectedOrder.order_id,
      product_id: null,
      variant_id: null,
      quantity: 1,
      price: 1500000
    };

    const productsRes = await fetch(`${SUPABASE_URL}/rest/v1/products?limit=1`, { headers });
    const products = await productsRes.json();
    if (products.length > 0) {
      mockItem.product_id = products[0].product_id;
    }
    
    const variantsRes = await fetch(`${SUPABASE_URL}/rest/v1/product_variants?limit=1`, { headers });
    const variants = await variantsRes.json();
    if (variants.length > 0) {
      mockItem.variant_id = variants[0].variant_id;
    }

    // Clean delete if exists
    await fetch(`${SUPABASE_URL}/rest/v1/order_item?item_id=eq.${mockItem.item_id}`, {
      method: "DELETE",
      headers
    });

    const itemRes = await fetch(`${SUPABASE_URL}/rest/v1/order_item`, {
      method: "POST",
      headers,
      body: JSON.stringify(mockItem)
    });
    if (!itemRes.ok) {
      console.error("Failed to insert mock order item:", await itemRes.text());
      process.exit(1);
    }
    orderItemId = mockItem.item_id;
    console.log("Mock order item created.");
  }

  // 3. Clear existing return records and seed them
  const seedReturns = [
    {
      return_id: "f0000000-0000-4000-8000-000000000001",
      order_id: selectedOrder.order_id,
      user_id: userId,
      return_type: "refund",
      description: "Sản phẩm bị lỗi đường may bên hông và có màu sắc không giống hình ảnh quảng cáo.",
      evidence_images: ["https://placehold.co/600x400/png?text=Evidence1", "https://placehold.co/600x400/png?text=Evidence2"],
      status: "pending",
      version: 1,
      created_at: new Date().toISOString()
    },
    {
      return_id: "f0000000-0000-4000-8000-000000000002",
      order_id: selectedOrder.order_id,
      user_id: userId,
      return_type: "exchange",
      description: "Kích thước quá rộng so với cơ thể, tôi muốn đổi sang size S.",
      evidence_images: ["https://placehold.co/600x400/png?text=SizeExchange"],
      status: "pending",
      version: 1,
      created_at: new Date().toISOString()
    },
    {
      return_id: "f0000000-0000-4000-8000-000000000003",
      order_id: selectedOrder.order_id,
      user_id: userId,
      return_type: "refund",
      description: "Chất liệu thô ráp, không thoải mái khi mặc thử.",
      status: "approved",
      version: 1,
      admin_note: "Chấp nhận hoàn tiền sau khi nhận được hàng.",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      return_id: "f0000000-0000-4000-8000-000000000004",
      order_id: selectedOrder.order_id,
      user_id: userId,
      return_type: "exchange",
      description: "Gửi nhầm mã sản phẩm, đặt màu đen nhưng nhận màu đỏ.",
      status: "received",
      version: 1,
      admin_note: "Đã nhận hàng hoàn trả về kho. Chờ kiểm tra sản phẩm.",
      created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
    },
    {
      return_id: "f0000000-0000-4000-8000-000000000005",
      order_id: selectedOrder.order_id,
      user_id: userId,
      return_type: "refund",
      description: "Hàng bị ướt sũng khi giao tới do đóng gói sơ sài.",
      status: "completed",
      version: 1,
      admin_note: "Đã hoàn tất chuyển khoản hoàn tiền qua Techcombank.",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      return_id: "f0000000-0000-4000-8000-000000000006",
      order_id: selectedOrder.order_id,
      user_id: userId,
      return_type: "exchange",
      description: "Chất liệu mỏng hơn tưởng tượng, muốn đổi sang sản phẩm khác dày dặn hơn.",
      status: "shipping_back",
      version: 1,
      admin_note: "Đang vận chuyển ngược từ khách hàng.",
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    },
    {
      return_id: "f0000000-0000-4000-8000-000000000007",
      order_id: selectedOrder.order_id,
      user_id: userId,
      return_type: "refund",
      description: "Tôi không muốn lấy hàng nữa vì giao trễ hẹn 1 ngày.",
      status: "rejected",
      version: 1,
      admin_note: "Từ chối vì lý do giao trễ 1 ngày không nằm trong điều khoản đổi trả của Velura.",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      return_id: "f0000000-0000-4000-8000-000000000008",
      order_id: selectedOrder.order_id,
      user_id: userId,
      return_type: "refund",
      description: "Yêu cầu đổi trả quá hạn 48 giờ để kiểm tra tính năng tự động từ chối/ẩn của hệ thống.",
      status: "pending",
      version: 1,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Clean delete return items first to avoid foreign key constraint errors
  for (const ret of seedReturns) {
    await fetch(`${SUPABASE_URL}/rest/v1/return_item?return_id=eq.${ret.return_id}`, {
      method: "DELETE",
      headers
    });
  }

  for (const ret of seedReturns) {
    // Delete existing with same ID to allow clean re-runs
    await fetch(`${SUPABASE_URL}/rest/v1/return_exchange?return_id=eq.${ret.return_id}`, {
      method: "DELETE",
      headers
    });

    const retRes = await fetch(`${SUPABASE_URL}/rest/v1/return_exchange`, {
      method: "POST",
      headers,
      body: JSON.stringify(ret)
    });

    if (!retRes.ok) {
      console.error(`Failed to insert return ${ret.return_id}:`, await retRes.text());
      continue;
    }

    console.log(`Seeded return ${ret.return_id} (${ret.status})`);

    // Seed return item
    const retItem = {
      return_id: ret.return_id,
      order_item_id: orderItemId,
      quantity: 1
    };

    await fetch(`${SUPABASE_URL}/rest/v1/return_item`, {
      method: "POST",
      headers,
      body: JSON.stringify(retItem)
    });
  }

  // 4. Seed support tickets to verify action processing
  const seedTickets = [
    {
      ticket_id: "fa000000-0000-4000-8000-000000000001",
      user_id: userId,
      title: "Yêu cầu thay đổi thông tin giao nhận đơn hàng",
      description: "Tôi muốn thay đổi địa chỉ nhận hàng từ 123 Đường Láng sang 456 Kim Mã, Hà Nội.",
      priority: "high",
      status: "open",
      version: 1,
      created_at: new Date().toISOString()
    },
    {
      ticket_id: "fa000000-0000-4000-8000-000000000002",
      user_id: userId,
      title: "Hỏi về chương trình hoàn tiền ví điện tử",
      description: "Thanh toán bằng ví MoMo có được nhận hoàn tiền 10% như banner quảng cáo không?",
      priority: "medium",
      status: "processing",
      version: 2,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      ticket_id: "fa000000-0000-4000-8000-000000000003",
      user_id: userId,
      title: "Khiếu nại sản phẩm lỗi khi nhận hàng",
      description: "Kính mát tôi nhận bị trầy xước nhẹ ở mặt ngoài, đề nghị hỗ trợ.",
      priority: "high",
      status: "open",
      version: 1,
      created_at: new Date().toISOString()
    },
    {
      ticket_id: "fa000000-0000-4000-8000-000000000004",
      user_id: userId,
      title: "Tư vấn chọn size váy maxi mùa hè",
      description: "Số đo 85-64-90 thì mặc size nào vừa vặn và tôn dáng nhất?",
      priority: "low",
      status: "resolved",
      version: 1,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const ticket of seedTickets) {
    await fetch(`${SUPABASE_URL}/rest/v1/support_ticket?ticket_id=eq.${ticket.ticket_id}`, {
      method: "DELETE",
      headers
    });

    const ticketRes = await fetch(`${SUPABASE_URL}/rest/v1/support_ticket`, {
      method: "POST",
      headers,
      body: JSON.stringify(ticket)
    });

    if (!ticketRes.ok) {
      console.error(`Failed to insert ticket ${ticket.ticket_id}:`, await ticketRes.text());
      continue;
    }

    console.log(`Seeded support ticket ${ticket.ticket_id} (${ticket.status})`);
  }

  console.log("Returns and support tickets seeding completed successfully!");
}

run().catch((err) => {
  console.error("Seeding script crashed:", err);
  process.exit(1);
});
