"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/db/schema";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "staff", "accountant"] as UserRole[] },
  { href: "/inventory", label: "Inventory", icon: Package, roles: ["owner", "staff"] as UserRole[] },
  { href: "/sales/new", label: "POS", icon: ShoppingCart, roles: ["owner", "staff"] as UserRole[] },
  { href: "/sales", label: "Sales", icon: ShoppingCart, roles: ["owner", "staff"] as UserRole[] },
  { href: "/appointments", label: "Appointments", icon: Calendar, roles: ["owner", "staff"] as UserRole[] },
  { href: "/bookkeeping/ledger", label: "Ledger", icon: BookOpen, roles: ["owner", "accountant"] as UserRole[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner"] as UserRole[] },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

export function DashboardShell({
  userName,
  userRole,
  children,
}: {
  userName: string;
  userRole: UserRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-semibold text-primary">
            TBH-IMS
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {userName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r bg-muted/20 sm:block">
          <nav className="sticky top-14 space-y-1 p-4">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto pb-20 sm:pb-6">
          <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background sm:hidden">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {visibleItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 text-xs",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
