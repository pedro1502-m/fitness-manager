/**
 * Fitness Manager - Servidor Express
 * Serve a API REST (/api/*) e os arquivos estáticos do frontend.
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const workoutRoutes = require('./src/routes/workoutRoutes');
const mealRoutes = require('./src/routes/mealRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

if (!process.env.JWT_SECRET) {
  console.error('ERRO: defina JWT_SECRET no arquivo .env');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// ---- API ----
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rotas /api desconhecidas
app.use('/api', (req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));

// ---- Frontend estático ----
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---- Tratamento centralizado de erros ----
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Erro interno do servidor.' : err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Fitness Manager rodando em http://localhost:${PORT}`));
