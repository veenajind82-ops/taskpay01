import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Copy, Upload, MessageCircle, Image as ImageIcon, Send, Camera, KeyRound, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/profile";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PER_DAY = 50;
const CAMPAIGN_TEXT =
  "Hi! Earn daily rewards by completing simple tasks on TaskPay. Join here and start earning today 👉 https://taskpay.app";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp Task Hub — TaskPay" },
      { name: "description", content: "Send WhatsApp campaign messages, submit double-tick proof, and earn ₹1 per delivered message." },
      { property: "og:title", content: "WhatsApp Task Hub — TaskPay" },
      { property: "og:description", content: "Earn ₹1 per delivered WhatsApp message, up to 50 per day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhatsappPage,
});

function WhatsappPage() {
  const { profile } = useProfile();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [delivered, setDelivered] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function copyText() {
    navigator.clipboard.writeText(CAMPAIGN_TEXT);
    toast.success("Campaign text copied");
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      toast.error("Only PNG or JPG allowed");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Max file size is 8MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    const count = Number(delivered);
    if (!file) return toast.error("Please attach a screenshot");
    if (!Number.isInteger(count) || count < 1) return toast.error("Enter a valid delivered messages count");
    if (count > MAX_PER_DAY) return toast.error(`Daily limit is ${MAX_PER_DAY} messages`);

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");

      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("whatsapp-proofs")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { data: signed } = await supabase.storage
        .from("whatsapp-proofs")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const screenshotUrl = signed?.signedUrl ?? path;

      const { error: insErr } = await supabase.from("whatsapp_submissions" as never).insert({
        user_id: user.id,
        phone: profile?.phone ?? "",
        screenshot_url: screenshotUrl,
        delivered_count: count,
        status: "Pending",
      } as never);
      if (insErr) throw insErr;

      toast.success("WhatsApp proof submitted. Status: Pending");
      setFile(null);
      setPreview(null);
      setDelivered("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Tasks</h1>
          <p className="text-sm text-muted-foreground">Send, screenshot, submit — get paid per delivery.</p>
        </div>
      </div>

      {/* Safety notice */}
      <Card className="p-4 border-warning/40 bg-warning/10 shadow-card">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-warning mb-1">Earning &amp; Safety Limit</div>
            <p className="text-foreground/90 leading-relaxed">
              Earn <span className="font-semibold">₹1 per double-tick</span> (delivered message), up to a maximum of{" "}
              <span className="font-semibold">50 messages per day</span>. Sending more may get your number flagged.
            </p>
          </div>
        </div>
      </Card>

      {/* Steps */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Execution Guide</h2>
        <div className="space-y-3">
          <Card className="p-4 gradient-card border-border/60 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">1</div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="font-semibold">Copy the campaign text</div>
                  <p className="text-xs text-muted-foreground">Use this exact message — edits may void your proof.</p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground/90 leading-relaxed">
                  {CAMPAIGN_TEXT}
                </div>
                <Button size="sm" variant="secondary" className="gap-1.5" onClick={copyText}>
                  <Copy className="w-4 h-4" /> Copy Text
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 gradient-card border-border/60 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">2</div>
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  <Send className="w-4 h-4 text-success" /> Send on WhatsApp
                </div>
                <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                  Paste and send the message to your contacts — one by one, up to 50 per day.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 gradient-card border-border/60 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">3</div>
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-success" /> Screenshot the double-ticks
                </div>
                <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                  Take a fresh screenshot clearly showing the{" "}
                  <span className="font-semibold">grey double-ticks (delivered)</span> on your sent messages.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Proof submission */}
      <Card className="p-4 gradient-card border-border/60 shadow-card space-y-4">
        <div>
          <div className="font-semibold">Submit Your Proof</div>
          <p className="text-xs text-muted-foreground">PNG or JPG, up to 8MB. Reviewed by admin before payout.</p>
        </div>

        <label className="block cursor-pointer">
          <Input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={onPick} className="hidden" />
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-background/30">
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="WhatsApp proof preview" className="max-h-56 mx-auto rounded-lg object-contain" />
                <div className="text-xs text-muted-foreground truncate">{file?.name}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="w-8 h-8" />
                <div className="text-sm font-medium text-foreground">Tap to select screenshot</div>
                <div className="text-xs">PNG or JPG · Max 8MB</div>
              </div>
            )}
          </div>
        </label>

        <div className="space-y-2">
          <Label htmlFor="delivered">Delivered Messages Count</Label>
          <Input
            id="delivered"
            inputMode="numeric"
            placeholder={`e.g. 25 (max ${MAX_PER_DAY})`}
            value={delivered}
            onChange={(e) => setDelivered(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
          <p className="text-xs text-muted-foreground">
            Estimated earning: <span className="text-primary font-semibold">₹{Math.min(Number(delivered) || 0, MAX_PER_DAY).toFixed(2)}</span>
          </p>
        </div>

        <Button onClick={submit} disabled={!file || !delivered || submitting} className="w-full gap-2">
          <Upload className="w-4 h-4" />
          {submitting ? "Submitting…" : "Submit WhatsApp Proof"}
        </Button>
      </Card>
    </div>
  );
}
