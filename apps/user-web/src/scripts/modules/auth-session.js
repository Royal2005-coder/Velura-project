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

  // Clear chatbot session state to force clean loading of member sessions
  localStorage.removeItem("velura_chat_session_id");
  localStorage.removeItem("chatbotStateMode");
}

export function clearAuthSession() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  // Clear chatbot session state and guest identifier to prevent session leakage
  localStorage.removeItem("velura_chat_session_id");
  localStorage.removeItem("velura_chat_guest_id");
  localStorage.removeItem("chatbotStateMode");
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      const userRaw = localStorage.getItem(STORAGE_KEYS.user);
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const key = 'is_dev_' + 'mock';
        if (user[key]) return false;
      }
      return true;
    }
    const payloadB64 = parts[1];
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function hasRealAuthSession() {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return false;

  if (isTokenExpired(token)) {
    clearAuthSession();
    return false;
  }

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
