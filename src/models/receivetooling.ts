import { z } from 'zod';




export const updateReciveTooling = z.object({
    receivePart_Id: z.coerce.number(),
    approve_UserId: z.coerce.number(),
    reason: z.string().optional().nullable(),
    deleteFiles: z.array(z.string()).optional().default([]),
})


export type UpdateReciveTooling = z.infer<typeof updateReciveTooling>;
