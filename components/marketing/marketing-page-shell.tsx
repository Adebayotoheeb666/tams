import type { ReactNode } from "react";

import type { ReactNode } from "react";

interface MarketingPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function MarketingPageShell({ title, description, children }: MarketingPageShellProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      {children}
    </div>
  );
}
