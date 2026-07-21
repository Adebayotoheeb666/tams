import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateReferralCodeForCustomer, completeReferral, getReferrals } from "@/lib/actions/marketing";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

async function generateCodeAction(formData: FormData) {
  "use server";

  await generateReferralCodeForCustomer(formData.get("customerId")?.toString() || "");
}

async function completeReferralAction(formData: FormData) {
  "use server";

  await completeReferral(formData.get("referralId")?.toString() || "", Number(formData.get("rewardAmount") || 500));
}

export default async function ReferralsPage() {
  const result = await getReferrals();
  const referrals = result.success ? result.data : [];
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
              <label className="text-sm font-medium" htmlFor="customerId">
                Customer ID
              </label>
              <Input id="customerId" name="customerId" placeholder="customer-id" required />
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
                Referral ID
              </label>
              <Input id="referralId" name="referralId" placeholder="referral-id" required />
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
