import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "user";

/** Current user's role from the user_roles table. null while loading. */
export function useUserRole(): UserRole | null {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (mounted) setRole("user");
        return;
      }
      const { data } = await supabase
        .from("user_roles" as never)
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (mounted) setRole(data ? "admin" : "user");
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return role;
}

export function useIsAdmin() {
  const role = useUserRole();
  return role === null ? null : role === "admin";
}
