import type { NextResponse } from 'next/server';

/**
 * Copies every cookie from `src.cookies` onto `dst.cookies` and returns
 * `dst`. Used by the prelaunch middleware branch (FR-002 / TR-003) so that
 * an in-flight Supabase session refresh — written to `response.cookies` by
 * `updateSession` — survives a `NextResponse.rewrite(...)` or a 503 short
 * circuit.
 *
 * `NextResponse.rewrite(url, { headers: response.headers })` is fragile
 * because cookie metadata is re-serialized rather than re-applied; iterating
 * `getAll()` and calling `set(cookie)` is the documented pattern.
 */
export function preserveCookies(src: NextResponse, dst: NextResponse): NextResponse {
  for (const cookie of src.cookies.getAll()) {
    dst.cookies.set(cookie);
  }
  return dst;
}
