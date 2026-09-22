// frontend/src/utils/auth.js

const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const USER_KEY = "user"; // store user object (optional but useful)

export const getDefaultRoute = (role) => {
  if (role === "user") return "/my-appointments";
  if (["admin", "staff"].includes(role)) return "/vehicles";
  return "/";
};

export const setAuth = ({ token, role, user }) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (role) localStorage.setItem(ROLE_KEY, role);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

  // ✅ tell Navbar to refresh
  window.dispatchEvent(new Event("auth-change"));
};

export const getAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY);
  const userRaw = localStorage.getItem(USER_KEY);

  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  return { token, role, user };
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);

  window.dispatchEvent(new Event("auth-change"));
};
