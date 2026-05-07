import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserTier = "free" | "plus";

export function useUserTier() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["user_tier", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role);
      return {
        tier: (roles.includes("plus") ? "plus" : "free") as UserTier,
        isSuperuser: roles.includes("superuser"),
      };
    },
  });
  return {
    tier: query.data?.tier ?? "free",
    isPlus: query.data?.tier === "plus",
    isSuperuser: query.data?.isSuperuser ?? false,
    isLoading: query.isLoading,
  };
}