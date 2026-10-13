import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/AuthProvider";
import { WS_BASE_URL } from "@/lib/api/config";

// One app-wide Socket.IO connection for chat, presence, notifications and GRWM updates.
let shared: { token: string; socket: Socket; refs: number } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function acquire(token: string) {
  if (shared && shared.token !== token) {
    shared.socket.disconnect();
    shared = null;
  }
  if (!shared) {
    const socket = io(WS_BASE_URL, {
      auth: { token },
      // React Native has no XHR polling quirks to work around; websocket first is fastest.
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socket.on("connect", emit);
    socket.on("disconnect", emit);
    shared = { token, socket, refs: 0 };
  }
  shared.refs += 1;
  return shared.socket;
}

function release(socket: Socket) {
  if (!shared || shared.socket !== socket) return;
  shared.refs -= 1;
  if (shared.refs <= 0) {
    socket.disconnect();
    shared = null;
    emit();
  }
}

/** The shared socket for the signed-in user (null while signed out). */
export function useAppSocket() {
  const { token } = useAuth();
  const subscribe = useCallback(
    (onChange: () => void) => {
      listeners.add(onChange);
      if (!token) return () => listeners.delete(onChange);
      const socket = acquire(token);
      onChange();
      return () => {
        listeners.delete(onChange);
        release(socket);
      };
    },
    [token]
  );
  return useSyncExternalStore(subscribe, () => (token && shared?.token === token ? shared.socket : null));
}

/** Whether the shared socket is currently connected. */
export function useSocketConnected() {
  const socket = useAppSocket();
  return useSyncExternalStore(
    useCallback((l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    }, []),
    () => Boolean(socket?.connected)
  );
}

/** Subscribes to one server event on the shared socket. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const socket = useAppSocket();
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!socket) return;
    const listener = (payload: T) => ref.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
