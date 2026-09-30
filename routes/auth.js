const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// REGISTRO DE VOLUNTARIOS
router.post('/registro', async (req, res) => {
  const { num_voluntario, nombre, email, password } = req.body;

  try {
    const usuarioExistente = await pool.query(
      'SELECT * FROM usuarios WHERE num_voluntario = $1 OR email = $2',
      [num_voluntario, email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ error: 'El número de voluntario o correo ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await pool.query(
      'INSERT INTO usuarios (num_voluntario, nombre, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, num_voluntario, nombre, email, rol',
      [num_voluntario, nombre, email, password_hash]
    );

    res.status(201).json({
      mensaje: 'Voluntario registrado exitosamente',
      usuario: nuevoUsuario.rows[0]
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar.' });
  }
});

// LOGIN DE VOLUNTARIOS
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (resultado.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const usuario = resultado.rows[0];

    const passwordCorrecto = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordCorrecto) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, num_voluntario: usuario.num_voluntario },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        num_voluntario: usuario.num_voluntario,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
});

module.exports = router;