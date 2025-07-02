import express from 'express';
import sequelize from './db.js';
import cors from 'cors';
import router from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Настройки CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://client-cinema.netlify.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Проверка соединения с БД
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

// Синхронизация моделей
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database synced'))
  .catch(err => console.error('❌ Database sync error:', err));

// Основные роуты
app.use('/api', router);

// Health check
app.get('/health', (req, res) => res.status(200).send('OK'));

// Обработка 404
app.use((req, res) => {
  console.error(`❌ Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Обработка ошибок
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('🔍 Available routes:');
  console.log('POST /api/user/registration');
  console.log('POST /api/user/login');
  console.log('POST /api/user/refresh');
  console.log('POST /api/user/logout');
  console.log('GET /api/user/auth');
});