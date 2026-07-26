import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/profile";
import { Copy, User as UserIcon, Wallet, LayoutDashboard, MessageSquare, MessageCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const walletBalance = profile?.wallet_balance ?? 0;
  const inviteCode = profile?.invitation_code ?? "DB1339D2";
  const username = profile?.username ?? "User";

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  function copyCode() {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Invitation code copied");
  }

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/sms", label: "SMS Tasks", icon: MessageSquare },
    { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
    { to: "/wallet", label: "Wallet", icon: Wallet },
    { to: "/admin", label: "Admin", icon: ShieldCheck },
  ] as const;

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg gradient-primary shadow-glow flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight truncate">PayMSGPro</div>
              <div className="text-[10px] text-muted-foreground leading-tight">TaskPay</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">₹{walletBalance.toFixed(2)}</span>
            </div>
            <div className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
              <span className="text-[11px] font-semibold text-primary">₹{walletBalance.toFixed(2)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Invitation Code strip */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex justify-end">
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Your Code</span>
            <span className="font-mono font-semibold text-sm text-primary">{inviteCode}</span>
            <button
              onClick={copyCode}
              className="ml-1 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Copy invitation code"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-4 text-xs text-muted-foreground">
          Hi, <span className="text-foreground font-medium">{username}</span>
        </div>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "drop-shadow-[0_0_6px_var(--color-primary)]" : ""}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* keep unused import out */}
      <div className="hidden">
        <Button />
      </div>
    </div>
  );
}
