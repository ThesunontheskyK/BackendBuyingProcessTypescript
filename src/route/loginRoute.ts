import { Router } from 'express';
import { login } from '../controllers/loginController';
import { validate } from '../middleware/validate';
import { loginSchema } from '../models/login';

const router = Router();

router.post('/login', validate(loginSchema), login);

export default router;
