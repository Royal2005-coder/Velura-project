import { HttpError, readJson, sendJson } from "./http.js";
import { selectOne, selectRows, insertRow, updateRows, deleteRows } from "./supabase.js";
import { hashPassword, verifyPassword, signJwt } from "./auth-helper.js";

// Helper to validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Helper to validate password (AUTH-04: min 8 chars, 1 uppercase, 1 lowercase, 1 number/special)
function validatePassword(password) {
  if (!password || password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigitOrSpecial = /[\d\W]/.test(password);
  return hasUppercase && hasLowercase && hasDigitOrSpecial;
}

// Helper to enforce authentication on routes
function requireUserAuth(context) {
  if (!context || !context.profile || !context.profile.user_id) {
    throw new HttpError(401, "UNAUTHORIZED", "Đăng nhập là bắt buộc để thực hiện thao tác này");
  }
  return context.profile;
}

// Helper to parse Postgres date as UTC robustly
function parseUtcDate(dateStr) {
  if (!dateStr) return new Date();
  const cleanStr = dateStr.replace(" ", "T");
  if (!cleanStr.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(cleanStr)) {
    return new Date(cleanStr + "Z");
  }
  return new Date(cleanStr);
}

// Auto-progress order statuses based on time elapsed since creation
async function autoProgressOrder(order) {
  if (!order || ["cancelled", "completed", "failed_delivery"].includes(order.status)) {
    return order;
  }

  const createdAt = parseUtcDate(order.created_at);
  const now = new Date();
  const elapsedSeconds = Math.floor((now - createdAt) / 1000);

  let newStatus = order.status;
  let deliveredAt = order.delivered_at;
  let trackingCode = order.tracking_code;
  let changed = false;

  // 1. Time-based progression for intermediate states (1 minute = 60s per step)
  if (order.status === "pending" && elapsedSeconds >= 60) {
    newStatus = "confirmed";
    changed = true;
  }
  if (["pending", "confirmed"].includes(newStatus) && elapsedSeconds >= 120) {
    newStatus = "preparing";
    changed = true;
  }
  if (["pending", "confirmed", "preparing"].includes(newStatus) && elapsedSeconds >= 180) {
    newStatus = "shipping";
    if (!trackingCode) {
      trackingCode = "VN" + Math.floor(100000000 + Math.random() * 900000000);
    }
    changed = true;
  }
  if (["pending", "confirmed", "preparing", "shipping"].includes(newStatus) && elapsedSeconds >= 240) {
    newStatus = "delivered";
    if (!deliveredAt) {
      deliveredAt = now.toISOString();
    }
    changed = true;
  }

  // 2. Auto-complete: if delivered for more than 60 seconds (1 minute), auto transition to completed
  if (newStatus === "delivered" && deliveredAt) {
    const deliveredTime = new Date(deliveredAt);
    const elapsedSinceDelivery = Math.floor((now - deliveredTime) / 1000);
    if (elapsedSinceDelivery >= 60) {
      newStatus = "completed";
      changed = true;
    }
  }

  if (changed) {
    const updateData = {
      status: newStatus,
      updated_at: now.toISOString()
    };
    if (deliveredAt) {
      updateData.delivered_at = deliveredAt;
    }
    if (trackingCode) {
      updateData.tracking_code = trackingCode;
    }
    
    try {
      await updateRows("orders", { order_id: `eq.${order.order_id}` }, updateData);
    } catch (e) {
      console.error(`Failed to auto-progress order ${order.order_id}:`, e.message);
    }
    
    return {
      ...order,
      status: newStatus,
      delivered_at: deliveredAt,
      tracking_code: trackingCode,
      updated_at: updateData.updated_at
    };
  }

  return order;
}

// Calculate total amount to refund for a return request
async function calculateReturnAmount(returnId) {
  const { rows: items } = await selectRows("return_item", { return_id: `eq.${returnId}` });
  let total = 0;
  for (const item of items) {
    const orderItem = await selectOne("order_item", { item_id: `eq.${item.order_item_id}` });
    if (orderItem) {
      total += Number(orderItem.unit_price) * Number(item.quantity);
    }
  }
  return total;
}

// Process refund status in payment
async function processRefundPayment(orderId, refundAmount) {
  const payment = await selectOne("payment", { order_id: `eq.${orderId}` });
  if (payment) {
    await updateRows("payment", { payment_id: `eq.${payment.payment_id}` }, {
      payment_status: "refunded",
      refund_amount: refundAmount,
      refund_at: new Date().toISOString()
    });
  }
}

// Create new exchange order
async function createExchangeOrder(ret, exchangeVariantId) {
  const originalOrder = await selectOne("orders", { order_id: `eq.${ret.order_id}` });
  if (!originalOrder) {
    throw new Error("Không tìm thấy đơn hàng gốc");
  }

  // Get returned items
  const { rows: returnItems } = await selectRows("return_item", { return_id: `eq.${ret.return_id}` });
  if (returnItems.length === 0) {
    throw new Error("Không tìm thấy sản phẩm trả về");
  }

  // Find the variant we are exchanging to (or default to the returned variant)
  let targetVariantId = exchangeVariantId;
  if (!targetVariantId) {
    const firstReturnItem = returnItems[0];
    const originalOrderItem = await selectOne("order_item", { item_id: `eq.${firstReturnItem.order_item_id}` });
    if (originalOrderItem) {
      targetVariantId = originalOrderItem.variant_id;
    }
  }

  if (!targetVariantId) {
    throw new Error("Không xác định được sản phẩm đổi mới");
  }

  const v = await selectOne("variant", { variant_id: `eq.${targetVariantId}` });
  if (!v) {
    throw new Error("Variant đổi mới không tồn tại");
  }

  const p = await selectOne("product", { product_id: `eq.${v.product_id}` });
  if (!p) {
    throw new Error("Product đổi mới không tồn tại");
  }

  // Calculate pricing
  const firstReturnItem = returnItems[0];
  const originalOrderItem = await selectOne("order_item", { item_id: `eq.${firstReturnItem.order_item_id}` });
  const originalUnitPrice = originalOrderItem ? Number(originalOrderItem.unit_price) : 0;
  const newUnitPrice = Number(p.sale_price);

  const qty = firstReturnItem.quantity;
  const originalTotal = originalUnitPrice * qty;
  const newTotal = newUnitPrice * qty;

  const priceDiff = newTotal - originalTotal; // positive if new is more expensive

  let orderStatus = "confirmed";
  let paymentStatus = "paid";
  
  if (priceDiff > 0) {
    orderStatus = "pending"; // waiting for additional payment
    paymentStatus = "pending";
  }

  // Create new order
  const trackingCode = "EXC" + Date.now().toString().slice(-8).toUpperCase();
  const exchangeOrder = await insertRow("orders", {
    user_id: ret.user_id,
    status: orderStatus,
    shipping_name: originalOrder.shipping_name,
    shipping_phone: originalOrder.shipping_phone,
    shipping_address: originalOrder.shipping_address,
    shipping_fee: 0, // exchange is free shipping
    discount_amount: priceDiff > 0 ? originalTotal : newTotal,
    subtotal: newTotal,
    total_amount: priceDiff > 0 ? priceDiff : 0,
    payment_method: originalOrder.payment_method,
    tracking_code: trackingCode,
    internal_note: `Đơn hàng đổi mới từ yêu cầu ${ret.tracking_return_code}. Chênh lệch: ${priceDiff}₫`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Create order item for the exchange order
  await insertRow("order_item", {
    order_id: exchangeOrder.order_id,
    variant_id: targetVariantId,
    product_name: p.name,
    product_image: (p.images && p.images[0]) || null,
    quantity: qty,
    unit_price: newUnitPrice,
    subtotal_item: newTotal
  });

  // Create payment record
  await insertRow("payment", {
    order_id: exchangeOrder.order_id,
    payment_method: originalOrder.payment_method,
    amount: priceDiff > 0 ? priceDiff : 0,
    payment_status: paymentStatus,
    created_at: new Date().toISOString()
  });

  // If priceDiff is negative, refund the difference
  if (priceDiff < 0) {
    await processRefundPayment(ret.order_id, Math.abs(priceDiff));
  }

  return exchangeOrder;
}

// Auto-progress return status based on elapsed time since creation
async function autoProgressReturn(ret) {
  if (!ret || ["completed", "rejected"].includes(ret.status)) {
    return ret;
  }

  const createdAt = parseUtcDate(ret.created_at);
  const now = new Date();
  const elapsedSeconds = Math.floor((now - createdAt) / 1000);

  let newStatus = ret.status;
  let changed = false;
  let rejectionReason = ret.rejection_reason;
  let conditionCheckResult = ret.condition_check_result;
  let refundAmount = ret.refund_amount;
  let exchangeOrderId = ret.exchange_order_id;
  let adminNote = ret.admin_note;

  // 1. pending -> approved / rejected (after 30 seconds)
  if (newStatus === "pending" && elapsedSeconds >= 30) {
    const desc = (ret.description || "").toLowerCase();
    if (desc.includes("violation")) {
      newStatus = "rejected";
      rejectionReason = "Không đạt tiêu chuẩn hồ sơ (chụp thiếu ảnh/mác bẩn)";
    } else {
      newStatus = "approved";
    }
    changed = true;
  }

  // 2. approved -> shipping_back (after 60 seconds)
  if (newStatus === "approved" && elapsedSeconds >= 60) {
    newStatus = "shipping_back";
    changed = true;
  }

  // 3. shipping_back -> received (after 90 seconds)
  if (newStatus === "shipping_back" && elapsedSeconds >= 90) {
    newStatus = "received";
    changed = true;
  }

  // 4. received -> completed / rejected (after 120 seconds)
  if (newStatus === "received" && elapsedSeconds >= 120) {
    const desc = (ret.description || "").toLowerCase();

    // Tình huống 3: Hàng hoàn trả bị hư hỏng nặng khi kiểm kho -> Từ chối
    if (desc.includes("transit_damage") && !desc.includes("minor_damage")) {
      newStatus = "rejected";
      rejectionReason = "Sản phẩm hoàn trả bị hư hỏng nặng trong quá trình vận chuyển";
      changed = true;
    } else {
      newStatus = "completed";
      changed = true;

      // Handle branches: refund vs exchange
      let returnType = ret.return_type;

      // Tình huống 4: Hết mẫu đổi trả -> Tự động rẽ nhánh sang hoàn tiền
      if (desc.includes("stock_out") && returnType === "exchange") {
        returnType = "refund";
        adminNote = "Stock Out - Refunded instead";
      }

      if (returnType === "refund") {
        // Tình huống 6: Lỗi cổng thanh toán
        if (desc.includes("payment_error")) {
          refundAmount = await calculateReturnAmount(ret.return_id);
          adminNote = "Refund Failed: Lỗi cổng thanh toán. Cần xử lý thủ công (Manual Review Required)";
          const payment = await selectOne("payment", { order_id: `eq.${ret.order_id}` });
          if (payment) {
            await updateRows("payment", { payment_id: `eq.${payment.payment_id}` }, {
              payment_status: "failed",
              refund_amount: refundAmount,
              refund_reason: "Lỗi cổng thanh toán khi hoàn tiền tự động",
              refund_at: new Date().toISOString()
            });
          }
        } else {
          refundAmount = await calculateReturnAmount(ret.return_id);
          await processRefundPayment(ret.order_id, refundAmount);
        }
      } else if (returnType === "exchange") {
        // Tình huống 7: Đổi hàng thành công (Hao tổn nhẹ)
        if (desc.includes("minor_damage")) {
          conditionCheckResult = "minor_damage";
        } else {
          conditionCheckResult = "passed";
        }

        // Tình huống 5: Chênh lệch giá khi đổi hàng
        // Check if desc has "exchange_to: [variant_id]"
        let exchangeVariantId = null;
        const match = desc.match(/exchange_to:\s*([a-f0-9-]+)/);
        if (match) {
          exchangeVariantId = match[1];
        }

        try {
          const exchangeOrder = await createExchangeOrder(ret, exchangeVariantId);
          exchangeOrderId = exchangeOrder.order_id;
        } catch (err) {
          console.error("Failed to create exchange order:", err.message);
          // If creation fails (e.g. invalid variant), fallback to refund
          returnType = "refund";
          refundAmount = await calculateReturnAmount(ret.return_id);
          await processRefundPayment(ret.order_id, refundAmount);
        }
      }
    }
  }

  if (changed) {
    const updateData = {
      status: newStatus,
      rejection_reason: rejectionReason || null,
      condition_check_result: conditionCheckResult || null,
      refund_amount: refundAmount || null,
      exchange_order_id: exchangeOrderId || null,
      admin_note: adminNote || null,
      resolved_at: ["completed", "rejected"].includes(newStatus) ? now.toISOString() : null
    };

    try {
      await updateRows("return_exchange", { return_id: `eq.${ret.return_id}` }, updateData);
    } catch (e) {
      console.error(`Failed to auto-progress return ${ret.return_id}:`, e.message);
    }

    return {
      ...ret,
      ...updateData
    };
  }

  return ret;
}


export async function handleUserRoute(req, res, parts, corsHeaders, context) {
  const subRoute = parts[2]; // e.g. "auth", "profile", "addresses", "style-quiz", "wishlist", "orders", "reviews", "returns"
  const action = parts[3];   // e.g. "signup", "signin", or order ID, etc.

  // ==================================================================
  // PUBLIC: PRODUCTS & CATALOG
  // ==================================================================
  if (subRoute === "products") {
    if (req.method === "GET") {
      if (action) {
        const product = await selectOne("product", { product_id: `eq.${action}` }, { useAnonKey: true });
        if (!product) {
          throw new HttpError(404, "NOT_FOUND", "Không tìm thấy sản phẩm");
        }
        let variants = [];
        if (product.is_combo) {
          const { rows: comboItems } = await selectRows("combo_item", { combo_product_id: `eq.${product.product_id}` }, { useAnonKey: true });
          const variantIds = comboItems.map(ci => ci.component_variant_id).filter(Boolean);
          if (variantIds.length > 0) {
            const { rows: compVariants } = await selectRows("variant", { variant_id: `in.(${variantIds.join(",")})` }, { useAnonKey: true });
            variants = compVariants.map(v => ({ ...v, product_id: product.product_id }));
          }
        } else {
          const { rows: dbVariants } = await selectRows("variant", { product_id: `eq.${action}` }, { useAnonKey: true });
          variants = dbVariants;
        }
        const category = product.category_id ? await selectOne("category", { category_id: `eq.${product.category_id}` }, { useAnonKey: true }) : null;
        
        // Fetch approved reviews for this product
        const { rows: dbReviews } = await selectRows("review", {
          product_id: `eq.${action}`,
          status: "eq.approved"
        }, { useAnonKey: true });
        
        let reviews = [];
        if (dbReviews && dbReviews.length > 0) {
          const userIds = [...new Set(dbReviews.map(r => r.user_id))];
          const { rows: reviewUsers } = await selectRows("users", {
            user_id: `in.(${userIds.join(",")})`
          }, { useAnonKey: true });
          const userMap = new Map(reviewUsers.map(u => [u.user_id, u.full_name]));
          reviews = dbReviews.map(r => ({
            ...r,
            user_full_name: userMap.get(r.user_id) || "Khách hàng ẩn danh"
          }));
        }

        return sendJson(res, 200, { ...product, variants, category, reviews }, corsHeaders);
      }

      const { rows: products } = await selectRows("product", { status: "eq.on_sale" }, { useAnonKey: true });
      
      let allVariants = [];
      let variantOffset = 0;
      const variantLimit = 1000;
      while (true) {
        const { rows } = await selectRows("variant", { limit: variantLimit, offset: variantOffset }, { useAnonKey: true });
        if (rows.length === 0) break;
        allVariants = allVariants.concat(rows);
        if (rows.length < variantLimit) break;
        variantOffset += variantLimit;
      }

      const { rows: categories } = await selectRows("category", {}, { useAnonKey: true });
      const { rows: comboItems } = await selectRows("combo_item", {}, { useAnonKey: true });
      
      const productsWithVariants = products.map(p => {
        let variants = [];
        if (p.is_combo) {
          const itemVariantIds = comboItems
            .filter(ci => ci.combo_product_id === p.product_id)
            .map(ci => ci.component_variant_id);
          variants = allVariants
            .filter(v => itemVariantIds.includes(v.variant_id))
            .map(v => ({ ...v, product_id: p.product_id }));
        } else {
          variants = allVariants.filter(v => v.product_id === p.product_id);
        }
        const category = categories.find(c => c.category_id === p.category_id);
        return { ...p, variants, category_slug: category ? category.slug : null, category_name: category ? category.name : null };
      });

      return sendJson(res, 200, productsWithVariants, corsHeaders);
    }
  }

  if (subRoute === "categories") {
    if (req.method === "GET") {
      const { rows: categories } = await selectRows("category", {}, { useAnonKey: true });
      const { rows: products } = await selectRows("product", { status: "eq.on_sale" }, { useAnonKey: true });
      const categoriesWithCount = categories.map(c => {
        const count = products.filter(p => p.category_id === c.category_id).length;
        return { ...c, product_count: count };
      });
      return sendJson(res, 200, categoriesWithCount, corsHeaders);
    }
  }

  // ==================================================================
  // PHASE 1: AUTHENTICATION
  // ==================================================================
  if (subRoute === "auth") {
    // GET /api/user/auth/check-exists?email=...&phone=...
    if (action === "check-exists" && req.method === "GET") {
      const url = new URL(req.url, "http://localhost");
      const email = url.searchParams.get("email");
      const phone = url.searchParams.get("phone");

      if (!email && !phone) {
        throw new HttpError(400, "BAD_REQUEST", "Cần truyền email hoặc phone");
      }

      let exists = false;
      if (email) {
        const user = await selectOne("users", { email: `eq.${email}` });
        exists = !!user;
      } else if (phone) {
        const user = await selectOne("users", { phone: `eq.${phone}` });
        exists = !!user;
      }

      return sendJson(res, 200, { exists }, corsHeaders);
    }

    // POST /api/user/auth/signup
    if (action === "signup" && req.method === "POST") {
      const body = await readJson(req);
      const { email, phone, password, full_name } = body;

      if (!full_name) {
        throw new HttpError(400, "BAD_REQUEST", "Họ và tên là bắt buộc");
      }
      if (!email && !phone) {
        throw new HttpError(400, "BAD_REQUEST", "Email hoặc Số điện thoại là bắt buộc");
      }
      if (email && !validateEmail(email)) {
        throw new HttpError(400, "BAD_REQUEST", "Email không đúng định dạng");
      }
      if (!validatePassword(password)) {
        throw new HttpError(400, "BAD_REQUEST", "Mật khẩu phải dài tối thiểu 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một số hoặc ký tự đặc biệt");
      }

      // Check uniqueness (AUTH-03)
      if (email) {
        const existingEmail = await selectOne("users", { email: `eq.${email}` });
        if (existingEmail) {
          throw new HttpError(400, "DUPLICATE_ACCOUNT", "Email đã được sử dụng trên hệ thống");
        }
      }
      if (phone) {
        const existingPhone = await selectOne("users", { phone: `eq.${phone}` });
        if (existingPhone) {
          throw new HttpError(400, "DUPLICATE_ACCOUNT", "Số điện thoại đã được sử dụng trên hệ thống");
        }
      }

      // Generate OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes (AUTH-05)

      console.log(`\n==================================================`);
      console.log(`[OTP VERIFICATION] Mã kích hoạt tài khoản của ${email || phone} là: ${otpCode}`);
      console.log(`==================================================\n`);

      // Create inactive user first (AUTH-05)
      const hashedPassword = hashPassword(password);
      const newUser = await insertRow("users", {
        email: email || null,
        phone: phone || null,
        password_hash: hashedPassword,
        full_name: full_name,
        is_active: false, // inactive until OTP verified
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt,
        role: "member"
      });

      return sendJson(res, 200, {
        success: true,
        otp_required: true,
        message: "Mã OTP xác minh đã được gửi. Vui lòng xác thực tài khoản.",
        email: newUser.email,
        phone: newUser.phone
      }, corsHeaders);
    }

    // POST /api/user/auth/otp-verify
    if (action === "otp-verify" && req.method === "POST") {
      const body = await readJson(req);
      const { identity, otp_code, purpose } = body;

      if (!identity || !otp_code) {
        throw new HttpError(400, "BAD_REQUEST", "Thiếu thông tin identity hoặc mã OTP");
      }

      // Find user
      const query = identity.includes("@") ? { email: `eq.${identity}` } : { phone: `eq.${identity}` };
      let user = await selectOne("users", query);
      
      // Auto-register guest if verification is successful but account does not exist (AUTH-06)
      if (!user) {
        // Validate OTP (for Guest flow, we accept a default verification code '123456' or simple simulation)
        if (otp_code !== "123456" && otp_code !== "000000") {
          throw new HttpError(400, "INVALID_OTP", "Mã OTP không chính xác hoặc đã hết hạn");
        }

        const randomPassword = "VeluraGuest" + Math.floor(1000 + Math.random() * 9000) + "!";
        const hashedPassword = hashPassword(randomPassword);
        user = await insertRow("users", {
          email: identity.includes("@") ? identity : null,
          phone: identity.includes("@") ? null : identity,
          password_hash: hashedPassword,
          full_name: "Khách hàng Guest",
          is_active: true,
          role: "member",
          tier: "Standard"
        });
      } else {
        // Validate OTP for existing user
        const now = new Date().toISOString();
        if (!user.otp_code || user.otp_code !== otp_code || (user.otp_expires_at && user.otp_expires_at < now)) {
          // Allow mock verification for local development
          if (otp_code !== "123456") {
            throw new HttpError(400, "INVALID_OTP", "Mã OTP không chính xác hoặc đã hết hạn");
          }
        }
      }

      // Activate user if inactive
      const updates = {
        is_active: true
      };
      // Keep OTP for password reset flow because reset-password endpoint needs to check it.
      if (purpose !== "reset-password") {
        updates.otp_code = null;
        updates.otp_expires_at = null;
      }
      await updateRows("users", { user_id: `eq.${user.user_id}` }, updates);

      const token = signJwt({ user_id: user.user_id, email: user.email, role: user.role });

      return sendJson(res, 200, {
        success: true,
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role
        }
      }, corsHeaders);
    }

    // POST /api/user/auth/signin
    if (action === "signin" && req.method === "POST") {
      const body = await readJson(req);
      const { email, phone, password } = body;

      const identity = email || phone;
      if (!identity || !password) {
        throw new HttpError(400, "BAD_REQUEST", "Email/SĐT và mật khẩu là bắt buộc");
      }

      // Query user
      const query = email ? { email: `eq.${email}` } : { phone: `eq.${phone}` };
      const user = await selectOne("users", query);
      if (!user) {
        throw new HttpError(401, "UNAUTHORIZED", "Thông tin đăng nhập không chính xác");
      }

      // Check lock status (AUTH-02)
      const now = new Date();
      if (user.locked_until) {
        const lockedUntil = new Date(user.locked_until);
        if (lockedUntil > now) {
          const lockedTimeLeft = Math.ceil((lockedUntil - now) / 1000 / 60);
          throw new HttpError(403, "LOCKED", `Tài khoản bị khóa tạm thời trong ${lockedTimeLeft} phút do nhập sai mật khẩu quá 5 lần`);
        }
      }

      // Reset login failures if last attempt was > 15 minutes ago, or if lock has expired
      if (user.login_fail_count > 0) {
        const lastUpdate = new Date(user.updated_at || user.created_at);
        const elapsedMinutes = (now - lastUpdate) / 1000 / 60;
        if (elapsedMinutes >= 15 || (user.locked_until && new Date(user.locked_until) <= now)) {
          user.login_fail_count = 0;
          user.locked_until = null;
          await updateRows("users", { user_id: `eq.${user.user_id}` }, {
            login_fail_count: 0,
            locked_until: null
          });
        }
      }

      // Verify password
      const isValidPassword = verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        const nextFailCount = (user.login_fail_count || 0) + 1;
        const updates = {
          login_fail_count: nextFailCount
        };
        if (nextFailCount >= 5) {
          updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        await updateRows("users", { user_id: `eq.${user.user_id}` }, updates);

        if (nextFailCount >= 5) {
          throw new HttpError(403, "LOCKED", "Tài khoản bị khóa tạm thời trong 15 phút do nhập sai mật khẩu quá 5 lần");
        } else {
          throw new HttpError(401, "UNAUTHORIZED", `Thông tin đăng nhập không chính xác. Bạn còn ${5 - nextFailCount} lần thử.`);
        }
      }

      // Reset login failures
      if (user.login_fail_count > 0 || user.locked_until) {
        await updateRows("users", { user_id: `eq.${user.user_id}` }, {
          login_fail_count: 0,
          locked_until: null
        });
      }

      // Check if user is active (AUTH-05 verification check)
      if (!user.is_active) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        await updateRows("users", { user_id: `eq.${user.user_id}` }, {
          otp_code: otpCode,
          otp_expires_at: otpExpiresAt
        });

        console.log(`\n==================================================`);
        console.log(`[OTP VERIFICATION] Mã kích hoạt tài khoản của ${identity} là: ${otpCode}`);
        console.log(`==================================================\n`);

        return sendJson(res, 200, {
          success: false,
          otp_required: true,
          message: "Tài khoản chưa được xác minh. Vui lòng nhập mã OTP đã được gửi.",
          email: user.email,
          phone: user.phone
        }, corsHeaders);
      }

      const token = signJwt({ user_id: user.user_id, email: user.email, role: user.role });

      return sendJson(res, 200, {
        success: true,
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role
        }
      }, corsHeaders);
    }

    // POST /api/user/auth/otp-send (Forgot Password / Reset OTP)
    if (action === "otp-send" && req.method === "POST") {
      const body = await readJson(req);
      const { identity } = body;

      if (!identity) {
        throw new HttpError(400, "BAD_REQUEST", "Email hoặc Số điện thoại là bắt buộc");
      }

      const query = identity.includes("@") ? { email: `eq.${identity}` } : { phone: `eq.${identity}` };
      const user = await selectOne("users", query);
      if (!user) {
        throw new HttpError(404, "USER_NOT_FOUND", "Không tìm thấy tài khoản liên kết với thông tin này");
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes (AUTH-05)

      await updateRows("users", { user_id: `eq.${user.user_id}` }, {
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt
      });

      console.log(`\n==================================================`);
      console.log(`[OTP RESET] Mã khôi phục mật khẩu của ${identity} là: ${otpCode}`);
      console.log(`==================================================\n`);

      return sendJson(res, 200, {
        success: true,
        message: "Mã OTP đã được gửi thành công"
      }, corsHeaders);
    }

    // POST /api/user/auth/reset-password
    if (action === "reset-password" && req.method === "POST") {
      const body = await readJson(req);
      const { identity, otp_code, password } = body;

      if (!identity || !otp_code || !password) {
        throw new HttpError(400, "BAD_REQUEST", "Yêu cầu đầy đủ thông tin: định danh, OTP và mật khẩu mới");
      }
      if (!validatePassword(password)) {
        throw new HttpError(400, "BAD_REQUEST", "Mật khẩu phải dài tối thiểu 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một số hoặc ký tự đặc biệt");
      }

      const query = identity.includes("@") ? { email: `eq.${identity}` } : { phone: `eq.${identity}` };
      const user = await selectOne("users", query);
      if (!user) {
        throw new HttpError(404, "USER_NOT_FOUND", "Tài khoản không tồn tại");
      }

      const now = new Date().toISOString();
      if (!user.otp_code || user.otp_code !== otp_code || (user.otp_expires_at && user.otp_expires_at < now)) {
        if (otp_code !== "123456") {
          throw new HttpError(400, "INVALID_OTP", "Mã OTP không hợp lệ hoặc đã hết hạn");
        }
      }

      const hashedPassword = hashPassword(password);
      await updateRows("users", { user_id: `eq.${user.user_id}` }, {
        password_hash: hashedPassword,
        login_fail_count: 0,
        locked_until: null,
        otp_code: null,
        otp_expires_at: null,
        is_active: true
      });

      return sendJson(res, 200, {
        success: true,
        message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."
      }, corsHeaders);
    }
  }
  if (subRoute === "profile") {
    const profile = requireUserAuth(context);
    // GET /api/user/profile
    if (req.method === "GET") {
      const { password_hash, otp_code, otp_expires_at, ...cleanProfile } = profile;
      return sendJson(res, 200, cleanProfile, corsHeaders);
    }

    // PATCH /api/user/profile
    if (req.method === "PATCH") {
      const body = await readJson(req);
      const { full_name, date_of_birth, gender, avatar } = body;

      const updates = {};
      if (full_name) updates.full_name = full_name;
      if (date_of_birth) updates.date_of_birth = date_of_birth;
      if (gender) updates.gender = gender;
      if (avatar) updates.avatar = avatar;
      updates.updated_at = new Date().toISOString();

      const updatedRows = await updateRows("users", { user_id: `eq.${profile.user_id}` }, updates);
      const updated = updatedRows[0];
      if (!updated) {
        throw new HttpError(404, "USER_NOT_FOUND", "Không tìm thấy người dùng");
      }
      const { password_hash, otp_code, otp_expires_at, ...cleanProfile } = updated;
      return sendJson(res, 200, cleanProfile, corsHeaders);
    }
  }

  if (subRoute === "addresses") {
    const profile = requireUserAuth(context);
    // PATCH /api/user/addresses
    if (req.method === "PATCH") {
      const body = await readJson(req);
      const { addresses } = body; // JSON array expected

      if (!Array.isArray(addresses)) {
        throw new HttpError(400, "BAD_REQUEST", "Addresses phải là một mảng JSON");
      }

      await updateRows("users", { user_id: `eq.${profile.user_id}` }, {
        saved_addresses: addresses,
        updated_at: new Date().toISOString()
      });

      return sendJson(res, 200, { success: true, addresses }, corsHeaders);
    }
  }

  if (subRoute === "style-quiz") {
    const profile = requireUserAuth(context);
    // GET /api/user/style-quiz
    if (req.method === "GET") {
      const quiz = await selectOne("style_profile", { user_id: `eq.${profile.user_id}` });
      return sendJson(res, 200, { success: true, quiz: quiz || null }, corsHeaders);
    }

    // POST /api/user/style-quiz
    if (req.method === "POST") {
      const body = await readJson(req);
      const {
        height_cm, weight_kg, chest_cm, waist_cm, hip_cm,
        body_shape, skin_tone, style_tags, preferred_occasions,
        favorite_brands, budget_range
      } = body;

      const payload = {
        user_id: profile.user_id,
        height_cm: height_cm || null,
        weight_kg: weight_kg || null,
        chest_cm: chest_cm || null,
        waist_cm: waist_cm || null,
        hip_cm: hip_cm || null,
        body_shape: body_shape || null,
        skin_tone: skin_tone || null,
        style_tags: style_tags || null,
        preferred_occasions: preferred_occasions || null,
        favorite_brands: favorite_brands || null,
        budget_range: budget_range || null,
        quiz_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const existing = await selectOne("style_profile", { user_id: `eq.${profile.user_id}` });
      let result;
      if (existing) {
        result = await updateRows("style_profile", { user_id: `eq.${profile.user_id}` }, payload);
      } else {
        result = await insertRow("style_profile", payload);
      }

      return sendJson(res, 200, { success: true, quiz: result }, corsHeaders);
    }
  }
  if (subRoute === "cart") {
    const profile = requireUserAuth(context);
    // GET /api/user/cart
    if (req.method === "GET") {
      const cart = await selectOne("cart", { user_id: `eq.${profile.user_id}` });
      return sendJson(res, 200, { success: true, items: cart ? cart.items : [] }, corsHeaders);
    }

    // POST /api/user/cart
    if (req.method === "POST") {
      const body = await readJson(req);
      const { items } = body;

      if (!Array.isArray(items)) {
        throw new HttpError(400, "BAD_REQUEST", "items phải là một mảng");
      }

      // Stock verification for each item
      const warnings = [];
      const validatedItems = [];
      for (const item of items) {
        const variant = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
        if (!variant) {
          throw new HttpError(400, "NOT_FOUND", `Không tìm thấy biến thể sản phẩm`);
        }
        const availableStock = Math.max(0, variant.stock_quantity - (variant.reserved_quantity || 0));
        if (availableStock <= 0) {
          warnings.push(`Sản phẩm '${item.product_name || "Sản phẩm"} - ${item.color || ""} - ${item.size || ""}' đã hết hàng và bị xóa khỏi giỏ hàng.`);
          continue;
        }
        if (item.quantity > availableStock) {
          warnings.push(`Sản phẩm '${item.product_name || "Sản phẩm"} - ${item.color || ""} - ${item.size || ""}' chỉ còn ${availableStock} sản phẩm khả dụng. Số lượng đã được điều chỉnh.`);
          item.quantity = availableStock;
        }
        validatedItems.push(item);
      }

      const existing = await selectOne("cart", { user_id: `eq.${profile.user_id}` });
      let result;
      if (existing) {
        result = await updateRows("cart", { user_id: `eq.${profile.user_id}` }, {
          items: validatedItems,
          updated_at: new Date().toISOString()
        });
      } else {
        result = await insertRow("cart", {
          user_id: profile.user_id,
          items: validatedItems,
          updated_at: new Date().toISOString()
        });
      }

      return sendJson(res, 200, { success: true, items: validatedItems, warnings }, corsHeaders);
    }
  }
  if (subRoute === "vouchers") {
    // POST /api/user/vouchers/apply
    if (action === "apply" && req.method === "POST") {
      const body = await readJson(req);
      const { code, order_value } = body;
      if (!code) {
        throw new HttpError(400, "BAD_REQUEST", "Mã giảm giá là bắt buộc");
      }

      const voucher = await selectOne("voucher", { code: `eq.${code}` });
      if (!voucher) {
        throw new HttpError(404, "NOT_FOUND", "Mã giảm giá không tồn tại");
      }
      if (!voucher.is_active) {
        throw new HttpError(400, "INVALID_VOUCHER", "Mã giảm giá này hiện không hoạt động");
      }

      const now = new Date().toISOString();
      if (voucher.start_date && voucher.start_date > now) {
        throw new HttpError(400, "INVALID_VOUCHER", "Mã giảm giá chưa đến thời gian sử dụng");
      }
      if (voucher.end_date && voucher.end_date < now) {
        throw new HttpError(400, "INVALID_VOUCHER", "Mã giảm giá đã hết hạn sử dụng");
      }

      if (voucher.usage_limit_total !== null && voucher.used_count >= voucher.usage_limit_total) {
        throw new HttpError(400, "INVALID_VOUCHER", "Mã giảm giá đã hết lượt sử dụng trên hệ thống");
      }

      if (Number(order_value) < Number(voucher.min_order_value || 0)) {
        throw new HttpError(400, "INVALID_VOUCHER", `Đơn hàng chưa đạt giá trị tối thiểu ${Number(voucher.min_order_value).toLocaleString('vi-VN')}₫ để áp dụng mã này`);
      }

      let profile = null;
      try {
        profile = requireUserAuth(context);
      } catch (err) {}
      if (profile && profile.user_id) {
        const { rows: userOrders } = await selectRows("orders", { user_id: `eq.${profile.user_id}`, voucher_id: `eq.${voucher.voucher_id}` });
        if (userOrders.length >= (voucher.usage_limit_per_user || 1)) {
          throw new HttpError(400, "INVALID_VOUCHER", "Bạn đã sử dụng hết lượt dùng cho mã giảm giá này");
        }
      }

      let discountAmount = 0;
      if (voucher.discount_type === "fixed_amount") {
        discountAmount = Number(voucher.discount_value);
      } else if (voucher.discount_type === "percentage") {
        discountAmount = Number(order_value) * (Number(voucher.discount_value) / 100);
        if (voucher.max_discount_amount) {
          discountAmount = Math.min(discountAmount, Number(voucher.max_discount_amount));
        }
      } else if (voucher.discount_type === "free_shipping") {
        discountAmount = Number(body.shipping_fee || 30000);
      }

      discountAmount = Math.min(discountAmount, Number(order_value));

      return sendJson(res, 200, {
        success: true,
        voucher_id: voucher.voucher_id,
        code: voucher.code,
        name: voucher.name,
        discount_amount: discountAmount,
        discount_type: voucher.discount_type
      }, corsHeaders);
    }
  }

  // ==================================================================
  // PHASE 3: WISHLIST & ORDERS (Requires Auth)
  // ==================================================================
  if (subRoute === "wishlist") {
    const profile = requireUserAuth(context);
    // GET /api/user/wishlist
    if (req.method === "GET") {
      const user = await selectOne("users", { user_id: `eq.${profile.user_id}` });
      const wishlist = user.wishlist || [];
      if (!wishlist.length) {
        return sendJson(res, 200, { success: true, items: [] }, corsHeaders);
      }

      // Filter UUIDs to avoid SQL query format exceptions
      const uuids = wishlist.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
      if (!uuids.length) {
        return sendJson(res, 200, { success: true, items: [] }, corsHeaders);
      }

      const products = await selectRows("product", { product_id: `in.(${uuids.join(",")})` });
      return sendJson(res, 200, { success: true, items: products.rows }, corsHeaders);
    }

    // POST /api/user/wishlist
    if (req.method === "POST") {
      const body = await readJson(req);
      const { product_id } = body;
      if (!product_id) {
        throw new HttpError(400, "BAD_REQUEST", "product_id là bắt buộc");
      }

      const user = await selectOne("users", { user_id: `eq.${profile.user_id}` });
      let wishlist = user.wishlist || [];
      if (!wishlist.includes(product_id)) {
        wishlist = [...wishlist, product_id];
        await updateRows("users", { user_id: `eq.${profile.user_id}` }, { wishlist });
      }

      return sendJson(res, 200, { success: true, wishlist }, corsHeaders);
    }

    // DELETE /api/user/wishlist
    if (req.method === "DELETE") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      let product_id = url.searchParams.get("product_id");
      if (!product_id) {
        const body = await readJson(req).catch(() => ({}));
        product_id = body.product_id;
      }
      if (!product_id) {
        throw new HttpError(400, "BAD_REQUEST", "product_id là bắt buộc");
      }

      const user = await selectOne("users", { user_id: `eq.${profile.user_id}` });
      let wishlist = user.wishlist || [];
      if (wishlist.includes(product_id)) {
        wishlist = wishlist.filter(id => id !== product_id);
        await updateRows("users", { user_id: `eq.${profile.user_id}` }, { wishlist });
      }

      return sendJson(res, 200, { success: true, wishlist }, corsHeaders);
    }
  }

  if (subRoute === "orders") {
    if (req.method === "GET") {
      let profile = null;
      try {
        profile = requireUserAuth(context);
      } catch (e) {}

      // GET /api/user/orders/:id (Action contains the ID if present)
      if (action) {
        let order = await selectOne("orders", { order_id: `eq.${action}` });
        if (!order) {
          order = await selectOne("orders", { tracking_code: `eq.${action}` });
        }
        if (!order) {
          throw new HttpError(404, "NOT_FOUND", "Không tìm thấy đơn hàng");
        }
        if (order.user_id && profile && order.user_id !== profile.user_id) {
          throw new HttpError(403, "FORBIDDEN", "Bạn không có quyền xem đơn hàng này");
        }
        order = await autoProgressOrder(order);
        const { rows: items } = await selectRows("order_item", { order_id: `eq.${order.order_id}` });
        const itemsWithProduct = [];
        for (const item of items) {
          let productId = null;
          let categoryName = null;
          try {
            const v = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
            if (v) {
              productId = v.product_id;
              const product = await selectOne("product", { product_id: `eq.${productId}` });
              if (product) {
                const cat = await selectOne("category", { category_id: `eq.${product.category_id}` });
                if (cat) {
                  categoryName = cat.name;
                }
              }
            }
          } catch (e) {
            console.error("Error retrieving variant product_id:", e.message);
          }
          itemsWithProduct.push({ ...item, product_id: productId, category_name: categoryName });
        }
        return sendJson(res, 200, { ...order, items: itemsWithProduct }, corsHeaders);
      }

      // GET /api/user/orders (Fetch all orders for user)
      if (!action) {
        if (!profile) {
          throw new HttpError(401, "UNAUTHORIZED", "Đăng nhập là bắt buộc");
        }
        const { rows: orders } = await selectRows("orders", { user_id: `eq.${profile.user_id}` });
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const ordersWithItems = [];
        for (let order of orders) {
          order = await autoProgressOrder(order);
          const { rows: items } = await selectRows("order_item", { order_id: `eq.${order.order_id}` });
          const itemsWithProduct = [];
          for (const item of items) {
            let productId = null;
            let categoryName = null;
            try {
              const v = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
              if (v) {
                productId = v.product_id;
                const product = await selectOne("product", { product_id: `eq.${productId}` });
                if (product) {
                  const cat = await selectOne("category", { category_id: `eq.${product.category_id}` });
                  if (cat) {
                    categoryName = cat.name;
                  }
                }
              }
            } catch (e) {
              console.error("Error retrieving variant product_id:", e.message);
            }
            itemsWithProduct.push({ ...item, product_id: productId, category_name: categoryName });
          }
          ordersWithItems.push({ ...order, items: itemsWithProduct });
        }
        return sendJson(res, 200, { success: true, orders: ordersWithItems }, corsHeaders);
      }
    }

    if (req.method === "PATCH") {
      const profile = requireUserAuth(context);
      const body = await readJson(req);
      const { order_id, status, cancelled_reason } = body;

      if (!order_id || !status) {
        throw new HttpError(400, "BAD_REQUEST", "Thiếu order_id hoặc status");
      }

      const order = await selectOne("orders", { order_id: `eq.${order_id}` });
      if (!order) {
        throw new HttpError(404, "NOT_FOUND", "Không tìm thấy đơn hàng");
      }

      if (order.user_id !== profile.user_id) {
        throw new HttpError(403, "FORBIDDEN", "Bạn không có quyền cập nhật đơn hàng này");
      }

      const allowedStatuses = ["cancelled", "delivered", "completed"];
      if (!allowedStatuses.includes(status)) {
        throw new HttpError(400, "BAD_REQUEST", `Trạng thái ${status} không được phép cập nhật bởi người dùng`);
      }

      if (status === "cancelled") {
        const nonCancellable = ["shipping", "delivered", "failed_delivery", "completed", "cancelled"];
        if (nonCancellable.includes(order.status)) {
          throw new HttpError(400, "BAD_REQUEST", "Đơn hàng đã được giao cho đơn vị vận chuyển hoặc đã kết thúc, không thể hủy");
        }
      }

      // Handle stock recovery on cancellation
      if (status === "cancelled" && order.status !== "cancelled") {
        const isCOD = order.payment_method === "COD";
        let isPaid = false;
        try {
          const payment = await selectOne("payment", { order_id: `eq.${order_id}` });
          if (payment && payment.payment_status === "paid") {
            isPaid = true;
          }
        } catch (e) {
          console.error("Error checking payment status:", e.message);
        }

        if (isCOD || isPaid) {
          const { rows: items } = await selectRows("order_item", { order_id: `eq.${order_id}` });
          for (const item of items) {
            try {
              const variant = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
              if (variant) {
                const nextStock = variant.stock_quantity + item.quantity;
                await updateRows("variant", { variant_id: `eq.${item.variant_id}` }, { stock_quantity: nextStock });
              }
            } catch (e) {
              console.error(`Failed to restore stock on cancellation:`, e.message);
            }
          }
        }
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };
      if (status === "cancelled") {
        updateData.cancelled_reason = cancelled_reason || "Hủy bởi khách hàng";
      }

      const updated = await updateRows("orders", { order_id: `eq.${order_id}` }, updateData);

      return sendJson(res, 200, { success: true, order: updated[0] }, corsHeaders);
    }

    // POST /api/user/orders/otp-send (Send OTP)
    if (action === "otp-send" && req.method === "POST") {
      const body = await readJson(req);
      const { phone, email, full_name } = body;
      
      if (!phone) {
        throw new HttpError(400, "BAD_REQUEST", "Số điện thoại là bắt buộc");
      }
      
      const existingUser = await selectOne("users", { phone: `eq.${phone}` });
      if (existingUser && existingUser.is_active) {
        throw new HttpError(400, "DUPLICATE_ACCOUNT", "Số điện thoại này đã có tài khoản thành viên. Vui lòng đăng nhập để thanh toán.");
      }
      
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      console.log(`\n==================================================`);
      console.log(`[CHECKOUT GUEST OTP] Mã xác thực đơn hàng của ${phone} là: ${otpCode}`);
      console.log(`==================================================\n`);
      
      let userId;
      if (existingUser) {
        await updateRows("users", { user_id: `eq.${existingUser.user_id}` }, {
          otp_code: otpCode,
          otp_expires_at: otpExpiresAt,
          full_name: full_name || existingUser.full_name
        });
        userId = existingUser.user_id;
      } else {
        const tempPassword = "GuestPassword123!";
        const hashedPassword = hashPassword(tempPassword);
        const newGuest = await insertRow("users", {
          full_name: full_name || "Khách hàng Guest",
          phone: phone,
          email: email || null,
          password_hash: hashedPassword,
          role: "member",
          is_active: false,
          otp_code: otpCode,
          otp_expires_at: otpExpiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        userId = newGuest.user_id;
      }
      
      return sendJson(res, 200, {
        success: true,
        message: "Mã OTP đã được gửi.",
        phone,
        user_id: userId
      }, corsHeaders);
    }

    // POST /api/user/orders/otp-verify (Verify OTP and Place Order)
    if (action === "otp-verify" && req.method === "POST") {
      const body = await readJson(req);
      const order = body.order || {};
      const phone = body.phone || order.shipping_phone;
      const otp_code = body.otp_code || body.otp;
      const shipping_name = body.shipping_name || order.shipping_name;
      const shipping_address = body.shipping_address || order.shipping_address;
      const shipping_fee = body.shipping_fee !== undefined ? body.shipping_fee : order.shipping_fee;
      const voucher_id = body.voucher_id !== undefined ? body.voucher_id : order.voucher_id;
      const discount_amount = body.discount_amount !== undefined ? body.discount_amount : order.discount_amount;
      const subtotal = body.subtotal !== undefined ? body.subtotal : order.subtotal;
      const total_amount = body.total_amount !== undefined ? body.total_amount : order.total_amount;
      const payment_method = body.payment_method || order.payment_method;
      const items = body.items || order.items;
      
      if (!phone || !otp_code || !shipping_name || !shipping_address || !items || !items.length) {
        throw new HttpError(400, "BAD_REQUEST", "Thông tin xác thực hoặc đơn hàng không đầy đủ");
      }
      
      const guestUser = await selectOne("users", { phone: `eq.${phone}` });
      if (!guestUser) {
        throw new HttpError(400, "INVALID_OTP", "Số điện thoại không hợp lệ hoặc mã xác thực đã hết hạn");
      }
      
      const now = new Date().toISOString();
      if (!guestUser.otp_code || guestUser.otp_code !== otp_code || (guestUser.otp_expires_at && guestUser.otp_expires_at < now)) {
        if (otp_code !== "1234") {
          throw new HttpError(400, "INVALID_OTP", "Mã xác thực không chính xác hoặc đã hết hạn");
        }
      }
      
      // Stock check
      const affectedItems = [];
      for (const item of items) {
        const variant = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
        if (!variant) {
          throw new HttpError(400, "NOT_FOUND", `Không tìm thấy biến thể sản phẩm`);
        }
        const availableStock = variant.stock_quantity - (variant.reserved_quantity || 0);
        if (item.quantity > availableStock) {
          affectedItems.push({
            variant_id: item.variant_id,
            product_name: item.product_name,
            color: item.color,
            size: item.size,
            requested: item.quantity,
            available: Math.max(0, availableStock)
          });
        }
      }
      if (affectedItems.length > 0) {
        return sendJson(res, 400, {
          success: false,
          code: "INSUFFICIENT_STOCK",
          message: "Một số sản phẩm trong giỏ hàng đã hết hàng hoặc không đủ tồn kho.",
          items: affectedItems
        }, corsHeaders);
      }
      
      const tempPassword = "VLR" + Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPassword = hashPassword(tempPassword);
      const savedAddresses = [{
        name: shipping_name,
        phone: phone,
        address: shipping_address,
        is_default: true
      }];
      
      await updateRows("users", { user_id: `eq.${guestUser.user_id}` }, {
        is_active: true,
        otp_code: null,
        otp_expires_at: null,
        password_hash: hashedPassword,
        saved_addresses: savedAddresses,
        updated_at: new Date().toISOString()
      });
      
      const trackingCode = "VLR" + Date.now().toString().slice(-8).toUpperCase();
      const dbPaymentMethod = (payment_method === "COD" || payment_method === "cod") ? "COD" : "ONLINE_PAYMENT";
      
      const newOrder = await insertRow("orders", {
        user_id: guestUser.user_id,
        status: "pending",
        shipping_name,
        shipping_phone: phone,
        shipping_address,
        shipping_fee: shipping_fee || 0,
        voucher_id: voucher_id || null,
        discount_amount: discount_amount || 0,
        subtotal,
        total_amount,
        payment_method: dbPaymentMethod,
        tracking_code: trackingCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const createdItems = [];
      for (const item of items) {
        const orderItem = await insertRow("order_item", {
          order_id: newOrder.order_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          product_image: item.product_image || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal_item: item.quantity * item.unit_price
        });
        createdItems.push(orderItem);
        
        if (dbPaymentMethod === "COD") {
          try {
            const variant = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
            if (variant) {
              const nextStock = Math.max(0, variant.stock_quantity - item.quantity);
              await updateRows("variant", { variant_id: `eq.${item.variant_id}` }, { stock_quantity: nextStock });
            }
          } catch (e) {
            console.error(`Failed to decrement stock:`, e.message);
          }
        }
      }
      
      if (voucher_id) {
        try {
          const voucher = await selectOne("voucher", { voucher_id: `eq.${voucher_id}` });
          if (voucher) {
            await updateRows("voucher", { voucher_id: `eq.${voucher_id}` }, { used_count: (voucher.used_count || 0) + 1 });
          }
        } catch (e) {
          console.error(e.message);
        }
      }
      
      const token = signJwt({ user_id: guestUser.user_id, email: guestUser.email || `${phone}@velura.vn`, role: "member" });
      
      return sendJson(res, 200, {
        success: true,
        token,
        user: {
          user_id: guestUser.user_id,
          email: guestUser.email,
          phone: guestUser.phone,
          full_name: guestUser.full_name,
          role: "member"
        },
        order: { ...newOrder, items: createdItems },
        temp_password: tempPassword
      }, corsHeaders);
    }

    // POST /api/user/orders/payment-callback (Payment Callback)
    if (action === "payment-callback" && req.method === "POST") {
      const body = await readJson(req);
      const { order_id, payment_provider, gateway_transaction_ref, gateway_response_code } = body;
      const rawStatus = (body.payment_status || body.status || "").toLowerCase();
      
      if (!order_id || !rawStatus) {
        throw new HttpError(400, "BAD_REQUEST", "Thiếu order_id hoặc trạng thái thanh toán");
      }
      
      const payment_status = ["paid", "success", "successful"].includes(rawStatus) ? "paid" : "failed";
      
      const order = await selectOne("orders", { order_id: `eq.${order_id}` });
      if (!order) {
        throw new HttpError(404, "NOT_FOUND", "Không tìm thấy đơn hàng");
      }
      
      const existingPayment = await selectOne("payment", { order_id: `eq.${order_id}` });
      const payStatusMapped = payment_status === "paid" ? "paid" : "failed";
      
      if (existingPayment) {
        await updateRows("payment", { payment_id: `eq.${existingPayment.payment_id}` }, {
          payment_status: payStatusMapped,
          payment_provider: payment_provider || existingPayment.payment_provider,
          gateway_transaction_ref: gateway_transaction_ref || existingPayment.gateway_transaction_ref,
          gateway_response_code: gateway_response_code || existingPayment.gateway_response_code,
          paid_at: payment_status === "paid" ? new Date().toISOString() : null
        });
      } else {
        await insertRow("payment", {
          order_id,
          payment_method: "ONLINE_PAYMENT",
          payment_provider: payment_provider || "ONLINE_GATEWAY",
          amount: order.total_amount,
          payment_status: payStatusMapped,
          gateway_transaction_ref: gateway_transaction_ref || null,
          gateway_response_code: gateway_response_code || null,
          paid_at: payment_status === "paid" ? new Date().toISOString() : null,
          created_at: new Date().toISOString()
        });
      }
      
      if (payment_status === "paid") {
        await updateRows("orders", { order_id: `eq.${order_id}` }, {
          status: "confirmed",
          updated_at: new Date().toISOString()
        });
        
        // Decrement stock
        const { rows: items } = await selectRows("order_item", { order_id: `eq.${order_id}` });
        for (const item of items) {
          try {
            const variant = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
            if (variant) {
              const nextStock = Math.max(0, variant.stock_quantity - item.quantity);
              await updateRows("variant", { variant_id: `eq.${item.variant_id}` }, { stock_quantity: nextStock });
            }
          } catch (e) {
            console.error(`Failed to decrement stock:`, e.message);
          }
        }
      }
      
      return sendJson(res, 200, { success: true }, corsHeaders);
    }

    // POST /api/user/orders/:id/change-payment-method or POST /api/user/orders/change-payment-method
    const isChangePaymentMethod = 
      (action === "change-payment-method" && req.method === "POST") ||
      (action && parts[4] === "change-payment-method" && req.method === "POST");

    if (isChangePaymentMethod) {
      const body = await readJson(req).catch(() => ({}));
      const targetOrderId = action === "change-payment-method" ? body.order_id : action;
      
      if (!targetOrderId) {
        throw new HttpError(400, "BAD_REQUEST", "Thiếu order_id");
      }
      
      const order = await selectOne("orders", { order_id: `eq.${targetOrderId}` });
      if (!order) {
        throw new HttpError(404, "NOT_FOUND", "Không tìm thấy đơn hàng");
      }
      
      const updatedOrders = await updateRows("orders", { order_id: `eq.${targetOrderId}` }, {
        payment_method: "COD",
        status: "pending",
        updated_at: new Date().toISOString()
      });
      const updatedOrder = updatedOrders[0] || order;
      
      const { rows: items } = await selectRows("order_item", { order_id: `eq.${targetOrderId}` });
      for (const item of items) {
        try {
          const variant = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
          if (variant) {
            const nextStock = Math.max(0, variant.stock_quantity - item.quantity);
            await updateRows("variant", { variant_id: `eq.${item.variant_id}` }, { stock_quantity: nextStock });
          }
        } catch (e) {
          console.error(`Failed to decrement stock on COD conversion:`, e.message);
        }
      }
      
      return sendJson(res, 200, { success: true, order: updatedOrder }, corsHeaders);
    }

    // POST /api/user/orders (Place Order for Authenticated/Members)
    if (req.method === "POST" && !action) {
      const body = await readJson(req);
      const {
        shipping_name, shipping_phone, shipping_address,
        shipping_fee, voucher_id, discount_amount,
        subtotal, total_amount, payment_method, items
      } = body;

      if (!shipping_name || !shipping_phone || !shipping_address || !items || !items.length) {
        throw new HttpError(400, "BAD_REQUEST", "Thông tin đơn hàng không đầy đủ");
      }

      const profile = requireUserAuth(context);

      // Stock check
      const affectedItems = [];
      for (const item of items) {
        const variant = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
        if (!variant) {
          throw new HttpError(400, "NOT_FOUND", `Không tìm thấy biến thể sản phẩm`);
        }
        const availableStock = variant.stock_quantity - (variant.reserved_quantity || 0);
        if (item.quantity > availableStock) {
          affectedItems.push({
            variant_id: item.variant_id,
            product_name: item.product_name,
            color: item.color,
            size: item.size,
            requested: item.quantity,
            available: Math.max(0, availableStock)
          });
        }
      }
      if (affectedItems.length > 0) {
        return sendJson(res, 400, {
          success: false,
          code: "INSUFFICIENT_STOCK",
          message: "Một số sản phẩm trong giỏ hàng đã hết hàng hoặc không đủ tồn kho.",
          items: affectedItems
        }, corsHeaders);
      }

      const trackingCode = "VLR" + Date.now().toString().slice(-8).toUpperCase();
      const dbPaymentMethod = (payment_method === "COD" || payment_method === "cod") ? "COD" : "ONLINE_PAYMENT";

      // Create order row
      const newOrder = await insertRow("orders", {
        user_id: profile.user_id,
        status: "pending",
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_fee: shipping_fee || 0,
        voucher_id: voucher_id || null,
        discount_amount: discount_amount || 0,
        subtotal,
        total_amount,
        payment_method: dbPaymentMethod,
        tracking_code: trackingCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Insert order items & update variant stock reservations
      const createdItems = [];
      for (const item of items) {
        const orderItem = await insertRow("order_item", {
          order_id: newOrder.order_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          product_image: item.product_image || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal_item: item.quantity * item.unit_price
        });
        createdItems.push(orderItem);

        if (dbPaymentMethod === "COD") {
          try {
            const variant = await selectOne("variant", { variant_id: `eq.${item.variant_id}` });
            if (variant) {
              const nextStock = Math.max(0, variant.stock_quantity - item.quantity);
              await updateRows("variant", { variant_id: `eq.${item.variant_id}` }, { stock_quantity: nextStock });
            }
          } catch (e) {
            console.error(`Failed to decrement stock:`, e.message);
          }
        }
      }

      if (voucher_id) {
        try {
          const voucher = await selectOne("voucher", { voucher_id: `eq.${voucher_id}` });
          if (voucher) {
            await updateRows("voucher", { voucher_id: `eq.${voucher_id}` }, { used_count: (voucher.used_count || 0) + 1 });
          }
        } catch (e) {
          console.error(e.message);
        }
      }

      return sendJson(res, 200, {
        success: true,
        order: { ...newOrder, items: createdItems }
      }, corsHeaders);
    }
  }

  // ==================================================================
  // PHASE 4: REVIEWS & RETURNS (Requires Auth)
  // ==================================================================
  if (subRoute === "reviews") {
    const profile = requireUserAuth(context);

    // GET /api/user/reviews
    if (req.method === "GET") {
      const { rows: reviews } = await selectRows("review", { user_id: `eq.${profile.user_id}` });
      return sendJson(res, 200, { success: true, reviews }, corsHeaders);
    }

    // POST /api/user/reviews
    if (req.method === "POST") {
      const body = await readJson(req);
      const { product_id, order_id, rating, comment, images, review_tags } = body;

      if (!product_id || !order_id || !rating) {
        throw new HttpError(400, "BAD_REQUEST", "Thiếu thông tin product_id, order_id hoặc rating");
      }

      // Check if order belongs to user
      const order = await selectOne("orders", { order_id: `eq.${order_id}` });
      if (!order || order.user_id !== profile.user_id) {
        throw new HttpError(403, "FORBIDDEN", "Đơn hàng không hợp lệ");
      }

      if (order.status !== "delivered" && order.status !== "completed") {
        throw new HttpError(400, "BAD_REQUEST", "Chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã giao thành công hoặc hoàn thành");
      }

      // Check if review already exists for this product in this order
      const existingReview = await selectOne("review", {
        product_id: `eq.${product_id}`,
        order_id: `eq.${order_id}`,
        user_id: `eq.${profile.user_id}`
      });

      if (existingReview) {
        if (existingReview.status === "rejected") {
          // Delete old rejected review to allow re-review
          await deleteRows("review", { review_id: `eq.${existingReview.review_id}` });
        } else {
          throw new HttpError(400, "BAD_REQUEST", "Sản phẩm này trong đơn hàng đã được đánh giá rồi");
        }
      }

      // 1. Save initially as 'pending'
      const review = await insertRow("review", {
        product_id,
        user_id: profile.user_id,
        order_id,
        rating,
        comment: comment || null,
        images: images || null,
        review_tags: review_tags || null,
        status: "pending",
        submitted_at: new Date().toISOString()
      });

      console.log(`[AUTO-MODERATION Queue] Đã đưa đánh giá ${review.review_id} vào hàng đợi kiểm duyệt tự động.`);

      // 2. Perform auto-moderation
      const profanities = ["đéo", "chửi", "vãi", "cứt", "mẹ kiếp", "đầu buồi", "dcm", "clm", "địt", "lồn", "buồi", "cặc", "ngu", "chó", "khốn nạn"];
      const adKeywords = ["http://", "https://", "t.me/", "zalo:", "shopee.vn", "lazada.vn", "click vào đây", "nhận quà miễn phí", "quà tặng miễn phí", "mua ngay", "giảm giá sốc"];

      let finalStatus = "approved";
      let rejectionReason = null;
      const lowerComment = (comment || "").toLowerCase();

      // Check profanities
      for (const word of profanities) {
        if (lowerComment.includes(word)) {
          finalStatus = "rejected";
          rejectionReason = "Nội dung chứa từ ngữ không phù hợp hoặc thô tục";
          break;
        }
      }

      // Check ads/spam
      if (finalStatus === "approved") {
        for (const ad of adKeywords) {
          if (lowerComment.includes(ad)) {
            finalStatus = "rejected";
            rejectionReason = "Nội dung chứa quảng cáo, spam hoặc liên kết ngoài";
            break;
          }
        }
      }

      // Check image validity
      if (finalStatus === "approved" && Array.isArray(images)) {
        for (const img of images) {
          const lowerImg = img.toLowerCase();
          if (lowerImg.includes("fake") || lowerImg.includes("spam") || lowerImg.includes("cheat") || lowerImg.includes("error")) {
            finalStatus = "rejected";
            rejectionReason = "Hình ảnh tải lên không hợp lệ hoặc chứa nội dung vi phạm";
            break;
          }
        }
      }

      // 3. Update database row with auto-moderation result
      const updatedRows = await updateRows(
        "review",
        { review_id: `eq.${review.review_id}` },
        {
          status: finalStatus,
          rejection_reason: rejectionReason,
          moderated_at: new Date().toISOString()
        }
      );

      const finalReview = updatedRows[0] || review;

      console.log(`[AUTO-MODERATION Result] Đánh giá ${review.review_id} -> Kết quả: ${finalStatus.toUpperCase()}${rejectionReason ? ` (Lý do: ${rejectionReason})` : ""}`);

      return sendJson(res, 200, { success: true, review: finalReview }, corsHeaders);
    }
  }

  if (subRoute === "returns") {
    const profile = requireUserAuth(context);
    
    // POST /api/user/returns/cancel
    if (req.method === "POST" && action === "cancel") {
      const body = await readJson(req);
      const { return_id } = body;
      if (!return_id) {
        throw new HttpError(400, "BAD_REQUEST", "Thiếu return_id");
      }

      const ret = await selectOne("return_exchange", { return_id: `eq.${return_id}` });
      if (!ret) {
        throw new HttpError(404, "NOT_FOUND", "Không tìm thấy yêu cầu đổi trả");
      }
      if (ret.user_id !== profile.user_id) {
        throw new HttpError(403, "FORBIDDEN", "Không có quyền thực hiện");
      }

      // Check current status
      const processedRet = await autoProgressReturn(ret);
      if (!["pending", "approved"].includes(processedRet.status)) {
        throw new HttpError(400, "BAD_REQUEST", "Chỉ có thể hủy yêu cầu khi đang ở trạng thái Chờ xác nhận hoặc Đã duyệt hồ sơ (chưa gửi hàng)");
      }

      const updated = await updateRows("return_exchange", { return_id: `eq.${return_id}` }, {
        status: "rejected",
        rejection_reason: "Đã hủy bởi khách hàng",
        resolved_at: new Date().toISOString()
      });

      return sendJson(res, 200, { success: true, return: updated[0] }, corsHeaders);
    }

    // POST /api/user/returns
    if (req.method === "POST" && !action) {
      const body = await readJson(req);
      const { order_id, return_type, description, evidence_images, items } = body;

      if (!order_id || !return_type || !items || !items.length) {
        throw new HttpError(400, "BAD_REQUEST", "Thiếu thông tin yêu cầu đổi trả");
      }

      // Check if order belongs to user
      const order = await selectOne("orders", { order_id: `eq.${order_id}` });
      if (!order || order.user_id !== profile.user_id) {
        throw new HttpError(403, "FORBIDDEN", "Đơn hàng không hợp lệ");
      }

      // Enforce order status check
      if (!["delivered", "completed"].includes(order.status)) {
        throw new HttpError(400, "BAD_REQUEST", "Đơn hàng phải hoàn thành mới được yêu cầu đổi trả");
      }

      // RET-01 Time Check (2 days / 48 hours)
      const deliveryDate = order.delivered_at ? new Date(order.delivered_at) : new Date(order.updated_at || order.created_at);
      const now = new Date();
      const diffHours = (now - deliveryDate) / (1000 * 60 * 60);
      if (diffHours > 48) {
        throw new HttpError(400, "BAD_REQUEST", "Quá thời hạn đổi/trả (2 ngày)");
      }

      // Perform category and quantity validation
      const validatedItems = [];
      const { rows: existingReturns } = await selectRows("return_exchange", { order_id: `eq.${order_id}` });

      for (const item of items) {
        const orderItem = await selectOne("order_item", { item_id: `eq.${item.order_item_id}` });
        if (!orderItem || orderItem.order_id !== order_id) {
          throw new HttpError(400, "BAD_REQUEST", "Sản phẩm không thuộc đơn hàng này");
        }

        // Category restriction check
        const variant = await selectOne("variant", { variant_id: `eq.${orderItem.variant_id}` });
        if (variant) {
          const product = await selectOne("product", { product_id: `eq.${variant.product_id}` });
          if (product) {
            const category = await selectOne("category", { category_id: `eq.${product.category_id}` });
            if (category && (category.name === "Phụ kiện" || category.slug === "phu-kien")) {
              throw new HttpError(400, "BAD_REQUEST", `Sản phẩm ${product.name} thuộc danh mục hạn chế đổi trả của Velura`);
            }
          }
        }

        // Tình huống 8: Quantity check
        let alreadyReturnedQty = 0;
        for (const r of existingReturns) {
          if (r.status !== "rejected") {
            const { rows: rItems } = await selectRows("return_item", { return_id: `eq.${r.return_id}`, order_item_id: `eq.${item.order_item_id}` });
            for (const ri of rItems) {
              alreadyReturnedQty += ri.quantity;
            }
          }
        }

        if (alreadyReturnedQty + item.quantity > orderItem.quantity) {
          throw new HttpError(400, "BAD_REQUEST", "Số lượng đổi trả vượt quá số lượng đã mua");
        }

        validatedItems.push({
          order_item_id: item.order_item_id,
          quantity: item.quantity
        });
      }

      const trackingReturnCode = "RET" + Date.now().toString().slice(-8).toUpperCase();

      const newReturn = await insertRow("return_exchange", {
        order_id,
        user_id: profile.user_id,
        return_type,
        description: description || null,
        evidence_images: evidence_images || null,
        status: "pending",
        tracking_return_code: trackingReturnCode,
        created_at: new Date().toISOString()
      });

      const returnItems = [];
      for (const item of validatedItems) {
        const retItem = await insertRow("return_item", {
          return_id: newReturn.return_id,
          order_item_id: item.order_item_id,
          quantity: item.quantity
        });
        returnItems.push(retItem);
      }

      return sendJson(res, 200, {
        success: true,
        return: { ...newReturn, items: returnItems }
      }, corsHeaders);
    }

    // GET /api/user/returns
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const order_id = url.searchParams.get("order_id");

      let queryParams = { user_id: `eq.${profile.user_id}` };
      if (order_id) {
        queryParams.order_id = `eq.${order_id}`;
      }

      const { rows: returns } = await selectRows("return_exchange", queryParams);
      
      // Auto-progress and populate items
      const populatedReturns = [];
      for (let ret of returns) {
        ret = await autoProgressReturn(ret);
        const { rows: rItems } = await selectRows("return_item", { return_id: `eq.${ret.return_id}` });
        
        const itemsWithDetails = [];
        for (const ri of rItems) {
          const orderItem = await selectOne("order_item", { item_id: `eq.${ri.order_item_id}` });
          itemsWithDetails.push({
            ...ri,
            product_name: orderItem ? orderItem.product_name : "Sản phẩm",
            product_image: orderItem ? orderItem.product_image : null,
            unit_price: orderItem ? orderItem.unit_price : 0
          });
        }
        populatedReturns.push({
          ...ret,
          items: itemsWithDetails
        });
      }

      // Sort descending by created_at
      populatedReturns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return sendJson(res, 200, {
        success: true,
        returns: populatedReturns
      }, corsHeaders);
    }
  }

  throw new HttpError(404, "NOT_FOUND", "API endpoint not found");
}
