import { describe, expect, it } from 'vitest';
import { getUnreadCount, getRecentNotifications } from '@/lib/notifications/actions';

describe('notifications stub service', () => {
  it('getUnreadCount returns 0 (stub until Notifications spec ships)', async () => {
    await expect(getUnreadCount()).resolves.toBe(0);
  });

  it('getRecentNotifications returns an empty array regardless of limit', async () => {
    await expect(getRecentNotifications({ limit: 5 })).resolves.toEqual([]);
    await expect(getRecentNotifications({ limit: 50 })).resolves.toEqual([]);
  });
});
