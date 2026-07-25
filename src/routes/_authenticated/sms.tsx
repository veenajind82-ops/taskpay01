import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sms")({
  head: () => ({
    meta: [
      { title: "SMS Tasks — TaskPay" },
      { name: "description", content: "Complete SMS tasks and earn rewards on TaskPay." },
      { property: "og:title", content: "SMS Tasks — TaskPay" },
      { property: "og:description", content: "Complete SMS tasks and earn rewards." },
    ],
  }),
  component: SmsPage,
});

function SmsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMS Tasks</h1>
          <p className="text-sm text-muted-foreground">Available SMS campaigns will appear here.</p>
        </div>
      </div>
      <Card className="p-8 gradient-card border-border/60 text-center shadow-card">
        <p className="text-muted-foreground text-sm">No active SMS tasks yet. Check back soon.</p>
      </Card>
    </div>
  );
}
