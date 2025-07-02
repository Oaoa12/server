import { Router } from 'express';
import userRouter from './userRouter.js';
import favoriteRouter from './favoriteRouter.js';
import commentRouter from './commentRouter.js';
import likeRouter from './likeRouter.js';

const router = Router();

router.use('/api/user', userRouter);
router.use('/api/favorites', favoriteRouter);
router.use('/api/comments', commentRouter);
router.use('/api/likes', likeRouter);

export default router;