import type { ReactNode } from 'react';

interface SidebarStatRowProps {
  label: string;
  value: number;
  icon?: ReactNode;
}

/** "Số Kudos bạn nhận được: 25" — sidebar stat line used by D.1.x. */
export function SidebarStatRow({ label, value, icon }: SidebarStatRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm text-hero-foreground">
      <span className="flex items-center gap-1 text-hero-foreground/80">
        {label}
        {icon ? (
          <span aria-hidden className="ml-1 inline-flex items-center">
            {icon}
          </span>
        ) : null}
      </span>
      <span className="text-lg font-bold tabular-nums text-hero-foreground">{value}</span>
    </div>
  );
}
