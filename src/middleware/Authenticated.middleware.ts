// src/middleware/Authenticated.middleware.ts
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";

dotenv.config();

// กำหนดโครงสร้างของข้อมูลที่จะอยู่ใน Token
export interface JWTPayload extends JwtPayload {
    userId: number;
    username?: string;
    role?: string | string[];
}

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.user = decoded;
        next();
    } catch (err) {
        // กรณีที่ Token ผิดพลาด เราจะปล่อยผ่านไปก่อน 
        // เพื่อให้ requireRoles เป็นคนตัดสินใจว่าจะให้เข้าถึงหรือไม่
        next();
    }
};

const authorizeRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                message: "Forbidden: User or role not found.",
            });
        }

        const userRoles = Array.isArray(req.user.role)
            ? req.user.role
            : [req.user.role];

        const hasRequiredRole = userRoles.some((r) =>
            allowedRoles.includes(r as string)
        );

        if (hasRequiredRole) {
            next();
        } else {
            res.status(403).json({
                message: "Forbidden: Insufficient permissions.",
            });
        }
    };
};

const generateToken = (payload: any, expiresIn: any) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};


const requireRoles = (roles: string[] = []) => {
    return roles.length
        ? [authenticateJWT, authorizeRoles(roles)]
        : [authenticateJWT];
};

export { authenticateJWT, authorizeRoles, generateToken, requireRoles };
