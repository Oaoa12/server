import { Comment, User } from '../models/models.js';

class CommentController {
    async add(req, res) {
        try {
            const { kinopoiskId, text } = req.body;
            const userId = req.user.id;

            const comment = await Comment.create({ userId, kinopoiskId, text });
            return res.json(comment);
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    async remove(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            const comment = await Comment.findOne({ where: { id } });
            if (!comment) {
                return res.status(404).json({ message: 'Комментарий не найден' });
            }

            if (comment.userId !== userId && userRole !== 'ADMIN') {
                return res.status(403).json({ message: 'Нет доступа' });
            }

            await Comment.destroy({ where: { id } });
            return res.json({ message: 'Комментарий удалён' });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    async getByMovie(req, res) {
        try {
            const { kinopoiskId } = req.params;
            const comments = await Comment.findAll({ 
                where: { kinopoiskId },
                include: [{ model: User, attributes: ['login'] }] // Добавляем логин автора
            });
            return res.json(comments);
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
}

export default new CommentController();