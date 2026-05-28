import { z } from 'zod';

/**
 * Zod schemas for the live-board API surface. Exported for both route
 * handlers (request validation) and any client code that needs typed
 * payloads.
 */

export const KudosSortSchema = z.enum(['newest', 'hearts']);
export type KudosSort = z.infer<typeof KudosSortSchema>;

export const FeedQuerySchema = z.object({
  sort: KudosSortSchema.default('newest'),
  cursor: z.string().nullish(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  hashtag: z.string().trim().toLowerCase().min(1).max(40).nullish(),
  team: z.string().trim().min(1).max(40).nullish(),
});
export type FeedQuery = z.infer<typeof FeedQuerySchema>;

export const HighlightQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
  hashtag: z.string().trim().toLowerCase().min(1).max(40).nullish(),
  team: z.string().trim().min(1).max(40).nullish(),
});
export type HighlightQuery = z.infer<typeof HighlightQuerySchema>;

export const LeaderboardTypeSchema = z.enum(['rank-promotion', 'gift-received']);
export type LeaderboardType = z.infer<typeof LeaderboardTypeSchema>;

export const LeaderboardQuerySchema = z.object({
  type: LeaderboardTypeSchema,
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;

export const SpotlightSearchSchema = z.object({
  query: z.string().trim().min(1).max(100),
});

export const KudoIdParamSchema = z.object({
  id: z.uuid({ message: 'kudo id must be a UUID' }),
});
