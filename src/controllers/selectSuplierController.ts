import { Request, Response, NextFunction } from 'express';
import { getConnection } from '../config/database';
import sql from 'mssql';
import * as fileUtil from '../middleware/fileSave';
import getToolingListlogTool from '../middleware/ToolingListlogTool';

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




const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
    try {


        const { toolingCreate_Id, supplierName, quotationNo, price, quotationDate } = req.body;

            const files = (req.files as any) || [];


        const fileSaveObj = fileUtil.formatFileSaveObject(files, "selectSupplier");
        const fileSaveData = JSON.stringify(fileSaveObj);

        const pool = await getConnection();

        // Insert into log_SelectSupplier
        const createInfo = `Insert into log_SelectSupplier (toolingCreate_Id, supplierName, quotationNo, quotationDate, price, fileSave, issueStatus_Id) 
                             VALUES (@toolingCreate_Id, @supplierName, @quotationNo, @quotationDate, @price, @fileSave, 1)`;

        const result = await pool
            .request()
            .input("toolingCreate_Id", sql.Int, toolingCreate_Id)
            .input("supplierName", sql.NVarChar, supplierName)
            .input("quotationNo", sql.NVarChar, quotationNo)
            .input("quotationDate", sql.NVarChar, quotationDate)
            .input("price", sql.Decimal(18, 2), price) // Assuming price is decimal/money
            .input("fileSave", sql.NVarChar, fileSaveData)
            .query(createInfo);

        res.status(200).json({
            result: result.recordset,
            files: fileSaveObj,
            message: "Supplier info and files processed successfully",
        });
    } catch (err) {
        next(err);
    }
};

export { getsupplieToolingList, toolinglistsetdate, createSupplier };
