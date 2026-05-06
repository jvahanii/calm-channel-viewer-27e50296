import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserTier = "free" | "plus";

export function useUserTier() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["user_tier", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserTier> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data?.some((r) => r.role === "plus") ? "plus" : "free";
    },
  });
  return {
    tier: query.data ?? "free",
    isPlus: query.data === "plus",
    isLoading: query.isLoading,
  };
}