const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// CREAR UN NUEVO PARTE DE SERVICIO
router.post('/', async (req, res) => {
  const {
    correlativo_cia,
    correlativo_gen,
    fecha,
    hora,
    clave,
    direccion,
    poblacion,
    lugar_tipo,
    construccion_tipo,
    observaciones,
    usuario_id,
    asistencia
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insertar el Encabezado del Parte
    const parteQuery = `
      INSERT INTO partes_servicio 
      (correlativo_cia, correlativo_gen, fecha, hora, clave, direccion, poblacion, lugar_tipo, construccion_tipo, observaciones, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const parteValues = [
      correlativo_cia,
      correlativo_gen,
      fecha,
      hora,
      clave,
      direccion,
      poblacion,
      lugar_tipo,
      construccion_tipo,
      observaciones,
      usuario_id
    ];

    const resParte = await client.query(parteQuery, parteValues);
    const nuevoParte = resParte.rows[0];

    // 2. Insertar la Lista de Asistencia (si existe)
    if (asistencia && asistencia.length > 0) {
      for (const vol of asistencia) {
        await client.query(
          'INSERT INTO asistencia_partes (parte_id, num_voluntario, nombre_voluntario, tipo_asistencia) VALUES ($1, $2, $3, $4)',
          [nuevoParte.id, vol.num_voluntario, vol.nombre_voluntario, vol.tipo_asistencia]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Parte de servicio registrado exitosamente.',
      parte: nuevoParte
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar el parte:', error);
    res.status(500).json({ error: 'Error interno al guardar el parte de servicio.' });
  } finally {
    client.release();
  }
});

// OBTENER TODOS LOS PARTES DE SERVICIO
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM partes_servicio ORDER BY creado_en DESC');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener los partes:', error);
    res.status(500).json({ error: 'Error al consultar partes de servicio.' });
  }
});

module.exports = router;