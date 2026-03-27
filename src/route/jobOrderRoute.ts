import { Router } from 'express';
import multer from 'multer';
import { jobOrderSchema } from '../models/jobOrder';
import { getallJobOrder, getJobOrderById, createJobOrder, updatestatusjoborder, getjobOrderList } from '../controllers/jobOrderController';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/Authenticated.middleware';
import { checkAbility } from '../middleware/ability.middleware';
const router = Router();
const upload = multer({ dest: 'public/jobOrder/' })

// Use generic validate middleware
router.post('/CreatejobOrder', authenticateJWT, checkAbility('create', 'JobOrder'), upload.array('files'), validate(jobOrderSchema), createJobOrder);

router.get('/jobOrder', getallJobOrder);
router.post('/jobOrderById', getJobOrderById);
router.put('/updateJobOrderStatus', updatestatusjoborder);
router.get('/jobOrderList', getjobOrderList);

export default router;
