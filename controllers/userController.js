import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Token } from '../models/models.js';
import ApiError from '../error/apiError.js';

const generateJwt = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.SECRET_KEY,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.SECRET_KEY,
    { expiresIn: '30d' }
  );
};

class UserController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Валидация
      if (!email?.trim() || !password?.trim()) {
        return next(ApiError.badRequest('Email и пароль обязательны'));
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Поиск пользователя
      const user = await User.findOne({ 
        where: { email: normalizedEmail } 
      });
      
      if (!user) {
        return next(ApiError.notFound('Пользователь не найден'));
      }

      // Проверка пароля
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return next(ApiError.badRequest('Неверный пароль'));
      }

      // Генерация токенов
      const accessToken = generateJwt(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id, user.email, user.role);

      // Обновление токена в БД
      await Token.upsert({
        user_id: user.id,
        refresh_token: refreshToken
      });

      // Установка куки
      res.cookie('refreshToken', refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
      });

      return res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error('Login error:', err);
      return next(ApiError.internal('Ошибка сервера'));
    }
  }

  async registration(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email?.trim() || !password?.trim()) {
        return next(ApiError.badRequest('Email и пароль обязательны'));
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Проверка существующего пользователя
      const candidate = await User.findOne({ 
        where: { email: normalizedEmail } 
      });
      
      if (candidate) {
        return next(ApiError.badRequest('Пользователь уже существует'));
      }

      // Хеширование пароля
      const hashPassword = await bcrypt.hash(password, 5);
      
      // Создание пользователя
      const user = await User.create({
        email: normalizedEmail,
        password: hashPassword,
        role: 'USER'
      });

      // Генерация токенов
      const accessToken = generateJwt(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id, user.email, user.role);

      // Сохранение токена
      await Token.create({
        user_id: user.id,
        refresh_token: refreshToken
      });

      // Установка куки
      res.cookie('refreshToken', refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
      });

      return res.status(201).json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error('Registration error:', err);
      return next(ApiError.internal('Ошибка регистрации'));
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      
      if (!refreshToken) {
        return next(ApiError.unauthorized('Не авторизован'));
      }

      // Верификация токена
      const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY);
      if (!decoded) {
        return next(ApiError.unauthorized('Недействительный токен'));
      }

      // Проверка токена в БД
      const tokenFromDb = await Token.findOne({
        where: { refresh_token: refreshToken }
      });
      
      if (!tokenFromDb) {
        return next(ApiError.unauthorized('Токен не найден'));
      }

      // Поиск пользователя
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return next(ApiError.unauthorized('Пользователь не найден'));
      }

      // Генерация новых токенов
      const newAccessToken = generateJwt(user.id, user.email, user.role);
      const newRefreshToken = generateRefreshToken(user.id, user.email, user.role);

      // Обновление токена в БД
      await Token.update(
        { refresh_token: newRefreshToken },
        { where: { refresh_token: refreshToken } }
      );

      // Установка нового куки
      res.cookie('refreshToken', newRefreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
      });

      return res.json({
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error('Refresh error:', err);
      return next(ApiError.unauthorized('Ошибка обновления токена'));
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      
      if (!refreshToken) {
        return next(ApiError.badRequest('Токен отсутствует'));
      }

      // Удаление токена из БД
      await Token.destroy({ 
        where: { refresh_token: refreshToken } 
      });

      // Очистка куки
      res.clearCookie('refreshToken');

      return res.json({ message: 'Выход выполнен успешно' });

    } catch (err) {
      console.error('Logout error:', err);
      return next(ApiError.internal('Ошибка при выходе'));
    }
  }

  async check(req, res, next) {
    try {
      // Генерация нового access токена
      const accessToken = generateJwt(
        req.user.id, 
        req.user.email, 
        req.user.role
      );

      return res.json({
        accessToken,
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        }
      });

    } catch (err) {
      console.error('Auth check error:', err);
      return next(ApiError.internal('Ошибка проверки авторизации'));
    }
  }
}

export default new UserController();