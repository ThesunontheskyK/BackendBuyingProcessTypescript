import { Router } from 'express';
import multer from 'multer';
import { logToolingPage } from '../models/logToolingPage';
import { createsupplier } from '../models/selectsupplier';
import { getsupplieToolingList, toolinglistsetdate, createSupplier } from '../controllers/selectSuplierController';
import { toolingsetdate } from '../models/selectsupplier';
import { validate } from '../middleware/validate';

const router = Router();
const upload = multer({ dest: 'public/selectsupplier/' })

router.post('/getToolingList', validate(logToolingPage), getsupplieToolingList);
router.post('/toolinglistsetdate', validate(toolingsetdate), toolinglistsetdate);
router.post('/createSupplier',upload.array('files'), validate(createsupplier), createSupplier);
export default router;
