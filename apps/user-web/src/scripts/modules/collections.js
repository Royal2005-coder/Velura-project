import { apiRequest } from "./api.js";
import { addToCart, getVariantImage } from "./cart.js";
import { showToast } from "./account-profile.js";
import { updateWishlistBadge } from "./wishlist.js";

/**
 * Collections Module — Velura
 * Render bộ sưu tập động từ database. Mỗi collection hiển thị đúng số set đồ
 * đang được gắn collection + is_combo, không giới hạn cứng số lượng card.
 */
export function initCollectionsFilter() {
  const tabsContainer = document.querySelector(".collections-tabs");
  const listContainer = document.querySelector(".collections-list");

  if (!tabsContainer || !listContainer) return;

  listContainer.innerHTML = `<div class="collections-state">Đang tải danh sách bộ sưu tập từ cửa hàng...</div>`;
  tabsContainer.innerHTML = "";

  const COLLECTION_META = {
    "Soft Ceremony": {
      id: "soft-ceremony",
      vnName: "Soft Ceremony",
      label: "Thanh lịch & Kiêu sa",
      quote: "Thanh lịch không phải là nổi bật, mà là biết cách tôn lên chính mình.",
      banner: "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/velura_Soft-Ceremony_cover.png",
      decor: "/src/assets/images/collections/soft-ceremony-decor.png",
      story: [
        "Soft Ceremony là bộ sưu tập dành cho những dịp cần sự chỉn chu hơn thường ngày như tiệc nhẹ, hẹn hò, chụp ảnh hay những buổi gặp gỡ đặc biệt.",
        "Lấy cảm hứng từ vẻ đẹp nữ tính và thanh lịch, các thiết kế được xây dựng với phom dáng mềm mại, đường cắt tinh tế cùng những điểm nhấn vừa đủ.",
        "Với bảng màu trung tính, ấm và dịu, bộ sưu tập mang đến cảm giác sang trọng, hiện đại và dễ ứng dụng trong nhiều hoàn cảnh."
      ]
    },
    "The Urban Rhythm": {
      id: "the-urban-rhythm",
      vnName: "The Urban Rhythm",
      label: "Năng động & Thời thượng",
      quote: "Nhịp sống hiện đại đẹp nhất khi sự tự tin luôn vừa vặn với từng chuyển động.",
      banner: "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/Velura_urban-rythm_cover.png",
      decor: "/src/assets/images/collections/the-urban-rhythm-decor.png",
      story: [
        "The Urban Rhythm dành cho những quý cô hiện đại yêu thích sự linh hoạt giữa môi trường công sở và nhịp sống phố thị.",
        "Các thiết kế tập trung vào phom dáng hiện đại, đường cắt sắc sảo và tính ứng dụng cao để tôn lên thần thái độc lập.",
        "Bảng màu beige ấm, xám charcoal, trắng kem và xanh olive giúp từng set đồ dễ mix-match nhưng vẫn giữ nét sang trọng."
      ]
    },
    "Weekend Escape": {
      id: "weekend-escape",
      vnName: "Weekend Escape",
      label: "Tự do & Phóng khoáng",
      quote: "Một cuối tuần đẹp bắt đầu từ cảm giác nhẹ nhàng trong chính bộ đồ mình chọn.",
      banner: "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/velura_Weekend-Escape_cover.png",
      decor: "/src/assets/images/collections/weekend-escape-decor.png",
      story: [
        "Weekend Escape lấy cảm hứng từ những chuyến đi cuối tuần và những ngày thư giãn trọn vẹn.",
        "Bộ sưu tập đề cao sự thoải mái nhưng vẫn giữ vẻ thanh lịch với phom dáng nhẹ nhàng và chất liệu thoáng mát.",
        "Dù là dạo phố, cà phê cuối tuần hay du lịch ngắn ngày, các set đồ đều hướng tới sự tự tin và linh hoạt."
      ]
    },
    "Midnight Mirage": {
      id: "midnight-mirage",
      vnName: "Midnight Mirage",
      label: "Cá tính & Đường phố",
      quote: "Cá tính không cần ồn ào, chỉ cần đủ rõ để người mặc thấy mình trong đó.",
      banner: "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/velura_Midnight-Mirage_cover.png",
      decor: "/src/assets/images/collections/midnight-mirage-decor.png",
      story: [
        "Midnight Mirage lấy cảm hứng từ thời trang đường phố Hàn Quốc, kết hợp nét cá tính, tối giản và hiện đại.",
        "Các outfit mang nhiều sắc thái như Grunge, Soft Neutral, Campus Girl, Street Prep và Y2K Minimal.",
        "Tổng thể bộ sưu tập trẻ trung, linh hoạt, dễ phối và phù hợp cho đi học, đi làm, dạo phố hoặc cà phê cuối tuần."
      ]
    },
    "The Afterglow": {
      id: "the-afterglow",
      vnName: "The Afterglow",
      label: "Dư âm Vương giả",
      quote: "Có những khoảnh khắc không cần phô diễn, chỉ cần lưu lại như một vệt sáng rất riêng.",
      banner: "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/velura_The-Afterglow_cover.png",
      decor: "/src/assets/images/collections/the-afterglow-decor.png",
      story: [
        "The Afterglow lấy cảm hứng từ ánh hoàng hôn diễm lệ và vẻ đẹp kiêu sa, lãng mạn.",
        "Những chất liệu mềm mại, corset tinh tế và sắc màu từ hồng tulle đến xanh Sapphire tạo nên cảm giác vương giả.",
        "Khi kết hợp cùng phụ kiện lấp lánh, mỗi set đồ trở thành một dấu ấn nữ tính, nổi bật nhưng vẫn đầy tiết chế."
      ]
    }
  };

  const DISPLAY_ORDER = [
    "Soft Ceremony",
    "The Urban Rhythm",
    "Weekend Escape",
    "Midnight Mirage",
    "The Afterglow"
  ];

  const getMeta = (name) => {
    return COLLECTION_META[name] || {
      id: toSlug(name),
      vnName: name,
      label: "Thiết kế mới nhất",
      quote: "Một lựa chọn đúng có thể làm cả ngày trở nên mềm mại hơn.",
      banner: "/src/assets/images/about_02.jpg",
      decor: "/src/assets/images/collections/soft-ceremony-decor.png",
      story: [
        `Khám phá các set đồ mới nhất trong bộ sưu tập ${name} của Velura.`,
        "Mỗi thiết kế được tuyển chọn để giữ tinh thần thanh lịch, hiện đại và dễ ứng dụng.",
        "Các phối đồ ưu tiên sự cân bằng giữa phom dáng, màu sắc và cảm giác tự tin khi mặc."
      ]
    };
  };

  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ";
  };

  let wishlistedProductIds = new Set();
  const token = localStorage.getItem("velura_token");
  
  const loadWishlist = async () => {
    if (token) {
      try {
        const wishlistData = await apiRequest("/api/user/wishlist");
        const items = wishlistData.items || [];
        wishlistedProductIds = new Set(items.map(item => item.product_id));
      } catch (err) {
        console.error("Failed to load wishlist in collections:", err);
      }
    } else {
      try {
        const guestIds = JSON.parse(localStorage.getItem("velura_guest_wishlist") || "[]");
        wishlistedProductIds = new Set(guestIds);
      } catch {
        wishlistedProductIds = new Set();
      }
    }
  };

  loadWishlist()
    .then(() => apiRequest("/api/user/products"))
    .then(rawProducts => {
      const products = rawProducts.filter(p => {
        const nameLower = (p.name || "").toLowerCase();
        return !nameLower.includes("test") && !nameLower.includes("validation") && !nameLower.includes("commit");
      });

      const comboProducts = products.filter(p => p.is_combo === true && p.collection);
      const uniqueColNames = [...new Set(comboProducts.map(p => p.collection).filter(Boolean))];
      const orderedColNames = [
        ...DISPLAY_ORDER.filter(name => uniqueColNames.includes(name)),
        ...uniqueColNames.filter(name => !DISPLAY_ORDER.includes(name))
      ];

      if (orderedColNames.length === 0) {
        listContainer.innerHTML = `<div class="collections-state">Hiện chưa có bộ sưu tập nào hoạt động.</div>`;
        return;
      }

      tabsContainer.innerHTML = [
        `<button class="collections-tab active" data-filter="all">Tất cả</button>`,
        ...orderedColNames.map(colName => {
          const meta = getMeta(colName);
          return `<button class="collections-tab" data-filter="${escapeHtml(meta.id)}">${escapeHtml(meta.vnName)}</button>`;
        })
      ].join("");

      listContainer.innerHTML = orderedColNames.map((colName, index) => {
        const meta = getMeta(colName);
        const colProducts = comboProducts.filter(p => p.collection === colName);
        return renderCollectionBlock(meta, colProducts, formatVND, index, wishlistedProductIds);
      }).join("");

      const tabs = tabsContainer.querySelectorAll(".collections-tab");
      const collections = listContainer.querySelectorAll(".collection-detail");

      const applyFilter = (filterValue) => {
        tabs.forEach(tab => {
          tab.classList.toggle("active", tab.getAttribute("data-filter") === filterValue);
        });

        collections.forEach(collection => {
          const category = collection.getAttribute("data-category");
          collection.style.display = filterValue === "all" || category === filterValue ? "" : "none";
        });
      };

      tabs.forEach(tab => {
        tab.addEventListener("click", () => applyFilter(tab.getAttribute("data-filter")));
      });

      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get("id");
      if (urlId) applyFilter(urlId);

      // Bind wishlist and cart events
      const bindCollectionEvents = (products) => {
        const wishlistBtns = listContainer.querySelectorAll(".js-add-wishlist-collection");
        wishlistBtns.forEach(btn => {
          btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = btn.getAttribute("data-id");
            const isActive = btn.classList.contains("active");
            const token = localStorage.getItem("velura_token");

            try {
              if (token) {
                if (isActive) {
                  await apiRequest(`/api/user/wishlist?product_id=${productId}`, { method: "DELETE" });
                  btn.classList.remove("active");
                  wishlistedProductIds.delete(productId);
                  showToast("Đã xóa khỏi danh sách yêu thích");
                } else {
                  await apiRequest("/api/user/wishlist", {
                    method: "POST",
                    body: { product_id: productId }
                  });
                  btn.classList.add("active");
                  wishlistedProductIds.add(productId);
                  showToast("Đã thêm vào danh sách yêu thích!");
                }
                localStorage.setItem("velura_wishlist_count", wishlistedProductIds.size);
              } else {
                let guestIds = [];
                try {
                  guestIds = JSON.parse(localStorage.getItem("velura_guest_wishlist") || "[]");
                } catch {
                  guestIds = [];
                }

                if (isActive) {
                  guestIds = guestIds.filter(id => id !== productId);
                  btn.classList.remove("active");
                  wishlistedProductIds.delete(productId);
                  showToast("Đã xóa khỏi danh sách yêu thích");
                } else {
                  if (!guestIds.includes(productId)) {
                    guestIds.push(productId);
                  }
                  btn.classList.add("active");
                  wishlistedProductIds.add(productId);
                  showToast("Đã thêm vào danh sách yêu thích!");
                }
                localStorage.setItem("velura_guest_wishlist", JSON.stringify(guestIds));
              }
              updateWishlistBadge();
            } catch (err) {
              showToast(err.message || "Không thể lưu sản phẩm");
            }
          });
        });

        const cartBtns = listContainer.querySelectorAll(".js-add-cart-collection");
        cartBtns.forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = btn.getAttribute("data-id");
            const prod = products.find(x => x.product_id === productId);
            if (prod && prod.variants && prod.variants.length > 0) {
              const matchedVariant = prod.variants[0];
              addToCart({
                variant_id: matchedVariant.variant_id,
                product_id: prod.product_id,
                product_name: prod.name,
                product_image: getVariantImage ? getVariantImage(prod, matchedVariant.color || "Mặc định") : (prod.images?.[0] || ""),
                quantity: 1,
                unit_price: prod.sale_price || prod.base_price,
                color: matchedVariant.color || "Mặc định",
                size: matchedVariant.size || "M"
              });
            } else {
              showToast("Sản phẩm không có biến thể sẵn có.");
            }
          });
        });
      };

      bindCollectionEvents(products);
    })
    .catch(err => {
      console.error("[Collections Dynamic Load Error]:", err);
      listContainer.innerHTML = `<div class="collections-state collections-state--error">Không thể tải các bộ sưu tập: ${escapeHtml(err.message)}</div>`;
    });
}

function renderCollectionBlock(meta, products, formatVND, index, wishlistedProductIds) {
  const countClass = `collection-detail__products-grid--count-${Math.min(products.length, 6)}`;
  const cardsHtml = products.length
    ? products.map((product, idx) => renderOutfitCard(product, idx, formatVND, wishlistedProductIds)).join("")
    : `<div class="collections-state">Bộ sưu tập này chưa có set đồ đang bán.</div>`;

  const isReverse = index % 2 === 1;
  const bodyClass = isReverse ? "collection-detail__body collection-detail__body--reverse" : "collection-detail__body";

  return `
    <section class="collection-detail" data-category="${escapeHtml(meta.id)}" aria-labelledby="collection-${escapeHtml(meta.id)}">
      <div class="collection-detail__cover">
        <img src="${escapeAttribute(meta.banner)}" alt="Ảnh đại diện bộ sưu tập ${escapeAttribute(meta.vnName)}" class="collection-detail__cover-img" loading="lazy" />
        <div class="collection-detail__cover-overlay">
          <strong>${escapeHtml(meta.vnName)}</strong>
        </div>
      </div>

      <div class="${bodyClass}">
        <aside class="collection-detail__info">
          <div class="collection-detail__copy">
            <span class="collection-detail__story-tag">${escapeHtml(meta.label)}</span>
            <h2 class="collection-detail__story-title" id="collection-${escapeHtml(meta.id)}">${escapeHtml(meta.vnName)}</h2>
            <div class="collection-detail__divider" aria-hidden="true"><span></span></div>
            <div class="collection-detail__story-desc">
              ${meta.story.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            </div>
          </div>
          <figure class="collection-detail__decor" aria-hidden="true">
            <img src="${escapeAttribute(meta.decor)}" alt="" class="collection-detail__decor-img" loading="lazy" />
          </figure>
        </aside>

        <div class="collection-detail__products">
          <div class="collection-detail__products-header">
            <h3 class="collection-detail__products-title">Thiết kế tiêu biểu</h3>
            <span class="collection-detail__header-line"></span>
            <span class="collection-detail__mark">V</span>
          </div>
          <div class="collection-detail__products-grid ${countClass}">
            ${cardsHtml}
          </div>
          <p class="collection-detail__quote">
            “${escapeHtml(meta.quote)}”
          </p>
        </div>
      </div>
    </section>
  `;
}

function renderOutfitCard(product, index, formatVND, wishlistedProductIds) {
  const priceVal = product.sale_price || product.base_price || 0;
  const image = product.images?.[0] || "/src/assets/images/placeholder.jpg";
  const displayIndex = String(index + 1).padStart(2, "0");
  const isWishlisted = wishlistedProductIds.has(product.product_id);
  const wishlistClass = isWishlisted ? "active" : "";
  const detailUrl = `/src/pages/products/detail.html?id=${encodeURIComponent(product.product_id)}`;

  return `
    <article class="collection-product-card" data-detail-url="${detailUrl}">
      <div class="collection-product-card__media">
        <span class="collection-product-card__badge">${displayIndex}</span>
        <a href="${detailUrl}" class="collection-product-card__img-link">
          <img src="${escapeAttribute(image)}" alt="${escapeAttribute(product.name || "Set đồ Velura")}" class="collection-product-card__img" loading="lazy" />
        </a>
        <button class="btn-icon collection-product-card__btn-wishlist card__wishlist-btn js-add-wishlist-collection ${wishlistClass}" type="button" title="Thêm vào Wishlist" data-id="${product.product_id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="collection-product-card__info">
        <a href="${detailUrl}" class="collection-product-card__name-link">
          <h4 class="collection-product-card__name">${escapeHtml(product.name || "Set đồ Velura")}</h4>
        </a>
        <span class="collection-product-card__price">${escapeHtml(formatVND(priceVal))}</span>
      </div>
      <div class="collection-product-card__actions">
        <a href="${detailUrl}" class="btn-buy">
          <svg class="icon" width="16" height="16" style="fill: none; stroke: currentColor; stroke-width: 2;"><use href="#icon-bag"></use></svg>
          <span>Mua ngay</span>
        </a>
        <button class="collection-product-card__btn-cart js-add-cart-collection" type="button" title="Thêm vào giỏ hàng" data-id="${product.product_id}">
          <svg class="icon" width="18" height="18" style="fill: none; stroke: currentColor; stroke-width: 2;"><use href="#icon-cart"></use></svg>
        </button>
      </div>
    </article>
  `;
}

function toSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
