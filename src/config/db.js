// ! Configuración y utilidades para la conexión a la base de datos MySQL
const mysql = require('mysql2/promise'); // * Uso la versión con Promises para poder trabajar con async/await
require('dotenv').config(); // * Cargo las variables de entorno desde el archivo .env

// * Configuración del pool de conexiones usando variables de entorno
const dbConfig = {
  host: process.env.DB_HOST, // * Host de la base de datos (ej: localhost o IP del contenedor)
  user: process.env.DB_USER, // * Usuario de la base de datos
  password: process.env.DB_PASSWORD, // * Contraseña del usuario
  database: process.env.DB_NAME, // * Nombre de la base de datos
  port: process.env.DB_PORT, // * Puerto de la base de datos (asegúrate que sea número)
  waitForConnections: true, // * Espera si todas las conexiones están ocupadas
  connectionLimit: 10, // * Máximo de conexiones simultáneas en el pool
  queueLimit: 0 // * Sin límite de peticiones en cola
};


/* 
* Creo un pool de conexiones
* Un pool de conexiones es más eficiente que abrir y cerrar una conexión por cada consulta.
* Mantiene un grupo de conexiones listas para usar.
*/
const pool = mysql.createPool(dbConfig);

// * Utilidad para ejecutar consultas SQL usando el pool
// * Recibe la consulta y los parámetros, devuelve solo las filas del resultado
const query = async (sql, params) => {
  const [rows, fields] = await pool.execute(sql, params);
  return rows; // * Devuelvo solo las filas resultantes (ignoro metadatos)
};

const getConnection = async () => {
  const connection = await pool.getConnection();
  console.log('Herwing obtuvo una conexión del pool.'); // ! Para depuración
  return connection;
};


// * Exporto el pool y la función query para usarlos en los controladores y otros módulos
module.exports = {
  pool,
  query,
  getConnection
};
// * Mensaje de depuración para saber que este archivo se ejecutó correctamente
console.log('Módulo de conexión a base de datos cargado.'); 