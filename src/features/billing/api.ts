import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { useAuth } from "@/features/auth/AuthProvider";
import { queryKeys } from "@/lib/queryKeys";

// Credits: every generated image costs 1; packs are bought on the web (Razorpay checkout).

export type CreditPack = { id: string; name: string; description: string | null; price: number; credits: number; featured: boolean };
export type Catalogue = { paymentsEnabled: boolean; currency: string; freeCredits: number; videoCost: number; packs: CreditPack[] };
export type Wallet = { balance: number; freeCredits: number; imageCost: number; videoCost: number; paymentsEnabled: boolean };
export type CreditTransaction = { id: string; delta: number; balanceAfter: number; reason: string; note: string | null; createdAt: string };
export type CheckoutOrder = { orderId: string; amount: number; currency: string; keyId: string; pack: CreditPack };

export const billingApi = {
  async catalogue() {
    return (await apiRequest<Catalogue>(ENDPOINTS.billing.packs)).data;
  },
  async wallet(token: string) {
    return (await apiRequest<Wallet>(ENDPOINTS.billing.me, { token })).data;
  },
  async history(token: string) {
    return (await apiRequest<CreditTransaction[]>(ENDPOINTS.billing.history, { token })).data;
  },
  /** Creates a Razorpay order on the server (the price always comes from the server). */
  async createOrder(token: string, packId: string) {
    return (await apiRequest<CheckoutOrder>(ENDPOINTS.billing.orders, { method: "POST", token, body: { packId } })).data;
  },
  /** Checkout's success callback: the server checks the signature and adds the credits (once). */
  async verify(token: string, body: { orderId: string; paymentId: string; signature: string }) {
    return (await apiRequest<{ balance: number; credits: number }>(ENDPOINTS.billing.verify, { method: "POST", token, body })).data;
  },
};

/** Live packs and free allowance from the API (null until it answers). */
export function useCatalogue() {
  return useQuery({ queryKey: queryKeys.catalogue, queryFn: billingApi.catalogue, staleTime: 5 * 60_000 });
}

/** Recent credit changes, newest first. */
export function useCreditHistory() {
  const { token } = useAuth();
  return useQuery({ queryKey: queryKeys.creditHistory(token), queryFn: () => billingApi.history(token!), enabled: Boolean(token) });
}

/** The signed-in user's credits, shared by the Drape button, the account menu and the credits screen. */
export function useWallet() {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.wallet(token),
    queryFn: () => billingApi.wallet(token!),
    enabled: Boolean(token),
    staleTime: 30_000,
  });
}

/** Updates the cached balance from a render response's `creditsLeft` without another request. */
export function useSetCreditBalance() {
  const { token } = useAuth();
  const client = useQueryClient();
  return useCallback(
    (balance: number | undefined | null) => {
      if (typeof balance !== "number") return;
      client.setQueryData<Wallet>(queryKeys.wallet(token), (w) => (w ? { ...w, balance } : w));
    },
    [client, token]
  );
}
