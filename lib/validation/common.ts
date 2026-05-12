import { z } from 'zod';

/** Trim a string and reject empties — useful for query/form inputs. */
export const nonEmptyString = z.string().trim().min(1);
