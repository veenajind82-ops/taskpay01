import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/lib/role";

export const Route = createFileRoute("/_authenticated/admin-secret-access")({
  head: () => ({
    meta: [
      { title: "Admin — TaskPay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSecretPage,
});

function AdminSecretPage() {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [isAdmin, navigate]);

  if (isAdmin !== true) {
    return (
      <Card className="p-8 gradient-card border-border/60 text-center shadow-card">
        <p className="text-muted-foreground text-sm">Verifying access…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin (Secret Access)</h1>
          <p className="text-sm text-muted-foreground">Restricted admin controls.</p>
        </div>
      </div>
      <Card className="p-8 gradient-card border-border/60 shadow-card">
        <p className="text-muted-foreground text-sm">Welcome, admin.</p>
      </Card>
    </div>
  );
}
