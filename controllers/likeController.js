import { Like } from '../models/models.js';
import ApiError from '../error/apiError.js';

export const getLikes = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user?.id;

    if (!movieId) {
      return next(ApiError.badRequest('Требуется ID фильма'));
    }

    const parsedMovieId = parseInt(movieId, 10);
    if (isNaN(parsedMovieId) || parsedMovieId <= 0) {
      return next(ApiError.badRequest('Некорректный ID фильма'));
    }

    const likes = await Like.count({ where: { movie_id: parsedMovieId, is_like: true } });
    const dislikes = await Like.count({ where: { movie_id: parsedMovieId, is_like: false } });

    let userReaction = null;
    if (userId) {
      const reaction = await Like.findOne({ where: { user_id: userId, movie_id: parsedMovieId } });
      userReaction = reaction ? reaction.is_like : null;
    }

    return res.json({
      likes,
      dislikes,
      userReaction,
    });
  } catch (e) {
    return next(ApiError.internal('Не удалось получить лайки'));
  }
};

export const setLike = async (req, res, next) => {
  try {
    const { movieId } = req.body;
    const userId = req.user.id;

    if (!movieId) {
      return next(ApiError.badRequest('Требуется ID фильма'));
    }

    const parsedMovieId = parseInt(movieId, 10);
    if (isNaN(parsedMovieId) || parsedMovieId <= 0) {
      return next(ApiError.badRequest('Некорректный ID фильма'));
    }

    let like = await Like.findOne({ where: { user_id: userId, movie_id: parsedMovieId } });

    if (like) {
      if (like.is_like) {
        await like.destroy();
        like = null;
      } else {
        like.is_like = true;
        await like.save();
      }
    } else {
      like = await Like.create({ user_id: userId, movie_id: parsedMovieId, is_like: true });
    }

    const likesCount = await Like.count({ where: { movie_id: parsedMovieId, is_like: true } });
    const dislikesCount = await Like.count({ where: { movie_id: parsedMovieId, is_like: false } });

    return res.json({
      likes: likesCount,
      dislikes: dislikesCount,
      userReaction: like ? like.is_like : null,
    });
  } catch (e) {
    return next(ApiError.internal('Не удалось установить лайк'));
  }
};

export const setDislike = async (req, res, next) => {
  try {
    const { movieId } = req.body;
    const userId = req.user.id;

    if (!movieId) {
      return next(ApiError.badRequest('Требуется ID фильма'));
    }

    const parsedMovieId = parseInt(movieId, 10);
    if (isNaN(parsedMovieId) || parsedMovieId <= 0) {
      return next(ApiError.badRequest('Некорректный ID фильма'));
    }

    let like = await Like.findOne({ where: { user_id: userId, movie_id: parsedMovieId } });

    if (like) {
      if (!like.is_like) {
        await like.destroy();
        like = null;
      } else {
        like.is_like = false;
        await like.save();
      }
    } else {
      like = await Like.create({ user_id: userId, movie_id: parsedMovieId, is_like: false });
    }

    const likesCount = await Like.count({ where: { movie_id: parsedMovieId, is_like: true } });
    const dislikesCount = await Like.count({ where: { movie_id: parsedMovieId, is_like: false } });

    return res.json({
      likes: likesCount,
      dislikes: dislikesCount,
      userReaction: like ? like.is_like : null,
    });
  } catch (e) {
    return next(ApiError.internal('Не удалось установить дизлайк'));
  }
};