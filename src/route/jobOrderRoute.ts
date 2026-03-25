import { Router } from 'express';
import multer from 'multer';
import { jobOrderSchema } from '../models/jobOrder';
import { getallJobOrder, getJobOrderById, createJobOrder, updatestatusjoborder, getjobOrderList } from '../controllers/jobOrderController';
import { validate } from '../middleware/validate';

const router = Router();
const upload = multer({ dest: 'public/jobOrder/' })

// Use generic validate middleware
router.post('/CreatejobOrder', upload.array('files'), validate(jobOrderSchema), createJobOrder);

router.get('/jobOrder', getallJobOrder);
router.post('/jobOrderById', getJobOrderById);
router.put('/updateJobOrderStatus', updatestatusjoborder);
router.get('/jobOrderList', getjobOrderList);

export default router;
