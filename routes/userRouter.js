import { Router } from 'express';
import UserController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/registration', UserController.registration);
router.post('/login', UserController.login);
router.post('/refresh', UserController.refresh);
router.post('/logout', UserController.logout);
router.get('/auth', authMiddleware, UserController.check);

export default router;