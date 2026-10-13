import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type AppNotification } from "@/features/social/api";
import { queryKeys } from "@/lib/queryKeys";
import { useSocketEvent } from "@/lib/socket";

type NotificationState = { items: AppNotification[]; unread: number };

/** In-app notifications (circle invites, borrow requests, events, GRWM, stylist feedback), live over the socket. */
export function useNotifications() {
  const { token } = useAuth();
  const client = useQueryClient();
  const key = queryKeys.notifications(token);

  const query = useQuery({ queryKey: key, queryFn: () => socialApi.notifications(token!), enabled: Boolean(token), staleTime: 60_000 });

  useSocketEvent<{ notification: AppNotification }>("notification:new", ({ notification }) => {
    client.setQueryData<NotificationState>(key, (s) => ({
      items: [notification, ...(s?.items ?? []).filter((n) => n.id !== notification.id)].slice(0, 30),
      unread: (s?.unread ?? 0) + 1,
    }));
  });

  const markRead = useMutation({
    mutationFn: (id: string) => socialApi.readNotification(token!, id),
    onMutate: (id) =>
      client.setQueryData<NotificationState>(key, (s) =>
        s
          ? {
              items: s.items.map((x) => (x.id === id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x)),
              unread: Math.max(0, s.unread - (s.items.find((x) => x.id === id)?.readAt ? 0 : 1)),
            }
          : s
      ),
  });

  const markAll = useMutation({
    mutationFn: () => socialApi.readAllNotifications(token!),
    onMutate: () =>
      client.setQueryData<NotificationState>(key, (s) => (s ? { items: s.items.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })), unread: 0 } : s)),
  });

  return {
    items: query.data?.items ?? [],
    unread: query.data?.unread ?? 0,
    loading: query.isLoading,
    refetch: query.refetch,
    refreshing: query.isRefetching,
    markRead: markRead.mutate,
    markAll: markAll.mutate,
  };
}
