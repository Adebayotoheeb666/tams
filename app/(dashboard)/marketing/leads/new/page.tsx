import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createLead } from "@/lib/actions/marketing";
import { redirect } from "next/navigation";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

async function createLeadAction(formData: FormData) {
  "use server";

  await createLead({
    firstName: formData.get("firstName")?.toString() || undefined,
    lastName: formData.get("lastName")?.toString() || undefined,
    email: formData.get("email")?.toString() || undefined,
    phone: formData.get("phone")?.toString() || undefined,
    whatsappNumber: formData.get("whatsappNumber")?.toString() || undefined,
    source: (formData.get("source") as string) || "other",
    interestedIn: formData.getAll("interestedIn").map(String),
    initialMessage: formData.get("initialMessage")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
    status: (formData.get("status") as string) || "new",
  });

  redirect("/marketing/leads");
}

export default function NewLeadPage() {
  return (
    <MarketingPageShell title="New Lead" description="Capture a new lead from any acquisition channel.">
      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
          <CardDescription>Capture the lead quickly so follow-up can begin immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLeadAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="firstName">First name</label>
              <Input id="firstName" name="firstName" placeholder="Ada" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lastName">Last name</label>
              <Input id="lastName" name="lastName" placeholder="Adebayo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" name="email" type="email" placeholder="ada@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="phone">Phone</label>
              <Input id="phone" name="phone" placeholder="08012345678" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="whatsappNumber">WhatsApp number</label>
              <Input id="whatsappNumber" name="whatsappNumber" placeholder="08012345678" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="source">Source</label>
              <select id="source" name="source" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="other">
                <option value="instagram_dm">Instagram DM</option>
                <option value="tiktok_comment">TikTok comment</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="youtube_comment">YouTube comment</option>
                <option value="campus_popup">Campus popup</option>
                <option value="referral">Referral</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Interested in</label>
              <div className="flex flex-wrap gap-3">
                {(["thrift", "nails"] as const).map((interest) => (
                  <label key={interest} className="flex items-center gap-2 text-sm capitalize">
                    <input type="checkbox" name="interestedIn" value={interest} />
                    {interest}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="initialMessage">Initial message</label>
              <Textarea id="initialMessage" name="initialMessage" placeholder="What did they ask or say?" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="notes">Notes</label>
              <Textarea id="notes" name="notes" placeholder="Add context for the follow-up team" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="status">Status</label>
              <select id="status" name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" defaultValue="new">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="nurturing">Nurturing</option>
              </select>
            </div>
            <Button type="submit" className="md:col-span-2">Save lead</Button>
          </form>
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
}
