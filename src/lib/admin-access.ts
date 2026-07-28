import { useProfile } from "@/lib/profile";

export const MASTER_ADMIN_PHONE = "8307796711";
export const SMS_RATE = 1;

export function last10(phone?: string | null) {
  return (phone ?? "").replace(/\D/g, "").slice(-10);
}

/** Returns true only for the master admin phone, null while loading. */
export function useIsMasterAdmin(): boolean | null {
  const { profile, loading } = useProfile();
  if (loading) return null;
  return last10(profile?.phone) === MASTER_ADMIN_PHONE;
}
