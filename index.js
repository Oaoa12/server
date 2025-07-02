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
  origin: [
    'http://localhost:5173', 
    'https://client-cinema.netlify.app'
  ],
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Обработка ошибок
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});