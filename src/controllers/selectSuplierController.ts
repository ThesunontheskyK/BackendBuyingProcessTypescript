import { Request, Response, NextFunction } from 'express';
import { getConnection } from '../config/database';
import sql from 'mssql';
import * as fileUtil from '../middleware/fileSave';
import getToolingListlogTool from '../middleware/ToolingListlogTool';
const getFormattedDate = () => new Date().toISOString().split('T')[0];

const getsupplieToolingList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const toolingList = await getToolingListlogTool(2);
        res.status(200).json(toolingList);
    } catch (error) {
        next(error);
    }
}

const toolinglistsetdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { openjobdate, startdate, duedate, toolingcreateid } = req.body
        const pool = await getConnection();


        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        const result = await transaction.request()
            .input("openjobdate", sql.Date, openjobdate)
            .input("startdate", sql.Date, startdate)
            .input("duedate", sql.Date, duedate)
            .input("toolingcreateid", sql.Int, toolingcreateid)
            .query(`UPDATE log_ToolingCreate SET openJobDate = @openjobdate, startDate = @startdate, dueDate = @duedate WHERE toolingCreate_Id = @toolingcreateid`);
        await transaction.commit();
        res.status(200).json("success");
    } catch (error) {
        next(error);
    }
}

const getSupplierList = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {toolingCreate_Id} = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input("toolingCreateId", sql.Int, toolingCreate_Id)
            .query(`SELECT * FROM log_SelectSupplier WHERE toolingCreate_Id = @toolingCreateId`);
        res.status(200).json(result.recordset);
    }catch(err){
        next(err)
    }   
}

const getSupplierbyId = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {toolingCreateId} = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input("toolingCreateId", sql.Int, toolingCreateId)
            .query(`SELECT * FROM log_SelectSupplier WHERE toolingCreate_Id = @toolingCreateId`);
        res.status(200).json(result.recordset[0]);
    }catch(err){
        next(err)
    }
}

const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    try {
        const { toolingCreate_Id, supplierName, quotationNo, price, quotationDate, selectSupplier_Id, deleteFiles = [] } = req.body;
        const files = (req.files as any) || [];

        let existingFileObj: any = null;

        if (selectSupplier_Id) {
            // Check if record exists and get existing files
            const currentDataQuery = `SELECT fileSave FROM log_SelectSupplier WHERE selectSupplier_Id = @selectSupplier_Id`;
            const currentResult = await pool.request()
                .input("selectSupplier_Id", sql.Int, selectSupplier_Id)
                .query(currentDataQuery);

            if (currentResult.recordset.length === 0) {
                res.status(404).json({ message: "Supplier record not found for updating" });
                return;
            }

            const currentRecord = currentResult.recordset[0];
            if (currentRecord.fileSave) {
                try { existingFileObj = JSON.parse(currentRecord.fileSave); } catch (e) { }
            }
        }

        // Handle file updates (merge new files and remove deleted ones)
        const finalFileObj = fileUtil.processFileUpdates(existingFileObj, files, deleteFiles, "selectSupplier");
        const fileSaveData = finalFileObj ? JSON.stringify(finalFileObj) : null;

        await transaction.begin();

        if (selectSupplier_Id) {
            // Update mode
            const updateInfo = `UPDATE log_SelectSupplier SET 
                                 supplierName = @supplierName, 
                                 quotationNo = @quotationNo, 
                                 quotationDate = @quotationDate, 
                                 price = @price, 
                                 fileSave = @fileSave 
                                 WHERE selectSupplier_Id = @selectSupplier_Id`;

            await transaction.request()
                .input("selectSupplier_Id", sql.Int, selectSupplier_Id)
                .input("supplierName", sql.NVarChar, supplierName)
                .input("quotationNo", sql.NVarChar, quotationNo)
                .input("quotationDate", sql.NVarChar, quotationDate)
                .input("price", sql.Decimal(18, 2), price)
                .input("fileSave", sql.NVarChar, fileSaveData)
                .query(updateInfo);

        } else {
            // Create mode
            const createInfo = `Insert into log_SelectSupplier (toolingCreate_Id, supplierName, quotationNo, quotationDate, price, fileSave, issueStatus_Id) 
                                 VALUES (@toolingCreate_Id, @supplierName, @quotationNo, @quotationDate, @price, @fileSave, 1)`;

            await transaction.request()
                .input("toolingCreate_Id", sql.Int, toolingCreate_Id)
                .input("supplierName", sql.NVarChar, supplierName)
                .input("quotationNo", sql.NVarChar, quotationNo)
                .input("quotationDate", sql.NVarChar, quotationDate)
                .input("price", sql.Decimal(18, 2), price)
                .input("fileSave", sql.NVarChar, fileSaveData)
                .query(createInfo);
        }

        await transaction.commit();

        res.status(200).json({
            message: selectSupplier_Id ? "Supplier info updated successfully" : "Supplier info created successfully",
            files: finalFileObj
        });

    } catch (err) {
        if (transaction) {
            try { await transaction.rollback(); } catch (rollbackErr) { }
        }
        fileUtil.cleanupUploadedFiles((req.files as any) || []);
        next(err);
    }
};

const submitsup = async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {selectSupplier_Id} = req.body;
        const pool = await getConnection();
        const check = await pool.request()
            .input("selectSupplier_Id", sql.Int, selectSupplier_Id)
            .query(`SELECT * from log_SelectSupplier WHERE selectSupplier_Id = @selectSupplier_Id`)
        if(check.recordset.length === 0){
            res.status(404).json({ message: "Record not found" });
            return;
        }

        const result = await pool.request()
            .input("selectSupplier_Id", sql.Int, selectSupplier_Id)
            .query(`UPDATE log_SelectSupplier SET issueStatus_Id = 2 WHERE selectSupplier_Id = @selectSupplier_Id`);
        res.status(200).json("success");
    }catch (err){
        next(err)
    }
}

const updatestatusSupplier = async (req: Request, res: Response, next: NextFunction) => {
    let transaction: sql.Transaction | null = null;
    try {
        const { selectSupplier_Id, approve_UserId, decision, approve } = req.body;
        const pool = await getConnection();
        const formattedDate = getFormattedDate();

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 1. Get toolingCreate_Id from the record
        const idResult = await new sql.Request(transaction)
            .input("ssId", sql.Int, selectSupplier_Id)
            .query(`SELECT toolingCreate_Id FROM log_SelectSupplier WHERE selectSupplier_Id = @ssId`);

        if (idResult.recordset.length === 0) {
            await transaction.rollback();
            res.status(404).json({ message: "Record not found" });
            return;
        }

        const tId = idResult.recordset[0].toolingCreate_Id;

        if (approve === 'Reject') {
            // 2. Reject Logic
            await new sql.Request(transaction)
                .input("decision", sql.NVarChar, decision)
                .input("ssId", sql.Int, selectSupplier_Id)
                .query(`UPDATE log_SelectSupplier 
                        SET decisionResult = ISNULL(@decision, decisionResult),
                            decisionDate = NULL,
                            selectSupplierApprove_Date = NULL, 
                            selectSupplierSubmit_Date = NULL,
                            selectSupplierSubmit_UserId = NULL,
                            issueStatus_Id = 4, 
                            selectSupplierApprove_UserId = NULL 
                        WHERE selectSupplier_Id = @ssId`);

            if (tId) {
                await new sql.Request(transaction)
                    .input("tId", sql.Int, tId)
                    .query(`UPDATE log_ToolingCreate SET toolingCreateStatus_Id = 2 WHERE toolingCreate_Id = @tId`);
            }
        } else {
            // 3. Approve Logic
            await new sql.Request(transaction)
                .input("decision", sql.NVarChar, decision)
                .input("approveDate", sql.NVarChar, formattedDate)
                .input("approve_UserId", sql.Int, approve_UserId)
                .input("ssId", sql.Int, selectSupplier_Id)
                .query(`UPDATE log_SelectSupplier 
                        SET decisionResult = ISNULL(@decision, decisionResult), 
                            selectSupplierApprove_Date = @approveDate, 
                            issueStatus_Id = 3, 
                            selectSupplierApprove_UserId = @approve_UserId 
                        WHERE selectSupplier_Id = @ssId`);

            // Auto-Reject other suppliers for the same Tooling
            await new sql.Request(transaction)
                .input("tId", sql.Int, tId)
                .input("ssId", sql.Int, selectSupplier_Id)
                .query(`UPDATE log_SelectSupplier
                        SET issueStatus_Id = 4,
                            selectSupplierApprove_Date = NULL,
                            selectSupplierApprove_UserId = NULL
                        WHERE toolingCreate_Id = @tId AND selectSupplier_Id != @ssId`);

            if (tId) {
                // Update Master Tooling Status
                await new sql.Request(transaction)
                    .input("tId", sql.Int, tId)
                    .query(`UPDATE log_ToolingCreate SET toolingCreateStatus_Id = 3 WHERE toolingCreate_Id = @tId`);

                // Auto Create Receive Part Task if not exists
                const checkReceive = await new sql.Request(transaction)
                    .input("tId", sql.Int, tId)
                    .query(`SELECT 1 FROM log_ReceivePart WHERE toolingCreate_Id = @tId`);

                if (checkReceive.recordset.length === 0) {
                    await new sql.Request(transaction)
                        .input("tId", sql.Int, tId)
                        .query(`INSERT INTO log_ReceivePart (toolingCreate_Id, receivePartReviseNo, issueStatus_Id) VALUES (@tId, 1, 1)`);
                }
            }
        }

        await transaction.commit();
        res.status(200).json({ message: "Update success" });
    } catch (err) {
        if (transaction) {
            try { await transaction.rollback(); } catch (rollbackErr) { }
        }
        next(err);
    }
};

export { 
    getsupplieToolingList, 
    toolinglistsetdate, 
    createSupplier, 
    updatestatusSupplier, 
    getSupplierList, 
    getSupplierbyId ,
    submitsup
};
