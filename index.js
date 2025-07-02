import express from 'express';
import sequelize from './db.js';
import cors from 'cors';
import router from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware должны быть в правильном порядке!
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://client-cinema.netlify.app'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Для парсинга JSON

// Основные роуты с префиксом /api
app.use('/api', router);

// Обработка ошибок должна быть последней
app.use(errorHandler);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Убедитесь, что таблицы созданы
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.error('Server startup error:', e);
    process.exit(1);
  }
};

start();