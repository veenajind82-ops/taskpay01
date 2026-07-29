import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, MessageCircle, Smartphone, PlayCircle, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TUTORIAL_URL = "https://www.youtube.com/results?search_query=whatsapp+device+binding+tutorial";

type Binding = {
  id: string;
  user_phone: string;
  status: string;
  binding_code: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp Task Hub — TaskPay" },
      {
        name: "description",
        content: "Manage linked WhatsApp numbers and their live task runtime on TaskPay.",
      },
      { property: "og:title", content: "WhatsApp Task Hub — TaskPay" },
      {
        property: "og:description",
        content: "Manage linked WhatsApp numbers and their live task runtime.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhatsappPage,
});

function WhatsappPage() {
  const [initiated, setInitiated] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadBindings(uid: string) {
    const { data } = await supabase
      .from("whatsapp_bindings")
      .select("id,user_phone,status,binding_code,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setBindings((data as Binding[] | null) ?? []);
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !mounted) return;
      setUserId(uid);
      await loadBindings(uid);

      channel = supabase
        .channel("whatsapp_bindings_user")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "whatsapp_bindings", filter: `user_id=eq.${uid}` },
          () => {
            loadBindings(uid);
          },
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const activeBinding = bindings[0] ?? null;
  const codeReady = activeBinding?.status === "CODE_SENT" && !!activeBinding.binding_code;

  function copyCode() {
    if (!activeBinding?.binding_code) return;
    navigator.clipboard.writeText(activeBinding.binding_code);
    toast.success("Verification code copied");
  }

  async function submitBinding() {
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      toast.error("Enter a valid 10-digit WhatsApp number");
      return;
    }
    if (!userId) {
      toast.error("Please sign in again");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("whatsapp_bindings").insert({
      user_id: userId,
      user_phone: `+91${digits}`,
      status: "PENDING",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPhone("");
    setInitiated(true);
    toast.success("Submitted for device binding");
    loadBindings(userId);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Task Hub</h1>
          <p className="text-sm text-muted-foreground">
            Manage linked WhatsApp numbers and their live task runtime.
          </p>
        </div>
      </div>

      <Card className="p-4 border-success/40 bg-success/10 shadow-card">
        <div className="text-sm font-semibold text-success">Rate: ₹1 per double-tick message</div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          You earn ₹1 for every delivered (double-tick) WhatsApp message approved by admin.
        </p>
      </Card>

      <Button
        className="w-full gap-2"
        onClick={() => {
          setInitiated(true);
          toast.success("Enter your WhatsApp number below to start binding");
        }}
      >
        <Plus className="w-4 h-4" /> Start WhatsApp Task Initiation
      </Button>

      {/* Device binding request */}
      <Card className="p-4 gradient-card border-border/60 shadow-card space-y-3">
        <div className="font-semibold">Device binding request</div>
        <Input
          inputMode="numeric"
          placeholder="Enter WhatsApp Phone Number (+91)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button
          className="w-full bg-success text-success-foreground hover:bg-success/90"
          onClick={submitBinding}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for Device Binding"}
        </Button>

        {activeBinding && !codeReady && (
          <p className="text-sm text-muted-foreground">Waiting for verification code...</p>
        )}
        {codeReady && (
          <p className="text-sm text-success font-medium">
            Verification code received — follow the binding guide below.
          </p>
        )}
      </Card>

      {/* Linked accounts */}
      <Card className="p-4 gradient-card border-border/60 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          <div className="font-semibold">Linked accounts</div>
        </div>
        {bindings.length === 0 ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            No numbers linked yet. Click &apos;Start WhatsApp Task Initiation&apos; to add one
          </p>
        ) : (
          <div className="space-y-2">
            {bindings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <span className="font-medium">{b.user_phone}</span>
                <span className="text-xs text-muted-foreground">{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Binding guide — only after code is sent */}
      {codeReady && (
        <Card
          className={`p-4 gradient-card border-border/60 shadow-card space-y-4 ${
            initiated ? "ring-1 ring-primary/40" : ""
          }`}
        >
          <div className="font-semibold">1. WhatsApp Device Binding Guide</div>

          <div className="space-y-3">
            <Step n={1} text="Open the official WhatsApp notification" />
            <Step n={2} text="Approve device connection" />
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="flex-1 space-y-3">
                <div className="text-sm font-medium">Enter the system verification code</div>
                <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                  <span className="font-mono font-bold tracking-[0.2em] text-lg text-primary">
                    {activeBinding?.binding_code}
                  </span>
                  <Button size="sm" variant="secondary" className="ml-auto gap-1.5" onClick={copyCode}>
                    <Copy className="w-4 h-4" /> Copy Code
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <a href={TUTORIAL_URL} target="_blank" rel="noreferrer" className="block">
            <Button variant="secondary" className="w-full gap-2">
              <PlayCircle className="w-4 h-4" /> Watch WhatsApp binding tutorial
            </Button>
          </a>
        </Card>
      )}
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </div>
      <div className="text-sm font-medium pt-1">{text}</div>
    </div>
  );
}
