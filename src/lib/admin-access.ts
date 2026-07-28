import { useProfile } from "@/lib/profile";

export const MASTER_ADMIN_PHONE = "8307796711";
/** ₹0.10 per approved SMS (100 SMS = ₹10). */
export const SMS_RATE = 0.1;
/** ₹1 per delivered double-tick WhatsApp message. */
export const WHATSAPP_RATE = 1;

export function last10(phone?: string | null) {
  return (phone ?? "").replace(/\D/g, "").slice(-10);
}

/** Returns true only for the master admin phone, null while loading. */
export function useIsMasterAdmin(): boolean | null {
  const { profile, loading } = useProfile();
  if (loading) return null;
  return last10(profile?.phone) === MASTER_ADMIN_PHONE;
}
