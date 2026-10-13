import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { StackHeader } from "@/components/layout/StackHeader";
import { ErrorState, Loader } from "@/components/ui/States";
import { useAuth } from "@/features/auth/AuthProvider";
import { discoverApi } from "@/features/discover/api";
import { PostCard } from "@/features/discover/components/PostCard";
import { brandFromPost, mapApiPost } from "@/features/discover/model";
import { errorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { colors, radius } from "@/theme";

/** One brand post on its own screen (opened from the grid, trending, a share link or a notification). */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const query = useQuery({ queryKey: queryKeys.post(token, id), queryFn: () => discoverApi.getPost(token, id), enabled: Boolean(id) });

  return (
    <Screen header={<StackHeader title={query.data?.brand.name ?? "Post"} />} padded={false} contentStyle={styles.content}>
      {query.isLoading ? (
        <Loader />
      ) : query.isError || !query.data ? (
        <ErrorState message={errorMessage(query.error, "This post isn't available.")} onRetry={() => query.refetch()} style={styles.pad} />
      ) : (
        <View style={styles.card}>
          <PostCard post={mapApiPost(query.data)} brand={brandFromPost(query.data, query.data.brandId)} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingTop: 4 },
  pad: { marginHorizontal: 4 },
  card: { borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, overflow: "hidden", backgroundColor: "rgba(13,12,29,0.6)" },
});
