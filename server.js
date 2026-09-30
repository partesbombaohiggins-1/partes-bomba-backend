const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const partesRoutes = require('./routes/partes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/partes', partesRoutes);

// Ruta de comprobación de estado
app.get('/', (req, res) => {
  res.send('🚒 API REST Bomba O\'Higgins activa y lista.');
});

// Inicializar Servidor y verificar conexión
app.listen(PORT, async () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  try {
    await pool.query('SELECT NOW()');
  } catch (err) {
    console.error('❌ Error de conexión a la base de datos:', err);
  }
});