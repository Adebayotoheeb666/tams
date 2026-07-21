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
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  customers,
  orders,
  products,
  purchaseOrders,
} from "@/lib/db/schema";
import { formatNaira } from "@/lib/utils";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  CreditCard,
  Package,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function startOfMonthIso(): string {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

type MetricCardProps = {
  label: string;
  value: string | number;
  description: string;
  href: string;
  icon: React.ElementType;
  tone?: "default" | "warning" | "success";
};

function MetricCard({
  label,
  value,
  description,
  href,
  icon: Icon,
  tone = "default",
}: MetricCardProps) {
  const iconStyles = {
    default: "bg-primary/10 text-primary",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  }[tone];

  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            </div>
            <span className={`rounded-lg p-2.5 ${iconStyles}`}>
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{description}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  const todayStart = startOfTodayIso();
  const monthStart = startOfMonthIso();
  const today = todayDateString();
  const canViewAppointments = role !== "accountant";
  const canViewFinance = role === "owner" || role === "accountant";
  const salesHref = role === "accountant" ? "/finance/pnl" : "/sales";

  const [
    todaySales,
    monthSales,
    receivables,
    lowStockCount,
    activeProductCount,
    inventoryValue,
    customerCount,
    todayAppointments,
    pendingAppointments,
    openPurchaseOrders,
    upcomingAppointments,
    recentOrders,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
        count: count(),
      })
      .from(orders)
      .where(gte(orders.orderDate, todayStart)),
    db
      .select({
        total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
        count: count(),
      })
      .from(orders)
      .where(gte(orders.orderDate, monthStart)),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.balanceDue}), 0)` })
      .from(orders)
      .where(sql`${orders.balanceDue} > 0`),
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
    db
      .select({ total: sql<number>`coalesce(sum(${products.quantity} * ${products.costPrice}), 0)` })
      .from(products)
      .where(eq(products.isActive, 1)),
    db.select({ count: count() }).from(customers),
    canViewAppointments
      ? db.select({ count: count() }).from(appointments).where(eq(appointments.appointmentDate, today))
      : Promise.resolve([]),
    canViewAppointments
      ? db
          .select({ count: count() })
          .from(appointments)
          .where(sql`${appointments.status} IN ('booked', 'confirmed') AND ${appointments.appointmentDate} >= ${today}`)
      : Promise.resolve([]),
    db
      .select({ count: count() })
      .from(purchaseOrders)
      .where(sql`${purchaseOrders.status} IN ('sent', 'pending', 'partially-received')`),
    canViewAppointments ? getUpcomingAppointments(4) : Promise.resolve([]),
    db.query.orders.findMany({
      columns: { id: true, receiptNumber: true, orderDate: true, totalAmount: true, paymentStatus: true },
      orderBy: [desc(orders.orderDate)],
      limit: 5,
    }),
  ]);

  const todayRevenue = todaySales[0]?.total ?? 0;
  const todayOrderCount = todaySales[0]?.count ?? 0;
  const monthRevenue = monthSales[0]?.total ?? 0;
  const monthOrderCount = monthSales[0]?.count ?? 0;
  const outstandingBalance = receivables[0]?.total ?? 0;
  const lowStock = lowStockCount[0]?.count ?? 0;
  const productCount = activeProductCount[0]?.count ?? 0;
  const stockValue = inventoryValue[0]?.total ?? 0;
  const totalCustomers = customerCount[0]?.count ?? 0;
  const appointmentsToday = todayAppointments[0]?.count ?? 0;
  const pendingAppointmentCount = pendingAppointments[0]?.count ?? 0;
  const openPurchaseOrderCount = openPurchaseOrders[0]?.count ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Business overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, {session?.user?.name ?? "there"}.</h1>
          <p className="mt-1 text-muted-foreground">A live snapshot of Tams Thrift and Glitz Nails. Select any metric to explore it.</p>
        </div>
        <p className="text-sm text-muted-foreground">Updated {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Sales performance</h2>
            <p className="text-sm text-muted-foreground">Revenue and transaction activity</p>
          </div>
          <Link href={salesHref} className="text-sm font-medium text-primary hover:underline">View sales</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Today’s revenue" value={formatNaira(todayRevenue)} description={`${todayOrderCount} sale${todayOrderCount === 1 ? "" : "s"} recorded today`} href={salesHref} icon={Wallet} tone="success" />
          <MetricCard label="Month-to-date revenue" value={formatNaira(monthRevenue)} description={`${monthOrderCount} sale${monthOrderCount === 1 ? "" : "s"} this month`} href={salesHref} icon={CreditCard} />
          {canViewFinance ? <MetricCard label="Outstanding balances" value={formatNaira(outstandingBalance)} description="Unpaid and partially paid sales" href="/finance/pnl" icon={CircleAlert} tone={outstandingBalance > 0 ? "warning" : "success"} /> : <MetricCard label="Customer base" value={totalCustomers} description="Customers in your records" href="/sales" icon={Users} />}
          <MetricCard label="Recent transactions" value={recentOrders.length} description="Latest recorded sales" href={salesHref} icon={ShoppingBag} />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Operations at a glance</h2>
          <p className="text-sm text-muted-foreground">Inventory, procurement, and bookings that need attention</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active products" value={productCount} description="Available catalog items" href="/inventory" icon={Package} />
          <MetricCard label="Low-stock alerts" value={lowStock} description={lowStock > 0 ? "Products at or below reorder level" : "All stock levels are healthy"} href="/inventory?lowStock=1" icon={CircleAlert} tone={lowStock > 0 ? "warning" : "success"} />
          <MetricCard label="Open purchase orders" value={openPurchaseOrderCount} description="Sent, pending, or partly received" href="/procurement" icon={ClipboardList} tone={openPurchaseOrderCount > 0 ? "warning" : "default"} />
          {canViewAppointments ? <MetricCard label="Today’s appointments" value={appointmentsToday} description={`${pendingAppointmentCount} upcoming booking${pendingAppointmentCount === 1 ? "" : "s"}`} href="/appointments" icon={CalendarDays} /> : <MetricCard label="Inventory value" value={formatNaira(stockValue)} description="Cost value of active stock" href="/finance/balance-sheet" icon={Package} />}
        </div>
      </section>

      <div className={`grid gap-6 ${canViewAppointments ? "xl:grid-cols-2" : ""}`}>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Recent sales</CardTitle>
              <CardDescription className="mt-1">Your latest completed transactions</CardDescription>
            </div>
            <Link href={salesHref} className="text-sm font-medium text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No sales have been recorded yet.</p> : <div className="divide-y rounded-md border">{recentOrders.map((order) => <Link key={order.id} href={role === "accountant" ? "/finance/pnl" : `/sales/${order.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"><div><p className="text-sm font-medium">{order.receiptNumber}</p><p className="mt-0.5 text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} · {order.paymentStatus}</p></div><p className="text-sm font-semibold">{formatNaira(order.totalAmount)}</p></Link>)}</div>}
          </CardContent>
        </Card>

        {canViewAppointments ? <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Upcoming appointments</CardTitle>
              <CardDescription className="mt-1">Next Glitz Nails bookings</CardDescription>
            </div>
            <Link href="/appointments" className="text-sm font-medium text-primary hover:underline">View calendar</Link>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No upcoming appointments are scheduled.</p> : <div className="divide-y rounded-md border">{upcomingAppointments.map((appointment) => <Link key={appointment.id} href="/appointments" className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"><div><p className="text-sm font-medium">{appointment.customerName}</p><p className="mt-0.5 text-xs text-muted-foreground">{appointment.appointmentDate} at {appointment.startTime}</p></div><Badge variant="secondary">{appointment.status}</Badge></Link>)}</div>}
          </CardContent>
        </Card> : null}
      </div>
    </div>
  );
}
