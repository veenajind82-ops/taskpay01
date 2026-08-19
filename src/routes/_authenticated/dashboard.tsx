import { createFileRoute, Link } from "@tanstack/react-router";
import { useProfile } from "@/lib/profile";
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, MessageSquare, MessageCircle, ArrowRight, Coins } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TaskPay" },
      { name: "description", content: "Your TaskPay dashboard — wallet, earnings, and tasks at a glance." },
      { property: "og:title", content: "Dashboard — TaskPay" },
      { property: "og:description", content: "Wallet, earnings, and tasks at a glance." },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="p-4 gradient-card border-border/60 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className="text-2xl font-bold mt-2 tracking-tight">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { profile } = useProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your earnings and quick tasks.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Wallet Balance"
          value={`₹${(profile?.wallet_balance ?? 0).toFixed(2)}`}
          icon={Wallet}
          accent="bg-primary/15 text-primary"
        />
        <StatCard
          label="Earned Today"
          value={`₹${(profile?.earned_today ?? 0).toFixed(2)}`}
          icon={TrendingUp}
          accent="bg-info/15 text-info"
        />
        <StatCard
          label="Points"
          value={`${profile?.points ?? 0} pts · ₹${(((profile?.points ?? 0) / 100) * 0.77).toFixed(2)}`}
          icon={Coins}
          accent="bg-success/15 text-success"
        />
        <StatCard
          label="Total SMS Sent"
          value={String(profile?.total_sms_sent ?? 0)}
          icon={MessageSquare}
          accent="bg-warning/15 text-warning"
        />
        <StatCard
          label="Active WhatsApp"
          value={String(profile?.active_whatsapp ?? 0)}
          icon={MessageCircle}
          accent="bg-success/15 text-success"
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/sms" className="group">
            <Card className="p-5 gradient-card border-border/60 shadow-card hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">SMS Tasks</div>
                  <div className="text-xs text-muted-foreground">Send SMS and earn per delivery</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
          <Link to="/whatsapp" className="group">
            <Card className="p-5 gradient-card border-border/60 shadow-card hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">WhatsApp Tasks</div>
                  <div className="text-xs text-muted-foreground">Manage sessions and earn</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
