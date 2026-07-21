import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getBroadcasts, getCampaigns, getKpis, getLeads, getReferrals, getTestimonials, syncSocialAnalyticsMetrics, updateKpi } from "@/lib/actions/marketing";
import { getMarketingHealthScore } from "@/lib/utils/marketing";

async function createKpiAction(formData: FormData) {
  "use server";

  await updateKpi({
    metricName: formData.get("metricName")?.toString() || "",
    metricValue: Number(formData.get("metricValue") || 0),
    targetValue: Number(formData.get("targetValue") || 0),
    platform: formData.get("platform") || undefined,
    period: (formData.get("period") as string) || "monthly",
    periodStartDate: formData.get("periodStartDate")?.toString() || new Date().toISOString(),
    periodEndDate: formData.get("periodEndDate")?.toString() || undefined,
    dataSource: formData.get("dataSource") || "manual_entry",
  });
}

async function syncSocialAnalyticsAction() {
  "use server";

  await syncSocialAnalyticsMetrics();
}

export default async function AnalyticsPage() {
  const [campaignsResult, leadsResult, broadcastsResult, testimonialsResult, referralsResult, kpisResult] = await Promise.all([
    getCampaigns(),
    getLeads(),
    getBroadcasts(),
    getTestimonials(),
    getReferrals(),
    getKpis(),
  ]);

  const campaigns = campaignsResult.success ? campaignsResult.data : [];
  const leads = leadsResult.success ? leadsResult.data : [];
  const broadcasts = broadcastsResult.success ? broadcastsResult.data : [];
  const testimonials = testimonialsResult.success ? testimonialsResult.data : [];
  const referrals = referralsResult.success ? referralsResult.data : [];
  const kpis = kpisResult.success ? kpisResult.data : [];
  const health = getMarketingHealthScore({ campaigns, leads, broadcasts, testimonials, referrals, kpis });
  const averageDeliveryRate = broadcasts.length
    ? Math.round(broadcasts.reduce((sum: number, broadcast: any) => sum + (broadcast.performance?.deliveryRate ?? 0), 0) / broadcasts.length)
    : 0;

  return (
    <MarketingPageShell title="Analytics & KPIs" description="Monitor your marketing health and compare performance to targets.">
      <Card>
        <CardHeader>
          <CardTitle>Performance snapshot</CardTitle>
          <CardDescription>Health score: {health.score}/100 • {health.label}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm text-muted-foreground">
          <div className="rounded-lg border p-3">Active campaigns: {campaigns.length}</div>
          <div className="rounded-lg border p-3">Converted leads: {leads.filter((lead: any) => lead.status === "converted").length}</div>
          <div className="rounded-lg border p-3">Broadcasts queued/sent: {broadcasts.length}</div>
          <div className="rounded-lg border p-3">Average delivery rate: {averageDeliveryRate}%</div>
          <div className="rounded-lg border p-3">Testimonials approved: {testimonials.filter((item: any) => ["featured", "approved"].includes(item.status)).length}</div>
          <div className="rounded-lg border p-3">Referrals completed: {referrals.filter((item: any) => item.status === "completed").length}</div>
          <div className="rounded-lg border p-3">KPIs logged: {kpis.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync social analytics</CardTitle>
          <CardDescription>Pull the latest published and scheduled social post counts into the KPI dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={syncSocialAnalyticsAction}>
            <Button type="submit" variant="outline">Sync now</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log a KPI</CardTitle>
          <CardDescription>Track follower growth, booking volume, or campaign reach.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createKpiAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="metricName">
                Metric name
              </label>
              <Input id="metricName" name="metricName" placeholder="instagram_followers" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="platform">
                Platform
              </label>
              <Input id="platform" name="platform" placeholder="instagram" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="metricValue">
                Metric value
              </label>
              <Input id="metricValue" name="metricValue" type="number" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="targetValue">
                Target value
              </label>
              <Input id="targetValue" name="targetValue" type="number" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="period">
                Period
              </label>
              <select id="period" name="period" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="monthly">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="6_month">6 month</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="periodStartDate">
                Start date
              </label>
              <Input id="periodStartDate" name="periodStartDate" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="dataSource">
                Data source
              </label>
              <Input id="dataSource" name="dataSource" placeholder="manual_entry" />
            </div>
            <Button type="submit">Save KPI</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi: any) => (
          <Card key={kpi.id}>
            <CardHeader>
              <CardTitle>{kpi.metricName}</CardTitle>
              <CardDescription>{kpi.platform || "Overall"} • {kpi.period}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Value: {kpi.metricValue}</p>
              <p>Target: {kpi.targetValue || 0}</p>
              <p>Source: {kpi.dataSource || "manual"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingPageShell>
  );
}
