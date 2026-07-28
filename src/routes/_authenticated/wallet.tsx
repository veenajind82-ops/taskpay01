import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, Banknote, Clock } from "lucide-react";

type WithdrawalRequest = {
  id: string;
  amount: number;
  upi_id: string;
  account_name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const MIN_WITHDRAWAL = 50;

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

function statusTone(status: string) {
  if (status === "Approved") return "text-success";
  if (status === "Rejected") return "text-destructive";
  return "text-warning";
}

function WalletPage() {
  const { profile } = useProfile();
  const [balance, setBalance] = useState<number | null>(null);
  const [rows, setRows] = useState<WithdrawalRequest[]>([]);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const [{ data: p }, { data: w }] = await Promise.all([
      supabase.from("profiles" as never).select("wallet_balance").eq("id", userData.user.id).maybeSingle(),
      supabase
        .from("withdrawal_requests" as never)
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (p) setBalance(Number((p as unknown as { wallet_balance: number }).wallet_balance));
    setRows((w as unknown as WithdrawalRequest[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const available = balance ?? profile?.wallet_balance ?? 0;

  async function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return toast.error("Enter a valid amount");
    if (value < MIN_WITHDRAWAL) return toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL}`);
    if (value > available) return toast.error("Amount exceeds your wallet balance");
    if (!upiId.trim()) return toast.error("Enter your UPI ID");
    if (!accountName.trim()) return toast.error("Enter the account holder name");

    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal" as never, {
      _amount: value,
      _upi_id: upiId.trim(),
      _account_name: accountName.trim(),
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Withdrawal request sent to admin");
    setAmount("");
    load();
  }

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
        <div className="text-xs uppercase tracking-wider text-primary-foreground/80 font-medium">
          Available Balance
        </div>
        <div className="text-4xl font-bold mt-2 text-primary-foreground">₹{available.toFixed(2)}</div>
        <div className="text-xs text-primary-foreground/80 mt-2">
          Earned today: ₹{(profile?.earned_today ?? 0).toFixed(2)}
        </div>
      </Card>

      {/* Withdrawal request */}
      <Card className="p-4 gradient-card border-border/60 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-success" />
          <div className="font-semibold">Request Withdrawal</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Requests are sent to the admin for approval. Once approved, the admin pays you manually on the
          UPI ID below. Minimum withdrawal ₹{MIN_WITHDRAWAL}.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wd-amount">Amount (₹)</Label>
            <Input
              id="wd-amount"
              inputMode="decimal"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wd-upi">UPI ID</Label>
            <Input
              id="wd-upi"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wd-name">Account holder name</Label>
            <Input
              id="wd-name"
              placeholder="Full name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          <Button className="w-full gap-2" disabled={busy} onClick={submit}>
            <Banknote className="w-4 h-4" /> {busy ? "Sending…" : "Request Withdrawal"}
          </Button>
        </div>
      </Card>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Withdrawal History
        </h2>
        {rows.length === 0 ? (
          <Card className="p-6 gradient-card border-border/60 shadow-card text-center">
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          </Card>
        ) : (
          rows.map((row) => (
            <Card key={row.id} className="p-4 gradient-card border-border/60 shadow-card space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="font-semibold">₹{Number(row.amount).toFixed(2)}</span>
                <Badge variant="secondary" className={`ml-auto text-xs ${statusTone(row.status)}`}>
                  {row.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground font-mono">{row.upi_id}</div>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {new Date(row.created_at).toLocaleString()}
              </div>
              {row.admin_note ? (
                <div className="text-xs text-destructive">Note: {row.admin_note}</div>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
