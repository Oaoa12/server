import { Favorite, User } from '../models/models.js';
import ApiError from '../error/apiError.js';

class FavoriteController {
    async add(req, res, next) {
        try {
            const { kinopoiskId } = req.body;
            const userId = req.user.id;

            const parsedKinopoiskId = parseInt(kinopoiskId, 10);
            if (!parsedKinopoiskId || parsedKinopoiskId <= 0) {
                return next(ApiError.badRequest('Некорректный ID фильма'));
            }

            const existing = await Favorite.findOne({ where: { userId, kinopoiskId: parsedKinopoiskId } });
            if (existing) {
                return next(ApiError.badRequest('Фильм уже в избранном'));
            }

            const favorite = await Favorite.create({ userId, kinopoiskId: parsedKinopoiskId });
            console.log('Added to favorites:', { userId, kinopoiskId: parsedKinopoiskId });

            return res.json({ favorite, message: 'Фильм добавлен в избранное' });
        } catch (e) {
            console.error('Error adding to favorites:', e);
            return next(ApiError.internal('Ошибка при добавлении фильма в избранное'));
        }
    }

    async remove(req, res, next) {
        try {
            const { kinopoiskId } = req.body;
            const userId = req.user.id;

            const parsedKinopoiskId = parseInt(kinopoiskId, 10);
            if (!parsedKinopoiskId || parsedKinopoiskId <= 0) {
                return next(ApiError.badRequest('Некорректный ID фильма'));
            }

            const existing = await Favorite.findOne({ where: { userId, kinopoiskId: parsedKinopoiskId } });
            if (!existing) {
                return next(ApiError.badRequest('Фильм не найден в избранном'));
            }

            await Favorite.destroy({ where: { userId, kinopoiskId: parsedKinopoiskId } });
            console.log('Removed from favorites:', { userId, kinopoiskId: parsedKinopoiskId });

            return res.json({ message: 'Фильм удалён из избранного' });
        } catch (e) {
            console.error('Error removing from favorites:', e);
            return next(ApiError.internal('Ошибка при удалении фильма из избранного'));
        }
    }

    async getAll(req, res, next) {
        try {
            const userId = req.user.id;
            const { limit = 10, offset = 0 } = req.query;
            const favorites = await Favorite.findAll({
                where: { userId },
                limit: parseInt(limit),
                offset: parseInt(offset),
            });
            console.log('Fetched favorites for user:', { userId, count: favorites.length });
            return res.json(favorites);
        } catch (e) {
            console.error('Error fetching favorites:', e);
            return next(ApiError.internal('Ошибка при получении списка избранного'));
        }
    }
}

export default new FavoriteController();