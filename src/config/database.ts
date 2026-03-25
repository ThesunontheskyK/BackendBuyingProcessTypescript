import sql from 'mssql';
import dotenv from 'dotenv'

dotenv.config();

const sqlConfig: sql.config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    server: process.env.SQL_SERVER as string,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
}

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export const getConnection = async () => {
    // ถ้าระบบยังไม่เคยเชื่อมต่อ DB มาก่อนเลย (ครั้งแรกสุด) ให้เริ่มเชื่อมต่อ
    if (!poolPromise) {
        poolPromise = sql.connect(sqlConfig).then(pool => {
            console.log('Connected to database');
            return pool;
        }).catch(error => {
            console.error('Error connecting to database', error);
            poolPromise = null; // รีเซ็ตใหม่ถ้าเชื่อมต่อล้มเหลว
            throw error;
        });
    }
    
    // ถ้าเคยเชื่อมต่อไว้แล้ว จะส่งค่าของเดิมที่เคยเชื่อมไว้กลับไปให้ทันทีโดยไม่ต่อซ้ำ
    return poolPromise;
}

