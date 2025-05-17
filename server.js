// server.js
const express = require('express');
require('dotenv').config(); // Carga las variables de entorno
const { pool } = require('./src/config/db'); // Importa el pool de conexiones

const app = express();
const port = process.env.PORT || 3000; // Usa el puerto del .env o 3000 por defecto

// Middleware para parsear JSON en las peticiones
app.use(express.json());
// Middleware para parsear datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Ruta de ejemplo para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Servidor de Inventario funcionando!');
});

// Ruta de ejemplo para probar la conexión a la base de datos
app.get('/db-test', async (req, res) => {
  try {
    // Intenta obtener una conexión del pool y ejecutar una consulta simple
    const [rows] = await pool.execute('SELECT 1 + 1 AS solution');
    res.json({
      message: 'Conexión a base de datos exitosa!',
      solution: rows[0].solution
    });
  } catch (error) {
    console.error('Error al conectar o consultar la base de datos:', error);
    res.status(500).json({
      message: 'Error al conectar a la base de datos.',
      error: error.message // Envía el mensaje de error para depuración
    });
  }
});


// TODO: Aquí irán las rutas para las diferentes entidades (equipos, empleados, etc.)
// Ejemplo:
// const equiposRoutes = require('./src/routes/equipos.routes');
// app.use('/api/equipos', equiposRoutes);


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  // Intenta una conexión inicial para verificar credenciales pronto
   pool.getConnection()
    .then(connection => {
      console.log('Pool de conexiones a DB creado y listo.');
      connection.release(); // Libera la conexión de vuelta al pool
    })
    .catch(err => {
      console.error('Error al conectar al pool de conexiones de la DB:', err);
      console.error('Asegúrate de que el contenedor Docker esté corriendo y las credenciales en .env sean correctas.');
    });
});