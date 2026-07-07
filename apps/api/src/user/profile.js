import { HttpError, readJson, sendJson } from "../http.js";
import { updateRows } from "../supabase.js";
import { requireUserAuth } from "./auth.js";

export async function handleProfileRoute(req, res, subRoute, corsHeaders, context) {
  const profile = requireUserAuth(context);

  if (subRoute === "profile") {
    // GET /api/user/profile
    if (req.method === "GET") {
      const { password_hash, otp_code, otp_expires_at, ...cleanProfile } = profile;
      return sendJson(res, 200, cleanProfile, corsHeaders);
    }

    // PATCH /api/user/profile
    if (req.method === "PATCH") {
      const body = await readJson(req);
      const { full_name, date_of_birth, gender, avatar } = body;

      const updates = {};
      if (full_name) updates.full_name = full_name;
      if (date_of_birth) updates.date_of_birth = date_of_birth;
      if (gender) updates.gender = gender;
      if (avatar) updates.avatar = avatar;
      updates.updated_at = new Date().toISOString();

      const updatedRows = await updateRows("users", { user_id: `eq.${profile.user_id}` }, updates);
      const updated = updatedRows[0];
      if (!updated) {
        throw new HttpError(404, "USER_NOT_FOUND", "Không tìm thấy người dùng");
      }
      const { password_hash, otp_code, otp_expires_at, ...cleanProfile } = updated;
      return sendJson(res, 200, cleanProfile, corsHeaders);
    }
  }

  if (subRoute === "addresses") {
    // PATCH /api/user/addresses
    if (req.method === "PATCH") {
      const body = await readJson(req);
      const { addresses } = body; // JSON array expected

      if (!Array.isArray(addresses)) {
        throw new HttpError(400, "BAD_REQUEST", "Addresses phải là một mảng JSON");
      }

      await updateRows("users", { user_id: `eq.${profile.user_id}` }, {
        saved_addresses: addresses,
        updated_at: new Date().toISOString()
      });

      return sendJson(res, 200, { success: true, addresses }, corsHeaders);
    }
  }

  throw new HttpError(404, "NOT_FOUND", "Route profile not found");
}
