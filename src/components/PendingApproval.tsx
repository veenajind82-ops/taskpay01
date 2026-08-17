import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, LogOut } from "lucide-react";

function remaining(createdAt: string) {
  const end = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
  return Math.max(0, end - Date.now());
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function PendingApproval({
  createdAt,
  phone,
  rejected,
  onSignOut,
}: {
  createdAt: string;
  phone: string;
  rejected?: boolean;
  onSignOut: () => void;
}) {
  const [ms, setMs] = useState(() => remaining(createdAt));

  useEffect(() => {
    const id = setInterval(() => setMs(remaining(createdAt)), 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 gradient-card border-border/60 shadow-card text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-warning/15 text-warning flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {rejected ? "Registration not approved" : "Registration under review"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {rejected
              ? "Your registration request was not approved. Please contact support for assistance."
              : "Your registration request is under review. Account will be activated within 24 hours once verified."}
          </p>
        </div>

        {!rejected && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Time remaining
            </div>
            <div className="font-mono text-3xl font-bold text-primary mt-2 tracking-tight">
              {pad(h)}:{pad(m)}:{pad(s)}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Registered number: <span className="text-foreground font-medium">+91 {phone.replace(/\D/g, "").slice(-10)}</span>
          <div className="mt-1">
            Status: <span className="font-semibold text-warning">{rejected ? "rejected" : "pending_approval"}</span>
          </div>
          <div className="mt-1">Invitation code will be assigned by the admin on approval.</div>
        </div>

        <Button variant="secondary" className="w-full gap-1.5" onClick={onSignOut}>
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </Card>
    </div>
  );
}
