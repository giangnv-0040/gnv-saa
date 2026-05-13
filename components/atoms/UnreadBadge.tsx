interface UnreadBadgeProps {
  /** Number of unread notifications. Hidden when 0 or negative. */
  count: number;
  /** Already-localized aria-label (e.g. "Có thông báo mới chưa đọc"). */
  ariaLabel: string;
}

/**
 * The red dot that decorates the bell when there are unread notifications.
 * Renders nothing when `count <= 0` (FR-020). Numeric count is not shown —
 * the design uses a pure indicator dot, not a counter.
 */
export function UnreadBadge({ count, ariaLabel }: UnreadBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      data-testid="unread-badge"
      className="absolute right-1 top-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background"
    />
  );
}
