import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Campaign = {
  id: string;
  created_by: string;
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  audience: "free" | "all";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "active"],
    queryFn: async (): Promise<Campaign[]> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });
}

export function useAllCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "all"],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });
}