import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ComingSoonPage({
  title,
  description,
  phase,
  backHref = "/",
  backLabel = "Back to dashboard",
}: {
  title: string;
  description: string;
  phase: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>{phase}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This module is planned in the TBH-IMS roadmap. Phase 1 covers
          inventory tracking, POS sales, and digital receipts — which you can
          use from the dashboard today.
        </CardContent>
      </Card>
    </div>
  );
}
