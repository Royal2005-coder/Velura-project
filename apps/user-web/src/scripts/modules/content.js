import { apiRequest } from "./api.js";
import {
  FALLBACK_BLOG_POSTS,
  FALLBACK_BLOG_CATEGORIES
} from "./blog-posts.js";

let blogCategoryLabels = new Map();
const blogState = {
  posts: [],
  activeCategory: "all",
  visible: 0,
  perPage: 10
};

export function initContentPages() {
  initBlogPage();
  initPolicyPage();
  initAboutPage();
}

async function initBlogPage() {
  const page = document.querySelector(".page-blog");
  const grid = document.querySelector("#articlesGrid");
  if (!page || !grid) return;

  let posts = [];
  let categories = [];
  try {
    const [categoriesResult, blogsResult] = await Promise.all([
      apiRequest("/api/content/categories?type=blog"),
      apiRequest("/api/content/blogs?limit=50")
    ]);
    categories = categoriesResult.rows || [];
    posts = blogsResult.rows || [];
  } catch (error) {
    console.warn("Blog content API unavailable, using fallback data.", error);
    posts = FALLBACK_BLOG_POSTS;
    categories = FALLBACK_BLOG_CATEGORIES;
  }

  blogCategoryLabels = new Map(
    (categories.length ? categories : FALLBACK_BLOG_CATEGORIES).map((category) => [category.slug, category.name])
  );

  if (!posts.length) {
    renderBlogEmpty();
    return;
  }

  blogState.posts = posts;
  blogState.activeCategory = "all";
  blogState.visible = blogState.perPage;

  renderBlogTabs(categories.length ? categories : FALLBACK_BLOG_CATEGORIES);
  renderFeaturedPost(posts.find((post) => post.is_featured) || posts[0]);
  renderBlogGrid();
  bindBlogTabs();
  setupLoadMore();
  bindNewsletter();
  applyBlogImageFallbacks();
  setupReveal();
}

function applyBlogImageFallbacks() {
  document.querySelectorAll(".page-blog img").forEach((image) => {
    image.loading = image.closest(".featured-post") ? "eager" : "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.src = "/src/assets/images/image-8.png";
    }, { once: true });
  });
}

async function initPolicyPage() {
  const page = document.querySelector(".policy-container");
  const tabs = document.querySelector(".policy-tabs");
  const content = document.querySelector(".policy-content");
  if (!page || !tabs || !content) return;

  tabs.innerHTML = '<button class="policy-tabs__item is-active" type="button" disabled><span>Đang tải chính sách...</span></button>';
  content.innerHTML = `
    <section class="policy-panel js-policy-panel is-active">
      <h2 class="policy-panel__title">Đang tải chính sách</h2>
      <p class="policy-panel__intro">Velura đang lấy nội dung chính sách mới nhất từ database.</p>
    </section>
  `;

  try {
    const policiesResult = await apiRequest("/api/content/policies");
    const categoriesResult = await apiRequest("/api/content/categories?type=policy").catch((error) => {
      console.warn("Policy categories unavailable; deriving tabs from policies.", error);
      return { rows: [] };
    });
    const categories = categoriesResult.rows || [];
    const policies = policiesResult.rows || [];
    if (!policies.length) {
      throw new Error("No published policies found");
    }

    const categorySource = categories.length
      ? categories
      : policies.map((policy) => ({
        slug: policy.slug,
        name: policy.title,
        display_order: policy.display_order || 0
      }));

    // Hỗ trợ nhảy trực tiếp tới tab từ URL (ví dụ: ?tab=faq)
    const urlParams = new URLSearchParams(window.location.search);
    const activeTabSlug = urlParams.get('tab');
    let activeIndex = 0;
    
    // Lọc lại các danh mục có bài chính sách
    const activeCategories = categorySource.filter((category) => policies.some((policy) => policy.slug === category.slug));

    if (activeTabSlug) {
      const foundIndex = activeCategories.findIndex(c => c.slug === activeTabSlug);
      if (foundIndex !== -1) {
        activeIndex = foundIndex;
      }
    }

    tabs.innerHTML = activeCategories
      .map((category, index) => renderPolicyTab(category, index === activeIndex))
      .join("");
    content.innerHTML = policies.map((policy) => {
      // Find the correct index in activeCategories for this policy
      const catIndex = activeCategories.findIndex(c => c.slug === policy.slug);
      return renderPolicyPanel(policy, catIndex === activeIndex);
    }).join("");
    bindPolicyTabs();
  } catch (error) {
    console.warn("Policy content API unavailable.", error);
    tabs.innerHTML = "";
    content.innerHTML = `
      <section class="policy-panel js-policy-panel is-active">
        <h2 class="policy-panel__title">Không thể tải chính sách</h2>
        <p class="policy-panel__intro">Hiện chưa lấy được dữ liệu chính sách từ database. Vui lòng kiểm tra API /api/content/policies hoặc thử lại sau.</p>
      </section>
    `;
  }
}

function bindPolicyTabs() {
  const tabs = document.querySelectorAll(".js-policy-tab");
  const panels = document.querySelectorAll(".js-policy-panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = document.getElementById(`policy-panel-${tab.dataset.policyTab}`);
      if (!target) return;
      tabs.forEach((item) => {
        item.classList.remove("is-active");
        item.setAttribute("aria-selected", "false");
      });
      panels.forEach((panel) => panel.classList.remove("is-active"));
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      target.classList.add("is-active");
    });
  });
}

async function initAboutPage() {
  const page = document.querySelector(".page-about");
  if (!page) return;
  try {
    const data = await apiRequest("/api/content/pages/about");
    const title = page.querySelector(".about-story .about-title");
    const descs = page.querySelectorAll(".about-story .about-desc");
    if (title && data.subtitle) title.textContent = data.subtitle;
    const story = Array.isArray(data.content?.story) ? data.content.story : [];
    story.slice(0, descs.length).forEach((text, index) => {
      descs[index].textContent = text;
    });
  } catch (error) {
    console.warn("About content API unavailable, keeping static content.", error);
  }
  setupAboutStoryReveal(page);
}

function setupAboutStoryReveal(page) {
  const targets = page.querySelectorAll("[data-story-reveal]");
  if (!targets.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((target) => target.classList.add("is-story-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-story-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  targets.forEach((target) => observer.observe(target));
}

function renderBlogTabs(categories) {
  const tabs = document.querySelector(".category-tabs");
  if (!tabs) return;
  tabs.innerHTML = [
    '<button type="button" class="category-tab is-active" data-category="all">Tất cả</button>',
    ...categories.map((category) => `<button type="button" class="category-tab" data-category="${escapeHtml(category.slug)}">${escapeHtml(category.name)}</button>`)
  ].join("");
}

function renderFeaturedPost(post) {
  const section = document.querySelector(".featured-post");
  if (!section || !post) return;
  const href = `blog-detail.html?slug=${encodeURIComponent(post.slug || "")}`;
  section.innerHTML = `
    <a class="featured-post__image" href="${escapeHtml(href)}" aria-label="${escapeHtml(post.title)}">
      <img src="${escapeHtml(post.image_url || "/src/assets/images/image-8.png")}" alt="${escapeHtml(post.title)}" loading="eager" decoding="async" onerror="this.src='/src/assets/images/image-8.png';" />
    </a>
    <div class="featured-post__content">
      <span class="blog-badge">${escapeHtml(categoryLabel(post.category_slug))}</span>
      <h2 class="featured-post__title"><a href="${escapeHtml(href)}">${escapeHtml(post.title)}</a></h2>
      <p class="featured-post__excerpt">${escapeHtml(post.excerpt || "")}</p>
      <div class="post-meta">
        <span class="post-meta__author">${escapeHtml(post.author || "")}</span>
        <span class="post-meta__dot">&middot;</span>
        <span class="post-meta__date">${escapeHtml(formatDate(post.published_at))}</span>
        <span class="post-meta__dot">&middot;</span>
        <span class="post-meta__read-time">${escapeHtml(post.read_minutes)} phút đọc</span>
      </div>
      <a href="${escapeHtml(href)}" class="btn-read-more">
        Đọc tiếp
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </a>
    </div>
  `;
}

function filteredPosts() {
  return blogState.activeCategory === "all"
    ? blogState.posts
    : blogState.posts.filter((post) => post.category_slug === blogState.activeCategory);
}

function articleCardHtml(post) {
  const href = `blog-detail.html?slug=${encodeURIComponent(post.slug || "")}`;
  return `
    <article class="article-card reveal" data-category="${escapeHtml(post.category_slug)}">
      <a class="article-card__image" href="${escapeHtml(href)}" aria-label="${escapeHtml(post.title)}">
        <img src="${escapeHtml(post.image_url || "/src/assets/images/image-8.png")}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async" onerror="this.src='/src/assets/images/image-8.png';" />
      </a>
      <div class="article-card__content">
        <span class="blog-badge">${escapeHtml(categoryLabel(post.category_slug))}</span>
        <h3 class="article-card__title"><a href="${escapeHtml(href)}">${escapeHtml(post.title)}</a></h3>
        <p class="article-card__excerpt">${escapeHtml(post.excerpt || post.content || "")}</p>
        <div class="post-meta">
          <span class="post-meta__author">${escapeHtml(post.author || "")}</span>
          <span class="post-meta__dot">&middot;</span>
          <span class="post-meta__date">${escapeHtml(formatDate(post.published_at))}</span>
          <span class="post-meta__dot">&middot;</span>
          <span class="post-meta__read-time">${escapeHtml(post.read_minutes)} phút</span>
        </div>
      </div>
    </article>
  `;
}

function renderBlogGrid() {
  const grid = document.querySelector("#articlesGrid");
  if (!grid) return;

  const list = filteredPosts().slice(0, blogState.visible);
  const isBento = blogState.activeCategory === "all";
  grid.classList.toggle("is-bento", isBento);

  if (!list.length) {
    renderBlogEmpty();
    return;
  }

  grid.innerHTML = list.map((post) => articleCardHtml(post)).join("");
  updateLoadMore();
}

function renderBlogEmpty() {
  const grid = document.querySelector("#articlesGrid");
  const loadMoreWrap = document.querySelector("#loadMoreWrap");
  if (loadMoreWrap) loadMoreWrap.hidden = true;
  if (!grid) return;
  grid.classList.remove("is-bento");
  grid.innerHTML = `
    <div class="blog-empty" role="status">
      <p class="blog-empty__title">Chưa có bài viết nào trong mục này</p>
      <p class="blog-empty__desc">Hãy khám phá các chuyên mục khác hoặc quay lại sau nhé.</p>
      <button type="button" class="blog-empty__reset" id="blogEmptyReset">Xem tất cả bài viết</button>
    </div>
  `;
  const reset = grid.querySelector("#blogEmptyReset");
  if (reset) {
    reset.addEventListener("click", () => {
      const allTab = document.querySelector('.category-tab[data-category="all"]');
      if (allTab) allTab.click();
    });
  }
}

function bindBlogTabs() {
  const tabs = document.querySelectorAll(".category-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.classList.contains("is-active")) return;
      tabs.forEach((item) => {
        item.classList.remove("is-active");
        item.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      blogState.activeCategory = tab.dataset.category || "all";
      blogState.visible = blogState.perPage;
      renderBlogGrid();
      setupReveal();
    });
  });
}

function setupLoadMore() {
  const button = document.querySelector("#loadMoreBtn");
  if (!button) return;
  button.addEventListener("click", () => {
    const remaining = filteredPosts().slice(blogState.visible);
    if (!remaining.length) {
      button.hidden = true;
      return;
    }
    const grid = document.querySelector("#articlesGrid");
    const next = remaining.slice(0, blogState.perPage);
    if (grid) grid.insertAdjacentHTML("beforeend", next.map((post) => articleCardHtml(post)).join(""));
    blogState.visible += next.length;
    applyBlogImageFallbacks();
    updateLoadMore();
    setupReveal();
  });
}

function updateLoadMore() {
  const wrap = document.querySelector("#loadMoreWrap");
  if (!wrap) return;
  const hasMore = filteredPosts().length > blogState.visible;
  wrap.hidden = !hasMore;
}

function renderPolicyTab(category, active) {
  return `
    <button class="policy-tabs__item js-policy-tab ${active ? "is-active" : ""}" data-policy-tab="${escapeHtml(category.slug)}" id="policy-tab-${escapeHtml(category.slug)}" role="tab" aria-selected="${active ? "true" : "false"}" aria-controls="policy-panel-${escapeHtml(category.slug)}">
      <span>${escapeHtml(category.name)}</span>
    </button>
  `;
}

function renderPolicyPanel(policy, active) {
  const sections = Array.isArray(policy.content) ? policy.content : [];
  return `
    <section class="policy-panel js-policy-panel ${active ? "is-active" : ""}" id="policy-panel-${escapeHtml(policy.slug)}" role="tabpanel" aria-labelledby="policy-tab-${escapeHtml(policy.slug)}">
      <h2 class="policy-panel__title">${escapeHtml(policy.title)}</h2>
      <p class="policy-panel__intro">${escapeHtml(policy.summary)}</p>
      ${sections.map((section) => `
        <h3 class="policy-panel__section-title">${escapeHtml(section.heading || "")}</h3>
        ${(section.items || []).length ? `<ul class="policy-panel__list">${section.items.map((item) => `<li class="policy-panel__list-item">${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
        ${section.text ? `<p class="policy-panel__text">${escapeHtml(section.text)}</p>` : ""}
      `).join("")}
    </section>
  `;
}

function categoryLabel(slug) {
  if (blogCategoryLabels.has(slug)) return blogCategoryLabels.get(slug);
  const labels = {
    trend: "Xu hướng",
    style: "Phối đồ",
    interview: "Phỏng vấn",
    sustainable: "Bền vững",
    event: "Sự kiện"
  };
  return labels[slug] || slug || "Velura";
}

function bindNewsletter() {
  const form = document.querySelector("#newsletterForm");
  if (!form) return;
  const input = form.querySelector('input[type="email"]');
  const success = document.querySelector("#newsletterSuccess");
  const error = document.querySelector("#newsletterError");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (error) error.hidden = true;
    if (!input.checkValidity()) {
      if (error) {
        error.textContent = "Vui lòng nhập địa chỉ email hợp lệ.";
        error.hidden = false;
      }
      input.focus();
      return;
    }
    form.reset();
    if (success) {
      success.hidden = false;
      success.textContent = "Cảm ơn bạn đã đăng ký. Tạp chí Velura sẽ gửi đến hòm thư của bạn mỗi tuần.";
    }
  });
}

function setupReveal() {
  const extra = [
    document.querySelector(".featured-post"),
    document.querySelector(".newsletter-box")
  ].filter(Boolean);
  extra.forEach((el) => {
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
  });

  const targets = document.querySelectorAll(".reveal:not(.is-visible)");
  if (!targets.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  targets.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index, 6) * 60}ms`;
    observer.observe(el);
  });
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
