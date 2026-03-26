import { Router } from 'express';
import multer from 'multer';
import { logToolingPage } from '../models/logToolingPage';
import { validate } from '../middleware/validate';
import { updateReciveTooling } from '../models/receivetooling';
import revice from '../controllers/receivetoolController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/getReceiveToolingList',validate(logToolingPage) ,revice.getReceiveToolingList);
router.post('/getReceiveDetail', revice.getReceiveDetail);
router.put('/updateReceiveTooling',validate(updateReciveTooling),revice.updateReceive);
router.put('/updateStatus',revice.updatestatus);



export default router;