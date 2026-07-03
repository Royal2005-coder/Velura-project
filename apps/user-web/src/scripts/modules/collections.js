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
      vnName: 'Nghi lễ Dịu dàng',
      year: 'SOFT CEREMONY 2026',
      tag: 'Thanh lịch & Kiêu sa',
      story: 'Những thiết kế mang phom dáng bất đối xứng tôn eo, gam màu thanh nhã như Ivory, Cocoa mang đến vẻ ngoài sang trọng, chỉn chu cho các buổi tiệc nhẹ và dịp đặc biệt.',
      banner: '/src/assets/images/collection-1.png'
    },
    'The Urban Rhythm': {
      id: 'the-urban-rhythm',
      vnName: 'Nhịp điệu Đô thị',
      year: 'THE URBAN RHYTHM',
      tag: 'Năng động & Thời thượng',
      story: 'Tập trung vào sự linh hoạt giữa phong cách công sở và dạo phố hiện đại. Chất liệu linen tự nhiên kết hợp lụa mềm mại tạo cảm giác tự tin cả ngày dài bận rộn.',
      banner: '/src/assets/images/collection-2.png'
    },
    'Modern Academia': {
      id: 'modern-academia',
      vnName: 'Học viện Hiện đại',
      year: 'MODERN ACADEMIA 2026',
      tag: 'Trẻ trung & Tri thức',
      story: 'Cảm hứng từ phong cách Preppy học đường pha chút phá cách hiện đại, sử dụng các gam màu ấm và họa tiết kẻ thanh lịch đầy cá tính.',
      banner: '/src/assets/images/image-4.png'
    },
    'Weekend Escape': {
      id: 'weekend-escape',
      vnName: 'Trốn chạy Cuối tuần',
      year: 'WEEKEND ESCAPE',
      tag: 'Tự do & Phóng khoáng',
      story: 'Bộ sưu tập của những chuyến đi ngẫu hứng đầy nắng và gió. Các chất liệu Linen mộc mạc và Silk mát mẻ giúp bạn tận hưởng những ngày nghỉ trọn vẹn.',
      banner: '/src/assets/images/about_01.jpg'
    },
    'Midnight Mirage': {
      id: 'midnight-mirage',
      vnName: 'Ảo ảnh Nửa đêm',
      year: 'MIDNIGHT MIRAGE',
      tag: 'Quyến rũ & Bí ẩn',
      story: 'Sự đan xen quyến rũ của các đường khoét vai tinh tế, chất liệu len dệt kim móc (crochet) cá tính mang lại diện mạo nổi bật trong các buổi tiệc tối.',
      banner: '/src/assets/images/image-5.png'
    },
    'The Afterglow': {
      id: 'the-afterglow',
      vnName: 'Rực rỡ Hoàng hôn',
      year: 'THE AFTERGLOW 2026',
      tag: 'Dạ tiệc Thượng lưu',
      story: 'Dòng sản phẩm dạ hội cao cấp nhất của Velura. Phom dáng đầm xòe phồng, đầm đuôi cá kết hợp kỹ thuật xếp nếp ruffles tạo nên vẻ đẹp đẳng cấp.',
      banner: '/src/assets/images/about_03.jpg'
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
      // Get all unique collections present in database
      const uniqueColNames = [...new Set(products.map(p => p.collection).filter(Boolean))];

      if (uniqueColNames.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; color: var(--soft); padding: 64px 0;">Hiện chưa có bộ sưu tập nào hoạt động.</div>`;
        return;
      }

      // 1. Build tabs
      let tabsHtml = `<button class="collections-tab active" data-filter="all">Tất cả</button>`;
      uniqueColNames.forEach(colName => {
        const meta = getMeta(colName);
        tabsHtml += `<button class="collections-tab" data-filter="${meta.id}">${meta.vnName}</button>`;
      });
      tabsContainer.innerHTML = tabsHtml;

      // 2. Build collection list blocks
      let listHtml = "";
      uniqueColNames.forEach(colName => {
        const meta = getMeta(colName);
        const colProducts = products.filter(p => p.collection === colName);
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
