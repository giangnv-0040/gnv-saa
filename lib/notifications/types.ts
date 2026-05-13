/**
 * Notification surface for Homepage SAA's bell overlay (US3).
 *
 * The full data layer (table + RLS + writers) is owned by the Notifications
 * spec (`Tất cả thông báo`, `View thông báo`). Homepage ships against the
 * stubbed service defined in `lib/notifications/actions.ts` and renders only
 * the empty state until that spec lands.
 */
export interface Notification {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string; // ISO-8601
  readonly read: boolean;
  readonly url: string | null;
}
