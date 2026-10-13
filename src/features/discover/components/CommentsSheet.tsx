import { Send, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { discoverContent as copy } from "@/data/app-content";
import { useAuth } from "@/features/auth/AuthProvider";
import { displayName } from "@/features/auth/types";
import { errorMessage } from "@/lib/api/client";
import { timeAgo } from "@/lib/format";
import { colors, fonts, radius } from "@/theme";
import { discoverApi, toPostComment, type PostComment } from "../api";

type Props = {
  open: boolean;
  onClose: () => void;
  postId: string;
  /** Comments already shown on the card, for an instant first paint. */
  initial: PostComment[];
  /** Keeps the card's preview and count in sync. */
  onChange: (comments: PostComment[], count: number) => void;
  autoFocus?: boolean;
};

/** All comments on a post with an input pinned to the bottom (the web's inline comment list + form). */
export function CommentsSheet({ open, onClose, postId, initial, onChange, autoFocus }: Props) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<PostComment[]>(initial);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true);
    setError("");
    discoverApi
      .listComments(token, postId)
      .then((all) => {
        if (!live) return;
        const mapped = all.map(toPostComment);
        setComments(mapped);
        onChange(mapped, mapped.length);
      })
      .catch((e) => live && setError(errorMessage(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId, token]);

  const update = (next: PostComment[], count = next.length) => {
    setComments(next);
    onChange(next, count);
  };

  const add = async () => {
    const text = draft.trim();
    if (!text || !token) return;
    const tempId = `local-${Date.now()}`;
    const pending: PostComment = { id: tempId, userId: user?.id, author: displayName(user), avatar: user?.avatar, text, pending: true };
    const withPending = [...comments, pending];
    update(withPending);
    setDraft("");
    setError("");
    try {
      const created = toPostComment(await discoverApi.addComment(token, postId, text));
      update(withPending.map((c) => (c.id === tempId ? created : c)));
    } catch (e) {
      update(withPending.filter((c) => c.id !== tempId));
      setDraft(text);
      setError(errorMessage(e));
    }
  };

  const remove = async (comment: PostComment) => {
    if (!token) return;
    const before = comments;
    update(comments.filter((c) => c.id !== comment.id));
    try {
      const res = await discoverApi.deleteComment(token, postId, comment.id);
      onChange(
        before.filter((c) => c.id !== comment.id),
        res.commentsCount
      );
    } catch (e) {
      update(before);
      setError(errorMessage(e));
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Comments"
      full
      maxHeight={0.82}
      footer={
        <View style={styles.inputRow}>
          <Avatar name={displayName(user)} src={user?.avatar} size={32} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            maxLength={500}
            autoFocus={autoFocus}
            placeholder={copy.commentPlaceholder}
            placeholderTextColor={colors.muted}
            selectionColor={colors.accentBright}
            onSubmitEditing={add}
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable onPress={add} disabled={!draft.trim()} hitSlop={8} style={[styles.post, !draft.trim() && styles.disabled]} accessibilityLabel={copy.postButton}>
            <Send size={18} color="#ddd6fe" />
          </Pressable>
        </View>
      }
    >
      {loading && comments.length === 0 ? (
        <ActivityIndicator color={colors.accentBright} style={styles.loader} />
      ) : comments.length === 0 ? (
        <AppText variant="sm" color={colors.muted} align="center" style={styles.empty}>
          No comments yet. Start the conversation.
        </AppText>
      ) : (
        comments.map((c) => {
          const mine = Boolean(user && c.userId === user.id);
          return (
            <View key={c.id} style={[styles.row, c.pending && styles.pending]}>
              <Avatar name={c.author} src={c.avatar} size={30} />
              <View style={styles.body}>
                <AppText variant="sm" color={colors.inkSoft}>
                  <AppText variant="sm" weight="medium">
                    {c.author}{" "}
                  </AppText>
                  {c.text}
                </AppText>
                {c.createdAt && (
                  <AppText variant="micro" color={colors.muted}>
                    {timeAgo(c.createdAt)}
                  </AppText>
                )}
              </View>
              {mine && !c.pending && (
                <Pressable onPress={() => remove(c)} hitSlop={8} accessibilityLabel={copy.deleteComment} style={styles.delete}>
                  <Trash2 size={15} color={colors.muted} />
                </Pressable>
              )}
            </View>
          );
        })
      )}
      {error ? (
        <AppText variant="xs" color="#fda4af">
          {error}
        </AppText>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 24 },
  empty: { marginTop: 24 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  pending: { opacity: 0.6 },
  body: { flex: 1, gap: 2 },
  delete: { padding: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    flex: 1,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.glass,
    paddingHorizontal: 16,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  post: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
});
