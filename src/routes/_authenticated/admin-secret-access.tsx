import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useIsMasterAdmin } from "@/lib/admin-access";
import { AdminDashboard } from "@/components/AdminDashboard";

export const Route = createFileRoute("/_authenticated/admin-secret-access")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — TaskPay" },
      { name: "description", content: "Restricted admin approval console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSecretPage,
});

function AdminSecretPage() {
  const isAdmin = useIsMasterAdmin();
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

  return <AdminDashboard />;
}
