import { Router } from 'express';
import favoriteController from '../controllers/favoriteController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, favoriteController.add);

router.delete('/', authMiddleware, favoriteController.remove);

router.get('/', authMiddleware, favoriteController.getAll);

export default router;