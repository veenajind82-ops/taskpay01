import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Download, Copy, Upload, MessageSquare, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/profile";

const APK_URL = "https://drive.google.com/uc?export=download&id=1GT-Y3ruagZPW-PuhGusThwQlVSAs_YuY";
const WINSMS_URL = "https://drive.google.com/uc?export=download&id=1GT-Y3ruagZPW-PuhGusThwQlVSAs_YuY";
const INVITE_CODE = "tt2sFPY0";
const MAX_BYTES = 8 * 1024 * 1024;

export const Route = createFileRoute("/_authenticated/sms")({
  head: () => ({
    meta: [
      { title: "SMS Task Hub — TaskPay" },
      { name: "description", content: "Complete SMS tasks and submit proof to earn rewards." },
      { property: "og:title", content: "SMS Task Hub — TaskPay" },
      { property: "og:description", content: "Complete SMS tasks and submit proof to earn rewards." },
    ],
  }),
  component: SmsPage,
});

function SmsPage() {
  const { profile } = useProfile();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function copyInvite() {
    navigator.clipboard.writeText(INVITE_CODE);
    toast.success("Invite code copied");
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
    if (!file) {
      toast.error("Please attach a screenshot");
      return;
    }
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      toast.error("Enter the SMS count shown in the screenshot (1-100)");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");

      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("sms-proofs")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { data: signed } = await supabase.storage
        .from("sms-proofs")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const screenshotUrl = signed?.signedUrl ?? path;

      const { error: insErr } = await supabase.from("sms_submissions" as never).insert({
        user_id: user.id,
        phone: profile?.phone ?? "",
        screenshot_url: screenshotUrl,
        message_count: Number(count),
        status: "Pending",
      } as never);
      if (insErr) throw insErr;

      toast.success("Proof submitted. Status: Pending");
      setFile(null);
      setPreview(null);
      setCount("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMS Task Hub</h1>
          <p className="text-sm text-muted-foreground">Follow the steps, submit proof, get paid.</p>
        </div>
      </div>

      {/* Safety notice */}
      <Card className="p-4 border-warning/40 bg-warning/10 shadow-card">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-warning mb-1">Daily Safety Limit</div>
            <p className="text-foreground/90 leading-relaxed">
              Maximum <span className="font-semibold">100 SMS per SIM network per day</span>. Exceeding this may trigger network throttling and account review.
            </p>
          </div>
        </div>
      </Card>

      {/* Core APK download */}
      <Card className="p-5 gradient-card border-border/60 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Core User App (.APK)</div>
            <div className="text-xs text-muted-foreground">Required to run SMS tasks.</div>
          </div>
          <a href={APK_URL} target="_blank" rel="noreferrer">
            <Button size="sm" className="gap-1.5">
              <Download className="w-4 h-4" /> Download
            </Button>
          </a>
        </div>
      </Card>

      {/* Execution guide */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Execution Guide</h2>
        <div className="space-y-3">
          {/* Step 1 */}
          <Card className="p-4 gradient-card border-border/60 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">1</div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="font-semibold">Open the WinSMS app</div>
                  <p className="text-xs text-muted-foreground">Install and open WinSMS to start sending campaign SMS.</p>
                </div>
                <a href={WINSMS_URL} target="_blank" rel="noreferrer" className="inline-block">
                  <Button size="sm" variant="secondary" className="gap-1.5">
                    <Download className="w-4 h-4" /> Get WinSMS
                  </Button>
                </a>
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Invite Code</span>
                  <span className="font-mono font-semibold text-sm text-primary">{INVITE_CODE}</span>
                  <button onClick={copyInvite} className="ml-auto text-muted-foreground hover:text-primary transition-colors" aria-label="Copy invite code">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="p-4 gradient-card border-border/60 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">2</div>
              <div className="flex-1">
                <div className="font-semibold">Capture proof of usage</div>
                <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                  Switch to your messaging app, find the official company usage SMS
                  (showing <span className="font-semibold">50 or 100 SMS consumed</span>),
                  and take a fresh screenshot.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="p-4 gradient-card border-border/60 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">3</div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="font-semibold">Attach Daily Usage Screenshot</div>
                  <p className="text-xs text-muted-foreground">PNG or JPG, up to 8MB.</p>
                </div>

                <label className="block cursor-pointer">
                  <Input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={onPick}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-background/30">
                    {preview ? (
                      <div className="space-y-3">
                        <img src={preview} alt="Preview" className="max-h-56 mx-auto rounded-lg object-contain" />
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

                <div className="space-y-1.5">
                  <label htmlFor="sms-count" className="text-sm font-medium">
                    SMS consumed count (as shown in screenshot)
                  </label>
                  <Input
                    id="sms-count"
                    inputMode="numeric"
                    placeholder="e.g. 100"
                    value={count}
                    onChange={(e) => setCount(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  />
                </div>

                <Button onClick={submit} disabled={!file || !count || submitting} className="w-full gap-2">
                  <Upload className="w-4 h-4" />
                  {submitting ? "Submitting…" : "Submit Proof to Admin"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
