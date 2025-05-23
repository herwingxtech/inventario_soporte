// server.js
const express = require('express');
require('dotenv').config(); // Carga las variables de entorno
const { pool } = require('./src/config/db'); // Importa el pool de conexiones
const statusRoutes = require('./src/routes/status.routes'); // Importa las rutas de status
const empresasRoutes = require('./src/routes/empresas.routes'); // Importa las rutas de empresas
const sucursalesRoutes = require('./src/routes/sucursales.routes'); // Importa las rutas de sucursales
const areasRoutes = require('./src/routes/areas.routes'); // Importa las rutas de areas
const tiposSucursalRoutes = require('./src/routes/tipos_sucursal.routes'); // Importa las rutas de tipos de equipo
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
// === Montar el enrutador de status en la ruta base /api/status ===
app.use('/api/status', statusRoutes);
app.use('/api/empresas', empresasRoutes); // Monta el enrutador de empresas
app.use('/api/sucursales', sucursalesRoutes); // Monta el enrutador de sucursales
app.use('/api/areas', areasRoutes); // Monta el enrutador de areas
app.use('/api/tipos_sucursal', tiposSucursalRoutes); // Monta el enrutador de tipos de sucursal

// ===============================================================
// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});


// Middleware Global para manejo de Errores
// Este middleware especial con 4 argumentos (err, req, res, next)
// captura cualquier error que se pase a next(err)
app.use((err, req, res, next) => {
    console.error('Error capturado por middleware global:', err); // Log del error en el servidor

    // Determinar el código de estado. Si el error tiene un status (ej: 400, 409), usarlo.
    // Si no, default a 500 (Internal Server Error).
    const statusCode = err.status || 500;

    // Enviar la respuesta de error al cliente
    res.status(statusCode).json({
        message: err.message || 'Ocurrió un error interno en el servidor', // Usar el mensaje del error o uno genérico
        // Opcionalmente, incluir más detalles del error en modo desarrollo
        error: process.env.NODE_ENV === 'development' ? err.stack : {} // Envía el stack trace solo en desarrollo
    });
});

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