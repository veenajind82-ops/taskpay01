import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, MessageCircle, Smartphone, PlayCircle, Plus } from "lucide-react";
import { toast } from "sonner";

const VERIFICATION_CODE = "AAAA-AAAA";
const TUTORIAL_URL = "https://www.youtube.com/results?search_query=whatsapp+device+binding+tutorial";

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

  function copyCode() {
    navigator.clipboard.writeText(VERIFICATION_CODE);
    toast.success("Verification code copied");
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

      <Button
        className="w-full gap-2"
        onClick={() => {
          setInitiated(true);
          toast.success("Follow the binding guide below to link your number");
        }}
      >
        <Plus className="w-4 h-4" /> Start WhatsApp Task Initiation
      </Button>

      {/* Linked accounts */}
      <Card className="p-4 gradient-card border-border/60 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          <div className="font-semibold">Linked accounts</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          No numbers linked yet. Click &apos;Start WhatsApp Task Initiation&apos; to add one
        </p>
      </Card>

      {/* Binding guide */}
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
                  {VERIFICATION_CODE}
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
