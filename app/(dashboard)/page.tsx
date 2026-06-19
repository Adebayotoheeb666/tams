import Link from "next/link";
import { auth } from "@/auth";
import { getUpcomingAppointments } from "@/lib/actions/appointments";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, products } from "@/lib/db/schema";
import { formatNaira } from "@/lib/utils";

function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export default async function DashboardPage() {
  const session = await auth();
  const todayStart = startOfTodayIso();
  const canViewAppointments = session?.user?.role !== "accountant";

  const [todaySales, lowStockCount, activeProductCount, upcomingAppointments] =
    await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
        count: count(),
      })
      .from(orders)
      .where(gte(orders.orderDate, todayStart)),
    db
      .select({ count: count() })
      .from(products)
      .where(
        sql`${products.quantity} <= ${products.reorderLevel} AND ${products.isActive} = 1`,
      ),
    db
      .select({ count: count() })
      .from(products)
      .where(eq(products.isActive, 1)),
    canViewAppointments ? getUpcomingAppointments(3) : Promise.resolve([]),
  ]);

  const todayRevenue = todaySales[0]?.total ?? 0;
  const todayOrderCount = todaySales[0]?.count ?? 0;
  const lowStock = lowStockCount[0]?.count ?? 0;
  const productCount = activeProductCount[0]?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name ?? "there"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s revenue</CardDescription>
            <CardTitle className="text-2xl">{formatNaira(todayRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {todayOrderCount} sale{todayOrderCount === 1 ? "" : "s"} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active products</CardDescription>
            <CardTitle className="text-2xl">{productCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across Tams Thrift &amp; Glitz Nails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low stock alerts</CardDescription>
            <CardTitle className="text-2xl">{lowStock}</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock > 0 ? (
              <Link href="/inventory?lowStock=1">
                <Badge variant="warning">View low stock items</Badge>
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">All stock levels OK</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming appointments</CardDescription>
            <CardTitle className="text-2xl">{upcomingAppointments.length}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAppointments.length === 0 ? (
              <p className="text-xs text-muted-foreground">None scheduled</p>
            ) : (
              upcomingAppointments.map((appointment) => (
                <p key={appointment.id} className="text-xs">
                  {appointment.appointmentDate} {appointment.startTime} —{" "}
                  {appointment.customerName}
                </p>
              ))
            )}
            <Link href="/appointments" className="text-xs text-primary underline">
              View all
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
