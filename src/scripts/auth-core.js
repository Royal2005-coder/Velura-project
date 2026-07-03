// ══════════════════════════════════════════════════════════════
// Velura Auth Core — User management, SSO mock, session, RBAC
// ══════════════════════════════════════════════════════════════

const USERS_KEY = "velura_users";
const SESSION_KEY = "velura_session";
const CURRENT_SESSION_KEY = "velura_current_session";

// Role → allowed admin pages mapping
export const ROLE_PAGES = {
  "Admin quản trị": ["dashboard","accounts","products","orders","reviews","returns-cskh","pricing","promotions","logs"],
  "Admin quản lý sản phẩm": ["products","dashboard"],
  "Admin quản lý đơn hàng": ["orders","dashboard"],
  "Admin quản lý giá & khuyến mãi": ["pricing","promotions","dashboard"],
  "Admin quản lý đánh giá & review": ["reviews","dashboard"],
  "Admin quản lý đổi trả & CSKH": ["returns-cskh","dashboard"],
  "Member": ["welcome"],
  "Guest": ["welcome"]
};

// Default demo users
const DEMO_USERS = [
  {
    id: "USR-001", email: "admin@velura.vn", password: "admin123",
    name: "Phạm Thu Hương", phone: "0923456789",
    role: "Admin quản trị", type: "admin",
    avatar: "PH", createdAt: "15/12/2023", lastLogin: "",
    mustChangePassword: false, isGoogleUser: false, status: "active", version: 1
  },
  {
    id: "USR-002", email: "product@velura.vn", password: "product123",
    name: "Trần Minh Tuấn", phone: "0912345678",
    role: "Admin quản lý sản phẩm", type: "admin",
    avatar: "TT", createdAt: "01/03/2024", lastLogin: "",
    mustChangePassword: false, isGoogleUser: false, status: "active", version: 1
  },
  {
    id: "USR-003", email: "order@velura.vn", password: "order123",
    name: "Lê Gia Linh", phone: "0934567890",
    role: "Admin quản lý đơn hàng", type: "admin",
    avatar: "LG", createdAt: "15/06/2024", lastLogin: "",
    mustChangePassword: false, isGoogleUser: false, status: "active", version: 1
  },
  {
    id: "USR-004", email: "price@velura.vn", password: "price123",
    name: "Ngô Thanh Sơn", phone: "0956789012",
    role: "Admin quản lý giá & khuyến mãi", type: "admin",
    avatar: "NS", createdAt: "02/02/2025", lastLogin: "",
    mustChangePassword: false, isGoogleUser: false, status: "active", version: 1
  },
  {
    id: "USR-005", email: "cskh@velura.vn", password: "cskh123",
    name: "Vũ Thanh Mai", phone: "0967890123",
    role: "Admin quản lý đổi trả & CSKH", type: "admin",
    avatar: "VM", createdAt: "10/08/2024", lastLogin: "",
    mustChangePassword: false, isGoogleUser: false, status: "active", version: 1
  },
  {
    id: "USR-006", email: "lan.nguyen@email.com", password: "user123",
    name: "Nguyễn Thị Lan", phone: "0901234567",
    role: "Member", type: "customer",
    avatar: "NL", createdAt: "15/01/2024", lastLogin: "",
    mustChangePassword: false, isGoogleUser: false, status: "active", version: 1
  },
  {
    id: "USR-007", email: "khoa.tran@email.com", password: "user123",
    name: "Trần Minh Khoa", phone: "0912345679",
    role: "Member", type: "customer",
    avatar: "KM", createdAt: "20/03/2024", lastLogin: "",
    mustChangePassword: false, isGoogleUser: false, status: "active", version: 1
  }
];

// ─── Storage helpers ──────────────────────────────────────

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── User CRUD ────────────────────────────────────────────

function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    write(USERS_KEY, DEMO_USERS);
  }
}

export function getUsers() {
  initUsers();
  return read(USERS_KEY) || [];
}

export function saveUsers(users) {
  write(USERS_KEY, users);
}

export function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  return getUsers().find(u => u.id === id);
}

export function createUser({ email, password, name, phone, type, role, isGoogleUser, mustChangePassword }) {
  const users = getUsers();
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { error: "Email đã tồn tại trong hệ thống" };

  const id = `USR-${Date.now().toString().slice(-6)}`;
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const newUser = {
    id, email, password: password || null, name, phone: phone || "",
    role: role || "Member", type: type || "customer",
    avatar: initials,
    createdAt: new Date().toLocaleDateString("vi-VN"),
    lastLogin: "", mustChangePassword: mustChangePassword || false,
    isGoogleUser: isGoogleUser || false, status: "active", version: 1
  };
  users.push(newUser);
  saveUsers(users);
  return { user: newUser };
}

export function updateUser(id, updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return { error: "Không tìm thấy người dùng" };
  users[idx] = { ...users[idx], ...updates, version: (users[idx].version || 0) + 1 };
  saveUsers(users);
  return { user: users[idx] };
}

export function changePassword(id, oldPass, newPass) {
  const users = getUsers();
  const user = users.find(u => u.id === id);
  if (!user) return { error: "Không tìm thấy tài khoản" };

  // Google users don't have a password to verify
  if (!user.isGoogleUser && user.password && user.password !== oldPass) {
    return { error: "Mật khẩu hiện tại không đúng" };
  }

  if (!newPass || newPass.length < 6) {
    return { error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }

  user.password = newPass;
  user.mustChangePassword = false;
  user.version = (user.version || 0) + 1;
  saveUsers(users);
  return { success: true };
}

// ─── Authentication ───────────────────────────────────────

export function login(email, password) {
  const user = findUserByEmail(email);
  if (!user) return { error: "Email không tồn tại trong hệ thống" };
  if (user.status === "locked") return { error: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên." };
  if (user.password && user.password !== password) return { error: "Mật khẩu không chính xác" };

  user.lastLogin = new Date().toLocaleString("vi-VN");
  user.version = (user.version || 0) + 1;
  saveUsers(getUsers());

  const session = buildSession(user);
  write(CURRENT_SESSION_KEY, session);
  return { session, mustChangePassword: user.mustChangePassword };
}

export function loginWithGoogle(googleUser) {
  // Simulate Google OAuth response
  let user = findUserByEmail(googleUser.email);

  if (!user) {
    // Auto-create account from Google
    const result = createUser({
      email: googleUser.email,
      password: null, // No password for Google users
      name: googleUser.name,
      phone: "",
      type: "customer",
      role: "Member",
      isGoogleUser: true,
      mustChangePassword: false
    });
    if (result.error) return { error: result.error };
    user = result.user;
  }

  if (user.status === "locked") return { error: "Tài khoản đã bị khóa" };

  user.lastLogin = new Date().toLocaleString("vi-VN");
  user.isGoogleUser = true;
  user.version = (user.version || 0) + 1;
  saveUsers(getUsers());

  const session = buildSession(user);
  write(CURRENT_SESSION_KEY, session);
  return { session, mustChangePassword: false };
}

export function register({ email, password, name, phone, useDefaultPassword }) {
  const finalPassword = useDefaultPassword ? "Velura@123" : password;

  if (!useDefaultPassword && (!password || password.length < 6)) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự" };
  }

  if (!email || !name) {
    return { error: "Vui lòng nhập đầy đủ họ tên và email" };
  }

  const result = createUser({
    email, password: finalPassword, name, phone,
    type: "customer", role: "Member",
    mustChangePassword: useDefaultPassword,
    isGoogleUser: false
  });

  if (result.error) return result;

  // Auto-login after registration
  const session = buildSession(result.user);
  write(CURRENT_SESSION_KEY, session);

  return {
    session,
    mustChangePassword: useDefaultPassword,
    defaultPassword: useDefaultPassword ? finalPassword : null
  };
}

export function logout() {
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

export function getSession() {
  return read(CURRENT_SESSION_KEY);
}

export function isLoggedIn() {
  return !!getSession();
}

export function isAdmin() {
  const s = getSession();
  return s && s.type === "admin";
}

// ─── Session builder ──────────────────────────────────────

function buildSession(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone || "",
    role: user.role,
    type: user.type,
    avatar: user.avatar,
    isGoogleUser: user.isGoogleUser,
    mustChangePassword: user.mustChangePassword,
    allowedPages: ROLE_PAGES[user.role] || []
  };
}

// ─── Password strength check ──────────────────────────────

export function checkPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Rất yếu", color: "#dc2626" },
    { label: "Yếu", color: "#ea580c" },
    { label: "Trung bình", color: "#d97706" },
    { label: "Mạnh", color: "#65a30d" },
    { label: "Rất mạnh", color: "#16a34a" },
    { label: "Tuyệt vời", color: "#15803d" }
  ];
  return { score, ...levels[Math.min(score, levels.length - 1)] };
}

// Auto-init
initUsers();
