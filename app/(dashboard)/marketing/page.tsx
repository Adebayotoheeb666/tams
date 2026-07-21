import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing Hub</h1>
        <p className="text-muted-foreground mt-2">Manage campaigns, content, leads, and broadcasts</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Leads Module */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Management</CardTitle>
            <CardDescription>Track and convert leads from all platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Centralized inbox for WhatsApp, Instagram, TikTok, and YouTube leads. Auto-scoring and follow-up management.
            </p>
            <Link href="/marketing/leads">
              <Button className="w-full">Manage Leads</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Content Calendar Module */}
        <Card>
          <CardHeader>
            <CardTitle>Content Calendar</CardTitle>
            <CardDescription>Plan and schedule social content</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Schedule posts across Instagram, TikTok, YouTube, and WhatsApp. Track performance metrics.
            </p>
            <Link href="/marketing/content-calendar">
              <Button className="w-full">Plan Content</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Campaigns Module */}
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Manage marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create and track campaigns across all platforms with KPI monitoring.
            </p>
            <Link href="/marketing/campaigns">
              <Button className="w-full">View Campaigns</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Customer Journey Module */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Journey</CardTitle>
            <CardDescription>Track customer progression</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize and manage customer movement through awareness, interest, desire, action, and loyalty stages.
            </p>
            <Link href="/marketing/customer-journey">
              <Button className="w-full">View Journey Map</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Broadcast Module */}
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Broadcasts</CardTitle>
            <CardDescription>Send targeted broadcasts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Segment audience and send WhatsApp broadcasts. Track delivery and engagement metrics.
            </p>
            <Link href="/marketing/broadcasts">
              <Button className="w-full">Send Broadcast</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Testimonials Module */}
        <Card>
          <CardHeader>
            <CardTitle>Testimonials</CardTitle>
            <CardDescription>Manage social proof</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Collect, approve, and feature customer testimonials and reviews.
            </p>
            <Link href="/marketing/testimonials">
              <Button className="w-full">Manage Reviews</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Referral Module */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Program</CardTitle>
            <CardDescription>Track referrals and rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate referral codes, track conversions, and fulfill rewards.
            </p>
            <Link href="/marketing/referrals">
              <Button className="w-full">View Referrals</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Analytics Module */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics & KPIs</CardTitle>
            <CardDescription>Monitor performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track KPIs against 6-month targets across all platforms.
            </p>
            <Link href="/marketing/analytics">
              <Button className="w-full">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Automation Module */}
        <Card>
          <CardHeader>
            <CardTitle>Automation</CardTitle>
            <CardDescription>Manage automated workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage lead follow-ups, broadcast scheduling, and journey automation.
            </p>
            <Link href="/marketing/automations">
              <Button className="w-full">Manage Automations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
