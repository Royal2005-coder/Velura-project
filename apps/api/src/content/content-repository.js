import { HttpError } from "../http.js";
import { selectOne, selectRows } from "../supabase.js";

const BLOG_SELECT = [
  "blog_id",
  "category_slug",
  "slug",
  "title",
  "excerpt",
  "content",
  "image_url",
  "author",
  "read_minutes",
  "is_featured",
  "status",
  "published_at",
  "updated_at"
].join(",");

const POLICY_SELECT = [
  "policy_id",
  "slug",
  "title",
  "summary",
  "content",
  "display_order",
  "updated_at"
].join(",");

export function createContentRepository() {
  return {
    listCategories(type) {
      const query = {
        select: "content_category_id,content_type,slug,name,display_order",
        order: "display_order.asc,name.asc"
      };
      if (type) query.content_type = `eq.${type}`;
      return withContentError(() => selectRows("content_category", query));
    },

    listBlogs(filters) {
      const query = {
        select: BLOG_SELECT,
        status: "eq.published",
        order: filters.featuredFirst ? "is_featured.desc,published_at.desc" : "published_at.desc",
        limit: filters.limit,
        offset: filters.offset
      };
      if (filters.categorySlug) query.category_slug = `eq.${filters.categorySlug}`;
      return withContentError(() => selectRows("blog", query));
    },

    getBlog(slug) {
      return withContentError(() => selectOne("blog", {
        select: BLOG_SELECT,
        status: "eq.published",
        slug: `eq.${slug}`
      }));
    },

    listPolicies() {
      return withContentError(() => selectRows("policy", {
        select: POLICY_SELECT,
        status: "eq.published",
        order: "display_order.asc,title.asc"
      }));
    },

    getPolicy(slug) {
      return withContentError(() => selectOne("policy", {
        select: POLICY_SELECT,
        status: "eq.published",
        slug: `eq.${slug}`
      }));
    },

    getStaticPage(slug) {
      return withContentError(() => selectOne("static_page", {
        select: "static_page_id,slug,title,subtitle,content,updated_at",
        status: "eq.published",
        slug: `eq.${slug}`
      }));
    }
  };
}

async function withContentError(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof HttpError && error.code === "SUPABASE_ERROR") {
      const databaseCode = error.details?.message || error.details?.code || "CONTENT_DATABASE_ERROR";
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      throw new HttpError(status, databaseCode, "Content database operation failed", error.details);
    }
    throw error;
  }
}
