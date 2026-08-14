import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  phone: string;
  username: string;
  invitation_code: string;
  invite_code: string | null;
  referred_by: string | null;

  wallet_balance: number;
  earned_today: number;
  total_sms_sent: number;
  active_whatsapp: number;
};

export function phoneToEmail(phone: string) {
  // strip any non-digits, keep last 10
  const digits = phone.replace(/\D/g, "").slice(-10);
  return `plus91${digits}@taskpay.app`;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (mounted) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles" as never)
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (mounted) {
        setProfile((data as Profile | null) ?? null);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { profile, loading };
}
