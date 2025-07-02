import { Router } from 'express';
import userRouter from './userRouter.js';
import favoriteRouter from './favoriteRouter.js';
import commentRouter from './commentRouter.js';
import likeRouter from './likeRouter.js';

const router = Router();

router.use('/user', userRouter);
router.use('/favorites', favoriteRouter);
router.use('/comments', commentRouter);
router.use('/likes', likeRouter);

export default router;