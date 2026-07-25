import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp Tasks — TaskPay" },
      { name: "description", content: "Manage WhatsApp sessions and earn on TaskPay." },
      { property: "og:title", content: "WhatsApp Tasks — TaskPay" },
      { property: "og:description", content: "Manage WhatsApp sessions and earn." },
    ],
  }),
  component: WhatsappPage,
});

function WhatsappPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Tasks</h1>
          <p className="text-sm text-muted-foreground">Your active WhatsApp sessions will appear here.</p>
        </div>
      </div>
      <Card className="p-8 gradient-card border-border/60 text-center shadow-card">
        <p className="text-muted-foreground text-sm">No active WhatsApp sessions yet.</p>
      </Card>
    </div>
  );
}
