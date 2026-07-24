import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { completeReferral, generateReferralCodeForCustomer, getCustomers, getReferrals } from "@/lib/actions/marketing";
import { resolveCustomerId } from "@/lib/utils/customer-id";

async function generateCodeAction(formData: FormData) {
  "use server";

  await generateReferralCodeForCustomer(
    resolveCustomerId(formData.get("customerIdSelect")?.toString(), formData.get("customerId")?.toString()),
  );
}

async function completeReferralAction(formData: FormData) {
  "use server";

  await completeReferral(formData.get("referralId")?.toString() || "", Number(formData.get("rewardAmount") || 500));
}

export default async function ReferralsPage() {
  const [referralsResult, customersResult] = await Promise.all([getReferrals(), getCustomers()]);
  const referrals = referralsResult.success ? referralsResult.data : [];
  const customerOptions = customersResult.success ? customersResult.data : [];
  const completedReferrals = referrals.filter((r: any) => r.status === "completed").length;
  const totalRewards = referrals.reduce((sum: number, r: any) => sum + (Number(r.rewardGivenAmount || 0)), 0);

  return (
    <MarketingPageShell title="Referral Program" description="Track customer referrals and reward conversions.">
      <Card>
        <CardHeader>
          <CardTitle>Program stats</CardTitle>
          <CardDescription>Referral program performance</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm text-muted-foreground">
          <div className="rounded-lg border p-3">Active codes: {referrals.filter((r: any) => r.status === "pending").length}</div>
          <div className="rounded-lg border p-3">Completed: {completedReferrals}</div>
          <div className="rounded-lg border p-3">Total rewards: ₦{totalRewards.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate referral code</CardTitle>
          <CardDescription>Create a unique referral code for a customer to share.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={generateCodeAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="customerIdSelect">
                Customer
              </label>
              <select
                id="customerIdSelect"
                name="customerIdSelect"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              >
                <option value="">Select existing customer</option>
                {customerOptions.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.id})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Or enter a customer ID manually</p>
              <Input id="customerId" name="customerId" placeholder="customer-id" />
            </div>
            <Button type="submit">Generate code</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complete a referral</CardTitle>
          <CardDescription>Mark a referral as completed and award the reward.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeReferralAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="referralId">
                Referral ID or code
              </label>
              <Input id="referralId" name="referralId" placeholder="referral-id or referral code" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="rewardAmount">
                Reward amount (₦)
              </label>
              <Input id="rewardAmount" name="rewardAmount" type="number" defaultValue="500" />
            </div>
            <Button type="submit">Complete referral</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {referrals.map((referral: any) => (
          <Card key={referral.id}>
            <CardHeader>
              <CardTitle className="text-base">{referral.referralCode}</CardTitle>
              <CardDescription>{referral.status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Reward: ₦{Number(referral.rewardGivenAmount || 0).toLocaleString()}</p>
              <p>Date: {referral.referralDate ? new Date(referral.referralDate).toLocaleDateString() : "Pending"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingPageShell>
  );
}
