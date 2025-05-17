// src/config/db.js
const mysql = require('mysql2/promise'); // Usamos la versión con Promises para async/await
require('dotenv').config(); // Carga las variables de entorno del archivo .env

// Configuración de la conexión usando variables de entorno
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // El puerto, asegurate de que sea un numero
  waitForConnections: true,
  connectionLimit: 10, // Limita el número de conexiones activas
  queueLimit: 0
};

// Crear un pool de conexiones
// Un pool de conexiones es más eficiente que abrir y cerrar una conexión por cada consulta.
// Mantiene un grupo de conexiones listas para usar.
const pool = mysql.createPool(dbConfig);

// Función para obtener una conexión del pool y ejecutar una consulta
const query = async (sql, params) => {
  const [rows, fields] = await pool.execute(sql, params);
  return rows; // Devolvemos las filas resultantes
};

// Exportar el pool o la función query para usarla en otras partes de la app
module.exports = {
  pool,
  query
};

console.log('Módulo de conexión a base de datos cargado.'); // Mensaje de depuración