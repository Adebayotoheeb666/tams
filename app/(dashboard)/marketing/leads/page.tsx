"use client";

import { useEffect, useState } from "react";
import { getLeads } from "@/lib/actions/marketing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { format } from "date-fns";

interface Lead {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  source: string;
  status: string;
  leadScore?: number | null;
  initialMessage?: string | null;
  createdAt: string;
  interestedIn?: string[];
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadLeads() {
      try {
        const filters = statusFilter !== "all" ? { status: statusFilter } : undefined;
        const result = await getLeads(filters);
        if (result.success) {
          setLeads(result.data);
        }
      } catch (error) {
        console.error("Failed to load leads:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, [statusFilter]);

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    const name = `${lead.firstName || ""} ${lead.lastName || ""}`.toLowerCase();
    const email = (lead.email || "").toLowerCase();
    const phone = (lead.whatsappNumber || "").toLowerCase();

    return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      new: "default",
      contacted: "secondary",
      interested: "outline",
      converted: "default",
      lost: "destructive",
      nurturing: "secondary",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      whatsapp: "bg-green-100 text-green-800",
      instagram_dm: "bg-pink-100 text-pink-800",
      tiktok_comment: "bg-blue-100 text-blue-800",
      youtube_comment: "bg-red-100 text-red-800",
      campus_popup: "bg-purple-100 text-purple-800",
      referral: "bg-amber-100 text-amber-800",
      other: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colors[source] || "bg-gray-100 text-gray-800"}>
        {source.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and convert leads from all platforms
          </p>
        </div>
        <Link href="/marketing/leads/new">
          <Button>+ New Lead</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-11 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="nurturing">Nurturing</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            {statusFilter !== "all" && `Showing ${statusFilter} leads`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads found. {statusFilter !== "all" && "Try changing the filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Contact</th>
                    <th className="text-left py-3 px-4">Source</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Score</th>
                    <th className="text-left py-3 px-4">Interested In</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {lead.whatsappNumber && <div>{lead.whatsappNumber}</div>}
                        {lead.email && <div className="text-muted-foreground">{lead.email}</div>}
                      </td>
                      <td className="py-3 px-4">{getSourceBadge(lead.source)}</td>
                      <td className="py-3 px-4">{getStatusBadge(lead.status)}</td>
                      <td className="py-3 px-4">
                        {lead.leadScore ? (
                          <span className="font-semibold">{lead.leadScore}/100</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {lead.interestedIn && lead.interestedIn.length > 0 ? (
                          <div className="flex gap-1">
                            {lead.interestedIn.map((item) => (
                              <Badge key={item} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(lead.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/marketing/leads/${lead.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
