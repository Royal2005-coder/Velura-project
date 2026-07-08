import { apiRequest } from "./api.js";

/**
 * Collections Module — Velura
 * Tải danh sách bộ sưu tập và sản phẩm động hoàn toàn từ database
 */
export function initCollectionsFilter() {
  const tabsContainer = document.querySelector(".collections-tabs");
  const listContainer = document.querySelector(".collections-list");

  if (!tabsContainer || !listContainer) return;

  // Loading indicator for list
  listContainer.innerHTML = `<div style="text-align: center; color: var(--soft); padding: 64px 0;">Đang tải danh sách bộ sưu tập từ cửa hàng...</div>`;
  tabsContainer.innerHTML = "";

  const COLLECTION_META = {
    'Soft Ceremony': {
      id: 'soft-ceremony',
      vnName: 'Soft Ceremony',
      year: 'SOFT CEREMONY 2026',
      tag: 'Thanh lịch & Kiêu sa',
      story: 'Soft Ceremony là bộ sưu tập dành cho những dịp cần sự chỉn chu hơn thường ngày như tiệc nhẹ, hẹn hò, chụp ảnh hay những buổi gặp gỡ đặc biệt. Lấy cảm hứng từ vẻ đẹp nữ tính và thanh lịch, các thiết kế được xây dựng với phom dáng mềm mại, đường cắt tinh tế cùng những điểm nhấn vừa đủ, giúp tôn lên nét duyên dáng và sự tự tin của người mặc. Với bảng màu trung tính, ấm và dịu, bộ sưu tập mang đến cảm giác sang trọng, hiện đại, dễ ứng dụng và phù hợp với nhiều hoàn cảnh khác nhau.',
      banner: 'https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/velura_Soft-Ceremony_cover.png'
    },
    'The Urban Rhythm': {
      id: 'the-urban-rhythm',
      vnName: 'The Urban Rhythm',
      year: 'THE URBAN RHYTHM 2026',
      tag: 'Năng động & Thời thượng',
      story: 'Urban Rhythm là bộ sưu tập dành cho những quý cô hiện đại, yêu thích sự linh hoạt và cân bằng giữa môi trường công sở lẫn nhịp sống phố thị năng động. Lấy cảm hứng từ phong cách tối giản và thanh lịch, các thiết kế tập trung vào phom dáng hiện đại, đường cắt sắc sảo cùng tính ứng dụng cao, giúp tôn lên thần thái tự tin, độc lập của người mặc. Với bảng màu trung tính, thời thượng như beige ấm, xám charcoal, trắng kem và xanh olive, bộ sưu tập mang đến diện mạo sang trọng, dễ dàng mix-and-match và phù hợp cho cả những ngày làm việc bận rộn hay những buổi dạo phố cuối tuần.',
      banner: 'https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/Velura_urban-rythm_cover.png'
    },
    'Weekend Escape': {
      id: 'weekend-escape',
      vnName: 'Weekend Escape',
      year: 'WEEKEND ESCAPE 2026',
      tag: 'Tự do & Phóng khoáng',
      story: 'Weekend Escape là bộ sưu tập lấy cảm hứng từ những chuyến đi cuối tuần và những ngày thư giãn trọn vẹn, nơi thời trang đề cao sự thoải mái nhưng vẫn giữ được vẻ thanh lịch và tinh tế. Các thiết kế được lựa chọn với phom dáng nhẹ nhàng, chất liệu thoáng mát cùng bảng màu trung tính như trắng, kem, be, đen và xanh olive, dễ dàng phối hợp với các phụ kiện tối giản để tạo nên diện mạo hiện đại và nữ tính. Dù là dạo phố, cà phê cuối tuần, du lịch hay nghỉ dưỡng, Weekend Escape mang đến những set đồ linh hoạt, giúp người mặc luôn cảm thấy tự tin, thanh lịch và thoải mái trong mọi hành trình.',
      banner: 'https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/velura_Weekend-Escape_cover.png'
    },
    'Midnight Mirage': {
      id: 'midnight-mirage',
      vnName: 'Midnight Mirage',
      year: 'MIDNIGHT MIRAGE 2026',
      tag: 'Cá tính & Đường phố',
      story: 'Midnight Mirage là bộ sưu tập lấy cảm hứng từ phong cách thời trang đường phố Hàn Quốc, kết hợp giữa nét cá tính, tối giản và hiện đại. Bộ sưu tập mang đến 5 outfit với những sắc thái khác nhau như Grunge, Soft Neutral, Campus Girl, Street Prep và Y2K Minimal, giúp người mặc dễ dàng thể hiện cá tính riêng trong mọi hoạt động thường ngày như đi học, đi làm, dạo phố hay cà phê cuối tuần. Bảng màu trung tính pha chút pastel cùng các thiết kế trẻ trung tạo nên tổng thể thời thượng, linh hoạt và dễ phối đồ.',
      banner: 'https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/velura_Midnight-Mirage_cover.png'
    },
    'The Afterglow': {
      id: 'the-afterglow',
      vnName: 'The Afterglow',
      year: 'THE AFTERGLOW 2026',
      tag: 'Dư âm Vương giả',
      story: 'Lấy cảm hứng từ ánh hoàng hôn diễm lệ, The Afterglow là bản hòa ca dành cho vẻ đẹp kiêu sa và lãng mạn – nơi tà áo lụa satin mềm mại, corset siết eo tinh tế và sắc màu từ hồng tulle ngọt ngào đến xanh Sapphire huyền bí cùng hòa quyện để tôn vinh người phụ nữ. Khi kết hợp cùng trang sức ngọc trai và giày đính đá lấp lánh, bộ sưu tập không chỉ kể câu chuyện về một tiểu thư tài phiệt, mà còn lưu giữ dư âm rực rỡ – tựa hào quang khó phai của một dấu ấn vương giả, để mỗi khoảnh khắc bạn xuất hiện đều trở thành một kỷ niệm đáng nhớ.',
      banner: 'https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/velura_The-Afterglow_cover.png'
    }
  };

  const getMeta = (name) => {
    return COLLECTION_META[name] || {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      vnName: name,
      year: `${name.toUpperCase()} COLLECTION`,
      tag: 'Thiết kế mới nhất',
      story: `Khám phá các thiết kế mới nhất nằm trong bộ sưu tập ${name} của Velura.`,
      banner: '/src/assets/images/about_02.jpg'
    };
  };

  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  apiRequest("/api/user/products")
    .then(rawProducts => {
      // Filter out test/mock products
      const products = rawProducts.filter(p => {
        const nameLower = (p.name || "").toLowerCase();
        return !nameLower.includes("test") && !nameLower.includes("validation") && !nameLower.includes("commit");
      });
      // Get all unique collections — only from set/combo products to avoid wrongly-tagged individual items
      const uniqueColNames = [...new Set(products.filter(p => p.is_combo === true).map(p => p.collection).filter(Boolean))];

      // Fixed display order — skip Modern Academia and any unlisted collections
      const DISPLAY_ORDER = ['Soft Ceremony', 'The Urban Rhythm', 'Weekend Escape', 'Midnight Mirage', 'The Afterglow'];
      const orderedColNames = DISPLAY_ORDER.filter(name => uniqueColNames.includes(name));

      if (orderedColNames.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; color: var(--soft); padding: 64px 0;">Hiện chưa có bộ sưu tập nào hoạt động.</div>`;
        return;
      }

      // 1. Build tabs
      let tabsHtml = `<button class="collections-tab active" data-filter="all">Tất cả</button>`;
      orderedColNames.forEach(colName => {
        const meta = getMeta(colName);
        tabsHtml += `<button class="collections-tab" data-filter="${meta.id}">${meta.vnName}</button>`;
      });
      tabsContainer.innerHTML = tabsHtml;

      // 2. Build collection list blocks
      let listHtml = "";
      orderedColNames.forEach(colName => {
        const meta = getMeta(colName);
        const colProducts = products.filter(p => p.collection === colName && p.is_combo === true);
        const displayedProducts = colProducts.slice(0, 4);

        const productsGridHtml = displayedProducts.map(p => {
          const price = p.sale_price || p.base_price;
          return `
            <a href="/src/pages/products/detail.html?id=${p.product_id}" class="collection-product-card">
              <img src="${p.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${p.name}" class="collection-product-card__img" />
              <div class="collection-product-card__info">
                <h5 class="collection-product-card__name">${p.name}</h5>
                <span class="collection-product-card__price">${formatVND(price)}</span>
              </div>
            </a>
          `;
        }).join("");

        listHtml += `
          <div class="collection-detail" data-category="${meta.id}">
            <div class="collection-detail__banner">
              <img src="${meta.banner}" alt="${meta.vnName}" class="collection-detail__banner-img" />
              <div class="collection-detail__banner-overlay">
                <span class="collection-detail__year">${meta.year}</span>
                <h2 class="collection-detail__name">${meta.vnName}</h2>
              </div>
            </div>
            <div class="collection-detail__content">
              <div class="collection-detail__info">
                <span class="collection-detail__story-tag">${meta.tag}</span>
                <h3 class="collection-detail__story-title">${meta.vnName}</h3>
                <p class="collection-detail__story-desc">${meta.story}</p>
              </div>
              <div class="collection-detail__products">
                <h4 class="collection-detail__products-title">Thiết kế tiêu biểu</h4>
                <div class="collection-detail__products-grid">
                  ${productsGridHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      });
      listContainer.innerHTML = listHtml;

      // 3. Set up click filtering logic on newly generated tabs
      const tabs = tabsContainer.querySelectorAll(".collections-tab");
      const collections = listContainer.querySelectorAll(".collection-detail");

      const applyFilter = (filterValue) => {
        tabs.forEach(t => {
          if (t.getAttribute("data-filter") === filterValue) {
            t.classList.add("active");
          } else {
            t.classList.remove("active");
          }
        });

        collections.forEach(col => {
          const category = col.getAttribute("data-category");
          if (filterValue === "all" || category === filterValue) {
            col.style.display = "";
          } else {
            col.style.display = "none";
          }
        });
      };

      tabs.forEach(tab => {
        tab.addEventListener("click", function () {
          const filterValue = tab.getAttribute("data-filter");
          applyFilter(filterValue);
        });
      });

      // BỔ SUNG: Kiểm tra tham số id từ URL và tự động kích hoạt bộ lọc tương ứng
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get("id");
      if (urlId) {
        applyFilter(urlId);
      }
    })
    .catch(err => {
      console.error("[Collections Dynamic Load Error]:", err);
      listContainer.innerHTML = `<div style="text-align: center; color: #d9534f; padding: 64px 0;">Không thể tải các bộ sưu tập: ${err.message}</div>`;
    });
}
