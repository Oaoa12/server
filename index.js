import express from 'express';
import sequelize from './db.js';
import cors from 'cors';
import router from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

const PORT = 5000;
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(
  '/proxy/obrut',
  createProxyMiddleware({
    target: 'https://92d73433.obrut.show',
    changeOrigin: true,
    pathRewrite: {
      '^/proxy/obrut': '',
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ message: 'Ошибка проксирования запроса' });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxy request to:', proxyReq.path);
    }
  })
);

app.use('/api', router);
app.use(errorHandler);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.error('Server startup error:', e);
  }
};

start();