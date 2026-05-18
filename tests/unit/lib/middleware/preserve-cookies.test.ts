import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';
import { preserveCookies } from '@/lib/middleware/preserve-cookies';

describe('preserveCookies', () => {
  it('copies every cookie from src onto dst', () => {
    const src = new NextResponse();
    src.cookies.set('sb-access-token', 'eyJabc', { path: '/', httpOnly: true });
    src.cookies.set('sb-refresh-token', 'r-xyz', { path: '/', httpOnly: true });
    const dst = NextResponse.json({ ok: true });

    const result = preserveCookies(src, dst);

    expect(result).toBe(dst);
    expect(result.cookies.get('sb-access-token')?.value).toBe('eyJabc');
    expect(result.cookies.get('sb-refresh-token')?.value).toBe('r-xyz');
  });

  it('handles a source with no cookies (no-op)', () => {
    const src = new NextResponse();
    const dst = NextResponse.rewrite(new URL('http://localhost/prelaunch'));

    const result = preserveCookies(src, dst);

    expect(result).toBe(dst);
    expect(result.cookies.getAll()).toHaveLength(0);
  });

  it('does not lose existing cookies already on dst', () => {
    const src = new NextResponse();
    src.cookies.set('new-cookie', 'src-value');
    const dst = new NextResponse();
    dst.cookies.set('existing', 'dst-value');

    preserveCookies(src, dst);

    expect(dst.cookies.get('existing')?.value).toBe('dst-value');
    expect(dst.cookies.get('new-cookie')?.value).toBe('src-value');
  });
});
