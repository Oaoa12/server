import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Token } from '../models/models.js';
import ApiError from '../error/apiError.js';

const generateJwt = (id, email, login, role) => {
  return jwt.sign(
    { id, email, login, role },
    process.env.SECRET_KEY,
    { expiresIn: '24h' }
  );
};

const generateRefreshToken = (id, email, login, role) => {
  return jwt.sign(
    { id, email, login, role },
    process.env.SECRET_KEY,
    { expiresIn: '30d' }
  );
};

class UserController {
  async registration(req, res, next) {
    try {
      const { email, login, password } = req.body;
      if (!email || !login || !password) {
        return next(ApiError.badRequest('Все поля обязательны'));
      }

      const candidate = await User.findOne({ where: { email } });
      if (candidate) {
        return next(ApiError.badRequest('Пользователь уже существует'));
      }

      const hashPassword = await bcrypt.hash(password, 5);
      const user = await User.create({ email, login, password: hashPassword });

      const accessToken = generateJwt(user.id, user.email, user.login, user.role);
      const refreshToken = generateRefreshToken(user.id, user.email, user.login, user.role);

      await Token.create({ user_id: user.id, refresh_token: refreshToken });

      console.log('Registration successful:', { email, accessToken, refreshToken });
      return res.json({ accessToken, refreshToken });
    } catch (e) {
      console.error('Registration error:', e);
      return next(ApiError.internal('Ошибка регистрации'));
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return next(ApiError.badRequest('Пользователь не найден'));
      }

      const comparePassword = bcrypt.compareSync(password, user.password);
      if (!comparePassword) {
        return next(ApiError.badRequest('Неверный пароль'));
      }

      const accessToken = generateJwt(user.id, user.email, user.login, user.role);
      const refreshToken = generateRefreshToken(user.id, user.email, user.login, user.role);

      await Token.create({ user_id: user.id, refresh_token: refreshToken });

      console.log('Login successful:', { email, accessToken, refreshToken });
      return res.json({ accessToken, refreshToken });
    } catch (e) {
      console.error('Login error:', e);
      return next(ApiError.internal('Ошибка входа'));
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return next(ApiError.unauthorized('Refresh-токен отсутствует'));
      }

      const tokenData = await Token.findOne({ where: { refresh_token: refreshToken } });
      if (!tokenData) {
        return next(ApiError.unauthorized('Недействительный refresh-токен'));
      }

      const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY);
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return next(ApiError.unauthorized('Пользователь не найден'));
      }

      const accessToken = generateJwt(user.id, user.email, user.login, user.role);
      const newRefreshToken = generateRefreshToken(user.id, user.email, user.login, user.role);

      await Token.update(
        { refresh_token: newRefreshToken },
        { where: { user_id: user.id, refresh_token: refreshToken } }
      );

      console.log('Token refreshed:', { userId: user.id, accessToken, refreshToken: newRefreshToken });
      return res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (e) {
      console.error('Refresh error:', e);
      return next(ApiError.unauthorized('Не удалось обновить токен'));
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await Token.destroy({ where: { refresh_token: refreshToken } });
      console.log('Logout successful:', { refreshToken });
      return res.json({ message: 'Выход успешен' });
    } catch (e) {
      console.error('Logout error:', e);
      return next(ApiError.internal('Ошибка выхода'));
    }
  }

  async check(req, res, next) {
    try {
      const accessToken = generateJwt(req.user.id, req.user.email, req.user.login, req.user.role);
      console.log('Auth check successful:', { userId: req.user.id });
      return res.json({ accessToken });
    } catch (e) {
      console.error('Auth check error:', e);
      return next(ApiError.internal('Ошибка проверки'));
    }
  }
}

export default new UserController();