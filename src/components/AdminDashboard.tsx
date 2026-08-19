import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { UserCheck, XCircle, ShieldCheck, RadioTower, Clock, Phone, Banknote } from "lucide-react";

type PendingUser = {
  id: string;
  phone: string;
  username: string;
  status: string;
  invitation_code: string;
  created_at: string;
};

type ActiveUser = {
  id: string;
  phone: string;
  username: string;
  invitation_code: string;
  wallet_balance: number;
  points: number;
  created_at: string;
};

function Empty({ label }: { label: string }) {
  return (
    <Card className="p-8 gradient-card border-border/60 text-center shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

export function AdminDashboard() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [pointsDraft, setPointsDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [usersRes, activeRes] = await Promise.all([
      supabase
        .from("profiles" as never)
        .select("id, phone, username, status, invitation_code, created_at")
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles" as never)
        .select("id, phone, username, invitation_code, wallet_balance, points, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);
    const err = usersRes.error || activeRes.error;
    if (err) toast.error(err.message);
    setUsers((usersRes.data as unknown as PendingUser[]) ?? []);
    const actives = (activeRes.data as unknown as ActiveUser[]) ?? [];
    setActiveUsers(actives);
    setPointsDraft(() => {
      const next: Record<string, string> = {};
      for (const u of actives) next[u.id] = String(u.points ?? 0);
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-approval-queues")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function run(id: string, fn: string, args: Record<string, unknown>, ok: string) {
    setBusyId(id);
    const { error } = await supabase.rpc(fn as never, args as never);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(ok);
    await load();
  }

  async function savePoints(userId: string, points: number) {
    setBusyId(userId);
    const { error } = await supabase.rpc("set_user_points" as never, {
      _user_id: userId,
      _points: points,
    } as never);
    setBusyId(null);
    if (error) return toast.error(error.message);
    // reflect immediately, then re-sync from the database
    setActiveUsers((rows) => rows.map((r) => (r.id === userId ? { ...r, points } : r)));
    toast.success("Balance Updated Successfully!");
    await load();
  }

  function randomCode() {
    let out = "";
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Approve registrations and manage balances.</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          PENDING REQUESTS {users.length}
        </Badge>
      </div>

      <Card className="p-4 gradient-card border-border/60 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/15 text-success flex items-center justify-center">
            <RadioTower className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-sm">REALTIME SYNC</div>
            <div className="text-xs text-success">Enabled</div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="text-xs">
            Pending Registrations ({users.length})
          </TabsTrigger>
          <TabsTrigger value="balances" className="text-xs">
            User Balance Management ({activeUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending registrations */}
        <TabsContent value="users" className="space-y-3 mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Registrations
          </h2>
          {loading ? (
            <Empty label="Loading registrations…" />
          ) : users.length === 0 ? (
            <Empty label="No pending registrations right now." />
          ) : (
            users.map((row) => (
              <Card key={row.id} className="p-4 gradient-card border-border/60 shadow-card space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-primary" /> +91 {row.phone.replace(/\D/g, "").slice(-10)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    pending_approval
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Input
                    className="uppercase font-mono"
                    placeholder="Assign invitation code"
                    maxLength={12}
                    value={codes[row.id] ?? ""}
                    onChange={(e) =>
                      setCodes((c) => ({ ...c, [row.id]: e.target.value.toUpperCase().slice(0, 12) }))
                    }
                  />
                  <Button
                    variant="secondary"
                    className="shrink-0 text-xs"
                    onClick={() => setCodes((c) => ({ ...c, [row.id]: randomCode() }))}
                  >
                    Generate
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5"
                    disabled={busyId === row.id || !(codes[row.id] ?? "").trim()}
                    onClick={() =>
                      run(
                        row.id,
                        "approve_user",
                        { _user_id: row.id, _invitation_code: (codes[row.id] ?? "").trim() },
                        "User approved and activated",
                      )
                    }
                  >
                    <UserCheck className="w-4 h-4" /> Approve &amp; Activate
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    disabled={busyId === row.id}
                    onClick={() => run(row.id, "reject_user", { _user_id: row.id }, "Registration rejected")}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* User balance management */}
        <TabsContent value="balances" className="space-y-3 mt-4">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              User Balance Management
            </h2>
            <span className="text-xs text-muted-foreground">100 points = ₹0.77</span>
          </div>
          {loading ? (
            <Empty label="Loading users…" />
          ) : activeUsers.length === 0 ? (
            <Empty label="No active users yet." />
          ) : (
            activeUsers.map((row) => {
              const draft = pointsDraft[row.id] ?? "";
              const parsed = Number(draft);
              const valid = draft.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;
              return (
                <Card key={row.id} className="p-4 gradient-card border-border/60 shadow-card space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-primary" /> +91 {row.phone.replace(/\D/g, "").slice(-10)}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.username}</span>
                    <span className="font-mono text-xs text-primary">{row.invitation_code}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Wallet ₹{Number(row.wallet_balance ?? 0).toFixed(2)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      className="w-40"
                      inputMode="decimal"
                      placeholder="Points"
                      value={draft}
                      onChange={(e) =>
                        setPointsDraft((d) => ({ ...d, [row.id]: e.target.value.replace(/[^0-9.]/g, "") }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      ≈ ₹{(valid ? (parsed / 100) * 0.77 : 0).toFixed(2)}
                    </span>
                    <Button
                      className="ml-auto gap-1.5"
                      disabled={busyId === row.id || !valid}
                      onClick={() => savePoints(row.id, parsed)}
                    >
                      <Banknote className="w-4 h-4" /> Save Balance
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current points: <span className="text-foreground font-semibold">{row.points ?? 0}</span> (₹
                    {(((row.points ?? 0) / 100) * 0.77).toFixed(2)})
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
