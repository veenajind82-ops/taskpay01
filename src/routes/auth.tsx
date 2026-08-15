import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet, Phone, Lock, User, Loader2 } from "lucide-react";

const REGISTRATION_WEBHOOK_URL =
  "https://hook.eu1.make.com/nc4ypuywcjymq851fskrbeff9gqt7lf4";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TaskPay" },
      { name: "description", content: "Sign in or create your TaskPay account with your mobile number." },
      { property: "og:title", content: "Sign in — TaskPay" },
      { property: "og:description", content: "Sign in or create your TaskPay account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Your registration has been completed successfully.");

  // sign-in state
  const [siPhone, setSiPhone] = useState("");
  const [siPass, setSiPass] = useState("");

  // sign-up state
  const [suPhone, setSuPhone] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suName, setSuName] = useState("");


  function validPhone(p: string) {
    return /^\d{10}$/.test(p.replace(/\D/g, ""));
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!validPhone(siPhone)) return toast.error("Enter a valid 10-digit mobile number");
    if (siPass.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(siPhone),
      password: siPass,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!validPhone(suPhone)) return toast.error("Enter a valid 10-digit mobile number");
    if (suPass.length < 6) return toast.error("Password must be at least 6 characters");
    if (!suName.trim()) return toast.error("Username is required");
    setLoading(true);
    const digits = suPhone.replace(/\D/g, "").slice(-10);
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(suPhone),
      password: suPass,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          phone: `+91${digits}`,
          username: suName.trim(),
        },
      },
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    // Notify the registration webhook (Make.com)
    try {
      const res = await fetch(REGISTRATION_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+91${digits}`,
          userId: data.user?.id ?? null,
        }),
      });

      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
      const result = (payload ?? {}) as {
        success?: boolean;
        status?: string;
        message?: string;
        error?: string;
      };
      const ok =
        res.ok &&
        result.success === true &&
        result.status !== "error" &&
        !result.error;

      if (ok) {
        setSuccessMessage(result.message ?? "Your registration has been completed successfully.");
        setSuccessOpen(true);
        toast.success("Registration successful");
      } else {
        setLoading(false);
        toast.error(
          result.message ?? result.error ?? `Registration webhook failed (${res.status})`,
        );
      }
    } catch {
      setLoading(false);
      toast.error("Could not reach the registration service");
    }
  }

  function handleSuccessContinue() {
    setSuccessOpen(false);
    navigate({ to: "/dashboard", replace: true });
  }


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary shadow-glow flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">TaskPay</h1>
          <p className="text-sm text-muted-foreground mt-1">by PayMSGPro</p>
        </div>

        <Card className="p-6 shadow-card">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-phone">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-md border bg-muted text-sm">+91</div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="si-phone"
                        className="pl-9"
                        placeholder="10-digit mobile"
                        inputMode="numeric"
                        maxLength={10}
                        value={siPhone}
                        onChange={(e) => setSiPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="si-pass"
                      className="pl-9"
                      type="password"
                      placeholder="Your password"
                      value={siPass}
                      onChange={(e) => setSiPass(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-glow" disabled={loading}>
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-phone">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-md border bg-muted text-sm">+91</div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="su-phone"
                        className="pl-9"
                        placeholder="10-digit mobile"
                        inputMode="numeric"
                        maxLength={10}
                        value={suPhone}
                        onChange={(e) => setSuPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-name">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="su-name" className="pl-9" placeholder="Your name" value={suName} onChange={(e) => setSuName(e.target.value)} maxLength={40} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pass">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="su-pass" className="pl-9" type="password" placeholder="Min 6 characters" value={suPass} onChange={(e) => setSuPass(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your invitation code is generated automatically after signup.
                </p>

                <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-glow" disabled={loading}>
                  {loading ? "Creating account…" : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing you agree to TaskPay's Terms & Privacy.
        </p>
      </div>
    </div>
  );
}
