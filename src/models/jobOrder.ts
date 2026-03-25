import { z } from 'zod';

export const toolingDetailSchema = z.object({
    jobOrderSample: z.string().optional(),
    prNo: z.string().optional(),
    toolingCost: z.object({
        amount: z.number(),
        currency: z.string()
    }),
    toolingPrice: z.object({
        amount: z.number(),
        currency: z.string()
    }),
    machine: z.string(),
    strokeLive: z.number(),
    registerToolingItemNo: z.string(),
    remark: z.string().optional(),
    saleCondition: z.string(),
    toolingTerms: z.object({
        selected: z.string().min(1).trim(),
        detail: z.string().nullable()
    }),
    createType: z.object({
        selected: z.string().min(1).trim(),
        duplicationQty: z.number().nullable().optional()
    }),
    typeOfMaker: z.object({
        selected: z.string().min(1).trim(),
        otherDetail: z.string().nullable()
    }),
    typeOfIndustry: z.object({
        selected: z.string().min(1).trim(),
        otherDetail: z.string().nullable()
    }),
    historyLog: z.array(z.object({
        action: z.string(),
        ByUser: z.string(),
        Date: z.string(),
        reason: z.string().optional()
    }))
});

export const jobOrderSchema = z.object({
    jobOrder_Id: z.number().optional(),
    toolingDetail: toolingDetailSchema,
    refToolingCode: z.number().optional(),
    initCustomer: z.string(),
    initPartNo: z.string(),
    responeSale_UserId: z.number(),
    jobOrderSubmit_userId: z.number(),
    toolingType_Id: z.number(),
});

export const jobOrderList = z.object({
    no: z.number(),
    jobOrder_Id: z.number(),
    runningNo: z.string(),
    initCustomer: z.string(),
    initPartNo: z.string(),
    issueDate: z.string(),
    statusName: z.string(),

})

export type toolingDetail = z.infer<typeof toolingDetailSchema>;
export type jobOrder = z.infer<typeof jobOrderSchema>;