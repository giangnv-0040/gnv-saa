'use server';

import type { Notification } from './types';

/**
 * Stubbed notifications service for Homepage SAA's bell overlay (US3).
 *
 * Both functions return constants until the Notifications spec
 * (`Tất cả thông báo`, screenId `6-1LRz3vqr`) replaces them with a real
 * Supabase-backed implementation.
 *
 * Behaviour MUST stay consistent for authenticated and anonymous callers
 * (always 0 / empty) so the homepage UI renders deterministically across
 * states until real notifications data exists.
 */

export async function getUnreadCount(): Promise<number> {
  return 0;
}

export async function getRecentNotifications({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  limit,
}: {
  limit: number;
}): Promise<Notification[]> {
  return [];
}
