const STORAGE_KEYS = Object.freeze({
  token: "velura_token",
  user: "velura_user",
  role: "userRole",
  userId: "user_id"
});

export function storeAuthSession({ token, user }) {
  if (!token) {
    throw new Error("Phiên đăng nhập không có token xác thực.");
  }

  if (!user?.user_id) {
    throw new Error("Phiên đăng nhập không có user_id.");
  }

  const normalizedUser = {
    ...user,
    role: user.role || "member"
  };

  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(normalizedUser));
  localStorage.setItem(STORAGE_KEYS.role, normalizedUser.role);
  localStorage.setItem(STORAGE_KEYS.userId, String(normalizedUser.user_id));
}

export function clearAuthSession() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function hasRealAuthSession() {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return false;

  const userId = localStorage.getItem(STORAGE_KEYS.userId) || getStoredUser()?.user_id;
  if (userId) {
    localStorage.setItem(STORAGE_KEYS.userId, String(userId));
    return true;
  }

  return false;
}

export function getCurrentRole() {
  return hasRealAuthSession() ? (localStorage.getItem(STORAGE_KEYS.role) || "member") : "guest";
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
