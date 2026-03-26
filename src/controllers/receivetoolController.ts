import { Request, Response, NextFunction } from 'express';
import { getConnection } from '../config/database';
import sql, { Transaction } from 'mssql';
import * as fileUtil from '../middleware/fileSave';
import getToolingListlogTool from '../middleware/ToolingListlogTool';
const getFormattedDate = () => new Date().toISOString().split('T')[0];

const getReceiveToolingList = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const toolingList = await getToolingListlogTool(3);
        res.status(200).json(toolingList);
    } catch (error) {
        next(error);
    }
}

const getReceiveDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { toolingCreate_Id } = req.body
        const pool = await getConnection();
        const result = await pool.request()
            .input("toolingCreate_Id", sql.Int, toolingCreate_Id)
            .query(`SELECT * FROM log_ToolingCreate WHERE toolingCreate_Id = @toolingCreate_Id`)
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        next(err)
    }
}


const updateReceive = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { receivepart_Id, reason, deleteFiles = [] } = req.body;
        const files = req.files as Express.Multer.File[] | [];
        const pool = await getConnection();
        let existingFileObj: any = null;
        //check ว่ามีข้อมูลอยู่แล้วหรือยัง
        const currentdata = await pool.request()
        .input("receivepart_Id",sql.Int,receivepart_Id)
        .query(`select filesave from log_receivepart where receivepart_Id = @receivepart_Id`)
        //ตรวจสอบว่าข้อมูลที่จัดเก็บถูกต้องไหม
        if(currentdata.recordset.length===0){
            res.status(404).json({ message: "Receive part not found for updating" });
            return;
        }
        //ดึงข้อมูลที่จัดเก็บ
        const currentrecord = currentdata.recordset[0];
        //ตรวจสอบว่ามีข้อมูลที่จัดเก็บไหม
        if(currentrecord.fileSave){
            try{
                existingFileObj = JSON.parse(currentrecord.fileSave);

            }catch(e){
                next(e)
                return
            }
        }
        const finalFileObj = fileUtil.processFileUpdates(existingFileObj,files,deleteFiles,"receivepart");
        const fileSaveData = finalFileObj ? JSON.stringify(finalFileObj) : null;

        const getdate = getFormattedDate();
        const transaction = new sql.Transaction(pool);
        try{
            await transaction.begin();
            await transaction.request()
            .input("receivepart_Id", sql.Int, receivepart_Id)
            .input("reason", sql.NVarChar, reason)
            .input("filesSave", sql.NVarChar, fileSaveData)
            .input("user_Id", sql.Int, req.user?.id)
            .input("date", sql.NVarChar, getdate)
            .query(`UPDATE log_ReceivePart SET reason = @reason, filesSave = @filesSave, reveivePartSubmit_UserId = @user_Id, reveivePartSubmit_Date = @date WHERE receivepart_Id = @receivepart_Id`)
            transaction.commit();

        }catch(error){
            if(transaction){
                await transaction.rollback()
                fileUtil.cleanupUploadedFiles(files);
                next(error)
                return
            }
        }
        res.status(200).json({ message: "Receive part updated successfully" });
        }
   
    catch (error) {
        next(error);
    }
}

const updatestatus = async (req:Request,res:Response,next:NextFunction) =>{
    try{
        const {receivepart_Id} = req.body;
        
        const pool = await getConnection();
        const checkpart_Id = await pool.request()
        .input('receivepart_Id',sql.Int,receivepart_Id)
        .query(`select * from log_receivePart whert receivepart_Id = @receivepart_Id`)
        if(checkpart_Id.recordset.length === 0){
            res.status(404).json({ message: "Receive part not found for updating" });
            return;
        }

        const transaction = new sql.Transaction(pool);
        const getdate = getFormattedDate();
        try{
            await transaction.begin();
            await transaction.request()
            .input("receivepart_Id", sql.Int, receivepart_Id)
            .input("userid",sql.Int,req.user?.id)
            .input("date",sql.NVarChar,getdate)
            .query(`UPDATE log_ReceivePart SET issueStatus_Id = 4, reveivePartSubmit_UserId = @userid, reveivePartSubmit_Date = @date WHERE receivepart_Id = @receivepart_Id`)
            transaction.commit();
        }catch(error){
            if(transaction){
                await transaction.rollback()
                next(error)
                return
            }
        }
        res.status(200).json({ message: "Receive part updated successfully" });
    }catch(error){
        next(error);
    }
}
export default { getReceiveToolingList, getReceiveDetail,updateReceive,updatestatus }