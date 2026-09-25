import { createContext, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);
export const ADMIN_EMAIL = "thaidinhduc05@gmail.com";
const ADMIN_PASSWORD = "123456";

export default function AuthProvider({ children }) {
  // initialize user from localStorage to avoid calling setState synchronously in an effect
  const [user, setUser] = useState(() => {
    try {
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const authenticatedUser = users.find((u) => u.isAuth === true);
      return authenticatedUser || null;
    } catch {
      return null;
    }
  });

  const [message, setMessage] = useState({
    content: "",
    type: "", // 'success' or 'error'
  });

  const signup = (email, password, name) => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userData = { email, password, name };
    if (email.trim().toLowerCase() === ADMIN_EMAIL) {
      setMessage({
        content: "This email is reserved for the admin account.",
        type: "error",
      });
      return false;
    }

    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      setMessage({
        content: "User already exists, please log in instead.",
        type: "error",
      });
      return false;
    }

    const newUser = { ...userData, isAuth: true };
    const updatedUsers = [
      ...users.map((user) => ({ ...user, isAuth: false })),
      newUser,
    ];
    setUser(newUser);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setMessage({
      content: "",
      type: "",
    });
    return true;
  };

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const normalizedEmail = email.trim().toLowerCase();
    const isAdminLogin = normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    const storedUser = isAdminLogin
      ? { email: ADMIN_EMAIL, name: "Admin", role: "admin" }
      : users.find(
          (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
        );

    if (storedUser) {
      const signedInUser = { ...storedUser, isAuth: true };
      const updatedUsers = isAdminLogin
        ? [
            ...users
              .filter((user) => user.email.toLowerCase() !== ADMIN_EMAIL)
              .map((user) => ({ ...user, isAuth: false })),
            signedInUser,
          ]
        : users.map((user) => ({
            ...user,
            isAuth: user.email.toLowerCase() === normalizedEmail,
          }));
      setUser(signedInUser);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      setMessage({
        content: "",
        type: "",
      });
      return true;
    } else {
      setMessage({
        content: "Invalid email or password.",
        type: "error",
      });
      return false;
    }
  };

  const logout = () => {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    // change the isAuth property of the logged-out user to false
    const updatedUsers = users.map((user) =>
      user.isAuth ? { ...user, isAuth: false } : user,
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setMessage({
      content: "",
      type: "",
    });
    setUser(null);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, message, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
