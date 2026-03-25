import { z } from 'zod';


export const toolingsetdate = z.object({
    openjobdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    startdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    duedate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    toolingcreateid: z.number(),
})

export const createsupplier = z.object({
    suppliername: z.string(),
    quotationNo: z.string(),
    quotationdate: z.string(),
    price: z.number(),
})

export type ToolingSetDate = z.infer<typeof toolingsetdate>;
export type CreateSupplier = z.infer<typeof createsupplier>;
