import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useIsMasterAdmin } from "@/lib/admin-access";
import { AdminDashboard } from "@/components/AdminDashboard";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — TaskPay" },
      { name: "description", content: "Review SMS proofs and release earnings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const isAdmin = useIsMasterAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [isAdmin, navigate]);

  if (isAdmin !== true) {
    return (
      <Card className="p-8 gradient-card border-border/60 text-center shadow-card">
        <p className="text-muted-foreground text-sm">Checking access…</p>
      </Card>
    );
  }

  return <AdminDashboard />;
}
