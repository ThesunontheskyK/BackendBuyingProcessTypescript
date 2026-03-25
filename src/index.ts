import express, { Request, Response, NextFunction } from 'express';
import { getConnection } from './config/database';
import dotenv from 'dotenv';
import cors from 'cors';
import jobOrderRoute from './route/jobOrderRoute';
import selectSupplierRoute from './route/selectSupplierRoute';
import loginRoute from './route/loginRoute';

import { notFound, errorHandler } from './middleware/errorHandler';
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toLocaleString('th-TH')}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/api', jobOrderRoute);
app.use('/api', selectSupplierRoute);
app.use('/auth', loginRoute);

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
    try {
        await getConnection();
        app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    } catch (error) {
        console.error('Fail to starting server', error);
    }
}

startServer();