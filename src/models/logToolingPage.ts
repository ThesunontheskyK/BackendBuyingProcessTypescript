import { z } from 'zod';

export const logToolingPage = z.object({
   page: z.number(),
})

export type LogToolingPage = z.infer<typeof logToolingPage>;