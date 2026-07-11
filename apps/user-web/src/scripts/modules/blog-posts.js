export const FALLBACK_BLOG_CATEGORIES = [
  { slug: "trend", name: "Xu hướng", display_order: 10 },
  { slug: "style", name: "Phối đồ", display_order: 20 },
  { slug: "interview", name: "Phỏng vấn", display_order: 30 },
  { slug: "sustainable", name: "Bền vững", display_order: 40 },
  { slug: "event", name: "Sự kiện", display_order: 50 }
];

export const FALLBACK_BLOG_POSTS = [
  /* ──────────────────────────────────────────────────────────
     FEATURED — Bảng màu mùa thu 2026
     ────────────────────────────────────────────────────────── */
  {
    slug: "bang-mau-mua-thu-2026",
    category_slug: "trend",
    title: "Bảng màu mùa thu 2026: Sắc nâu cognac và hồng phấn lên ngôi",
    excerpt: "Năm nay, các nhà mốt lớn đồng loạt giới thiệu bảng màu ấm áp xoay quanh nâu cognac, hồng phấn dịu nhẹ và xanh sage. Velura mách bạn cách phối ba sắc màu chủ đạo để có tủ đồ mùa thu hoàn hảo.",
    image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&h=800&q=80",
    author: "Nguyễn Thu Hà",
    read_minutes: 8,
    is_featured: true,
    published_at: "2026-06-02T09:00:00+07:00",
    content: {
      intro: "Mùa thu 2026 đánh dấu sự quay trở lại mạnh mẽ của các gam màu trầm ấm, tinh tế. Bảng màu xoay quanh nâu cognac — sắc nâu đỏ gợi nhớ vị rượu sành điệu, hồng phấn pastel tựa cánh hoa đào và xanh sage mộng mơ trở thành bộ ba hoàn hảo cho tủ đồ thu đông.",
      takeaways: [
        "Nâu cognac là sắc màu trung tâm, thay thế hoàn hảo cho đen truyền thống.",
        "Hồng phấn pastel làm dịu các set đồ trầm tối, mang lại nét nữ tính tinh tế.",
        "Xanh sage đóng vai trò cân bằng, làm mát tổng thể mà vẫn giữ chiều sâu.",
        "Phối tối đa 3 tông trong một set để giữ sự hài hòa thị giác."
      ],
      sections: [
        {
          heading: "Nâu cognac: Đẳng cấp thay thế đen kinh điển",
          body: [
            "Cognac là sắc nâu có ánh đỏ ấm, gợi liên tưởng đến vẻ sang trọng của da thuộc và rượu vang thượng hạng. Khác với nâu đất thông thường, cognac có chiều sâu và độ ấm giúp tôn da người châu Á một cách tự nhiên nhất.",
            "Blazer cognac kết hợp quần suông ivory hoặc đầm lụa rủ mềm mại là công thức phối đồ chuẩn chỉnh cho mùa thu. Thêm một chiếc túi da thật cùng tông sẽ hoàn thiện diện mạo thanh lịch mà không hề đơn điệu."
          ],
          productSkus: ["VLR-SD-005", "VLR-AO-001", "VLR-SD-002"]
        },
        {
          heading: "Hồng phấn & Sage: Bộ đôi cân bằng hoàn hảo",
          body: [
            "Sự kết hợp giữa hồng phấn pastel và xanh sage tạo ra bảng màu nhẹ nhàng nhưng đầy tính nghệ thuật. Hồng phấn mang lại nét dịu dàng qua áo blouse lụa hay khăn choàng mỏng, trong khi sage làm nền bằng quần wide-leg hay blazer dáng dài.",
            "Cả hai tông màu đều thuộc họ trung tính mềm (soft neutral), giúp người mặc dễ dàng phối với bất kỳ phụ kiện nào mà vẫn giữ được tổng thể hài hòa, tinh tế."
          ],
          productSkus: ["VLR-SD-004", "VLR-SD-019", "VLR-AO-003"]
        }
      ],
      products: [
        { sku: "VLR-SD-005", note: "Set Gilet Tweed Cocoa tông nâu cognac sang trọng cho mùa thu." },
        { sku: "VLR-SD-004", note: "Set Sage Pleated xanh sage dịu mát cân bằng bảng màu ấm." },
        { sku: "VLR-SD-019", note: "Set Boho Linen Hồng Kem nhẹ nhàng cho những ngày thu nắng nhạt." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     1. Sự kiện — Địch Lệ Nhiệt Ba mặc thiết kế Phan Huy
     ────────────────────────────────────────────────────────── */
  {
    slug: "dich-le-nhiet-ba-phan-huy",
    category_slug: "event",
    title: "Địch Lệ Nhiệt Ba mặc thiết kế Phan Huy trên bìa tạp chí",
    excerpt: "Mỹ nữ Tân Cương Địch Lệ Nhiệt Ba diện đầm Haute Couture 'Cành vàng lá ngọc' của NTK trẻ Phan Huy trên bìa ấn phẩm Marie Claire Trung Quốc.",
    image_url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Lê Minh Châu",
    read_minutes: 6,
    is_featured: false,
    published_at: "2026-05-28T09:00:00+07:00",
    content: {
      intro: "Sự xuất hiện của Địch Lệ Nhiệt Ba trên bìa Marie Claire Trung Quốc số tháng 6/2026 trong thiết kế Haute Couture của nhà thiết kế Việt Nam Phan Huy đã gây tiếng vang lớn trong làng thời trang châu Á.",
      takeaways: [
        "Thiết kế 'Cành vàng lá ngọc' kết hợp kỹ thuật thêu tay truyền thống Việt Nam với phom dáng haute couture Pháp.",
        "Sự kiện đánh dấu lần đầu tiên NTK Việt có tác phẩm trên bìa tạp chí thời trang hàng đầu Trung Quốc.",
        "Xu hướng các ngôi sao quốc tế tìm đến thời trang Việt Nam ngày càng rõ nét."
      ],
      sections: [
        {
          heading: "Khi tinh hoa thủ công Việt chinh phục sao quốc tế",
          body: [
            "Bộ đầm haute couture 'Cành vàng lá ngọc' được NTK Phan Huy dành hơn 800 giờ thêu tay thủ công. Mỗi chi tiết hoa văn được cài cắm tỉ mỉ lấy cảm hứng từ nghệ thuật gốm sứ Bát Tràng và hoa sen Việt Nam.",
            "Với sự kết hợp giữa lụa tơ tằm Việt Nam và organza Pháp, thiết kế mang đến vẻ đẹp vừa thổ cẩm truyền thống vừa hiện đại, xứng đáng xuất hiện trên bìa một ấn phẩm thời trang hàng đầu châu Á."
          ],
          productSkus: ["VLR-SD-010", "VLR-SD-025"]
        }
      ],
      products: [
        { sku: "VLR-SD-010", note: "Set Soft Ceremony thanh lịch lấy cảm hứng từ haute couture." },
        { sku: "VLR-SD-025", note: "Đầm dạ hội Tulle bồng bềnh với kỹ thuật xếp tầng thủ công." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     2. Sự kiện — Hề Mộng Dao diện đầm nhà mốt Việt
     ────────────────────────────────────────────────────────── */
  {
    slug: "he-mong-dao-dam-viet",
    category_slug: "event",
    title: "Hề Mộng Dao diện đầm của nhà mốt Việt trong ảnh cưới",
    excerpt: "Siêu mẫu Hề Mộng Dao chọn đầm ren thêu tinh xảo của local brand Việt trong loạt ảnh pre-wedding cùng doanh nhân Hà Du Quân.",
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Trần Bảo Ngọc",
    read_minutes: 12,
    is_featured: false,
    published_at: "2026-05-25T09:00:00+07:00",
    content: {
      intro: "Hôn lễ của siêu mẫu Hề Mộng Dao và doanh nhân Hà Du Quân tại Pháp đã thu hút sự quan tâm lớn từ truyền thông và giới thời trang châu Á. Trong bộ ảnh pre-wedding, cô lựa chọn đầm ren thêu tinh xảo của thương hiệu Việt Montsand.",
      takeaways: [
        "Local brand Việt Nam ngày càng được các ngôi sao quốc tế tin tưởng lựa chọn.",
        "Kỹ thuật thêu ren thủ công Việt Nam đạt trình độ haute couture quốc tế.",
        "Xu hướng wedding dress từ thương hiệu Việt đang bùng nổ tại thị trường châu Á."
      ],
      sections: [
        {
          heading: "Montsand: Khi ren Việt vươn tầm quốc tế",
          body: [
            "Thương hiệu Montsand đã dành hơn 6 tháng để hoàn thiện chiếc đầm cưới ren cho Hề Mộng Dao. Mỗi đường thêu tay được thực hiện bởi nghệ nhân có hơn 20 năm kinh nghiệm tại xưởng may truyền thống Huế.",
            "Thiết kế kết hợp kỹ thuật ren Chantilly cổ điển với motif hoa sen Việt Nam, tạo nên tác phẩm vừa mang hơi thở phương Tây sang trọng vừa giữ được linh hồn văn hóa Đông phương."
          ],
          productSkus: ["VLR-SD-010", "VLR-SD-025"]
        }
      ],
      products: [
        { sku: "VLR-SD-010", note: "Set Soft Ceremony ren tinh xảo lấy cảm hứng từ wedding couture." },
        { sku: "VLR-SD-025", note: "Đầm dạ hội Tulle lộng lẫy cho các dịp lễ trọng đại." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     3. Bền vững — Ba thương hiệu Việt tại London FW
     ────────────────────────────────────────────────────────── */
  {
    slug: "ba-thuong-hieu-viet-london-fw-2026",
    category_slug: "sustainable",
    title: "Ba thương hiệu Việt tại London Fashion Week Spring 2026",
    excerpt: "Lần đầu tiên, ba thương hiệu Việt cùng xuất hiện trong lịch trình chính thức tại London Fashion Week, bao gồm: TRAN HUNG, Montsand và IHF Studio.",
    image_url: "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Phạm Hoàng Linh",
    read_minutes: 10,
    is_featured: false,
    published_at: "2026-05-20T09:00:00+07:00",
    content: {
      intro: "London Fashion Week Spring 2026 đánh dấu cột mốc lịch sử khi ba thương hiệu Việt Nam — TRAN HUNG, Montsand và IHF Studio — cùng xuất hiện trong lịch trình chính thức. Đây là bước tiến lớn khẳng định vị thế của thời trang Việt trên bản đồ thời trang quốc tế.",
      takeaways: [
        "TRAN HUNG đã có 13 mùa liên tiếp góp mặt tại London Fashion Week.",
        "BST 'Xuân, Hạ, Thu, Đông,... và Xuân' mang ý niệm vòng tuần hoàn vô hạn của đời người.",
        "Montsand gây ấn tượng với kỹ thuật thêu ren thủ công truyền thống Huế.",
        "IHF Studio mang đến làn gió mới với phong cách sustainable fashion."
      ],
      sections: [
        {
          heading: "TRAN HUNG: 14 mùa và hành trình không ngừng nghỉ",
          body: [
            "Nhà thiết kế Trần Hùng mang đến bộ sưu tập 'Xuân, Hạ, Thu, Đông,... và Xuân' — ý niệm về vòng tuần hoàn vô hạn, gói trọn hành trình nhân sinh từ yêu thương, sinh sôi đến tiếp nối, như mặt trời và mặt trăng xoay quanh nhau trong vũ điệu bất tận.",
            "Với chất liệu organza pha lụa tơ tằm, mỗi thiết kế mang đến cảm giác bay bổng, nhẹ nhàng như cánh hoa đào trong gió xuân. Đây là mùa thứ 14 TRAN HUNG góp mặt tại London Fashion Week — một kỷ lục ấn tượng của thời trang Việt."
          ],
          productSkus: ["VLR-SD-018", "VLR-SD-004"]
        }
      ],
      products: [
        { sku: "VLR-SD-018", note: "Set White Resort lấy cảm hứng từ tinh thần bay bổng tại LFW." },
        { sku: "VLR-SD-004", note: "Set Sage Pleated mang đậm triết lý bền vững của thời trang mới." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     4. Xu hướng — Quiet luxury
     ────────────────────────────────────────────────────────── */
  {
    slug: "quiet-luxury-phai-dep-viet",
    category_slug: "trend",
    title: "Quiet luxury: Vì sao phái đẹp Việt đang chuộng vẻ đẹp sang trọng thầm lặng",
    excerpt: "Sự trở lại của những thiết kế tối giản, chất liệu cao cấp không logo đang định nghĩa lại khái niệm sang trọng.",
    image_url: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Nguyễn Thu Hà",
    read_minutes: 7,
    is_featured: false,
    published_at: "2026-05-18T09:00:00+07:00",
    content: {
      intro: "Quiet luxury — xu hướng sang trọng thầm lặng — đang dần thay thế phong cách 'logo mania' vốn thống trị thời trang suốt nhiều năm qua. Phái đẹp Việt ngày càng ưa chuộng những thiết kế tinh giản, đặt trọng tâm vào chất liệu và đường cắt.",
      takeaways: [
        "Quiet luxury tập trung vào chất liệu cao cấp thay vì logo thương hiệu.",
        "Đường cắt tối giản nhưng đòi hỏi kỹ thuật may đo chính xác tuyệt đối.",
        "Bảng màu trung tính (nude, ivory, camel) là nền tảng của phong cách này."
      ],
      sections: [
        {
          heading: "Khi ít hơn nghĩa là nhiều hơn",
          body: [
            "Quiet luxury không phải là mặc đồ rẻ. Nó là nghệ thuật chọn lọc tinh tế nhất — một chiếc áo cashmere không logo nhưng giá trị gấp ba chiếc áo phông in tên thương hiệu. Sự sang trọng toát ra từ nếp vải rủ mềm, đường may chắc chắn và phom dáng tôn lên từng đường cong tự nhiên.",
            "Tại Velura, triết lý này được thể hiện qua từng thiết kế: set đồ ivory draped lụa rủ mềm mại hay áo sơ mi tơ tằm có thể mặc đi mặc lại hàng trăm lần mà vẫn đẹp như lần đầu."
          ],
          productSkus: ["VLR-SD-002", "VLR-AO-002"]
        }
      ],
      products: [
        { sku: "VLR-SD-002", note: "Set Ivory Draped lụa rủ — hiện thân của quiet luxury." },
        { sku: "VLR-AO-002", note: "Áo sơ mi lụa tơ tằm mềm mại — đầu tư chất liệu thay vì logo." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     5. Phối đồ — Blazer linen mùa hè
     ────────────────────────────────────────────────────────── */
  {
    slug: "cach-phoi-blazer-linen-mua-he",
    category_slug: "style",
    title: "Cách phối blazer linen cho mùa hè nhiệt đới",
    excerpt: "Blazer không còn là độc quyền của mùa thu. Khám phá 4 công thức phối đồ thoáng mát mà vẫn thanh lịch.",
    image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Lê Minh Châu",
    read_minutes: 5,
    is_featured: false,
    published_at: "2026-05-14T09:00:00+07:00",
    content: {
      intro: "Blazer linen là món đồ đa năng bậc nhất cho mùa hè nhiệt đới. Với chất liệu thoáng mát và phom dáng thanh lịch, chiếc blazer giúp bạn tự tin từ văn phòng đến buổi hẹn hò lãng mạn.",
      takeaways: [
        "Chọn blazer linen dáng oversize để tạo cảm giác thoáng đãng trong ngày nóng.",
        "Phối cùng quần suông wide-leg là công thức an toàn nhất.",
        "Màu trung tính (kem, be, xám nhạt) phù hợp nhất cho mùa hè.",
        "Có thể khoác hờ ngoài đầm midi để tạo lớp layer thanh lịch."
      ],
      sections: [
        {
          heading: "4 công thức phối blazer linen chuẩn chỉnh",
          body: [
            "Công thức 1: Blazer kem + quần suông trắng + sandal da — hoàn hảo cho ngày đi làm mùa hè. Công thức 2: Blazer be + đầm midi linen + mũ cói — set đồ dạo phố cuối tuần phóng khoáng.",
            "Công thức 3: Blazer oversize + crop top + quần jeans ống rộng — cá tính, năng động cho buổi brunch. Công thức 4: Blazer linen xanh sage + quần culotte ivory + clutch cói — thanh lịch đi sự kiện buổi tối."
          ],
          productSkus: ["VLR-SD-004", "VLR-AO-003"]
        }
      ],
      products: [
        { sku: "VLR-SD-004", note: "Set Sage dịu mát phối blazer linen hoàn hảo cho mùa hè." },
        { sku: "VLR-AO-003", note: "Áo Peplum cổ vuông xanh sage thanh lịch layer cùng blazer." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     6. Sự kiện — Á khôi Thanh Hương áo dài cổ yếm
     ────────────────────────────────────────────────────────── */
  {
    slug: "a-khoi-thanh-huong-ao-dai-co-yem",
    category_slug: "event",
    title: "Á khôi Thanh Hương gợi ý diện mốt áo dài cổ yếm hot trend",
    excerpt: "Trước đó, nhiều sao Việt như hoa hậu Thanh Thủy, á hậu Phương Anh, diễn viên Phương Anh Đào... cũng chọn áo dài cổ yếm để xuống phố hay đi sự kiện.",
    image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Trần Bảo Ngọc",
    read_minutes: 4,
    is_featured: false,
    published_at: "2026-05-10T09:00:00+07:00",
    content: {
      intro: "Áo dài cổ yếm đang trở thành xu hướng 'hot trend' được nhiều sao Việt lựa chọn. Á khôi Thanh Hương gần đây gây ấn tượng khi diện mốt áo dài cách tân này tại nhiều sự kiện lớn.",
      takeaways: [
        "Áo dài cổ yếm kế thừa di sản truyền thống và phá cách phù hợp phụ nữ hiện đại.",
        "NTK Lê Ngọc Lâm là người tiên phong mang áo dài cổ yếm vào thời trang đương đại.",
        "Phong cách này phù hợp cả sự kiện trang trọng lẫn dạo phố thường ngày."
      ],
      sections: [
        {
          heading: "Áo dài cổ yếm: Khi truyền thống gặp hiện đại",
          body: [
            "Nhiều nhà thiết kế và local brand Việt đã cho ra mắt các mẫu áo dài cổ yếm phù hợp tiết trời mùa xuân. NTK Lê Ngọc Lâm nhận định áo dài cách tân cổ yếm kế thừa di sản truyền thống và phá cách phù hợp phụ nữ hiện đại.",
            "Điểm đặc biệt của áo dài cổ yếm nằm ở phần cổ áo được cắt thấp hình chữ V, khoe bờ vai thon gọn một cách tinh tế. Kết hợp với chất liệu lụa tơ tằm mỏng nhẹ, chiếc áo mang đến vẻ đẹp vừa truyền thống vừa quyến rũ."
          ],
          productSkus: ["VLR-SD-010", "VLR-AO-004"]
        }
      ],
      products: [
        { sku: "VLR-SD-010", note: "Set Soft Ceremony thanh lịch lấy cảm hứng từ áo dài cổ yếm." },
        { sku: "VLR-AO-004", note: "Áo cổ yếm lụa tinh tế tôn dáng người phụ nữ Việt." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     7. Phỏng vấn — Đặng Mỹ Linh
     ────────────────────────────────────────────────────────── */
  {
    slug: "dang-my-linh-thoi-trang-nhat-ky",
    category_slug: "interview",
    title: "Đặng Mỹ Linh: 'Thời trang là cách tôi viết nhật ký'",
    excerpt: "Nữ doanh nhân trẻ chia sẻ về hành trình xây dựng phong cách cá nhân và bộ sưu tập áo dài hiện đại.",
    image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Nguyễn Thu Hà",
    read_minutes: 9,
    is_featured: false,
    published_at: "2026-05-06T09:00:00+07:00",
    content: {
      intro: "Đặng Mỹ Linh — nữ doanh nhân trẻ thế hệ millennials — chia sẻ rằng cô coi trang phục như những trang nhật ký ghi lại từng chương trong cuộc đời. Mỗi giai đoạn, mỗi tâm trạng đều được phản ánh qua cách cô chọn chất liệu, màu sắc và phom dáng.",
      takeaways: [
        "Phong cách cá nhân cần được xây dựng từ sự thấu hiểu bản thân.",
        "Đầu tư vào chất liệu tốt giúp trang phục đồng hành lâu dài.",
        "Áo dài hiện đại có thể mặc hàng ngày, không chỉ dịp lễ tết."
      ],
      sections: [
        {
          heading: "Khi mỗi outfit kể một câu chuyện",
          body: [
            "Mỹ Linh chia sẻ: 'Tôi không chạy theo xu hướng. Tôi chọn những món đồ khiến mình cảm thấy đúng — đúng với tâm trạng hôm đó, đúng với con người mình đang trở thành.' Cô tin rằng phong cách cá nhân là hành trình chứ không phải đích đến.",
            "Bộ sưu tập áo dài hiện đại của cô — những chiếc áo dài cách tân có thể mặc đi café, đi làm hay đi sự kiện — là minh chứng cho triết lý này. Mỗi thiết kế đều mang dấu ấn cá nhân, từ chi tiết thêu tay đến cách phối màu."
          ],
          productSkus: ["VLR-AO-002", "VLR-SD-003"]
        }
      ],
      products: [
        { sku: "VLR-AO-002", note: "Áo sơ mi lụa tơ tằm — nền tảng của phong cách tinh giản." },
        { sku: "VLR-SD-003", note: "Set Midnight Blue chạm eo tinh tế tôn nét quyến rũ cá nhân." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     8. Bền vững — Hành trình váy linen tại xưởng Velura
     ────────────────────────────────────────────────────────── */
  {
    slug: "hanh-trinh-vay-linen-xuong-velura",
    category_slug: "sustainable",
    title: "Hành trình của một chiếc váy linen tại xưởng Velura",
    excerpt: "Từ cánh đồng lanh ở Normandie đến tay người mặc — câu chuyện về sự tỉ mỉ và tình yêu với chất liệu tự nhiên.",
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Phạm Hoàng Linh",
    read_minutes: 11,
    is_featured: false,
    published_at: "2026-05-02T09:00:00+07:00",
    content: {
      intro: "Mỗi chiếc váy linen tại Velura đều mang trong mình một hành trình dài — từ cánh đồng lanh hữu cơ ở vùng Normandie (Pháp) qua bàn tay nghệ nhân dệt, nhuộm, cắt may cho đến khi chạm vào làn da người mặc. Đó là câu chuyện về sự tỉ mỉ, kiên nhẫn và tình yêu.",
      takeaways: [
        "Sợi lanh Normandie cho ra thớ sợi dai bền, mềm mại hơn sau mỗi lần giặt.",
        "Quy trình nhuộm tự nhiên không sử dụng hóa chất độc hại.",
        "Mỗi chiếc váy linen là sản phẩm thủ công mang dấu ấn cá nhân."
      ],
      sections: [
        {
          heading: "Từ cánh đồng lanh đến xưởng may Velura",
          body: [
            "Hành trình bắt đầu từ vùng Normandie — nơi có khí hậu ôn đới lý tưởng cho cây lanh phát triển tự nhiên. Sợi lanh được thu hoạch thủ công, phơi khô dưới nắng tự nhiên và dệt thành vải trên khung cửi truyền thống.",
            "Tại xưởng Velura, từng tấm vải linen được kiểm tra kỹ lưỡng trước khi cắt may. Nghệ nhân may đo tỉ mỉ từng đường kim mũi chỉ, đảm bảo phom dáng vừa vặn và thoải mái nhất cho người mặc."
          ],
          productSkus: ["VLR-SD-016", "VLR-AO-003"]
        }
      ],
      products: [
        { sku: "VLR-SD-016", note: "Set dạo biển linen thô mộc — sản phẩm tiêu biểu từ xưởng Velura." },
        { sku: "VLR-AO-003", note: "Áo Peplum cổ vuông xanh sage — chất liệu tự nhiên tinh khiết." }
      ]
    }
  },

  /* ──────────────────────────────────────────────────────────
     9. Phối đồ — Công thức phối đồ resort
     ────────────────────────────────────────────────────────── */
  {
    slug: "cong-thuc-phoi-do-resort-he-2026",
    category_slug: "style",
    title: "Công thức phối đồ resort hè 2026: Từ sân bay đến bữa tối",
    excerpt: "Vali 3 ngày với 5 món đồ linh hoạt. Cách phối set linen, đầm maxi và phụ kiện cho chuyến đi biển hoàn hảo.",
    image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&h=600&q=80",
    author: "Lê Minh Châu",
    read_minutes: 7,
    is_featured: false,
    published_at: "2026-04-28T09:00:00+07:00",
    content: {
      intro: "Nghệ thuật xếp vali đi nghỉ dưỡng không nằm ở việc bạn mang theo bao nhiêu món đồ, mà ở khả năng biến hóa linh hoạt của từng thiết kế. Xu hướng resort wear hè 2026 tập trung tối giản hóa số lượng trang phục bằng cách ưu tiên các phom dáng thông minh.",
      takeaways: [
        "Công thức xếp đồ 5-4-3-2-1 giúp vali gọn nhẹ nhưng đa năng tối đa.",
        "Tông màu trung tính làm chủ đạo để dễ phối chéo các mảnh ghép.",
        "Phụ kiện chất liệu cói, gỗ hay canvas thô tạo điểm nhấn coastal phóng khoáng."
      ],
      sections: [
        {
          heading: "Từ sân bay đến sảnh chờ khách sạn",
          body: [
            "Trang phục di chuyển đòi hỏi sự co giãn tốt, thoáng khí nhưng không được quá xuề xòa. Lựa chọn tối ưu là quần suông rộng chất liệu linen pha cotton kết hợp cùng áo dệt kim nhẹ hoặc thun cao cấp dáng ôm vừa vặn.",
            "Hoàn thiện set đồ bằng một chiếc sơ mi khoác ngoài dáng dài hoặc blazer không cấu trúc vai. Thiết kế này bảo vệ bạn khỏi luồng gió điều hòa lạnh tại sân bay, đồng thời giữ diện mạo lịch sự khi đặt chân tới sảnh resort."
          ],
          productSkus: ["VLR-SD-016", "VLR-SD-018"]
        }
      ],
      products: [
        { sku: "VLR-SD-016", note: "Set dạo biển linen đen kem thoáng mát, linh hoạt di chuyển." },
        { sku: "VLR-SD-018", note: "Set White Resort linen bay bổng tôn dáng nữ thần biển." }
      ]
    }
  }
];

const blogEditorialUpdates = {
  "bang-mau-mua-thu-2026": {
    image_url: "/src/assets/images/blog-autumn-palette-2026.png",
    title: "Bảng màu mùa thu 2026: Hồng phấn, champagne và xanh thyme",
    excerpt: "Một bảng màu dịu, có chiều sâu để làm mới tủ đồ mùa thu bằng những lớp sắc độ dễ mặc và dễ phối.",
    content: {
      intro: "Mùa thu này, Velura chọn những sắc độ trầm nhẹ thay vì tương phản gay gắt. Hồng phấn, antique rose, champagne, dried thyme và bisque tạo nên một nhịp màu mềm mại, hiện đại và có thể ứng dụng mỗi ngày.",
      takeaways: [
        "Chọn một sắc trung tính sáng làm nền để tổng thể luôn thoáng mắt.",
        "Dùng antique rose hoặc bisque ở gần gương mặt để tạo điểm nhấn ấm áp.",
        "Xanh thyme giúp cân bằng các gam hồng và mang lại chiều sâu cho bản phối.",
        "Giới hạn tối đa ba sắc độ trong một diện mạo để màu sắc có khoảng thở."
      ],
      sections: [
        {
          heading: "Một bảng màu dịu nhưng không nhạt",
          body: [
            "Champagne và blush là lớp nền sáng, phù hợp cho sơ mi, váy lụa hoặc quần suông. Khi cần nét chín chắn hơn, antique rose tạo độ ấm vừa đủ mà không làm tổng thể nặng nề.",
            "Dried thyme là điểm neo bất ngờ của bảng màu. Một chiếc áo khoác nhẹ, túi da hoặc giày ở sắc xanh xám này giúp các lớp màu phấn trở nên hiện đại và có chủ đích."
          ],
          productSkus: ["VLR-SD-019", "VLR-SD-004", "VLR-SD-002"]
        },
        {
          heading: "Công thức phối màu của Velura",
          body: [
            "Bắt đầu với một phom dáng rõ ràng: quần ống đứng, chân váy midi hoặc đầm có đường eo gọn. Sau đó chọn một màu chính, một sắc sáng làm nền và một phụ kiện có chiều sâu.",
            "Nếu mặc cả hồng và xanh thyme, hãy để chúng xuất hiện ở hai mảng có tỷ lệ khác nhau. Một mảng lớn dịu, một điểm nhấn đậm sẽ khiến diện mạo cân bằng hơn."
          ],
          productSkus: ["VLR-SD-005", "VLR-AO-003"]
        }
      ],
      products: [
        { sku: "VLR-SD-019", note: "Set Boho Linen hồng kem cho lớp màu blush nhẹ nhàng." },
        { sku: "VLR-SD-004", note: "Set Sage Pleated là mảng xanh thyme cân bằng bảng màu." },
        { sku: "VLR-SD-002", note: "Set Ivory Draped lụa rủ tạo nền champagne thanh thoát." }
      ]
    }
  },
  "dich-le-nhiet-ba-phan-huy": {
    category_slug: "style",
    title: "Biến hoá diện mạo với áo polo mùa Hè 2026",
    excerpt: "Từ sporty street đến quiet luxury, áo polo là nền tảng linh hoạt cho những bản phối có cá tính riêng.",
    image_url: "/src/assets/images/blog-polo-style-2026.png",
    author: "Velura Editorial",
    read_minutes: 7,
    content: {
      intro: "Áo polo đã rời xa hình ảnh chỉn chu quen thuộc để trở thành món đồ chuyển đổi linh hoạt giữa nhiều ngữ cảnh. Chìa khóa là tỷ lệ phom dáng, chất liệu và cách tiết chế phụ kiện.",
      takeaways: [
        "Polo regular-fit hoặc hơi rộng là lựa chọn linh hoạt nhất.",
        "Chất liệu dệt kim và cotton có bề mặt đẹp giúp bản phối trông chỉn chu hơn.",
        "Một món có cấu trúc như blazer hoặc túi da sẽ nâng cấp tổng thể ngay lập tức.",
        "Chọn giày theo bối cảnh để chuyển phong cách mà không cần thay cả set đồ."
      ],
      sections: [
        {
          heading: "Polo và nhịp phố hiện đại",
          body: [
            "Với tinh thần thành thị, polo dáng hơi rộng đi cùng quần suông hoặc denim ống thẳng tạo cảm giác gọn mà không cứng. Một lớp jacket nhẹ khoác ngoài giúp tổng thể có chiều sâu hơn trong những ngày di chuyển nhiều.",
            "Giữ bảng màu trong ba sắc độ: navy, ivory và một điểm chạm burgundy hoặc đen. Công thức này đủ cá tính cho cuối tuần nhưng vẫn có độ tinh tế của một tủ đồ được chọn lọc."
          ],
          productSkus: ["VLR-AO-002", "VLR-SD-016"]
        },
        {
          heading: "Từ văn phòng đến buổi hẹn",
          body: [
            "Một chiếc polo trơn có thể đi cùng quần cạp cao hoặc chân váy midi. Hãy ưu tiên phần vai vừa vặn và vạt áo đủ dài để sơ vin nhẹ, tạo đường eo rõ ràng.",
            "Khi cần vẻ mềm mại hơn, phối polo với một lớp lụa rủ hoặc blazer có cấu trúc. Một đôi slingback hoặc loafer sẽ hoàn thiện diện mạo mà không biến nó thành công thức công sở cứng nhắc."
          ],
          productSkus: ["VLR-SD-002", "VLR-SD-003"]
        }
      ],
      products: [
        { sku: "VLR-AO-002", note: "Áo sơ mi lụa tơ tằm cho lớp phối mềm và chỉn chu." },
        { sku: "VLR-SD-016", note: "Set dạo biển linen linh hoạt cho ngày cuối tuần năng động." },
        { sku: "VLR-SD-002", note: "Set Ivory Draped tạo nền sáng cho polo tông navy hoặc đen." }
      ]
    }
  },
  "he-mong-dao-dam-viet": {
    title: "Những phụ nữ thắp sáng lối đi: Lãnh đạo bằng hành động",
    excerpt: "Câu chuyện về những nhà sáng lập dùng đổi mới và sự bền bỉ để biến một ý tưởng thành tác động tích cực.",
    image_url: "/src/assets/images/blog-women-leaders-2026.png",
    author: "Velura Editorial",
    read_minutes: 6,
    content: {
      intro: "Những cộng đồng phát triển bền vững thường bắt đầu từ một quyết định rất cụ thể: nhìn thấy vấn đề và chọn bắt tay vào giải quyết. Câu chuyện của các nữ lãnh đạo nhắc chúng ta rằng sự tự tin có thể được xây bằng hành động mỗi ngày.",
      takeaways: [
        "Tác động bền vững bắt đầu từ một vấn đề được gọi tên rõ ràng.",
        "Mạng lưới cố vấn và cộng đồng giúp ý tưởng đi xa hơn năng lực của một cá nhân.",
        "Sự chỉn chu trong cách hiện diện là một phần của năng lực lãnh đạo.",
        "Trang phục phù hợp nên hỗ trợ chuyển động, sự tập trung và bản sắc riêng."
      ],
      sections: [
        {
          heading: "Dẫn dắt bằng sự rõ ràng",
          body: [
            "Một nhà lãnh đạo đáng tin không cần phải xuất hiện với những tuyên bố lớn. Họ tạo niềm tin bằng khả năng đặt câu hỏi đúng, lắng nghe kỹ và đưa ra lựa chọn có trách nhiệm trong những việc nhỏ.",
            "Trong công việc sáng tạo, sự rõ ràng ấy càng quan trọng: một ý tưởng có thể bắt đầu rất cá nhân, nhưng chỉ tạo được ảnh hưởng khi nó được chuyển thành quy trình, đối thoại và một cộng đồng cùng tham gia."
          ],
          productSkus: ["VLR-SD-003", "VLR-SD-005"]
        },
        {
          heading: "Một tủ đồ cho ngày bạn tạo khác biệt",
          body: [
            "Trang phục công việc không cần phải đánh đổi sự thoải mái để có độ tin cậy. Hãy bắt đầu bằng phom may vừa vặn, chất liệu có chuyển động và một bảng màu nhất quán với cách bạn muốn được ghi nhớ.",
            "Một set may đo, một lớp lụa nhẹ và phụ kiện tối giản đủ để tạo sự tự tin từ phòng họp đến cuộc gặp gỡ sau giờ làm. Điều quan trọng là trang phục cho phép bạn tập trung vào điều mình muốn nói."
          ],
          productSkus: ["VLR-SD-002", "VLR-AO-003"]
        }
      ],
      products: [
        { sku: "VLR-SD-003", note: "Set Midnight Blue chạm eo, phù hợp cho những ngày cần sự tự tin." },
        { sku: "VLR-SD-005", note: "Set Gilet Tweed Cocoa tạo cấu trúc gọn gàng cho lịch họp." },
        { sku: "VLR-SD-002", note: "Set Ivory Draped cho lớp nền nhẹ và tinh tế." }
      ]
    }
  }
};

FALLBACK_BLOG_POSTS.forEach((post) => {
  const update = blogEditorialUpdates[post.slug];
  if (update) Object.assign(post, update);
});

const researchedEditorialUpdates = {
  "a-khoi-thanh-huong-ao-dai-co-yem": {
    category_slug: "trend",
    title: "Áo dài cổ yếm 2026: Khi di sản gặp đường nét đương đại",
    excerpt: "Phần cổ thanh thoát, phom áo tiết chế và chất liệu nhẹ đang đưa áo dài cổ yếm trở lại đời sống hiện đại.",
    image_url: "/src/assets/images/blog-ao-dai-co-yem-editorial.png",
    author: "Velura Editorial",
    read_minutes: 8,
    content: {
      intro: "Áo dài cổ yếm không chỉ là một biến tấu thị giác. Khi được xử lý đúng tỷ lệ, thiết kế này tạo nên cuộc đối thoại mềm mại giữa vẻ đẹp truyền thống và tinh thần tối giản của phụ nữ hôm nay.",
      takeaways: [
        "Đường cổ nên ôm vừa vặn, không siết sát và không khoét quá sâu.",
        "Lụa, tơ tằm và linen pha giúp tà áo chuyển động tự nhiên hơn.",
        "Thêu tay nên xuất hiện như một điểm nhấn thay vì phủ kín toàn bộ bề mặt.",
        "Phụ kiện nhỏ, tóc gọn và giày thanh mảnh giữ tổng thể hiện đại."
      ],
      sections: [
        {
          heading: "Từ chiếc yếm truyền thống đến đường cổ mới",
          body: [
            "Cảm hứng cổ yếm được nhận biết qua phần vai mở và đường cổ hướng lên cao. Trong thiết kế đương đại, chi tiết này được tinh giản để tôn vùng cổ, xương quai xanh và tư thế của người mặc mà vẫn giữ sự kín đáo cần thiết.",
            "Tỷ lệ là yếu tố quyết định. Thân trên cần gọn, trong khi tà áo có độ rủ vừa đủ để cân bằng phần vai. Một đường viền màu burgundy hoặc hàng cúc bọc nhỏ có thể tạo chiều sâu mà không phá vỡ vẻ thanh lịch."
          ],
          productSkus: ["VLR-AO-004", "VLR-SD-010"]
        },
        {
          heading: "Chọn chất liệu để áo dài biết chuyển động",
          body: [
            "Tơ tằm mang lại độ óng nhẹ và cảm giác trang trọng, còn linen pha phù hợp với những thiết kế mặc ban ngày. Với thời tiết nhiệt đới, lớp lót mỏng và bề mặt vải thoáng quan trọng hơn việc tạo phom quá cứng.",
            "Các họa tiết hoa nhỏ, cành mảnh hoặc thêu cùng tông giúp thiết kế có chiều sâu khi nhìn gần. Chúng nên đi theo chuyển động của tà áo thay vì nằm như một mảng trang trí tách biệt."
          ],
          productSkus: ["VLR-AO-002", "VLR-SD-003"]
        },
        {
          heading: "Ba bối cảnh, một thiết kế",
          body: [
            "Cho sự kiện ban ngày, chọn bảng màu ivory, hồng phấn hoặc xanh sage cùng khuyên tai ngọc trai. Buổi tối phù hợp với midnight blue, burgundy và một chiếc clutch có cấu trúc.",
            "Nếu muốn mặc áo dài cổ yếm trong đời sống thường ngày, hãy giảm chi tiết thêu, chọn phom gọn và phối cùng quần lụa trơn. Sự tiết chế giúp di sản trở nên gần gũi mà không mất đi phẩm chất riêng."
          ],
          productSkus: ["VLR-SD-002", "VLR-SD-004"]
        }
      ],
      products: [
        { sku: "VLR-AO-004", note: "Áo cổ yếm lụa tạo đường vai thanh thoát và hiện đại." },
        { sku: "VLR-SD-010", note: "Set Soft Ceremony phù hợp cho tiệc nhẹ và sự kiện trang trọng." },
        { sku: "VLR-SD-003", note: "Set Midnight Blue mang lại lựa chọn sâu màu cho buổi tối." }
      ]
    }
  },
  "cong-thuc-phoi-do-resort-he-2026": {
    category_slug: "style",
    title: "Resort 2026: Tủ đồ 5 món từ sân bay đến bữa tối",
    excerpt: "Một capsule gọn nhẹ với linen, phom may thư giãn và phụ kiện đủ tinh tế cho mọi nhịp của chuyến đi.",
    image_url: "/src/assets/images/blog-resort-capsule-2026.png",
    author: "Lê Minh Châu",
    read_minutes: 9,
    content: {
      intro: "Resort wear 2026 hướng đến những món đồ có thể chuyển vai linh hoạt. Thay vì đóng gói nhiều diện mạo riêng lẻ, hãy xây một bảng màu chung và chọn năm thiết kế có thể phối chéo từ lúc di chuyển đến bữa tối bên biển.",
      takeaways: [
        "Một bảng màu ba tông giúp mọi món đồ có thể phối cùng nhau.",
        "Linen pha và cotton dệt mịn thoáng nhưng giữ phom tốt hơn.",
        "Một set đồng bộ có thể tách thành ít nhất ba diện mạo.",
        "Phụ kiện có cấu trúc là cách nhanh nhất để nâng cấp trang phục buổi tối."
      ],
      sections: [
        {
          heading: "Năm món tạo nên một capsule resort",
          body: [
            "Bắt đầu với sơ mi linen trắng, quần suông cùng tông, một đầm cột dáng dài, áo khoác nhẹ và set đồng bộ có thể tách rời. Năm món này tạo đủ lớp cho sân bay, bữa sáng, dạo phố và buổi tối.",
            "Ưu tiên trắng, cát và chocolate hoặc navy. Khi màu sắc có cùng nhiệt độ, bạn có thể thay đổi phụ kiện mà không cần nghĩ lại toàn bộ trang phục."
          ],
          productSkus: ["VLR-SD-016", "VLR-SD-018"]
        },
        {
          heading: "Công thức cho ngày di chuyển",
          body: [
            "Tại sân bay, quần linen ống rộng đi cùng áo mỏng và sơ mi khoác ngoài giúp cơ thể dễ chịu khi nhiệt độ thay đổi. Chọn giày phẳng có quai chắc và một túi đủ lớn cho những vật dụng cần lấy nhanh.",
            "Khi đến resort, chỉ cần bỏ lớp áo ngoài, thay túi lớn bằng túi cói và thêm khuyên tai ánh kim. Bộ đồ di chuyển lập tức trở thành diện mạo ăn trưa thoải mái."
          ],
          productSkus: ["VLR-AO-002", "VLR-SD-002"]
        },
        {
          heading: "Chuyển sang buổi tối bằng tỷ lệ và chất liệu",
          body: [
            "Buổi tối không nhất thiết cần thêm một chiếc váy mới. Sơ vin gọn, để lộ cổ tay, đổi sandal thành giày gót thấp và dùng túi có cấu trúc là đủ để thay đổi nhịp điệu của set linen.",
            "Nếu chọn đầm dài, hãy giữ phom cột hoặc chữ A mềm để dễ gấp. Một lớp lụa, trang sức nhỏ và son màu sâu tạo điểm nhấn mà vẫn đúng tinh thần nghỉ dưỡng thanh lịch."
          ],
          productSkus: ["VLR-SD-003", "VLR-SD-019"]
        }
      ],
      products: [
        { sku: "VLR-SD-016", note: "Set dạo biển linen là nền tảng linh hoạt nhất cho capsule resort." },
        { sku: "VLR-SD-018", note: "Set White Resort phù hợp từ ban ngày đến bữa tối tối giản." },
        { sku: "VLR-SD-002", note: "Set Ivory Draped bổ sung độ rủ và vẻ trang trọng nhẹ nhàng." }
      ]
    }
  },
  "dang-my-linh-thoi-trang-nhat-ky": {
    category_slug: "interview",
    title: "Đặng Mỹ Linh: Phong cách là cuốn nhật ký không cần lời",
    excerpt: "Một cuộc trò chuyện về tủ đồ có chủ đích, bản sắc người sáng lập và cách trang phục lưu giữ từng giai đoạn trưởng thành.",
    image_url: "/src/assets/images/blog-founder-style-interview.png",
    author: "Nguyễn Thu Hà",
    read_minutes: 10,
    content: {
      intro: "Trong atelier ngập ánh sáng, Đặng Mỹ Linh nói về quần áo như một hệ thống ký ức. Mỗi chất liệu, đường cắt và sắc màu đều đánh dấu một quyết định, một chuyến đi hoặc một phiên bản cô đã từng trở thành.",
      takeaways: [
        "Phong cách cá nhân rõ nhất khi tủ đồ phản ánh nhịp sống thật.",
        "Một phom dáng tốt có giá trị lâu dài hơn một xu hướng ngắn hạn.",
        "Màu sắc có thể trở thành dấu hiệu nhận diện của người sáng lập.",
        "Mua ít hơn giúp mỗi món đồ có nhiều ký ức và nhiều lần xuất hiện hơn."
      ],
      sections: [
        {
          heading: "Từ tủ đồ nhiều lựa chọn đến tủ đồ có chủ đích",
          body: [
            "Mỹ Linh từng mua theo cảm xúc và nhận ra mình vẫn thường xuyên mặc lại một nhóm rất nhỏ. Bước ngoặt đến khi cô quan sát lịch làm việc, cách di chuyển và những khoảnh khắc cần cảm thấy tự tin nhất.",
            "Từ đó, tủ đồ được xây quanh blazer có cấu trúc, sơ mi lụa, quần suông và một vài thiết kế áo dài hiện đại. Các món đồ không giống nhau, nhưng cùng chia sẻ một ngôn ngữ về sự điềm tĩnh và rõ ràng."
          ],
          productSkus: ["VLR-SD-003", "VLR-AO-002"]
        },
        {
          heading: "Trang phục như một phần của bản sắc lãnh đạo",
          body: [
            "Theo Mỹ Linh, sự chuyên nghiệp không nằm ở việc mặc cứng nhắc. Một bộ đồ tốt phải cho phép người mặc ngồi lâu, di chuyển nhanh và tập trung vào cuộc trò chuyện thay vì liên tục chỉnh lại trang phục.",
            "Midnight blue và ivory trở thành hai màu nền quen thuộc vì chúng đủ nghiêm túc cho phòng họp nhưng vẫn mềm dưới ánh sáng tự nhiên. Burgundy chỉ xuất hiện ở phụ kiện hoặc lớp áo nhỏ như một chữ ký."
          ],
          productSkus: ["VLR-SD-005", "VLR-SD-002"]
        },
        {
          heading: "Những món đồ giữ lại ký ức",
          body: [
            "Cô vẫn giữ chiếc áo lụa mặc trong buổi thuyết trình đầu tiên và một thiết kế áo dài từ ngày khai trương studio. Giá trị của chúng không nằm ở việc còn mới, mà ở khả năng đưa cô trở lại đúng cảm xúc của thời điểm ấy.",
            "Đó cũng là nguyên tắc cô áp dụng khi mua mới: món đồ phải có chỗ trong cuộc sống hiện tại và đủ bền để tiếp tục đồng hành. Phong cách, theo cách đó, là một cuốn nhật ký được viết bằng lựa chọn hằng ngày."
          ],
          productSkus: ["VLR-AO-004", "VLR-SD-010"]
        }
      ],
      products: [
        { sku: "VLR-SD-003", note: "Set Midnight Blue tạo hình ảnh điềm tĩnh cho lịch làm việc quan trọng." },
        { sku: "VLR-AO-002", note: "Áo sơ mi lụa tơ tằm là lớp nền mềm cho tủ đồ công việc." },
        { sku: "VLR-SD-005", note: "Set Gilet Tweed Cocoa bổ sung cấu trúc mà vẫn dễ phối lại." }
      ]
    }
  }
};

FALLBACK_BLOG_POSTS.forEach((post) => {
  const update = researchedEditorialUpdates[post.slug];
  if (update) Object.assign(post, update);
});

const fashionMagazineUpdates = {
  "dang-my-linh-thoi-trang-nhat-ky": {
    category_slug: "trend",
    title: "Layering mùa mới: Khi những lớp cơ bản tạo nên phong cách",
    excerpt: "Áo cổ lọ, sơ mi, blazer và jacket da gặp nhau trong những bản phối có tỷ lệ rõ ràng nhưng không hề cứng nhắc.",
    image_url: "/src/assets/images/blog-street-layering-2026.png",
    author: "Velura Fashion Desk",
    read_minutes: 7,
    content: {
      intro: "Layering đẹp không đến từ số lượng lớp áo, mà từ cách mỗi lớp làm rõ tỷ lệ cơ thể. Mùa mới, street style quay về với những món quen thuộc, nhưng đặt chúng trong một trật tự sắc sảo hơn.",
      takeaways: [
        "Luôn bắt đầu bằng một lớp nền ôm gọn và dễ thở.",
        "Một chiếc áo khoác có vai rõ sẽ tạo cấu trúc cho tổng thể.",
        "Chọn tối đa ba chất liệu để diện mạo không bị rối.",
        "Màu sắc mạnh nên xuất hiện ở một lớp duy nhất."
      ],
      sections: [
        {
          heading: "Lớp nền làm nên nhịp điệu",
          body: [
            "Áo cổ lọ mỏng, tank top hoặc sơ mi poplin là điểm xuất phát tốt vì chúng tạo bề mặt phẳng cho các lớp áo phía ngoài. Hãy chọn màu than, trắng ngà hoặc navy để phần nền có thể đi cùng nhiều sắc độ khác.",
            "Khi lớp trong gọn, áo khoác dáng rộng sẽ không khiến cơ thể bị nuốt chửng. Sự đối lập giữa ôm và buông tạo nên nhịp điệu nhìn thấy rõ ngay cả trong một bản phối đơn sắc."
          ],
          productSkus: ["VLR-AO-002", "VLR-SD-003"]
        },
        {
          heading: "Tailoring mềm cho ngày thường",
          body: [
            "Blazer, áo khoác dáng dài và quần ống suông không còn thuộc riêng về tủ đồ công sở. Khi đi cùng denim hoặc chân váy ngắn, chúng tạo ra vẻ chỉn chu vừa đủ cho nhịp sống thành thị.",
            "Giữ phần vai ngay ngắn, đường eo có điểm dừng và để gấu quần chạm nhẹ vào giày. Ba chi tiết nhỏ này giúp layering có cấu trúc mà không mất cảm giác tự do."
          ],
          productSkus: ["VLR-SD-005", "VLR-SD-002"]
        },
        {
          heading: "Một điểm chạm màu sắc",
          body: [
            "Nếu nền trang phục là đen, navy hoặc xám, hãy để burgundy, camel hoặc xanh lá rêu xuất hiện ở chiếc áo len, khăn mỏng hay túi xách. Màu sắc lúc này hoạt động như một dấu chấm câu, không phải toàn bộ câu chuyện.",
            "Trang sức kim loại nhỏ, giày loafer hoặc boots mũi gọn sẽ kết thúc tổng thể. Chúng đủ có mặt để hoàn thiện phong cách nhưng không cạnh tranh với đường nét của các lớp áo."
          ],
          productSkus: ["VLR-SD-004", "VLR-AO-003"]
        }
      ],
      products: [
        { sku: "VLR-AO-002", note: "Áo sơ mi lụa tạo lớp nền mềm và gọn cho layering." },
        { sku: "VLR-SD-005", note: "Set Gilet Tweed Cocoa bổ sung cấu trúc cho bản phối thành thị." },
        { sku: "VLR-SD-003", note: "Set Midnight Blue là mảng nền sâu, dễ phối với phụ kiện sáng." }
      ]
    }
  },
  "a-khoi-thanh-huong-ao-dai-co-yem": {
    category_slug: "trend",
    title: "Áo khoác suede: Điểm nhấn mềm của street style 2026",
    excerpt: "Sắc nâu thuốc lá, phom boxy và bề mặt da lộn đưa chiếc jacket trở thành lớp chuyển mùa giàu cá tính nhất.",
    image_url: "/src/assets/images/blog-suede-jacket-2026.png",
    author: "Velura Fashion Desk",
    read_minutes: 6,
    content: {
      intro: "Giữa những phom áo khoác cứng và bề mặt kỹ thuật, suede mang đến một đối trọng mềm hơn. Chất liệu có độ mờ tự nhiên này giúp bản phối street style trở nên ấm áp, có chiều sâu và rất dễ ứng dụng.",
      takeaways: [
        "Sắc nâu thuốc lá dễ phối hơn nâu cam hoặc nâu đỏ.",
        "Phom jacket ngang hông giúp cân bằng quần ống rộng và váy dài.",
        "Bên trong nên là lớp vải trơn để giữ bề mặt suede làm điểm nhấn.",
        "Chăm sóc bề mặt khô, tránh để nước và ma sát làm loang màu."
      ],
      sections: [
        {
          heading: "Vì sao suede trở lại đúng lúc",
          body: [
            "Suede tạo cảm giác ít bóng hơn da trơn, vì vậy nó dễ hòa vào đời sống thường ngày. Bề mặt có độ mờ giữ ánh sáng mềm, phù hợp với những bảng màu tự nhiên như ivory, denim xanh sẫm, đen than và burgundy.",
            "Một chiếc jacket dáng boxy vừa chạm hông giúp tôn eo mà không ép phom. Đây là tỷ lệ linh hoạt cho cả quần jeans, chân váy midi lẫn váy lụa rủ."
          ],
          productSkus: ["VLR-SD-005", "VLR-SD-002"]
        },
        {
          heading: "Ba công thức để mặc ngay",
          body: [
            "Ngày thường, phối jacket suede cùng sơ mi trắng và jeans ống đứng. Khi cần nét nữ tính hơn, thay jeans bằng váy lụa nhẹ và giữ giày mũi gọn để phần thân dưới không bị nặng.",
            "Buổi tối phù hợp với nền màu tối: áo dệt kim mảnh, quần suông navy và một món phụ kiện ánh kim. Suede sẽ làm tổng thể mềm đi mà không mất sự sắc sảo."
          ],
          productSkus: ["VLR-AO-002", "VLR-SD-003"]
        },
        {
          heading: "Tỷ lệ và bề mặt quan trọng hơn xu hướng",
          body: [
            "Hãy chọn một chiếc áo khoác có đường vai rõ, tay đủ rộng để mặc thêm lớp mỏng và phần gấu không quá dài. Phom chuẩn sẽ giúp suede đồng hành nhiều mùa thay vì trở thành một món đồ chỉ mặc một lần.",
            "Khi jacket đã có bề mặt đặc biệt, phần còn lại nên giữ sạch và ít họa tiết. Một bộ trang phục có một chất liệu chính luôn thuyết phục hơn khi nhìn gần lẫn từ xa."
          ],
          productSkus: ["VLR-SD-004", "VLR-AO-003"]
        }
      ],
      products: [
        { sku: "VLR-SD-005", note: "Set Gilet Tweed Cocoa hòa nhịp cùng bảng màu nâu thuốc lá của suede." },
        { sku: "VLR-SD-002", note: "Set Ivory Draped tạo nền sáng cho jacket màu nâu." },
        { sku: "VLR-SD-003", note: "Set Midnight Blue tạo tương phản sâu và hiện đại." }
      ]
    }
  }
};

FALLBACK_BLOG_POSTS.forEach((post) => {
  const update = fashionMagazineUpdates[post.slug];
  if (update) Object.assign(post, update);
});

const redCarpetEditorialUpdates = {
  "he-mong-dao-dam-viet": {
    category_slug: "event",
    title: "Hoa trắng trên nền đen: Khi thảm đỏ trở về với sự tiết chế",
    excerpt: "Một chi tiết hoa duy nhất, phom corset gọn và trang sức ánh bạc cho thấy vẻ đẹp thảm đỏ có thể tạo ấn tượng mà không cần phô trương.",
    image_url: "/src/assets/images/blog-red-carpet-floral-2026.png",
    author: "Velura Fashion Desk",
    read_minutes: 6,
    content: {
      intro: "Trong một mùa thảm đỏ đầy chi tiết bắt sáng, chiếc váy đen với bông hoa trắng ở trung tâm cho thấy sức mạnh của sự đối lập. Không cần quá nhiều lớp trang trí, bố cục rõ ràng đã đủ dẫn ánh nhìn đến đúng nơi cần thiết.",
      takeaways: [
        "Một điểm nhấn có kích thước rõ ràng hiệu quả hơn nhiều chi tiết nhỏ.",
        "Đen và trắng tạo tương phản mạnh nhưng vẫn dễ giữ vẻ thanh lịch.",
        "Trang sức nên làm sáng đường cổ thay vì cạnh tranh với chi tiết hoa.",
        "Phom dáng chính xác là nền tảng của mọi diện mạo thảm đỏ."
      ],
      sections: [
        {
          heading: "Một bông hoa thay cho cả câu chuyện",
          body: [
            "Hoa ba chiều ở thân áo không chỉ là trang trí. Khi đặt tại trung tâm ngực áo, chi tiết này tạo điểm dừng thị giác, đồng thời làm mềm cấu trúc gọn của corset đen.",
            "Đây là bài học hữu ích cho những dịp cần nổi bật: hãy chọn một motif có chủ đích và để phần còn lại của trang phục đủ yên tĩnh để motif ấy được nhìn thấy."
          ],
          productSkus: ["VLR-SD-025", "VLR-SD-003"]
        },
        {
          heading: "Cân bằng cấu trúc với ánh sáng",
          body: [
            "Vải nhung, satin mờ hoặc crepe đen mang lại chiều sâu hơn một bề mặt bóng hoàn toàn. Chúng bắt ánh sáng vừa đủ, tạo đường nét cơ thể mà không biến chiếc váy thành một mảng phản chiếu.",
            "Trang sức ánh bạc ở vùng cổ và tai nên có đường nét mảnh, ưu tiên bề mặt sáng thay vì kích thước lớn. Khi chi tiết hoa đã là trung tâm, phụ kiện chỉ cần hỗ trợ nhịp điệu."
          ],
          productSkus: ["VLR-SD-010", "VLR-AO-004"]
        },
        {
          heading: "Từ thảm đỏ đến buổi tối của riêng bạn",
          body: [
            "Không cần một chiếc váy dạ hội mới để mượn tinh thần này. Hãy bắt đầu bằng một thiết kế đen có đường cổ rõ, thêm phụ kiện trắng ngà hoặc một bông hoa cài áo và giữ tóc gọn.",
            "Sự khác biệt nằm ở tỷ lệ: một điểm sáng, một nền tối và một phom dáng vừa vặn. Ba yếu tố đó đủ tạo nên vẻ trang trọng trong mọi buổi tiệc tối."
          ],
          productSkus: ["VLR-SD-002", "VLR-SD-005"]
        }
      ],
      products: [
        { sku: "VLR-SD-025", note: "Đầm Tulle dạ hội mang lại lớp chuyển động nhẹ cho buổi tối đặc biệt." },
        { sku: "VLR-SD-003", note: "Set Midnight Blue là nền màu sâu cho phong cách tối giản có điểm nhấn." },
        { sku: "VLR-SD-010", note: "Set Soft Ceremony phù hợp với những dịp cần vẻ trang trọng mềm mại." }
      ]
    }
  }
};

FALLBACK_BLOG_POSTS.forEach((post) => {
  const update = redCarpetEditorialUpdates[post.slug];
  if (update) Object.assign(post, update);
});

const blogImageUpdates = {
  "ba-thuong-hieu-viet-london-fw-2026": "/src/assets/images/blog-london-designers-moodboard.png",
  "quiet-luxury-phai-dep-viet": "/src/assets/images/blog-quiet-luxury-moodboard.png",
  "cach-phoi-blazer-linen-mua-he": "/src/assets/images/blog-linen-blazer-moodboard.png",
  "hanh-trinh-vay-linen-xuong-velura": "/src/assets/images/blog-linen-workshop-moodboard.png"
};

FALLBACK_BLOG_POSTS.forEach((post) => {
  if (blogImageUpdates[post.slug]) post.image_url = blogImageUpdates[post.slug];
});

export function getFallbackBlogPost(slug) {
  return FALLBACK_BLOG_POSTS.find((post) => post.slug === slug) || null;
}
