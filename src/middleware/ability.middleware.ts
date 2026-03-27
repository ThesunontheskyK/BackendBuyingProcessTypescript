import {Request,Response,NextFunction} from 'express';
import {defineAbilitiesFor} from '../config/ability';


export const checkAbility = (action: string,subject:string)=>{

    return(req:Request,res:Response,next:NextFunction)=>{
        if(!req.user){
            return res.status(401).json({message:"Unauthorized"})
        }
        const ability = defineAbilitiesFor(req.user);
        (req as any).ability = ability;
        if(ability.can(action as any,subject as any)){
            next();
        }else{
            return res.status(403).json({message:"Forbidden"})
        }
    }

}  