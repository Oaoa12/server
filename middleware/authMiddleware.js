import jwt from 'jsonwebtoken';
import ApiError from '../error/apiError.js';

export default function (req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(ApiError.unauthorized('Не авторизован: отсутствует токен'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Не авторизован: токен пустой'));
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Токен истек' });
    }
    return next(ApiError.unauthorized('Не авторизован'));
  }
};