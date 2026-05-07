import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Subscription = {
  id: string;
  user_id: string;
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string | null;
  created_at: string;
  expires_at: string | null;
  campaign_id: string | null;
};

export function useSubscriptions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["subscriptions", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Subscription[]> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Subscription[];
    },
  });

  const subscribe = useMutation({
    mutationFn: async (input: {
      channelId: string;
      channelTitle: string;
      channelThumbnail?: string | null;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        channel_id: input.channelId,
        channel_title: input.channelTitle,
        channel_thumbnail: input.channelThumbnail ?? null,
      });
      if (error) {
        if (error.message?.includes("Free tier")) {
          throw new Error(
            "You're on Tuubmix Free — only 1 channel allowed. Upgrade to Plus for unlimited subscriptions.",
          );
        }
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", user?.id] }),
  });

  const unsubscribe = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", user?.id] }),
  });

  const isSubscribed = (channelId: string) =>
    !!list.data?.some((s) => s.channel_id === channelId);

  return { list, subscribe, unsubscribe, isSubscribed };
}