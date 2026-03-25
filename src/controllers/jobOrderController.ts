import { Request, Response, NextFunction } from 'express';
import { getConnection } from '../config/database';
import sql from 'mssql';
import * as fileUtil from '../middleware/fileSave';

const getjobOrderList = async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`SELECT ROW_NUMBER() OVER(ORDER BY jo.jobOrder_Id DESC) as no, 
            jo.jobOrder_Id,
            jo.runningNo,
            jo.initCustomer,
            jo.initPartNo,
            CONVERT(varchar, jo.issueDate, 23) as issueDate,
            t.toolingCreateDataStatus_Name 
            FROM log_JobOrder jo 
            Left Join mst_ToolingCreateData_Status t 
            on jo.toolingCreateStatus_Id = t.toolingCreateStatus_Id`);
        res.status(200).json(result.recordset);
    } catch (error) {
        next(error);
    }
}

const getallJobOrder = async (req: Request, res: Response) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM log_JobOrder');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error getting all job orders', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getJobOrderById = async (req: Request, res: Response,next:NextFunction) => {
    try {
        const { jobOrder_Id } = req.body;
        const pool = await getConnection();
        const result = await pool.request().input("jobOrder_Id", sql.Int, jobOrder_Id).query('SELECT * FROM log_JobOrder WHERE jobOrder_Id = @jobOrder_Id');
        const record = result.recordset[0];
        if(!record){
            return next(new Error("Job Order not found"));
        }
        const data = {
            ...record,
            toolingDetail: JSON.parse(record.toolingDetail),
            fileSave: JSON.parse(record.fileSave)
        }
        res.status(200).json(data);
    } catch (error) {
      next(error)
    }
}


const getFormattedDate = () => new Date().toISOString().split('T')[0];


const createJobOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        let bodyData: any = req.body;
        if (req.body.data && typeof req.body.data === "string") {
            try {
                bodyData = JSON.parse(req.body.data);
            } catch (e) {
                console.error("Error parsing req.body.data:", e);
            }
        }

        const {
            jobOrder_Id,
            initCustomer,
            initPartNo,
            toolingType_Id,
            responeSale_UserId,
            jobOrderSubmit_userId,
            toolingDetail
        } = bodyData;

        // รองรับการลบไฟล์ผ่านอาเรย์ deleteFiles (เช่น ["260316093721.png", ...])
        let rawDeleteFiles = req.body.deleteFiles || bodyData.deleteFiles;
        let deleteFiles: string[] = [];
        if (typeof rawDeleteFiles === "string") {
            try { deleteFiles = JSON.parse(rawDeleteFiles); } catch (e) { }
        } else if (Array.isArray(rawDeleteFiles)) {
            deleteFiles = rawDeleteFiles;
        }

        const pool = await getConnection();

        const getquerynam = `SELECT mu.name FROM mst_User mu WHERE mu.userId = @userId`;
        const resultname = await pool
            .request()
            .input("userId", sql.Int, jobOrderSubmit_userId)
            .query(getquerynam);

        const userName = resultname.recordset[0]?.name || "Unknown";
        const formattedDate = getFormattedDate();

        let historyLog = toolingDetail?.historyLog || [];
        let existingFileObj: any = null;

        if (jobOrder_Id) {
            const currentDataQuery = `SELECT toolingDetail, fileSave FROM log_JobOrder WHERE jobOrder_Id = @id`;
            const currentResult = await pool.request().input("id", sql.Int, jobOrder_Id).query(currentDataQuery);

            if (currentResult.recordset.length === 0) {
                res.status(404).json({ message: "Job Order not found for updating" });
                return; // เด้งออกเลยถ้าหาไม่เจอ
            }

            const currentRecord = currentResult.recordset[0];

            // ประวัติเก่า
            let existingDetail: any = {};
            try { existingDetail = JSON.parse(currentRecord.toolingDetail); } catch (e) { }
            historyLog = existingDetail.historyLog || [];

            // ไฟล์เก่าห้อยติดมาเผื่อไว้บวกกัน
            if (currentRecord.fileSave) {
                try { existingFileObj = JSON.parse(currentRecord.fileSave); } catch (e) { }
            }
        }

        historyLog.push({
            action: "Submit",
            ByUser: userName,
            Date: formattedDate,
            reason: "",
        });

        // ผูก Log ที่รวมสมบูรณ์เข้าไปใหม่
        if (toolingDetail) {
            toolingDetail.historyLog = historyLog;
        }
        const toolingDetailJSON = JSON.stringify(toolingDetail || {});

        // ถ้ามีการ Duplication ให้เก็บ Ref Code ลง Column ด้วย
        const refToolingCode =
            (toolingDetail?.createType?.selected?.includes("Duplication") || toolingDetail?.createType?.selected?.includes("Modification")) && toolingDetail?.createType?.refId
                ? toolingDetail.createType?.refId
                : null;

        const files = (req as any).files || [];
        const finalFileObj = fileUtil.processFileUpdates(existingFileObj, files, deleteFiles, "jobOrder");
        const fileSaveData = finalFileObj ? JSON.stringify(finalFileObj) : null;

        if (jobOrder_Id) {
            // ------ UPDATE MODE ------
            const updateQuery = `
                UPDATE log_JobOrder
                SET 
                    initCustomer = @initCustomer,
                    initPartNo = @initPartNo,
                    toolingType_Id = @toolingType_Id,
                    responeSale_UserId = @responeSale_UserId,
                    toolingDetail = @toolingDetail,
                    refToolingCode = @refToolingCode,
                    fileSave = @fileSave,
                    jobOrderSubmit_userId = @jobOrderSubmit_userId,
                    jobOrderSubmit_Date = @jobOrderSubmit_Date
                WHERE jobOrder_Id = @jobOrder_Id
            `;

            await pool.request()
                .input("jobOrder_Id", sql.Int, jobOrder_Id)
                .input("initCustomer", sql.NVarChar, initCustomer)
                .input("initPartNo", sql.NVarChar, initPartNo)
                .input("toolingType_Id", sql.TinyInt, toolingType_Id)
                .input("responeSale_UserId", sql.Int, responeSale_UserId)
                .input("toolingDetail", sql.NVarChar(sql.MAX), toolingDetailJSON)
                .input("refToolingCode", sql.Int, refToolingCode)
                .input("fileSave", sql.NVarChar, fileSaveData)
                .input("jobOrderSubmit_userId", sql.Int, jobOrderSubmit_userId)
                .input("jobOrderSubmit_Date", sql.NVarChar, formattedDate)
                .query(updateQuery);

            res.status(200).json({
                message: "Job Order updated successfully",
                files: finalFileObj
            });

        } else {
            // ------ INSERT MODE ------
            const transactionQuery = `
                BEGIN TRANSACTION;
                BEGIN TRY
                    DECLARE @YearPrefix INT = RIGHT(YEAR(GETDATE()), 2);
                    DECLARE @RunNo INT;
                    DECLARE @TypeCode NVARCHAR(10);
                    DECLARE @FullRunningNo NVARCHAR(20);

                    SELECT @TypeCode = toolingTypeCode FROM mst_ToolingType WHERE toolingType_Id = @toolingType_Id;

                    IF EXISTS (SELECT 1 FROM mst_RunningNo WITH (UPDLOCK, SERIALIZABLE) WHERE yearPrefix = @YearPrefix)
                    BEGIN
                        UPDATE mst_RunningNo SET @RunNo = lastRunningNo = lastRunningNo + 1 WHERE yearPrefix = @YearPrefix;
                    END
                    ELSE
                    BEGIN
                        SET @RunNo = 1;
                        INSERT INTO mst_RunningNo (yearPrefix, lastRunningNo) VALUES (@YearPrefix, @RunNo);
                    END

                    SET @FullRunningNo = CAST(@YearPrefix AS NVARCHAR) + '-' + RIGHT('000' + CAST(@RunNo AS NVARCHAR), 3) + '-' + @TypeCode;

                    INSERT INTO log_JobOrder (
                        runningNo,
                        toolingCreateStatus_Id,
                        toolingDetail,
                        refToolingCode,
                        initCustomer,
                        initPartNo,
                        responeSale_UserId,
                        jobOrderSubmit_userId,
                        jobOrderSubmit_Date,
                        toolingType_Id,
                        fileSave
                    ) VALUES (
                        @FullRunningNo,
                        1, 
                        @toolingDetail,
                        @refToolingCode,
                        @initCustomer,
                        @initPartNo,
                        @responeSale_UserId,
                        @jobOrderSubmit_userId,
                        @jobOrderSubmit_Date,
                        @toolingType_Id,
                        @fileSave
                    );

                    SELECT SCOPE_IDENTITY() AS newId, @FullRunningNo AS generatedRunningNo;
                    COMMIT TRANSACTION;
                END TRY
                BEGIN CATCH
                    ROLLBACK TRANSACTION;
                    THROW;
                END CATCH
            `;

            const result = await pool.request()
                .input("toolingType_Id", sql.TinyInt, toolingType_Id)
                .input("toolingDetail", sql.NVarChar(sql.MAX), toolingDetailJSON)
                .input("refToolingCode", sql.Int, refToolingCode)
                .input("initCustomer", sql.NVarChar, initCustomer)
                .input("initPartNo", sql.NVarChar, initPartNo)
                .input("responeSale_UserId", sql.Int, responeSale_UserId)
                .input("jobOrderSubmit_userId", sql.Int, jobOrderSubmit_userId)
                .input("jobOrderSubmit_Date", sql.NVarChar, formattedDate)
                .input("fileSave", sql.NVarChar, fileSaveData)
                .query(transactionQuery);

            res.status(201).json({
                message: "Job Order created successfully",
                data: result.recordset[0],
                files: finalFileObj,
            });
        }

    } catch (err) {
        fileUtil.cleanupUploadedFiles((req as any).files);
        next(err);
    }
};

const updatestatusjoborder = async (req: Request, res: Response, next: NextFunction) => {
    const { jobOrder_Id, action, userId } = req.body;
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    if (!action||action.length === 0) {
        return res.status(400).json({ message: 'Action is required' });
    }
    const getDate = getFormattedDate();
    try {
        await transaction.begin();
        const result = new sql.Request(transaction)
        if (action.includes('Approve')) {
            result.input('jobOrder_Id', sql.Int, jobOrder_Id)
                .input('userId', sql.Int, userId)
                .input('getDate', sql.NVarChar, getDate)
                .query('UPDATE log_JobOrder SET toolingCreateStatus_Id = 2 ,jobOrderApprove_UserId = @userId,jobOrderApprove_Date = @getDate WHERE jobOrder_Id = @jobOrder_Id');

            await result
            .input("JobOrderId", sql.Int, jobOrder_Id)
            .input("ApproveByUserId", sql.Int, userId)
            .execute("sp_JobOrder_Approve_And_CreateTooling")
            await transaction.commit();
            res.status(200).json({ message: "JobOrderUpdateStatus Approve"});
        }
        else if (action.includes('Reject')) {
            result.input('jobOrder_Id', sql.Int, jobOrder_Id)
                .query('UPDATE log_JobOrder SET toolingCreateStatus_Id = 3 WHERE jobOrder_Id = @jobOrder_Id');
            await transaction.commit();
            res.status(200).json({ message: "JobOrderUpdateStatus Reject"});
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }


    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}

export {
    getallJobOrder,
    getJobOrderById,
    createJobOrder,
    updatestatusjoborder,
    getjobOrderList
};
