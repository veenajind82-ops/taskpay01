import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useProfile } from "@/lib/profile";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — TaskPay" },
      { name: "description", content: "Your TaskPay wallet balance, earnings, and payouts." },
      { property: "og:title", content: "Wallet — TaskPay" },
      { property: "og:description", content: "Balance, earnings, and payouts." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { profile } = useProfile();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-sm text-muted-foreground">Your balance and earnings.</p>
        </div>
      </div>
      <Card className="p-6 gradient-primary shadow-glow border-0">
        <div className="text-xs uppercase tracking-wider text-primary-foreground/80 font-medium">Available Balance</div>
        <div className="text-4xl font-bold mt-2 text-primary-foreground">₹{(profile?.wallet_balance ?? 0).toFixed(2)}</div>
        <div className="text-xs text-primary-foreground/80 mt-2">Earned today: ₹{(profile?.earned_today ?? 0).toFixed(2)}</div>
      </Card>
      <Card className="p-6 gradient-card border-border/60 shadow-card text-center">
        <p className="text-muted-foreground text-sm">No transactions yet.</p>
      </Card>
    </div>
  );
}
