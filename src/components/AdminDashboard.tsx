import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RadioTower,
  Clock,
  Phone,
  Banknote,
} from "lucide-react";
import { SMS_RATE, WHATSAPP_RATE } from "@/lib/admin-access";

type SmsSubmission = {
  id: string;
  user_id: string;
  phone: string;
  screenshot_url: string;
  message_count: number;
  status: string;
  created_at: string;
};

type WhatsappSubmission = {
  id: string;
  user_id: string;
  phone: string;
  screenshot_url: string;
  delivered_count: number;
  status: string;
  created_at: string;
};

type WithdrawalRequest = {
  id: string;
  user_id: string;
  phone: string;
  amount: number;
  upi_id: string;
  account_name: string;
  status: string;
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
  const [sms, setSms] = useState<SmsSubmission[]>([]);
  const [wa, setWa] = useState<WhatsappSubmission[]>([]);
  const [wd, setWd] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [smsRes, waRes, wdRes] = await Promise.all([
      supabase
        .from("sms_submissions" as never)
        .select("*")
        .eq("status", "Pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("whatsapp_submissions" as never)
        .select("*")
        .eq("status", "Pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("withdrawal_requests" as never)
        .select("*")
        .eq("status", "Pending")
        .order("created_at", { ascending: false }),
    ]);
    const err = smsRes.error || waRes.error || wdRes.error;
    if (err) toast.error(err.message);
    setSms((smsRes.data as unknown as SmsSubmission[]) ?? []);
    setWa((waRes.data as unknown as WhatsappSubmission[]) ?? []);
    setWd((wdRes.data as unknown as WithdrawalRequest[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-approval-queues")
      .on("postgres_changes", { event: "*", schema: "public", table: "sms_submissions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_submissions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawal_requests" }, load)
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
    load();
  }

  const total = sms.length + wa.length + wd.length;

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
          PENDING REQUESTS {total}
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

      <Tabs defaultValue="sms" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sms" className="text-xs">
            SMS ({sms.length})
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs">
            WhatsApp ({wa.length})
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-xs">
            Withdrawals ({wd.length})
          </TabsTrigger>
        </TabsList>

        {/* SMS queue */}
        <TabsContent value="sms" className="space-y-3 mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live SMS Submissions
          </h2>
          {loading ? (
            <Empty label="Loading submissions…" />
          ) : sms.length === 0 ? (
            <Empty label="No pending SMS submissions right now." />
          ) : (
            sms.map((row) => (
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
                    onClick={() =>
                      run(
                        row.id,
                        "approve_sms_submission",
                        { _submission_id: row.id, _rate: SMS_RATE },
                        `Approved — ₹${(row.message_count * SMS_RATE).toFixed(2)} credited`,
                      )
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve &amp; Mark Success
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    disabled={busyId === row.id}
                    onClick={() =>
                      run(row.id, "reject_sms_submission", { _submission_id: row.id }, "Submission rejected")
                    }
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* WhatsApp queue */}
        <TabsContent value="whatsapp" className="space-y-3 mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live WhatsApp Submissions
          </h2>
          {loading ? (
            <Empty label="Loading submissions…" />
          ) : wa.length === 0 ? (
            <Empty label="No pending WhatsApp submissions right now." />
          ) : (
            wa.map((row) => (
              <Card key={row.id} className="p-4 gradient-card border-border/60 shadow-card space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-success" /> +91 {row.phone || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {row.delivered_count} double-ticks
                  </Badge>
                </div>

                <img
                  src={row.screenshot_url}
                  alt={`WhatsApp delivery proof from +91 ${row.phone}`}
                  loading="lazy"
                  className="max-h-64 w-full object-contain rounded-lg border border-border bg-background/40"
                />

                <div className="text-xs text-muted-foreground">
                  Payout on approval:{" "}
                  <span className="text-success font-semibold">
                    ₹{(row.delivered_count * WHATSAPP_RATE).toFixed(2)}
                  </span>{" "}
                  ({row.delivered_count} × ₹{WHATSAPP_RATE.toFixed(2)})
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5"
                    disabled={busyId === row.id}
                    onClick={() =>
                      run(
                        row.id,
                        "approve_whatsapp_submission",
                        { _submission_id: row.id, _rate: WHATSAPP_RATE },
                        `Approved — ₹${(row.delivered_count * WHATSAPP_RATE).toFixed(2)} credited`,
                      )
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve &amp; Credit
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    disabled={busyId === row.id}
                    onClick={() =>
                      run(
                        row.id,
                        "reject_whatsapp_submission",
                        { _submission_id: row.id },
                        "Submission rejected",
                      )
                    }
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Withdrawals queue */}
        <TabsContent value="withdrawals" className="space-y-3 mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Withdrawal Requests
          </h2>
          {loading ? (
            <Empty label="Loading requests…" />
          ) : wd.length === 0 ? (
            <Empty label="No pending withdrawal requests right now." />
          ) : (
            wd.map((row) => (
              <Card key={row.id} className="p-4 gradient-card border-border/60 shadow-card space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-primary" /> +91 {row.phone || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                  <Badge className="ml-auto text-xs gap-1">
                    <Banknote className="w-3.5 h-3.5" /> ₹{Number(row.amount).toFixed(2)}
                  </Badge>
                </div>

                <div className="rounded-lg border border-border bg-background/40 p-3 text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">UPI ID: </span>
                    <span className="font-mono font-semibold">{row.upi_id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account name: </span>
                    <span className="font-semibold">{row.account_name}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Pay this user manually via UPI, then mark the request as paid. Rejecting returns the
                  held amount to their wallet.
                </p>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5"
                    disabled={busyId === row.id}
                    onClick={() =>
                      run(row.id, "approve_withdrawal", { _request_id: row.id }, "Withdrawal marked as paid")
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve &amp; Mark Paid
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    disabled={busyId === row.id}
                    onClick={() =>
                      run(
                        row.id,
                        "reject_withdrawal",
                        { _request_id: row.id, _note: null },
                        "Withdrawal rejected and refunded",
                      )
                    }
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
