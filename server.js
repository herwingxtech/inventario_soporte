// server.js
const express = require('express');
require('dotenv').config(); // Carga las variables de entorno
const { pool } = require('./src/config/db'); // Importa el pool de conexiones
const statusRoutes = require('./src/routes/status.routes'); // Importa las rutas de status
const empresasRoutes = require('./src/routes/empresas.routes'); // Importa las rutas de empresas
const sucursalesRoutes = require('./src/routes/sucursales.routes'); // Importa las rutas de sucursales
const areasRoutes = require('./src/routes/areas.routes'); // Importa las rutas de areas
const tiposSucursalRoutes = require('./src/routes/tipos_sucursal.routes'); // Importa las rutas de tipos de equipo
const tiposEquipoRoutes = require('./src/routes/tipos_equipo.routes'); // Importa las rutas de tipos de equipo
const empleadosRoutes = require('./src/routes/empleados.routes'); // Importa las rutas de empleados
const direccionesIpRoutes = require('./src/routes/direcciones_ip.routes'); // Importa las rutas de direcciones IP
const equiposRoutes = require('./src/routes/equipos.routes'); // Importa las rutas de equipos
const rolesRoutes = require('./src/routes/roles.routes'); // Importa las rutas de roles.|
const usuariosSistemaRoutes = require('./src/routes/usuarios_sistema.routes'); // Importa las rutas de usuarios_sistema
const cuentasEmailRoutes = require('./src/routes/cuentas_email.routes')
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
app.use('/api/tipos-sucursal', tiposSucursalRoutes); // Monta el enrutador de tipos de sucursal
app.use('/api/tipos-equipo', tiposEquipoRoutes); // Monta el enrutador de tipos de equipo
app.use('/api/empleados', empleadosRoutes); // Monta el enrutador de empleados
app.use('/api/direcciones-ip', direccionesIpRoutes); // Monta el enrutador de direcciones IP
app.use('/api/equipos', equiposRoutes); // Monta el enrutador de equipos
app.use('/api/roles', rolesRoutes); // Monta el enrutador de roles
app.use('/api/usuarios-sistema', usuariosSistemaRoutes); // Monta el enrutador de usuarios_sistema
app.use('/api/cuentas-email', cuentasEmailRoutes); //Monta enrutador de cuentas_email
// ===============================================================
// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});


// Middleware Global para manejo de Errores
// Este middleware especial con 4 argumentos (err, req, res, next)
// captura cualquier error que se pase a next(err)
app.use((err, req, res, next) => {
  console.error('-------- ERROR CAPTURADO POR MIDDLEWARE GLOBAL --------');
  console.error(err.stack);
  console.error('-----------------------------------------------------');

  const statusCode = err.status || 500;

  res.status(statusCode).json({
      message: err.message || 'Ocurrió un error interno en el servidor',
      error: process.env.NODE_ENV === 'development' ? err.stack : {}
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