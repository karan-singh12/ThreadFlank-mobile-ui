import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { queryKeys } from "@/lib/queryKeys";
import { discoverApi, type ApiBrandStory } from "./api";
import { mapApiBrand, mapApiPost, type Brand } from "./model";

export type StoryGroup = { brandId: string; brand: ApiBrandStory["brand"]; stories: ApiBrandStory[] };

export function useBrands() {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.brands(token),
    queryFn: async () => (await discoverApi.listBrands(token)).map(mapApiBrand),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });
}

/** Feed posts for a category and (optionally) one brand. */
export function usePosts(category: string, brandId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.posts(token, category), brandId],
    queryFn: async () => {
      const res = await discoverApi.listBrandPosts(token, {
        category: category === "All" ? undefined : category,
        brandId: brandId === "all" ? undefined : brandId,
      });
      return { posts: res.posts.map(mapApiPost), raw: res.posts };
    },
    enabled: Boolean(token),
  });
}

/** Active brand stories, with brand rings (unseen first) and view recording. */
export function useStories(brands: Brand[]) {
  const { token } = useAuth();
  const client = useQueryClient();
  const key = queryKeys.stories(token);
  const query = useQuery({ queryKey: key, queryFn: () => discoverApi.listBrandStories(token), enabled: Boolean(token) });
  const stories = useMemo(() => query.data ?? [], [query.data]);

  const brandsWithStories = useMemo(() => {
    const has = new Set(stories.map((s) => s.brandId));
    const unseen = new Set(stories.filter((s) => !s.viewed).map((s) => s.brandId));
    return brands.map((b) => ({ ...b, hasStory: has.has(b.id), hasNewStory: unseen.has(b.id) }));
  }, [brands, stories]);

  /** Story groups in carousel order, brands with unseen stories first (as Instagram does). */
  const groups = useMemo<StoryGroup[]>(() => {
    const map = new Map<string, StoryGroup>();
    for (const s of stories) {
      const g = map.get(s.brandId) ?? { brandId: s.brandId, brand: s.brand, stories: [] };
      g.stories.push(s);
      map.set(s.brandId, g);
    }
    const order = new Map(brands.map((b, i) => [b.id, i]));
    const unseen = (g: StoryGroup) => (g.stories.some((s) => !s.viewed) ? 0 : 1);
    return [...map.values()].sort((a, b) => unseen(a) - unseen(b) || (order.get(a.brandId) ?? 999) - (order.get(b.brandId) ?? 999));
  }, [stories, brands]);

  const recorded = useRef(new Set<string>());
  const markSeen = useCallback(
    (seen: ApiBrandStory) => {
      if (seen.viewed || recorded.current.has(seen.id)) return;
      recorded.current.add(seen.id);
      client.setQueryData<ApiBrandStory[]>(key, (list) => list?.map((s) => (s.id === seen.id ? { ...s, viewed: true } : s)));
      if (token) void discoverApi.recordStoryView(token, seen.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, token]
  );

  return { brandsWithStories, groups, markSeen, refetch: query.refetch };
}
