import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — TaskPay" },
      { name: "description", content: "TaskPay admin controls." },
      { property: "og:title", content: "Admin — TaskPay" },
      { property: "og:description", content: "TaskPay admin controls." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">Restricted controls.</p>
        </div>
      </div>
      <Card className="p-8 gradient-card border-border/60 text-center shadow-card">
        <p className="text-muted-foreground text-sm">You don't have admin access.</p>
      </Card>
    </div>
  );
}
