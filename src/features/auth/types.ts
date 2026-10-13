export type UserRole = "USER" | "ADMIN";

/** User object returned by /user/auth/login, /user/auth/signup and /users/profile. */
export type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type LoginPayload = { email: string; password: string };
export type SignupPayload = { email: string; password: string; username: string };
export type ForgotPasswordPayload = { email: string };
export type ResetPasswordPayload = { token: string; newPassword: string };

export const displayName = (u?: { username?: string | null; email?: string } | null) =>
  u?.username || u?.email?.split("@")[0] || "Someone";
