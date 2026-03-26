import { Router } from 'express';
import multer from 'multer';
import { logToolingPage } from '../models/logToolingPage';
import { createsupplier } from '../models/selectsupplier';
import { getsupplieToolingList, toolinglistsetdate, createSupplier } from '../controllers/selectSuplierController';
import { toolingsetdate } from '../models/selectsupplier';
import { validate } from '../middleware/validate';
import {updatestatusSupplier as updatestatus} from '../models/selectsupplier';
import {updatestatusSupplier} from '../controllers/selectSuplierController';
import {submitsup} from '../controllers/selectSuplierController';
const router = Router();
const upload = multer({ dest: 'public/selectsupplier/' })

router.post('/getToolingList', validate(logToolingPage), getsupplieToolingList);
router.post('/toolinglistsetdate', validate(toolingsetdate), toolinglistsetdate);
router.post('/createSupplier',upload.array('files'), validate(createsupplier), createSupplier);
router.post('/updatestatusSupplier', validate(updatestatus), updatestatusSupplier);
router.post('/submitsup', submitsup);
export default router;
