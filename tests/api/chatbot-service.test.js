import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ASSISTANT_GREETING } from "../../apps/api/src/chatbot/chatbot-constants.js";
import { createFallbackReply, detectHandoffIntent, getFallbackReply } from "../../apps/api/src/chatbot/chatbot-service.js";


test("default chatbot greeting introduces Velura Stylist capabilities", () => {
  assert.match(DEFAULT_ASSISTANT_GREETING, /Velura Stylist/);
  assert.match(DEFAULT_ASSISTANT_GREETING, /Gợi ý outfit/);
  assert.match(DEFAULT_ASSISTANT_GREETING, /Tạo ticket/);
  assert.match(DEFAULT_ASSISTANT_GREETING, /CSKH/);
});

test("greeting fallback returns the branded onboarding message", () => {
  assert.equal(createFallbackReply("Xin chào"), DEFAULT_ASSISTANT_GREETING);
});

test("handoff detection accepts direct CSKH and ticket requests", () => {
  assert.equal(detectHandoffIntent("Mình muốn gặp CSKH"), true);
  assert.equal(detectHandoffIntent("Tạo ticket hỗ trợ đơn hàng giúp mình"), true);
  assert.equal(detectHandoffIntent("Tôi cần phản ánh về giao hàng"), true);
});

test("policy query fallback explains return policy rules", async () => {
  const mockRepository = {
    async searchPolicies() {
      return {
        rows: [{
          title: "Chính sách đổi trả",
          summary: "Đổi trả trong 7 ngày cho sản phẩm nguyên giá đủ điều kiện.",
          content: [
            {
              heading: "Thời gian đổi trả",
              items: [
                "7 ngày kể từ ngày nhận hàng đối với sản phẩm nguyên giá.",
                "3 ngày đối với sản phẩm giảm giá trên 30%."
              ]
            }
          ]
        }]
      };
    }
  };
  const reply = await getFallbackReply("Chính sách đổi trả", [], mockRepository);
  assert.match(reply, /7 ngày kể từ ngày nhận hàng đối với sản phẩm nguyên giá/);
  assert.match(reply, /3 ngày đối với sản phẩm giảm giá trên 30%/);
});

test("handoff detection handles CSKH escalation triggers correctly", () => {
  assert.equal(detectHandoffIntent("CSKH"), true);
  assert.equal(detectHandoffIntent("gặp nhân viên hỗ trợ"), true);
  assert.equal(detectHandoffIntent("tôi muốn mua váy"), false);
});

