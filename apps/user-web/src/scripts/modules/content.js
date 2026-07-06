import { apiRequest } from "./api.js";

let blogCategoryLabels = new Map();

export function initContentPages() {
  initBlogPage();
  initPolicyPage();
  initAboutPage();
}

async function initBlogPage() {
  const page = document.querySelector(".page-blog");
  const grid = document.querySelector("#articlesGrid");
  if (!page || !grid) return;
  applyBlogImageFallbacks();

  try {
    const [categoriesResult, blogsResult] = await Promise.all([
      apiRequest("/api/content/categories?type=blog"),
      apiRequest("/api/content/blogs?limit=50")
    ]);
    const categories = categoriesResult.rows || [];
    const blogs = blogsResult.rows || [];
    if (!blogs.length) return;

    blogCategoryLabels = new Map(categories.map((category) => [category.slug, category.name]));
    renderBlogTabs(categories);
    renderFeaturedPost(blogs.find((post) => post.is_featured) || blogs[0]);
    renderBlogGrid(blogs);
    applyBlogImageFallbacks();
    bindBlogTabs();
    hideStaticPagination();
  } catch (error) {
    console.warn("Blog content API unavailable, keeping static content.", error);
  }
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

  try {
    const [categoriesResult, policiesResult] = await Promise.all([
      apiRequest("/api/content/categories?type=policy"),
      apiRequest("/api/content/policies")
    ]);
    const categories = categoriesResult.rows || [];
    const policies = policiesResult.rows || [];
    if (!policies.length) return;

    tabs.innerHTML = categories
      .filter((category) => policies.some((policy) => policy.slug === category.slug))
      .map((category, index) => renderPolicyTab(category, index === 0))
      .join("");
    content.innerHTML = policies.map((policy, index) => renderPolicyPanel(policy, index === 0)).join("");
    bindPolicyTabs();
  } catch (error) {
    console.warn("Policy content API unavailable, keeping static content.", error);
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
  section.innerHTML = `
    <div class="featured-post__image">
      <img src="${escapeHtml(post.image_url || "/src/assets/images/image-8.png")}" alt="${escapeHtml(post.title)}" loading="eager" decoding="async" onerror="this.src='/src/assets/images/image-8.png';" />
    </div>
    <div class="featured-post__content">
      <span class="blog-badge">${escapeHtml(categoryLabel(post.category_slug))}</span>
      <h2 class="featured-post__title">${escapeHtml(post.title)}</h2>
      <p class="featured-post__excerpt">${escapeHtml(post.excerpt)}</p>
      <div class="post-meta">
        <span class="post-meta__author">${escapeHtml(post.author)}</span>
        <span class="post-meta__dot">&middot;</span>
        <span class="post-meta__date">${escapeHtml(formatDate(post.published_at))}</span>
        <span class="post-meta__dot">&middot;</span>
        <span class="post-meta__read-time">${escapeHtml(post.read_minutes)} phút đọc</span>
      </div>
      <a href="#" class="btn-read-more">Đọc tiếp</a>
    </div>
  `;
}

function renderBlogGrid(blogs) {
  const grid = document.querySelector("#articlesGrid");
  if (!grid) return;
  grid.innerHTML = blogs.map((post) => `
    <article class="article-card" data-category="${escapeHtml(post.category_slug)}">
      <div class="article-card__image">
        <img src="${escapeHtml(post.image_url || "/src/assets/images/image-8.png")}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async" onerror="this.src='/src/assets/images/image-8.png';" />
      </div>
      <div class="article-card__content">
        <span class="blog-badge">${escapeHtml(categoryLabel(post.category_slug))}</span>
        <h3 class="article-card__title"><a href="#">${escapeHtml(post.title)}</a></h3>
        <p class="article-card__excerpt">${escapeHtml(post.excerpt || post.content)}</p>
        <div class="post-meta">
          <span class="post-meta__author">${escapeHtml(post.author)}</span>
          <span class="post-meta__dot">&middot;</span>
          <span class="post-meta__date">${escapeHtml(formatDate(post.published_at))}</span>
          <span class="post-meta__dot">&middot;</span>
          <span class="post-meta__read-time">${escapeHtml(post.read_minutes)} phút</span>
        </div>
      </div>
    </article>
  `).join("");
}

function bindBlogTabs() {
  const tabs = document.querySelectorAll(".category-tab");
  const articles = document.querySelectorAll(".article-card");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      const category = tab.dataset.category;
      articles.forEach((article) => {
        article.style.display = category === "all" || article.dataset.category === category ? "flex" : "none";
      });
    });
  });
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

function hideStaticPagination() {
  const pagination = document.querySelector(".page-blog .pagination");
  if (pagination) pagination.style.display = "none";
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
