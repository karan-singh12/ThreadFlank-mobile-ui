import { useRef } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { discoverApi } from "@/features/discover/api";
import type { Brand, BrandPost } from "@/features/discover/model";
import { socialApi } from "@/features/social/api";
import { WEB_ORIGIN } from "@/lib/api/config";
import { CardShareSheet, type ShareChannel } from "./CardShareSheet";

/** Share a Discover post as a branded card that links to its public post page. */
export function PostShareSheet({ open, onClose, post, brand }: { open: boolean; onClose: () => void; post: BrandPost; brand: Brand }) {
  const { token } = useAuth();
  const name = `${brand.name}: ${post.caption.replace(/\s+/g, " ").trim().slice(0, 60) || post.category}`;
  return (
    <CardShareSheet
      open={open}
      onClose={onClose}
      title="Share this post"
      name={name}
      image={post.image}
      shareText={`✨ ${name} — want to try this on?`}
      prepare={async () => {
        void discoverApi.recordShare(token, post.id);
        return {
          url: `${WEB_ORIGIN}/p/${post.id}`,
          card: (format) => `${WEB_ORIGIN}/api/post-card/${post.id}?format=${format}`,
        };
      }}
    />
  );
}

/**
 * Share a look as a branded card, or send it into a chat. A share link always points at a
 * saved look, so `ensureLookId` saves it first when needed.
 */
export function LookShareSheet({
  open,
  onClose,
  lookId,
  ensureLookId,
  image,
  video,
  name,
}: {
  open: boolean;
  onClose: () => void;
  lookId?: string | null;
  ensureLookId?: () => Promise<string>;
  image: string;
  video?: string | null;
  name: string;
}) {
  const { token } = useAuth();
  // Save at most once, even if several channels are tapped while the save is still running.
  const saving = useRef<Promise<string> | null>(null);

  const savedLookId = () => {
    if (lookId) return Promise.resolve(lookId);
    if (!ensureLookId) return Promise.reject(new Error("Save the look before sharing it"));
    if (!saving.current) {
      saving.current = ensureLookId();
      saving.current.catch(() => {
        saving.current = null;
      });
    }
    return saving.current;
  };

  const prepare = async (channel: ShareChannel) => {
    if (!token) throw new Error("Sign in to share");
    const share = await socialApi.createShare(token, await savedLookId(), channel);
    return {
      url: `${WEB_ORIGIN}/s/${share.token}`,
      card: (format: "whatsapp" | "story") => `${WEB_ORIGIN}/api/share-card/${share.token}?format=${format}`,
    };
  };

  return (
    <CardShareSheet
      open={open}
      onClose={onClose}
      title="Share this look"
      name={name}
      image={image}
      video={video}
      shareText={`👗 ${name} — what do you think?`}
      prepare={prepare}
      note={!lookId && ensureLookId ? "It's saved to your looks so the link keeps working." : undefined}
    />
  );
}
