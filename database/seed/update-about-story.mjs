import fs from "fs";

let supabaseUrl = process.env.VELURA_SUPABASE_URL || process.env.SUPABASE_URL || "";
let serviceKey = process.env.VELURA_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceKey) {
  try {
    const env = fs.readFileSync(new URL("../../.env", import.meta.url), "utf8");
    supabaseUrl ||= env.match(/(?:VELURA_SUPABASE_URL|SUPABASE_URL)=(.*)/)?.[1]?.trim() || "";
    serviceKey = env.match(/VELURA_SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || "";
  } catch {}
}

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase URL or service role key. Update .env before running this script.");
}

const story = [
  "Velura bắt đầu từ một xưởng may nhỏ - nơi tình yêu dành cho từng đường kim mũi chỉ đã thắp lên ngọn lửa của một thương hiệu.",
  "Chúng tôi tin rằng vẻ đẹp đích thực không nằm ở sự ồn ào, mà ở sự thanh lịch có thể đồng hành qua nhiều mùa.",
  "Với chất liệu tự nhiên, phom dáng tinh tế và trải nghiệm cá nhân hóa, Velura không chỉ may trang phục - chúng tôi đồng hành cùng bạn."
];

const response = await fetch(`${supabaseUrl}/rest/v1/static_page?slug=eq.about`, {
  method: "PATCH",
  headers: {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json",
    prefer: "return=representation"
  },
  body: JSON.stringify({ content: { story } })
});

const rows = await response.json();
if (!response.ok) throw new Error(JSON.stringify(rows));
if (!rows.length) throw new Error("About page: no matching static_page row found");
console.log("Updated about story");
