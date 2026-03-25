import { getConnection } from '../config/database';
import sql from 'mssql';

export const getToolingList = async (page: number) => {
    if (!page || page > 6 || page <= 1) {
        throw new Error('page is required');
        console.log('page is required');
    }
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("page", sql.Int, page)
            .query(`Select ROW_NUMBER() OVER(ORDER BY case when lt.toolingCreateStatus_Id = 2 then 0 else 1 end asc ,lt.toolingCreate_Id DESC) as no, jo.runningNo,jo.initCustomer,jo.initPartNo,
            CONVERT(varchar, lt.openJobDate, 23) as openJobDate,
            CONVERT(varchar, lt.startDate, 23) as startDate,
            CONVERT(varchar, lt.dueDate, 23) as dueDate,
            lt.toolingCreateStatus_Id, lt.toolingCreate_Id, s.supplierName
            from log_ToolingCreate lt 
            left join log_JobOrder jo on jo.jobOrder_Id = lt.jobOrder_Id 
            left join log_SelectSupplier s on s.toolingCreate_Id = lt.toolingCreate_Id AND s.issueStatus_Id = 3
            where lt.toolingCreateStatus_Id >= @page`);
        return result.recordset;
    } catch (error) {
        throw error;
    }
}

export default getToolingList;