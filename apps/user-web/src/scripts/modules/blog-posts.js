export const FALLBACK_BLOG_CATEGORIES = [
  { slug: "trend", name: "Xu hướng", display_order: 10 },
  { slug: "style", name: "Phối đồ", display_order: 20 },
  { slug: "interview", name: "Phỏng vấn", display_order: 30 },
  { slug: "sustainable", name: "Bền vững", display_order: 40 },
  { slug: "event", name: "Sự kiện", display_order: 50 }
];

export const FALLBACK_BLOG_POSTS = [
  {
    slug: "xu-huong-mau-sac-he-2026",
    category_slug: "trend",
    title: "Xu hướng màu sắc hè 2026: Bảng màu cho tủ đồ mới",
    excerpt: "Sage, cocoa, ivory và hồng phấn - những gam màu đang chiếm lĩnh mùa hè năm nay. Khám phá cách phối chúng trong tủ đồ Velura.",
    image_url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80",
    author: "Nguyễn Thu Hà",
    read_minutes: 8,
    is_featured: true,
    published_at: "2026-07-05T09:00:00+07:00",
    content: {
      intro: "Mùa hè 2026 đánh dấu sự trở lại của các gam màu tự nhiên, lấy cảm hứng từ thiên nhiên và lối sống tối giản. Bảng màu năm nay không quá ồn ào nhưng đủ sức tạo điểm nhấn cho tủ đồ mùa nóng.",
      takeaways: [
        "Chọn một màu chủ đạo, sau đó dùng trắng ngà hoặc sand để làm dịu tổng thể.",
        "Sage, olive và xanh nhạt hợp với linen, lụa mờ và các bề mặt có độ rũ.",
        "Hồng phấn đẹp nhất khi đi cùng phom tối giản, ít chi tiết và phụ kiện nhỏ."
      ],
      sections: [
        {
          heading: "Sage và ivory cho ngày nhiều nắng",
          body: [
            "Sage không còn là gam màu phụ. Khi đặt cạnh ivory, sắc xanh dịu này tạo nên vẻ ngoài thanh lịch mà vẫn có cảm giác nghỉ dưỡng.",
            "Hãy để chất liệu giữ vai trò chính: linen có độ nhăn tự nhiên, lụa mờ có độ rũ nhẹ, còn phụ kiện chỉ nên xuất hiện như một điểm sáng nhỏ."
          ],
          productSkus: ["VLR-SD-004", "VLR-AO-003", "VLR-SD-018"]
        },
        {
          heading: "Cocoa và vàng ánh cho tối sang trọng",
          body: [
            "Cocoa là gam màu ấm áp giúp trang phục tối giản có chiều sâu hơn. Khi kết hợp với ánh vàng nhẹ, tổng thể trở nên sang trọng mà không cần chi tiết cầu kỳ.",
            "Set gilet cocoa ánh vàng là lựa chọn lý tưởng cho bữa tối ven biển hoặc sự kiện nhẹ mùa hè."
          ],
          productSkus: ["VLR-SD-005", "VLR-AO-001", "VLR-SD-002"]
        },
        {
          heading: "Hồng kem dịu dàng",
          body: [
            "Hồng phấn mùa này không còn quá ngọt. Khi đi cùng đường cắt gọn và phom dáng đứng vừa phải, màu hồng trở nên mềm nhưng không yếu.",
            "Set boho linen hồng kem là lựa chọn hoàn hảo cho những ngày dạo biển hoặc brunch cuối tuần."
          ],
          productSkus: ["VLR-SD-019", "VLR-AO-004", "VLR-SD-010"]
        }
      ],
      products: [
        { sku: "VLR-SD-004", note: "Set sage dịu để thử bảng màu xanh mùa hè theo cách thanh lịch." },
        { sku: "VLR-SD-005", note: "Set gilet cocoa ánh vàng cho bữa tối sang trọng." },
        { sku: "VLR-SD-019", note: "Set boho linen hồng kem dịu dàng cho mùa hè." }
      ]
    }
  },
  {
    slug: "cong-thuc-phoi-do-resort-he-2026",
    category_slug: "style",
    title: "Công thức phối đồ resort hè 2026: Từ sân bay đến bữa tối",
    excerpt: "Vali 3 ngày với 5 món đồ linh hoạt. Cách phối set linen, đầm maxi và phụ kiện cho chuyến đi biển.",
    image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80",
    author: "Lê Minh Châu",
    read_minutes: 7,
    is_featured: false,
    published_at: "2026-07-03T09:00:00+07:00",
    content: {
      intro: "Một tủ đồ nghỉ dưỡng tốt không cần nhiều món. Điều quan trọng là mỗi món phải đủ nhẹ, đủ thoáng và đủ chỉn chu để đi từ sân bay đến bữa tối ven biển.",
      takeaways: [
        "Linen đen kem là nền an toàn cho những ngày di chuyển nhiều.",
        "Mũ cói, kính râm và túi nhỏ giúp outfit có điểm nhấn mà không nặng mắt.",
        "Ưu tiên phom rộng vừa phải, không chọn đồ quá ôm khi lịch trình có nhiều hoạt động ngoài trời."
      ],
      sections: [
        {
          heading: "Set linen cho resort casual",
          body: [
            "Đen và kem là bộ đôi ít rủi ro nhất trong vali mùa hè. Tỉ lệ đẹp là một món tối màu ở thân trên, một món sáng màu ở thân dưới và phụ kiện có bề mặt tự nhiên.",
            "Set dạo biển linen đen kem giữ được độ thanh lịch khi bạn cần bước vào nhà hàng, nhưng vẫn đủ thoải mái cho một buổi dạo biển."
          ],
          productSkus: ["VLR-SD-016", "VLR-SD-018", "VLR-SD-011"]
        },
        {
          heading: "Phụ kiện thay đổi cả bức ảnh",
          body: [
            "Phụ kiện nghỉ dưỡng nên có công năng thật. Mũ cói che nắng, kính râm cân bằng gương mặt, khăn lụa có thể buộc tóc hoặc thắt trên quai túi.",
            "Khi trang phục đã tối giản, chất liệu phụ kiện là nơi thể hiện cá tính: cói, lụa, acetate và canvas tạo cảm giác tự nhiên hơn kim loại bóng."
          ],
          productSkus: ["VLR-SD-012", "VLR-SD-013", "VLR-SD-014"]
        }
      ],
      products: [
        { sku: "VLR-SD-016", note: "Set linen đen kem cho những ngày cần mặc nhanh nhưng vẫn đẹp." },
        { sku: "VLR-SD-018", note: "Set white resort cho hẹn hò mùa hè." },
        { sku: "VLR-SD-011", note: "Set áo len crochet lệch vai năng động." }
      ]
    }
  },
  {
    slug: "phong-cach-toi-gian-stylist-mai-anh",
    category_slug: "interview",
    title: "Phỏng vấn stylist Mai Anh: Tối giản là biết đủ",
    excerpt: "Một cuộc trò chuyện về chiếc áo mặc lại nhiều lần, màu sắc khiến phụ nữ tự tin và cách mua ít hơn mà vẫn đẹp.",
    image_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80",
    author: "Trần Bảo Ngọc",
    read_minutes: 9,
    is_featured: false,
    published_at: "2026-07-01T09:00:00+07:00",
    content: {
      intro: "Phong cách cá nhân không xuất hiện sau một lần mua sắm. Nó được tạo nên từ những món đồ được mặc lại, được chăm sóc và được gắn với một nhịp sống thật.",
      takeaways: [
        "Một món đồ tốt phải đi cùng ít nhất ba hoàn cảnh khác nhau.",
        "Sự tự tin thường đến từ độ vừa vặn, không phải từ chi tiết cầu kỳ.",
        "Màu trung tính đẹp hơn khi có một điểm nhấn nhỏ ở cổ, eo hoặc phụ kiện."
      ],
      sections: [
        {
          heading: "Món đồ được mặc lại nhiều nhất",
          body: [
            "Mai Anh chọn áo sơ mi ivory vì nó cho phép cô thay đổi vai trò trong ngày: nghiêm túc khi đi họp, nhẹ hơn khi mở cúc cổ và phối với khăn lụa.",
            "Theo cô, người mặc nên để ý tới cảm giác trên da. Một chiếc áo đẹp nhưng khiến vai bị kéo hoặc cổ tay khó cử động sẽ ít có cơ hội quay lại tủ đồ."
          ],
          productSkus: ["VLR-AO-002", "VLR-AO-001", "VLR-SD-009"]
        },
        {
          heading: "Khi cần nổi bật mà vẫn là mình",
          body: [
            "Thay vì chọn trang phục quá phức tạp, cô ưu tiên một đường cắt có chủ ý: cổ yếm, eo wrap hoặc lớp cape mềm.",
            "Những chi tiết này tạo điểm nhìn vừa đủ. Chúng giúp outfit có câu chuyện, nhưng không khiến người mặc cảm giác bị trang phục lấn át."
          ],
          productSkus: ["VLR-SD-003", "VLR-SD-006", "VLR-SD-007"]
        }
      ],
      products: [
        { sku: "VLR-AO-002", note: "Sơ mi lụa ivory là món nền dễ xoay chuyển giữa công sở và cuối tuần." },
        { sku: "VLR-SD-003", note: "Set midnight blue chạm eo hiện đại cho buổi tối." },
        { sku: "VLR-SD-009", note: "Set smart casual cá tính cho ngày thường." }
      ]
    }
  },
  {
    slug: "chat-lieu-tu-nhien-mua-he",
    category_slug: "sustainable",
    title: "Chất liệu tự nhiên mùa hè: Linen, lụa và cotton pha",
    excerpt: "Bền vững trong thời trang bắt đầu từ câu hỏi: Món đồ này có được mặc lại không, có dễ chăm sóc không và có còn đẹp sau nhiều lần sử dụng không.",
    image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=80",
    author: "Phạm Hoàng Linh",
    read_minutes: 10,
    is_featured: false,
    published_at: "2026-06-29T09:00:00+07:00",
    content: {
      intro: "Bền vững trong thời trang không chỉ nằm ở nhãn chất liệu. Nó bắt đầu từ câu hỏi rất thực tế: món đồ này có được mặc lại không, có dễ chăm sóc không và có còn đẹp sau nhiều lần sử dụng không.",
      takeaways: [
        "Độ bền của phom dáng quan trọng không kém nguồn gốc chất liệu.",
        "Màu trung tính giúp món đồ có nhiều lần xuất hiện hơn trong tủ.",
        "Chăm sóc đúng cách kéo dài tuổi thọ sản phẩm và giảm nhu cầu mua thay thế."
      ],
      sections: [
        {
          heading: "Linen nên được phép có nếp nhăn",
          body: [
            "Vẻ đẹp của linen nằm ở độ sống của bề mặt. Nếp nhăn nhẹ giúp trang phục bớt cứng, đặc biệt khi được cắt trên phom sơ mi hoặc quần ống rộng.",
            "Thay vì cố giữ linen thật phẳng, hãy chọn phom có khoảng thở. Khi mặc đúng cách, nếp vải trở thành một phần của phong thái tự nhiên."
          ],
          productSkus: ["VLR-SD-016", "VLR-AO-003", "VLR-SD-019"]
        },
        {
          heading: "Mua ít hơn bằng bảng màu ổn định",
          body: [
            "Một bảng màu ổn định giúp bạn phối lại nhiều hơn. Ivory, sand, cocoa, sage và olive tạo được nhiều tổ hợp mà không cần mua thêm quá nhiều món mới.",
            "Nếu muốn thêm cảm xúc, hãy thêm phụ kiện nhỏ. Khăn, túi hoặc kính có thể làm mới set đồ quen mà không phá vỡ tinh thần tối giản."
          ],
          productSkus: ["VLR-SD-002", "VLR-SD-004", "VLR-SD-018"]
        }
      ],
      products: [
        { sku: "VLR-SD-016", note: "Set linen đen kem bền vững cho nhiều hoàn cảnh." },
        { sku: "VLR-AO-003", note: "Áo peplum cổ vuông sage dịu nhẹ từ chất liệu tự nhiên." },
        { sku: "VLR-SD-002", note: "Set ivory draped thanh nhã với lụa mềm." }
      ]
    }
  },
  {
    slug: "velura-summer-salon-2026",
    category_slug: "event",
    title: "Velura Summer Salon 2026: Buổi thử đồ riêng tư",
    excerpt: "Sự kiện giới thiệu các set resort, dạ tiệc nhẹ và phụ kiện cho mùa du lịch mới. Stylist Velura gợi ý set theo vóc dáng và hoàn cảnh.",
    image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80",
    author: "Minh Anh",
    read_minutes: 6,
    is_featured: false,
    published_at: "2026-06-27T09:00:00+07:00",
    content: {
      intro: "Velura Summer Salon 2026 được thiết kế như một buổi thử đồ chậm: khách mời chạm vào chất liệu, thử nhiều tỉ lệ phom dáng và nhận gợi ý phối theo lịch trình cá nhân.",
      takeaways: [
        "Không gian sự kiện tập trung vào resort wear, dạ tiệc nhẹ và phụ kiện du lịch.",
        "Stylist Velura gợi ý set theo vóc dáng, tông da và hoàn cảnh sử dụng.",
        "Các product card trong bài dẫn thẳng tới trang chi tiết để khách xem thêm sau sự kiện."
      ],
      sections: [
        {
          heading: "Khu resort wear",
          body: [
            "Khu đầu tiên dành cho những chuyến đi. Các set linen, áo cổ yếm và chân váy ivory được treo theo bảng màu để khách dễ hình dung vali 3 ngày.",
            "Đội stylist ưu tiên những công thức mặc được nhiều lần: một set trắng, một set sage, một chiếc sơ mi linen và phụ kiện gọn."
          ],
          productSkus: ["VLR-SD-018", "VLR-SD-004", "VLR-SD-016"]
        },
        {
          heading: "Khu dạ tiệc nhẹ",
          body: [
            "Ở khu evening, Velura đặt cạnh nhau các dáng đầm cúp ngực, cổ yếm và đuôi cá để khách so sánh độ rơi của chất liệu.",
            "Điểm đáng chú ý không phải là độ lộng lẫy tối đa, mà là cảm giác vừa vặn khi người mặc ngồi xuống, bước đi và xoay người."
          ],
          productSkus: ["VLR-SD-010", "VLR-SD-025", "VLR-SD-005"]
        }
      ],
      products: [
        { sku: "VLR-SD-018", note: "Set white resort cho hẹn hò mùa hè." },
        { sku: "VLR-SD-010", note: "Set soft ceremony nữ tính cho dạ tiệc nhẹ." },
        { sku: "VLR-SD-025", note: "Set đầm dạ hội công Chúa tulle xếp tầng." }
      ]
    }
  },
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
    content: {
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
    }
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
    content: {
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
    }
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
    content: {
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
    }
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
    content: {
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
    }
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
    content: {
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
    }
  }
];

export function getFallbackBlogPost(slug) {
  return FALLBACK_BLOG_POSTS.find((post) => post.slug === slug) || null;
}
