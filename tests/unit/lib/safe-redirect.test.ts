import { describe, expect, it } from 'vitest';
import { sanitizeRedirectTo, redirectToSchema } from '@/lib/auth/safe-redirect';

describe('sanitizeRedirectTo', () => {
  describe('accepts safe same-origin relative paths', () => {
    it.each([
      ['/', '/'],
      ['/admin', '/admin'],
      ['/admin/users', '/admin/users'],
      ['/path?with=query', '/path?with=query'],
      ['/path#hash', '/path#hash'],
      ['/awards/category/123', '/awards/category/123'],
    ])('keeps %s', (input, expected) => {
      expect(sanitizeRedirectTo(input)).toBe(expected);
    });
  });

  describe('rejects unsafe values → falls back to "/"', () => {
    it.each([
      // protocol-relative
      ['//evil.example.com'],
      ['//evil.example.com/admin'],
      // absolute URL with scheme
      ['https://evil.example.com'],
      ['http://evil.example.com'],
      ['javascript:alert(1)'],
      ['data:text/html,<script>x</script>'],
      ['file:///etc/passwd'],
      // backslash tricks (some browsers treat as /)
      ['\\\\evil.example.com'],
      ['/\\evil.example.com'],
      // not starting with /
      ['admin'],
      ['./admin'],
      ['../admin'],
      // empty / nullish
      [''],
      [null],
      [undefined],
      // wrong type
      [42],
      [{}],
      [[]],
    ])('rejects %p', (input) => {
      expect(sanitizeRedirectTo(input)).toBe('/');
    });
  });

  it('handles control characters by falling back to "/"', () => {
    expect(sanitizeRedirectTo('/admin\nLocation: https://evil')).toBe('/');
    expect(sanitizeRedirectTo('/admin\r\nFoo: bar')).toBe('/');
    expect(sanitizeRedirectTo('/\x00admin')).toBe('/');
  });

  it('rejects URLs that decode to protocol-relative', () => {
    expect(sanitizeRedirectTo('/%2Fevil.example.com')).toBe('/');
  });
});

describe('redirectToSchema (zod)', () => {
  it('parses a valid relative path', () => {
    const result = redirectToSchema.safeParse('/admin');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('/admin');
  });

  it('rejects a protocol-relative URL', () => {
    const result = redirectToSchema.safeParse('//evil.example.com');
    expect(result.success).toBe(false);
  });

  it('rejects an absolute URL', () => {
    const result = redirectToSchema.safeParse('https://evil.example.com');
    expect(result.success).toBe(false);
  });
});
