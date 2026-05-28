import { describe, expect, it } from 'vitest';
import {
  FeedQuerySchema,
  HighlightQuerySchema,
  KudoIdParamSchema,
  LeaderboardQuerySchema,
  SpotlightSearchSchema,
} from '@/lib/kudos/schemas';

describe('FeedQuerySchema', () => {
  it('applies defaults for sort + limit when omitted', () => {
    const result = FeedQuerySchema.parse({});
    expect(result.sort).toBe('newest');
    expect(result.limit).toBe(10);
    expect(result.cursor).toBeUndefined();
  });

  it('coerces limit from a string query param', () => {
    const result = FeedQuerySchema.parse({ limit: '20' });
    expect(result.limit).toBe(20);
  });

  it('rejects limits outside [1, 50]', () => {
    expect(() => FeedQuerySchema.parse({ limit: '0' })).toThrow();
    expect(() => FeedQuerySchema.parse({ limit: '100' })).toThrow();
  });

  it('lowercases the hashtag token', () => {
    const result = FeedQuerySchema.parse({ hashtag: 'Inspring' });
    expect(result.hashtag).toBe('inspring');
  });

  it('rejects unknown sort values', () => {
    expect(() => FeedQuerySchema.parse({ sort: 'random' })).toThrow();
  });
});

describe('HighlightQuerySchema', () => {
  it('defaults limit to 5 (Top 5 cards)', () => {
    expect(HighlightQuerySchema.parse({}).limit).toBe(5);
  });

  it('rejects limit > 20', () => {
    expect(() => HighlightQuerySchema.parse({ limit: '21' })).toThrow();
  });
});

describe('KudoIdParamSchema', () => {
  it('accepts a valid UUID', () => {
    const id = '11111111-1111-4111-9111-111111111111';
    expect(KudoIdParamSchema.parse({ id }).id).toBe(id);
  });

  it('rejects non-UUID strings', () => {
    expect(() => KudoIdParamSchema.parse({ id: 'k-1' })).toThrow();
  });
});

describe('LeaderboardQuerySchema', () => {
  it('requires a valid type', () => {
    expect(() => LeaderboardQuerySchema.parse({ type: 'unknown' })).toThrow();
    expect(LeaderboardQuerySchema.parse({ type: 'rank-promotion' }).limit).toBe(10);
  });
});

describe('SpotlightSearchSchema', () => {
  it('rejects empty queries', () => {
    expect(() => SpotlightSearchSchema.parse({ query: '   ' })).toThrow();
  });

  it('trims and accepts within 100 chars', () => {
    expect(SpotlightSearchSchema.parse({ query: '  Hu  ' }).query).toBe('Hu');
  });

  it('rejects queries over 100 chars', () => {
    expect(() => SpotlightSearchSchema.parse({ query: 'a'.repeat(101) })).toThrow();
  });
});
