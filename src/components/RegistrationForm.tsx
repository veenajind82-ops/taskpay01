import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw, Loader2, Smartphone, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const GET_CAPTCHA_URL = "https://hook.eu1.make.com/v4s6txyt6lke5lpuco188yezcqsf2y5y";
const REGISTER_URL = "https://hook.eu1.make.com/nc4ypuywcjymq851fskrbeff9gqt7lf4";
const INVITE_CODE = "tt2sFPY0";

export function RegistrationForm() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaSrc, setCaptchaSrc] = useState(GET_CAPTCHA_URL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCaptchaSrc(GET_CAPTCHA_URL);
  }, []);

  const refreshCaptcha = () => {
    setCaptcha("");
    setCaptchaSrc(`${GET_CAPTCHA_URL}?t=${Date.now()}`);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mobileNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!captcha.trim()) {
      toast.error("Please enter the captcha");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobileNumber,
          password,
          captcha: captcha.trim(),
          invite_code: INVITE_CODE,
        }),
      });

      let data: { success?: boolean; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.ok && data.success !== false) {
        toast.success(data.message || "Registration successful");
        setMobileNumber("");
        setPassword("");
        setCaptcha("");
        setShowPassword(false);
        refreshCaptcha();
      } else {
        toast.error(data.message || "Registration failed. Please check the captcha and try again.");
        setCaptcha("");
        refreshCaptcha();
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      setCaptcha("");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background text-foreground">
      <Card className="w-full max-w-md shadow-xl border border-border">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Register with your mobile number and invite code {INVITE_CODE}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
                  +91
                </div>
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="pl-9"
                    value={mobileNumber}
                    onChange={handlePhoneChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div className="space-y-2">
              <Label htmlFor="captcha">Captcha</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="captcha"
                    type="text"
                    placeholder="Enter captcha"
                    className="pl-9"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src={captchaSrc}
                    alt="Captcha"
                    className="h-10 w-28 rounded-md border object-cover bg-white"
                  />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2 rounded-md border hover:bg-muted transition-colors"
                    aria-label="Refresh captcha"
                  >
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Registration…
                </span>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
