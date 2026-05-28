/**
 * Centralised route constants. Single source of truth for every internal path
 * the application links to. Rename a path here and every consumer follows.
 *
 * Rationale (plan §Phase-1): Homepage SAA references several routes whose
 * owning specs (Awards Information, Sun* Kudos, Dropdown-profile, etc.) have
 * not been built yet. When those specs ratify final paths, this is the only
 * file that needs to change.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGN_OUT: '/auth/signout',
  AWARDS: '/awards',
  KUDOS: '/kudos',
  KUDOS_NEW: '/kudos/new',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  ADMIN: '/admin',
  RULES: '/rules',
  COMMUNITY_STANDARDS: '/community-standards',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

/**
 * Build a deep-link to the Awards Information page anchored at a category slug.
 * Used by Homepage SAA award cards (spec FR-013).
 */
export function awardDeepLink(slug: string): string {
  return `${ROUTES.AWARDS}#${slug}`;
}

/**
 * Build the canonical Kudo detail path. The detail page is out of scope of
 * the live board spec but the navigation contract (US10) is owned here.
 */
export function kudoDetailPath(kudoId: string): string {
  return `${ROUTES.KUDOS}/${encodeURIComponent(kudoId)}`;
}

/** Build a filtered `/kudos` URL — used by HashtagChip (FR-019). */
export function kudosFeedPath(params: { hashtag?: string; team?: string }): string {
  const search = new URLSearchParams();
  if (params.hashtag) search.set('hashtag', params.hashtag);
  if (params.team) search.set('team', params.team);
  const qs = search.toString();
  return qs ? `${ROUTES.KUDOS}?${qs}` : ROUTES.KUDOS;
}
