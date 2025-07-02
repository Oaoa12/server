import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Token } from '../models/models.js';
import ApiError from '../error/apiError.js';

// Генерация JWT токенов
const generateJwt = (id, email, login, role) => {
  return jwt.sign(
    { id, email, login, role },
    process.env.SECRET_KEY,
    { expiresIn: '24h' }
  );
};

// Генерация refresh токена
const generateRefreshToken = (id, email, login, role) => {
  return jwt.sign(
    { id, email, login, role },
    process.env.SECRET_KEY,
    { expiresIn: '30d' }
  );
};

class UserController {
  // Регистрация пользователя
  async registration(req, res, next) {
    try {
      const { email, login, password } = req.body;
      
      // Валидация входных данных
      if (!email || !login || !password) {
        return next(ApiError.badRequest('Все поля обязательны для заполнения'));
      }

      // Проверка на существующего пользователя
      const candidate = await User.findOne({ where: { email } });
      if (candidate) {
        return next(ApiError.badRequest('Пользователь с таким email уже существует'));
      }

      // Хеширование пароля
      const hashPassword = await bcrypt.hash(password, 5);
      
      // Создание пользователя
      const user = await User.create({ 
        email, 
        login, 
        password: hashPassword 
      });

      // Генерация токенов
      const accessToken = generateJwt(user.id, user.email, user.login, user.role);
      const refreshToken = generateRefreshToken(user.id, user.email, user.login, user.role);

      // Сохранение refresh токена
      await Token.create({ 
        user_id: user.id, 
        refresh_token: refreshToken 
      });

      // Установка refresh токена в cookie
      res.cookie('refreshToken', refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
      });

      // Возвращаем данные пользователя и токены
      return res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          login: user.login,
          role: user.role
        }
      });

    } catch (e) {
      console.error('Ошибка регистрации:', e);
      return next(ApiError.internal('Ошибка при регистрации'));
    }
  }

  // Авторизация пользователя
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Валидация входных данных
      if (!email || !password) {
        return next(ApiError.badRequest('Email и пароль обязательны'));
      }

      // Поиск пользователя
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return next(ApiError.badRequest('Пользователь не найден'));
      }

      // Проверка пароля
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return next(ApiError.badRequest('Неверный пароль'));
      }

      // Генерация токенов
      const accessToken = generateJwt(user.id, user.email, user.login, user.role);
      const refreshToken = generateRefreshToken(user.id, user.email, user.login, user.role);

      // Обновление refresh токена
      await Token.destroy({ where: { user_id: user.id } });
      await Token.create({ 
        user_id: user.id, 
        refresh_token: refreshToken 
      });

      // Установка refresh токена в cookie
      res.cookie('refreshToken', refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
      });

      // Возвращаем данные пользователя и токены
      return res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          login: user.login,
          role: user.role
        }
      });

    } catch (e) {
      console.error('Ошибка авторизации:', e);
      return next(ApiError.internal('Ошибка при авторизации'));
    }
  }

  // Обновление токенов
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

      // Поиск пользователя и токена
      const tokenFromDb = await Token.findOne({ 
        where: { refresh_token: refreshToken } 
      });
      
      if (!tokenFromDb) {
        return next(ApiError.unauthorized('Токен не найден'));
      }

      const user = await User.findByPk(decoded.id);
      if (!user) {
        return next(ApiError.unauthorized('Пользователь не найден'));
      }

      // Генерация новых токенов
      const newAccessToken = generateJwt(user.id, user.email, user.login, user.role);
      const newRefreshToken = generateRefreshToken(user.id, user.email, user.login, user.role);

      // Обновление токена в БД
      await Token.update(
        { refresh_token: newRefreshToken },
        { where: { refresh_token: refreshToken } }
      );

      // Установка нового refresh токена
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
          login: user.login,
          role: user.role
        }
      });

    } catch (e) {
      console.error('Ошибка обновления токена:', e);
      return next(ApiError.unauthorized('Ошибка при обновлении токена'));
    }
  }

  // Выход из системы
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      
      if (!refreshToken) {
        return next(ApiError.badRequest('Токен отсутствует'));
      }

      // Удаление токена из БД
      await Token.destroy({ where: { refresh_token: refreshToken } });

      // Очистка cookie
      res.clearCookie('refreshToken');

      return res.json({ message: 'Выход выполнен успешно' });

    } catch (e) {
      console.error('Ошибка выхода:', e);
      return next(ApiError.internal('Ошибка при выходе'));
    }
  }

  // Проверка авторизации
  async check(req, res, next) {
    try {
      // Генерация нового access токена
      const accessToken = generateJwt(
        req.user.id, 
        req.user.email, 
        req.user.login, 
        req.user.role
      );

      return res.json({
        accessToken,
        user: {
          id: req.user.id,
          email: req.user.email,
          login: req.user.login,
          role: req.user.role
        }
      });

    } catch (e) {
      console.error('Ошибка проверки авторизации:', e);
      return next(ApiError.internal('Ошибка при проверке авторизации'));
    }
  }
}

export default new UserController();