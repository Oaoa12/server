import jwt from 'jsonwebtoken';
import ApiError from '../error/apiError.js';

export default function(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(ApiError.unauthorized('Не авторизован'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Не авторизован'));
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return next(ApiError.unauthorized('Не авторизован'));
  }
}