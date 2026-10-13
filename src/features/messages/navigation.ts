import { router } from "expo-router";
import type { ChatRoom } from "./types";

/** Opens a chat thread, passing what the header needs so it paints instantly. */
export function openChat(room: ChatRoom) {
  router.push({
    pathname: "/chat/[id]",
    params: { id: room.id, name: room.name, avatar: room.avatar ?? "", type: room.type, otherId: room.otherId ?? "", members: String(room.memberCount ?? "") },
  });
}
