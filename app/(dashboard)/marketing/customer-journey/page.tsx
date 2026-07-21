import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { advanceCustomerStage, getJourneyMetrics, recordTouchpoint } from "@/lib/actions/marketing";
import { CustomerJourneyChart } from "@/components/marketing/customer-journey-chart";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

async function updateJourneyAction(formData: FormData) {
  "use server";

  await advanceCustomerStage(formData.get("customerId")?.toString() || "", formData.get("stage")?.toString() || "awareness");
}

async function recordTouchpointAction(formData: FormData) {
  "use server";

  await recordTouchpoint(
    formData.get("customerId")?.toString() || "",
    formData.get("touchpointType")?.toString() || "engagement",
    formData.get("description")?.toString() || ""
  );
}

export default async function CustomerJourneyPage() {
  const metricsResult = await getJourneyMetrics();
  const metrics = metricsResult.success ? metricsResult.data : null;

  const stageColors: Record<string, string> = {
    awareness: "bg-blue-100 text-blue-800",
    interest: "bg-purple-100 text-purple-800",
    desire: "bg-amber-100 text-amber-800",
    action: "bg-green-100 text-green-800",
    loyalty: "bg-rose-100 text-rose-800",
  };

  const stageLabels = {
    awareness: "Awareness",
    interest: "Interest",
    desire: "Desire",
    action: "Action",
    loyalty: "Loyalty",
  };

  const chartData = metrics
    ? [
        { stage: "Awareness", customers: metrics.stageBreakdown.awareness },
        { stage: "Interest", customers: metrics.stageBreakdown.interest },
        { stage: "Desire", customers: metrics.stageBreakdown.desire },
        { stage: "Action", customers: metrics.stageBreakdown.action },
        { stage: "Loyalty", customers: metrics.stageBreakdown.loyalty },
      ]
    : [];

  return (
    <MarketingPageShell title="Customer Journey" description="Track how customers move from awareness to loyalty.">
      {/* Metrics Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">tracked in journey</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₦{(metrics.totalLifetimeValue / 1000).toFixed(1)}k</div>
              <p className="text-xs text-muted-foreground">total across all customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Touchpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.averageTouchpoints}</div>
              <p className="text-xs text-muted-foreground">per customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">To Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.stageBreakdown.action}</div>
              <p className="text-xs text-muted-foreground">customers converted</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stage Distribution Chart */}
      {metrics && chartData.length > 0 && (
        <CustomerJourneyChart chartData={chartData} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Advance Stage Form */}
        <Card>
          <CardHeader>
            <CardTitle>Advance a customer stage</CardTitle>
            <CardDescription>Use this lightweight workflow to reflect the last customer action or nurture milestone.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateJourneyAction} className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="customerId">
                  Customer ID
                </label>
                <Input id="customerId" name="customerId" placeholder="customer-id" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="stage">
                  New stage
                </label>
                <select id="stage" name="stage" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="awareness">
                  <option value="awareness">Awareness</option>
                  <option value="interest">Interest</option>
                  <option value="desire">Desire</option>
                  <option value="action">Action</option>
                  <option value="loyalty">Loyalty</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                Advance stage
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Record Touchpoint Form */}
        <Card>
          <CardHeader>
            <CardTitle>Record a touchpoint</CardTitle>
            <CardDescription>Log customer interactions (posts viewed, DMs, purchases, etc.)</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={recordTouchpointAction} className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="touchpointCustomerId">
                  Customer ID
                </label>
                <Input id="touchpointCustomerId" name="customerId" placeholder="customer-id" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="touchpointType">
                  Touchpoint type
                </label>
                <select id="touchpointType" name="touchpointType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="engagement">
                  <option value="engagement">Social engagement</option>
                  <option value="dm">Direct message</option>
                  <option value="purchase">Purchase</option>
                  <option value="appointment">Appointment booked</option>
                  <option value="referral">Referral shared</option>
                  <option value="review">Left review</option>
                  <option value="email">Email opened</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="description">
                  Description
                </label>
                <Input id="description" name="description" placeholder="e.g., Liked Instagram post #234" />
              </div>
              <Button type="submit" className="w-full">
                Record touchpoint
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Customer List by Stage */}
      {metrics && metrics.journeys && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Journey Pipeline</CardTitle>
            <CardDescription>All customers tracked by their current stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(stageLabels).map(([stageKey, stageLabel]) => {
              const stageCustomers = metrics.journeys.filter((j) => j.stage === stageKey);
              return (
                <div key={stageKey} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold px-3 py-1 rounded w-fit ${stageColors[stageKey]}`}>{stageLabel}</h3>
                    <span className="text-sm text-muted-foreground">{stageCustomers.length} customers</span>
                  </div>
                  {stageCustomers.length > 0 ? (
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {stageCustomers.map((customer) => (
                        <div key={customer.id} className="rounded-lg border p-3 space-y-1">
                          <p className="font-medium text-sm">{customer.customerName || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{customer.customerEmail}</p>
                          <div className="flex justify-between items-center pt-2 text-xs">
                            <span className="text-muted-foreground">
                              {customer.touchpoints?.length || 0} touchpoints
                            </span>
                            <span className="font-semibold">₦{customer.lifetimeValue?.toLocaleString() || "0"}</span>
                          </div>
                          {customer.lastInteraction && (
                            <p className="text-xs text-muted-foreground italic">
                              Last: {customer.lastInteraction}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No customers at this stage yet</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Journey Flow Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Lifecycle Flow</CardTitle>
          <CardDescription>Use this as a simple guide for the customer journey stages.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5 text-sm text-muted-foreground">
          {[
            ["Awareness", "First touchpoint from social content or referral"],
            ["Interest", "Customer engages with content or asks a question"],
            ["Desire", "They compare services or ask about offers"],
            ["Action", "They book, purchase, or convert"],
            ["Loyalty", "They return for repeat visits or refer others"],
          ].map(([stage, detail]) => (
            <div key={stage} className="rounded-lg border p-3">
              <p className="font-medium text-foreground">{stage}</p>
              <p>{detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
}
