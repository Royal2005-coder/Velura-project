const STORAGE_KEYS = Object.freeze({
  token: "velura_token",
  user: "velura_user",
  role: "userRole",
  userId: "user_id"
});

const DEV_MEMBER_ID = "00000000-0000-4000-8000-000000000001";

export function storeAuthSession({ token, user }) {
  if (!user?.user_id) {
    throw new Error("Phiên đăng nhập không có user_id.");
  }

  const normalizedUser = {
    ...user,
    role: user.role || "member"
  };

  if (token) localStorage.setItem(STORAGE_KEYS.token, token);
  else localStorage.removeItem(STORAGE_KEYS.token);

  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(normalizedUser));
  localStorage.setItem(STORAGE_KEYS.role, normalizedUser.role);
  localStorage.setItem(STORAGE_KEYS.userId, String(normalizedUser.user_id));
}

export function clearAuthSession() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function createDevMemberSession(channel = "phone") {
  if (!import.meta.env.DEV) {
    throw new Error("Mock Login chỉ được phép chạy trong môi trường phát triển.");
  }

  return {
    token: null,
    user: {
      user_id: DEV_MEMBER_ID,
      full_name: "Thành viên Test",
      role: "member",
      email: channel === "email" ? "member.test@velura.local" : null,
      phone: channel === "phone" ? "0901234567" : null,
      is_dev_mock: true
    }
  };
}
