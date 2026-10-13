import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type CircleMemberRow, type ProfileMemberInput } from "@/features/social/api";
import { queryKeys } from "@/lib/queryKeys";
import { workspaceApi, type Look, type TwinInput, type WardrobeItem } from "./api";

/** A circle member as the UI sees it (managed profile or linked friend). */
export type CircleMember = {
  id: string;
  kind: "PROFILE" | "USER";
  status: "INVITED" | "ACTIVE" | "DECLINED";
  userId?: string;
  name: string;
  relation: string;
  gender: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  skinTone?: string;
  /** Source photo of the real person (relative upload path); resolve with `assetUrl`. */
  photo?: string;
  /** Generated full-body persistent twin. */
  twin?: string;
  avatar?: string | null;
};

/** Anyone an outfit can be draped on: you, or a circle member. */
export type Person = {
  id: string;
  name: string;
  relation: string;
  isSelf: boolean;
  gender?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  skinTone?: string;
  photo?: string;
  twin?: string;
};

export const SELF_ID = "me";

/** The person's selfie: Drape renders them from it (face) plus their body details. */
export const baseImage = (p?: Person) => p?.photo;

const toMember = (m: CircleMemberRow): CircleMember => ({
  id: m.id,
  kind: m.kind,
  status: m.status,
  userId: m.userId ?? undefined,
  name: m.name,
  relation: m.relation ?? (m.kind === "USER" ? "Friend" : "Family"),
  gender: m.gender ?? "",
  age: m.age ?? undefined,
  heightCm: m.heightCm ?? undefined,
  weightKg: m.weightKg ?? undefined,
  skinTone: m.skinTone ?? undefined,
  photo: m.photo ?? undefined,
  twin: m.twin ?? undefined,
  avatar: m.user?.avatar ?? null,
});

function useTokenOrNull() {
  return useAuth().token;
}

export function useWardrobe() {
  const token = useTokenOrNull();
  return useQuery({ queryKey: queryKeys.wardrobe(token), queryFn: () => workspaceApi.listWardrobe(token!), enabled: Boolean(token) });
}

export function useLooks() {
  const token = useTokenOrNull();
  return useQuery({ queryKey: queryKeys.looks(token), queryFn: () => workspaceApi.listLooks(token!), enabled: Boolean(token) });
}

export function useTwin() {
  const token = useTokenOrNull();
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.twin(token), queryFn: () => workspaceApi.getTwin(token!), enabled: Boolean(token) });
  const save = useMutation({
    mutationFn: (input: TwinInput) => workspaceApi.saveTwin(token!, input),
    onSuccess: (next) => client.setQueryData(queryKeys.twin(token), next),
  });
  return { twin: query.data ?? null, loading: query.isLoading, refetch: query.refetch, save: save.mutateAsync, saving: save.isPending };
}

export function useScenes() {
  return useQuery({ queryKey: queryKeys.scenes, queryFn: workspaceApi.scenes, staleTime: 5 * 60_000 });
}

/** Patch a cached list after a mutation without refetching. */
export function useListCache<T extends { id: string }>(key: readonly unknown[]) {
  const client = useQueryClient();
  return useMemo(
    () => ({
      upsert: (item: T) =>
        client.setQueryData<T[]>(key, (list = []) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list])),
      remove: (id: string) => client.setQueryData<T[]>(key, (list = []) => list.filter((x) => x.id !== id)),
      set: (updater: (list: T[]) => T[]) => client.setQueryData<T[]>(key, (list = []) => updater(list)),
      invalidate: () => client.invalidateQueries({ queryKey: key }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, JSON.stringify(key)]
  );
}

export const useWardrobeCache = () => useListCache<WardrobeItem>(queryKeys.wardrobe(useTokenOrNull()));
export const useLooksCache = () => useListCache<Look>(queryKeys.looks(useTokenOrNull()));

/** Your Twin Circle (members you manage + circles you belong to), with mutations that refresh it. */
export function useCircle() {
  const token = useTokenOrNull();
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.circle(token), queryFn: () => socialApi.circle(token!), enabled: Boolean(token) });
  const members = useMemo(() => (query.data?.circle.members ?? []).map(toMember), [query.data]);

  const run = async <T,>(fn: (t: string) => Promise<T>) => {
    if (!token) throw new Error("Not signed in");
    const result = await fn(token);
    await client.invalidateQueries({ queryKey: queryKeys.circle(token) });
    return result;
  };

  return {
    state: query.data ?? null,
    members,
    limit: query.data?.circle.limit ?? 5,
    memberships: query.data?.memberships ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addProfile: (input: ProfileMemberInput) => run((t) => socialApi.addProfile(t, input)),
    updateMember: (id: string, input: ProfileMemberInput) => run((t) => socialApi.updateMember(t, id, input)),
    removeMember: (id: string) => run((t) => socialApi.removeMember(t, id)),
    invite: (userId: string, relation?: string) => run((t) => socialApi.invite(t, userId, relation)),
    respondInvite: (memberId: string, accept: boolean) => run((t) => socialApi.respondInvite(t, memberId, accept)),
    leave: (circleId: string) => run((t) => socialApi.leaveCircle(t, circleId)),
  };
}

/** You first, then your active circle members, in one list for pickers. */
export function usePeople() {
  const { user } = useAuth();
  const { twin, loading } = useTwin();
  const { members, loading: circleLoading } = useCircle();

  const people = useMemo<Person[]>(() => {
    const self: Person = {
      id: SELF_ID,
      name: user?.username || user?.email.split("@")[0] || "You",
      relation: "You",
      isSelf: true,
      gender: twin?.gender ?? undefined,
      age: twin?.age ?? undefined,
      heightCm: twin?.heightCm ?? undefined,
      weightKg: twin?.weightKg ?? undefined,
      skinTone: twin?.skinTone ?? undefined,
      photo: twin?.selfieUrl || undefined,
      twin: twin?.baseAvatarUrl || undefined,
    };
    const active = members.filter((m) => m.status === "ACTIVE");
    return [self, ...active.map((m) => ({ ...m, isSelf: false }))];
  }, [user, twin, members]);

  return { people, loading: loading || circleLoading };
}
