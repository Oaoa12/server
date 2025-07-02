import { Router } from 'express';
import { setLike, setDislike, getLikes } from '../controllers/likeController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/like', authMiddleware, setLike);
router.post('/dislike', authMiddleware, setDislike);
router.get('/:movieId', authMiddleware, getLikes);

export default router;