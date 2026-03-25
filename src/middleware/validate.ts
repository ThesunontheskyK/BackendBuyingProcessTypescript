import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            let bodyToValidate = req.body;
            
            if (req.body.data && typeof req.body.data === "string") {
                try {
                    bodyToValidate = JSON.parse(req.body.data);
                } catch (e) {
                }
            }
            req.body = schema.parse(bodyToValidate);
            next();
            
        } catch (error) {
            if (error instanceof z.ZodError) {
                const readableErrors = error.issues.map((err: z.ZodIssue) => {
                    const fieldName = err.path.join('.');
                    return `${fieldName}: ${err.message}`;
                });

                return res.status(400).json({
                    success: false,
                    message: "ข้อมูลไม่ถูกต้อง (กรุณาตรวจสอบว่ากรอกข้อมูลครบถ้วนและถูกประเภท)",
                    errorDetails: readableErrors
                });
            }
            next(error);
        }
    };
};
