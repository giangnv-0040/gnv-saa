import { z } from 'zod';

const SAFE_PATH_PATTERN = /^\/(?!\/)[^\\\x00-\x1F]*$/;

/**
 * Returns true if `value` is a safe same-origin relative path:
 * - starts with exactly one '/'
 * - does NOT start with '//' (protocol-relative)
 * - contains no backslashes or control characters
 * - is not an absolute URL with a scheme
 */
function isSafePath(value: string): boolean {
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (!SAFE_PATH_PATTERN.test(value)) return false;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }
  if (decoded.startsWith('//') || decoded.includes('\\') || /[\x00-\x1F]/.test(decoded)) {
    return false;
  }

  return true;
}

/**
 * Zod schema for `redirectTo` query parameters. Validates the value is a safe
 * same-origin relative path. Use this at trust boundaries (callback route).
 */
export const redirectToSchema = z
  .string()
  .refine(isSafePath, { message: 'redirectTo must be a safe same-origin relative path' });

/**
 * Sanitize a `redirectTo` input from anywhere (URL search params, form data,
 * cookies). Returns the original path if it's safe, otherwise `/`.
 *
 * Defense in depth: call this at EVERY trust boundary (page Server Component,
 * Server Action, callback route) — never assume an upstream call already
 * sanitized.
 */
export function sanitizeRedirectTo(value: unknown): string {
  if (typeof value !== 'string') return '/';
  return isSafePath(value) ? value : '/';
}
