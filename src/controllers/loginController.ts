import { getConnection } from '../config/database';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, password } = req.body;
        const pool = await getConnection();
        const checkUser = await pool.request()
            .input('username', username)
            .query(`SELECT * from mst_User where userName = @username and deleteFlag = 0`);

        if (checkUser.recordset.length === 0) {
            return res.status(404).json({ message: "Not Found User" });
        }
        const user = checkUser.recordset[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) return res.status(400).send({ message: "Password Invalid" });

        let parsedPermission = [];
        if (user.permission) {
            try {
                parsedPermission = JSON.parse(user.permission);
            } catch (e) {
                console.error(`Failed to parse permission for user ${user.userName}:`, e);
            }
        }

        const payload = {
            userId: user.userId,
            username: user.userName,
            department_Id: user.department_Id,
            position_Id: user.position_Id,
            name: user.name,
            imagePath: user.imagePath,
            permission: parsedPermission,
            role: user.role,

        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30m' });

        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'Login Success', token });
    } catch (err) {
        next(err);
    }
}

export { login };