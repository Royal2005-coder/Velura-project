import { HttpError, readJson, sendJson } from "../http.js";
import { selectOne, insertRow, updateRows } from "../supabase.js";
import { requireUserAuth } from "./auth.js";

export async function handleQuizRoute(req, res, corsHeaders, context) {
  const profile = requireUserAuth(context);

  // GET /api/user/style-quiz
  if (req.method === "GET") {
    const quiz = await selectOne("style_profile", { user_id: `eq.${profile.user_id}` });
    return sendJson(res, 200, { success: true, quiz: quiz || null }, corsHeaders);
  }

  // POST /api/user/style-quiz
  if (req.method === "POST") {
    const body = await readJson(req);
    const {
      height_cm, weight_kg, chest_cm, waist_cm, hip_cm,
      body_shape, skin_tone, style_tags, preferred_occasions,
      favorite_brands, budget_range
    } = body;

    const payload = {
      user_id: profile.user_id,
      height_cm: height_cm || null,
      weight_kg: weight_kg || null,
      chest_cm: chest_cm || null,
      waist_cm: waist_cm || null,
      hip_cm: hip_cm || null,
      body_shape: body_shape || null,
      skin_tone: skin_tone || null,
      style_tags: style_tags || null,
      preferred_occasions: preferred_occasions || null,
      favorite_brands: favorite_brands || null,
      budget_range: budget_range || null,
      quiz_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const existing = await selectOne("style_profile", { user_id: `eq.${profile.user_id}` });
    let result;
    if (existing) {
      result = await updateRows("style_profile", { user_id: `eq.${profile.user_id}` }, payload);
    } else {
      result = await insertRow("style_profile", payload);
    }

    return sendJson(res, 200, { success: true, quiz: result }, corsHeaders);
  }

  throw new HttpError(404, "NOT_FOUND", "Route style-quiz not found");
}
