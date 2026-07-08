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
  prefer: "resolution=merge-duplicates,return=representation",
  "content-type": "application/json"
};

const NEW_BLOGS = [
  {
    slug: "best-fit-wins-song-hye-kyo-2026",
    category_slug: "trend",
    title: "Phong cách Best Fit Wins và sự bùng nổ của Song Hye Kyo 2026",
    excerpt: "Song Hye Kyo dẫn đầu xu hướng thời trang ứng dụng 2026 với phom dáng sắc sảo, tối giản nhưng vô cùng sang trọng.",
    image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=80",
    author: "Trần Thảo Linh",
    read_minutes: 6,
    is_featured: false,
    published_at: "2026-07-06T10:00:00+07:00",
    content: JSON.stringify({
      intro: "Phong cách cá nhân được khẳng định mạnh mẽ nhất qua độ vừa vặn và phom dáng của trang phục. Tại Milan 2026, Song Hye Kyo một lần nữa chứng minh triết lý 'Best Fit Wins' - trang phục đẹp nhất là trang phục vừa vặn nhất với cơ thể và thần thái của bạn.",
      takeaways: [
        "Độ vừa vặn ở vai và eo là yếu tố quyết định phom dáng thanh lịch.",
        "Màu sắc trung tính như trắng ngà hay sage nhạt giúp tôn da tự nhiên.",
        "Sự kết hợp tinh tế giữa blazer và chân váy xếp ly tạo nên nét nữ tính sắc sảo."
      ],
      sections: [
        {
          heading: "Phom dáng xếp ly tinh tế cùng Song Hye Kyo",
          body: [
            "Xuất hiện tại sự kiện, nữ diễn viên ưu tiên phom dáng có cấu trúc xếp nếp tinh xảo, tạo độ chuyển động mềm mại mỗi khi di chuyển. Set Sage Pleated là gợi ý lý tưởng để bạn tái hiện phong cách này.",
            "Tông màu sage dịu mát kết hợp với chi tiết dập ly nhỏ làm nổi bật vòng eo thon gọn, mang lại diện mạo thời thượng nhưng không kém phần thanh lịch."
          ],
          productSkus: ["VLR-SD-004", "VLR-SD-018"]
        }
      ],
      products: [
        { sku: "VLR-SD-004", note: "Set Sage Pleated dập ly mềm mại chuẩn phong cách Song Hye Kyo." },
        { sku: "VLR-SD-018", note: "Set White Resort tối giản, tôn lên làn da sáng và vóc dáng thanh mảnh." }
      ]
    })
  },
  {
    slug: "phoi-do-sac-nau-cognac-hong-phan-he-2026",
    category_slug: "style",
    title: "Bảng màu hè 2026: Sự hòa quyện giữa sắc nâu Cognac và hồng phấn",
    excerpt: "Khám phá cách phối hai tông màu nóng và lạnh hài hòa, tạo điểm nhấn nổi bật giữa những ngày hè đầy nắng.",
    image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80",
    author: "Lê Minh Châu",
    read_minutes: 7,
    is_featured: false,
    published_at: "2026-07-06T11:00:00+07:00",
    content: JSON.stringify({
      intro: "Bảng màu mùa hè 2026 ghi nhận sự kết hợp đầy bất ngờ giữa nét trầm ấm, cổ điển của màu nâu Cognac và sự ngọt ngào, dịu mát của hồng phấn. Sự tương phản nhẹ nhàng này đem lại làn gió mới cho các cô nàng yêu thích dạo phố.",
      takeaways: [
        "Sử dụng sắc Cognac làm tông màu chủ đạo cho các trang phục chính như quần hay gilet.",
        "Điểm xuyết màu hồng phấn qua áo blouse lụa mềm mại hoặc phụ kiện nhỏ xinh.",
        "Giữ tổng thể gọn gàng, hạn chế dùng quá 3 màu trên một set đồ."
      ],
      sections: [
        {
          heading: "Cách kết hợp nâu Cognac và hồng phấn cực chất",
          body: [
            "Sự phối hợp giữa một chiếc áo gilet tông trầm ấm và một chiếc quần linen hồng kem nhẹ nhàng tạo ra tỉ lệ màu sắc vô cùng thú vị. Nó vừa giữ được nét trưởng thành lại vừa tôn lên sự nữ tính duyên dáng.",
            "Hãy để chất liệu đan xen: vải tweed đứng phom kết hợp cùng linen bay bổng sẽ giúp bộ cánh của bạn có chiều sâu hơn."
          ],
          productSkus: ["VLR-SD-005", "VLR-SD-019"]
        }
      ],
      products: [
        { sku: "VLR-SD-005", note: "Set Gilet Tweed Cocoa ánh kim màu nâu sang trọng." },
        { sku: "VLR-SD-019", note: "Set Boho Linen Hồng Kem mềm mại dạo phố." }
      ]
    })
  },
  {
    slug: "phong-van-giam-doc-sang-tao-ve-thoi-trang-tinh-gon",
    category_slug: "interview",
    title: "Trò chuyện cùng Giám đốc Sáng tạo: Định nghĩa lại thời trang tinh gọn",
    excerpt: "Một cuộc phỏng vấn sâu sắc về xu hướng thời trang ứng dụng bền vững, chất liệu linen cao cấp và cảm xúc của người mặc.",
    image_url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1400&q=80",
    author: "Trần Bảo Ngọc",
    read_minutes: 8,
    is_featured: false,
    published_at: "2026-07-06T12:00:00+07:00",
    content: JSON.stringify({
      intro: "Thời trang tinh gọn (Quiet Luxury) không nằm ở những chiếc logo to bản, nó nằm ở cảm xúc thực tế khi chạm vào chất vải và đường cắt may tinh tế tôn dáng. Tuần này, hãy cùng trò chuyện với Giám đốc Sáng tạo Velura về triết lý này.",
      takeaways: [
        "Thời trang tinh gọn tập trung vào cảm nhận bề mặt chất liệu như lụa, linen.",
        "Thiết kế tối giản giúp ứng dụng linh hoạt trong nhiều môi trường khác nhau.",
        "Sự tự tin toát ra từ phom dáng đứng form và tỉ lệ cắt ráp cân đối."
      ],
      sections: [
        {
          heading: "Những món đồ nền tảng làm nên phong cách",
          body: [
            "Trong buổi chia sẻ, nhà thiết kế nhấn mạnh vai trò của chiếc sơ mi lụa mềm mại màu Ivory. Đây là món đồ cực kỳ đa năng khi dễ dàng phối từ quần tây công sở thanh lịch đến chân váy dạo phố.",
            "Thêm vào đó, một set đồ smart casual cá tính với phom dáng suông rộng cũng sẽ giúp bạn thoải mái thể hiện cái tôi phóng khoáng mà vẫn giữ được sự chỉn chu."
          ],
          productSkus: ["VLR-AO-002", "VLR-SD-009"]
        }
      ],
      products: [
        { sku: "VLR-AO-002", note: "Áo sơ mi lụa tơ tằm Ivory mềm mát, rủ nhẹ cực kỳ tôn dáng." },
        { sku: "VLR-SD-009", note: "Set Smart Casual cá tính năng động cho ngày thường bận rộn." }
      ]
    })
  },
  {
    slug: "nguyen-ly-thoi-trang-ben-vung-linen-tu-nhien",
    category_slug: "sustainable",
    title: "Nguyên lý thời trang bền vững: Chọn Linen tự nhiên cho tủ đồ hè",
    excerpt: "Linen không chỉ là chất liệu giải nhiệt mùa hè, nó là biểu tượng của phong cách sống chậm và thân thiện với thiên nhiên.",
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1400&q=80",
    author: "Phạm Hoàng Linh",
    read_minutes: 9,
    is_featured: false,
    published_at: "2026-07-06T13:00:00+07:00",
    content: JSON.stringify({
      intro: "Thời trang bền vững đang chuyển dịch từ khái niệm lý thuyết sang thói quen mua sắm hàng ngày. Việc lựa chọn các chất liệu tự nhiên có khả năng phân hủy sinh học như Linen hay Organic Cotton đang trở thành xu hướng sống xanh của thời đại.",
      takeaways: [
        "Vải Linen có nguồn gốc tự nhiên, thoáng khí và có độ bền sợi cao vượt trội.",
        "Nếp nhăn đặc trưng của linen tạo ra vẻ đẹp mộc mạc phóng khoáng đầy tự nhiên.",
        "Nên giặt tay và phơi khô tự nhiên để giữ độ co giãn tự nhiên của thớ vải."
      ],
      sections: [
        {
          heading: "Vẻ đẹp mộc mạc tinh tế từ thớ vải Linen",
          body: [
            "Set dạo biển linen phối màu đen kem là minh chứng cho thấy thời trang sinh thái vẫn vô cùng bắt mắt và sành điệu. Độ nhăn tự nhiên của vải linen kết hợp phom dáng phóng khoáng tạo nên cảm giác tự do vô tận.",
            "Phối cùng một chiếc áo peplum cổ vuông xanh sage dịu mát sẽ đem lại một tổng thể trang phục hòa quyện tuyệt vời với thiên nhiên."
          ],
          productSkus: ["VLR-SD-016", "VLR-AO-003"]
        }
      ],
      products: [
        { sku: "VLR-SD-016", note: "Set dạo biển Linen đen kem tự nhiên, thân thiện môi trường." },
        { sku: "VLR-AO-003", note: "Áo Peplum cổ vuông tông xanh sage nhẹ nhàng thanh lịch." }
      ]
    })
  },
  {
    slug: "velura-fashion-salon-2026-ket-noi-cam-xuc",
    category_slug: "event",
    title: "Velura Fashion Salon 2026: Đêm tiệc kết nối cảm xúc thời trang",
    excerpt: "Không gian trưng bày ấm cúng, tinh tế giới thiệu dòng sản phẩm resort và dạ hội cao cấp mới nhất của Velura.",
    image_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=80",
    author: "Minh Anh",
    read_minutes: 5,
    is_featured: false,
    published_at: "2026-07-06T14:00:00+07:00",
    content: JSON.stringify({
      intro: "Sự kiện thường niên Velura Fashion Salon 2026 đã diễn ra thành công rực rỡ, mang đến cho giới mộ điệu không gian trải nghiệm thời trang chậm đầy chiều sâu. Nơi các thiết kế dạ tiệc và resort wear cao cấp được trình diễn chân thực.",
      takeaways: [
        "Giới thiệu các dòng sản phẩm dạ hội Tulle xếp tầng thủ công cao cấp.",
        "Trải nghiệm trực quan bề mặt vải và nhận tư vấn phối đồ từ stylist chuyên nghiệp.",
        "Mỗi thiết kế đều mang thông điệp tôn vinh vẻ đẹp tự nhiên và sự tự tin của phái đẹp."
      ],
      sections: [
        {
          heading: "Điểm nhấn dạ tiệc và lễ hội sắc màu",
          body: [
            "Thu hút mọi ánh nhìn tại sự kiện là các mẫu đầm dạ hội bồng bềnh xếp tầng tỉ mỉ. Chất liệu lưới Tulle cao cấp xếp lớp tạo độ bồng bềnh bay bổng tựa như một nàng công chúa trong cổ tích.",
            "Bên cạnh đó, các set đồ lễ hội nhẹ nhàng tinh tế (Soft Ceremony) mang sắc màu trang nhã cũng là lựa chọn hoàn hảo cho các sự kiện cưới hỏi hay tiệc cocktail ngoài trời."
          ],
          productSkus: ["VLR-SD-025", "VLR-SD-010"]
        }
      ],
      products: [
        { sku: "VLR-SD-025", note: "Set đầm dạ hội công chúa Tulle thiết kế bồng bềnh sang trọng bậc nhất." },
        { sku: "VLR-SD-010", note: "Set Soft Ceremony thanh lịch, nhẹ nhàng cho tiệc ngoài trời." }
      ]
    })
  }
];

async function seed() {
  console.log("Upserting new modern blogs to Supabase database...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog`, {
    method: "POST",
    headers,
    body: JSON.stringify(NEW_BLOGS)
  });

  if (!res.ok) {
    console.error("Failed to seed blogs:", await res.text());
    process.exit(1);
  }

  console.log("Successfully seeded new modern blog posts into Supabase database.");
}

seed().catch(console.error);
