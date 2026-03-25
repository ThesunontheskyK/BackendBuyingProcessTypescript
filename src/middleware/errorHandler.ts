import { Request, Response, NextFunction } from "express";

export const notFound = (req:Request,res:Response,next:NextFunction) =>{
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}

export const errorHandler = (error:Error,req:Request,res:Response,next:NextFunction)=>{
   const statuscode = res.statusCode === 200 ? 500 : res.statusCode;
   console.error(`[Error]: ${error.message}`);

   res.status(statuscode).json({
    status: false,
    message: error.message
   })
  
}