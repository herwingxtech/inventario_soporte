// ! Archivo principal del servidor Express para el sistema de inventario
const express = require('express');
require('dotenv').config(); // * Cargo las variables de entorno desde .env
const { pool } = require('./src/config/db'); // * Importo el pool de conexiones a la base de datos
const statusRoutes = require('./src/routes/status.routes'); // * Rutas para el estado del sistema
const empresasRoutes = require('./src/routes/empresas.routes'); // * Rutas para empresas
const sucursalesRoutes = require('./src/routes/sucursales.routes'); // * Rutas para sucursales
const areasRoutes = require('./src/routes/areas.routes'); // * Rutas para áreas
const tiposSucursalRoutes = require('./src/routes/tipos_sucursal.routes'); // * Rutas para tipos de sucursal
const tiposEquipoRoutes = require('./src/routes/tipos_equipo.routes'); // * Rutas para tipos de equipo
const empleadosRoutes = require('./src/routes/empleados.routes'); // * Rutas para empleados
const direccionesIpRoutes = require('./src/routes/direcciones_ip.routes'); // * Rutas para direcciones IP
const equiposRoutes = require('./src/routes/equipos.routes'); // * Rutas para equipos
const rolesRoutes = require('./src/routes/roles.routes'); // * Rutas para roles
const usuariosSistemaRoutes = require('./src/routes/usuarios_sistema.routes'); // * Rutas para usuarios del sistema
const cuentasEmailRoutes = require('./src/routes/cuentas_email.routes'); // * Rutas para cuentas de email
const mantenimientosRoutes = require('./src/routes/mantenimientos.routes'); // * Rutas para mantenimientos
const notasRoutes =  require('./src/routes/notas.routes'); // * Rutas para notas
const asignacionesRoutes = require('./src/routes/asignaciones.routes'); // * Rutas para asignaciones
const app = express();
const port = process.env.PORT || 3000; // * Puerto del servidor (por defecto 3000 si no hay .env)

// * Middleware para servir archivos estáticos desde la carpeta 'public'.
// * Todo lo que esté en 'public' se puede acceder directamente por URL.
app.use(express.static('public'));

// * Middleware para parsear JSON en las peticiones (body-parser integrado)
app.use(express.json());
// * Middleware para parsear datos de formularios (URL-encoded)
app.use(express.urlencoded({ extended: true }));

// ? Ruta de prueba para verificar conexión a la base de datos
app.get('/db-test', async (req, res) => {
  try {
    // * Hago una consulta simple para probar la conexión
    const [rows] = await pool.execute('SELECT 1 + 1 AS solution');
    res.json({
      message: 'Conexión a base de datos exitosa!',
      solution: rows[0].solution
    });
  } catch (error) {
    // ! Si falla la conexión, muestro el error
    console.error('Error al conectar o consultar la base de datos:', error);
    res.status(500).json({
      message: 'Error al conectar a la base de datos.',
      error: error.message // * Devuelvo el mensaje de error para depuración
    });
  }
});

// TODO: Aquí se montan las rutas principales de la API
// * Cada entidad tiene su propio archivo de rutas
app.use('/api/status', statusRoutes); // * Estado
app.use('/api/empresas', empresasRoutes); // * Empresas
app.use('/api/sucursales', sucursalesRoutes); // * Sucursales
app.use('/api/areas', areasRoutes); // * Áreas
app.use('/api/tipos-sucursal', tiposSucursalRoutes); // * Tipos de sucursal
app.use('/api/tipos-equipo', tiposEquipoRoutes); // * Tipos de equipo
app.use('/api/empleados', empleadosRoutes); // * Empleados
app.use('/api/direcciones-ip', direccionesIpRoutes); // * Direcciones IP
app.use('/api/equipos', equiposRoutes); // * Equipos
app.use('/api/roles', rolesRoutes); // * Roles
app.use('/api/usuarios-sistema', usuariosSistemaRoutes); // * Usuarios del sistema
app.use('/api/cuentas-email', cuentasEmailRoutes); // * Cuentas de email
app.use('/api/mantenimientos', mantenimientosRoutes); // * Mantenimientos
app.use('/api/notas/', notasRoutes); // * Notas
app.use('/api/asignaciones/', asignacionesRoutes); // * Asignaciones

// ! Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// ! Middleware global para manejo de errores
// * Si ocurre un error en cualquier parte, cae aquí
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

// ! Inicio del servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  // * Pruebo la conexión al pool de la base de datos al arrancar
   pool.getConnection()
    .then(connection => {
      console.log('Pool de conexiones a DB creado y listo.');
      connection.release(); // * Libero la conexión de vuelta al pool
    })
    .catch(err => {
      // ! Si falla la conexión inicial, aviso por consola
      console.error('Error al conectar al pool de conexiones de la DB:', err);
      console.error('Asegúrate de que el contenedor Docker esté corriendo y las credenciales en .env sean correctas.');
    });
});