import { z } from 'zod';


export const toolingsetdate = z.object({
    openjobdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    startdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    duedate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    toolingcreateid: z.number(),
})

export const createsupplier = z.object({
    toolingCreate_Id: z.coerce.number(),
    supplierName: z.string(),
    quotationNo: z.string(),
    quotationDate: z.string(),
    price: z.coerce.number(),
    selectSupplier_Id: z.coerce.number().optional().nullable(),
    deleteFiles: z.array(z.string()).optional(),
})

export const updatestatusSupplier = z.object({
    selectSupplier_Id: z.coerce.number(),
    approve_UserId: z.coerce.number(),
    decision: z.string().optional().nullable(),
    approve: z.string(),
})



export type ToolingSetDate = z.infer<typeof toolingsetdate>;
export type CreateSupplier = z.infer<typeof createsupplier>;
export type UpdateStatusSupplier = z.infer<typeof updatestatusSupplier>;
