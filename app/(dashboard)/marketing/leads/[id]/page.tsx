import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getLeadById, updateLead, convertLeadToCustomerRecord } from "@/lib/actions/marketing";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

async function updateLeadAction(formData: FormData) {
  "use server";

  const leadId = formData.get("leadId")?.toString();
  if (!leadId) return;

  await updateLead({
    id: leadId,
    status: formData.get("status")?.toString(),
    assignedTo: formData.get("assignedTo")?.toString(),
    followUpDate: formData.get("followUpDate")?.toString(),
    notes: formData.get("notes")?.toString(),
  });

  redirect(`/marketing/leads/${leadId}`);
}

async function convertLeadAction(formData: FormData) {
  "use server";

  const leadId = formData.get("leadId")?.toString();
  if (!leadId) return;

  await convertLeadToCustomerRecord(leadId);
  redirect(`/marketing/leads/${leadId}`);
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    new: "bg-slate-100 text-slate-800",
    contacted: "bg-indigo-100 text-indigo-800",
    interested: "bg-emerald-100 text-emerald-800",
    converted: "bg-amber-100 text-amber-800",
    lost: "bg-rose-100 text-rose-800",
    nurturing: "bg-cyan-100 text-cyan-800",
  };
  return <Badge className={variants[status] || "bg-slate-100 text-slate-800"}>{status}</Badge>;
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const result = await getLeadById(params.id);
  if (!result.success || !result.data) {
    notFound();
  }

  const lead = result.data;

  return (
    <MarketingPageShell title="Lead details" description="Review the full lead record and update follow-up status.">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{lead.firstName || "Lead"} {lead.lastName || ""}</CardTitle>
            <CardDescription>{lead.email || lead.whatsappNumber || "No contact details"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p>
                <p className="font-semibold">{lead.source.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                {getStatusBadge(lead.status)}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Lead score</p>
                <p className="font-semibold">{lead.leadScore ?? 0}/100</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                <p className="font-semibold">{format(new Date(lead.createdAt), "PPP")}</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Message</p>
              <p className="whitespace-pre-wrap rounded-lg border border-input bg-muted/10 p-3 text-sm">{lead.initialMessage || "No initial message"}</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="whitespace-pre-wrap rounded-lg border border-input bg-muted/10 p-3 text-sm">{lead.notes || "No notes yet"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update lead</CardTitle>
            <CardDescription>Change status, assign ownership, or set the next follow-up date.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateLeadAction} className="space-y-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={lead.status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="nurturing">Nurturing</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="followUpDate">Follow-up date</label>
                <Input id="followUpDate" name="followUpDate" type="date" defaultValue={lead.followUpDate || undefined} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="assignedTo">Assigned to</label>
                <Input id="assignedTo" name="assignedTo" placeholder="Staff member ID" defaultValue={lead.assignedTo || ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="notes">Notes</label>
                <Textarea id="notes" name="notes" defaultValue={lead.notes || ""} placeholder="Update notes for follow-up" />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Convert lead</CardTitle>
            <CardDescription>Convert this lead into a customer record and add them to the customer journey.</CardDescription>
          </CardHeader>
          <CardContent>
            {lead.convertedCustomerId ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>This lead has already been converted.</p>
                <p>
                  Converted customer ID: <span className="font-semibold text-foreground">{lead.convertedCustomerId}</span>
                </p>
              </div>
            ) : (
              <form action={convertLeadAction} className="space-y-4">
                <input type="hidden" name="leadId" value={lead.id} />
                <p className="text-sm text-muted-foreground">
                  Converting creates a customer record from the lead details, enrolls them in the broadcast list if they have WhatsApp, and advances them to the action stage.
                </p>
                <Button type="submit">Convert to customer</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}
