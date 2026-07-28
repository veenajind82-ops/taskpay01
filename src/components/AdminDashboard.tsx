import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ShieldCheck, RadioTower, Clock, Phone } from "lucide-react";
import { SMS_RATE } from "@/lib/admin-access";

type Submission = {
  id: string;
  user_id: string;
  phone: string;
  screenshot_url: string;
  message_count: number;
  status: string;
  created_at: string;
};

export function AdminDashboard() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("sms_submissions" as never)
      .select("*")
      .eq("status", "Pending")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data as unknown as Submission[]) ?? []));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-sms-submissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "sms_submissions" }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function approve(row: Submission) {
    setBusyId(row.id);
    const { error } = await supabase.rpc("approve_sms_submission" as never, {
      _submission_id: row.id,
      _rate: SMS_RATE,
    } as never);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Approved — ₹${(row.message_count * SMS_RATE).toFixed(2)} credited`);
    load();
  }

  async function reject(row: Submission) {
    setBusyId(row.id);
    const { error } = await supabase.rpc("reject_sms_submission" as never, {
      _submission_id: row.id,
    } as never);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Submission rejected");
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Review proofs and release earnings.</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          PENDING REQUESTS {rows.length}
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

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Live SMS Submissions
        </h2>

        {loading ? (
          <Card className="p-8 gradient-card border-border/60 text-center shadow-card">
            <p className="text-sm text-muted-foreground">Loading submissions…</p>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="p-8 gradient-card border-border/60 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No pending submissions right now.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id} className="p-4 gradient-card border-border/60 shadow-card space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-primary" /> +91 {row.phone || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {row.message_count} messages
                  </Badge>
                </div>

                <img
                  src={row.screenshot_url}
                  alt={`SMS usage proof from +91 ${row.phone}`}
                  loading="lazy"
                  className="max-h-64 w-full object-contain rounded-lg border border-border bg-background/40"
                />

                <div className="text-xs text-muted-foreground">
                  Payout on approval:{" "}
                  <span className="text-primary font-semibold">
                    ₹{(row.message_count * SMS_RATE).toFixed(2)}
                  </span>{" "}
                  ({row.message_count} × ₹{SMS_RATE.toFixed(2)})
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5"
                    disabled={busyId === row.id}
                    onClick={() => approve(row)}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve &amp; Mark Success
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    disabled={busyId === row.id}
                    onClick={() => reject(row)}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
