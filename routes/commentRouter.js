import { Router } from 'express';
import commentController from '../controllers/commentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import checkAdminMiddleware from '../middleware/checkAdminMiddleware.js';

const router = Router();

router.post('/', authMiddleware, commentController.add);

router.delete('/:id', authMiddleware, checkAdminMiddleware, commentController.remove);

router.get('/:kinopoiskId', commentController.getByMovie);

export default router;