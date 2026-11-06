import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { AuthSession, AuthUser, ForgotPasswordPayload, LoginPayload, ResetPasswordPayload, SignupPayload, VerifyEmailPayload } from "./types";

export const authApi = {
  async login(payload: LoginPayload) {
    return (await apiRequest<AuthSession>(ENDPOINTS.auth.login, { method: "POST", body: payload })).data;
  },

  async signup(payload: SignupPayload) {
    // A session, or (when email verification is on) only a flag: the emailed link must be used first.
    return (await apiRequest<AuthSession | { requiresVerification: true; user: AuthUser }>(ENDPOINTS.auth.signup, { method: "POST", body: payload })).data;
  },

  async verifyEmail(payload: VerifyEmailPayload) {
    return (await apiRequest<null>(ENDPOINTS.auth.verifyEmail, { method: "POST", body: payload })).message;
  },

  /** Resolves with the server's message; the backend never reveals whether the email exists. */
  async resendVerification(payload: ForgotPasswordPayload) {
    return (await apiRequest<null>(ENDPOINTS.auth.resendVerification, { method: "POST", body: payload })).message;
  },

  /** Resolves with the server's message; the backend never reveals whether the email exists. */
  async forgotPassword(payload: ForgotPasswordPayload) {
    return (await apiRequest<null>(ENDPOINTS.auth.forgotPassword, { method: "POST", body: payload })).message;
  },

  async resetPassword(payload: ResetPasswordPayload) {
    return (await apiRequest<null>(ENDPOINTS.auth.resetPassword, { method: "POST", body: payload })).message;
  },

  /** Confirms a stored token is still accepted and returns the live user. */
  async profile(token: string, signal?: AbortSignal) {
    return (await apiRequest<AuthUser>(ENDPOINTS.users.profile, { token, signal })).data;
  },
};
