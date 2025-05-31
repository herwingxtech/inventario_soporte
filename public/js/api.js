// public/js/api.js
// ! Módulo central de llamadas HTTP al backend
// * Aquí centralizo todas las funciones para consumir la API REST del backend.
// * Uso una función genérica para peticiones y manejo de errores, y funciones específicas para cada entidad.
// * Los TODO y advertencias son recordatorios personales para futuras mejoras (ej: autenticación, manejo de tokens, etc).

// URL base de tu API backend.
const API_URL = 'http://localhost:3000/api'; // Asegúrate de que coincida con el puerto de tu server.js

// Función genérica para manejar peticiones HTTP y errores.
// Recibe la ruta (ej: '/equipos'), el método (ej: 'GET', 'POST'), y el cuerpo si es necesario.
// Retorna los datos de la respuesta si es exitosa (status 2xx) o lanza un error si no.
async function request(endpoint, method = 'GET', body = null) {
  const url = `${API_URL}${endpoint}`; // Construye la URL completa.
  const options = {
    method: method, // Método HTTP.
    headers: {
      'Content-Type': 'application/json', // Indica que enviamos/esperamos JSON.
      // Aquí podrías añadir encabezados de autenticación (ej. JWT) más adelante.
      // 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
    },
  };

  // Añade el cuerpo a la petición si el método lo requiere (POST, PUT, PATCH).
  if (body !== null) {
    options.body = JSON.stringify(body); // Convierte el objeto body a string JSON.
  }

  console.log(`API - Enviando petición ${method} a ${url}`, body ? { body } : '');

  try {
    const response = await fetch(url, options);

    // Intenta siempre parsear el cuerpo de la respuesta (puede contener datos o mensajes de error).
    // Algunos errores (ej. 404, 400, 409) aún pueden devolver un body JSON con detalles.
    // Si la respuesta es 204 No Content (como a veces en DELETE exitoso), response.json() fallará.
    // Manejamos eso.
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.warn('API - No se pudo parsear respuesta como JSON, pero Content-Type era application/json:', jsonError);
        // responseData se queda null.
      }
    }


    // Verifica si la respuesta HTTP fue exitosa (status 2xx).
    if (!response.ok) {
      // Si la respuesta no es OK, lanza un error.
      // Incluimos el mensaje del backend si está disponible en responseData.
      const errorMessage = responseData && responseData.message ?
        responseData.message :
        `Error de API: ${response.status} ${response.statusText}`;

      console.error(`API - Petición fallida ${method} a ${url}:`, response.status, response.statusText, responseData);
      const error = new Error(errorMessage);
      error.status = response.status; // Adjunta el status HTTP al objeto Error.
      error.responseData = responseData; // Adjunta los datos de respuesta por si contienen más info.
      throw error; // Lanza el error para que lo capture quien llamó a `request`.
    }

    console.log(`API - Petición exitosa ${method} a ${url}.`, responseData);
    // Retorna los datos parseados (si existen).
    return responseData;

  } catch (error) {
    // Captura errores de red o errores lanzados por `throw error` arriba.
    console.error(`API - Error de red o inesperado durante petición ${method} a ${url}:`, error);
    // Propaga el error para que la función que llamó a `request` pueda manejarlo (ej. mostrar mensaje al usuario).
    throw error;
  }
}

// ===============================================================
// FUNCIONES ESPECÍFICAS POR ENTIDAD
// Usan la función genérica `request` para cada operación CRUD.
// ===============================================================

// --- Equipos ---
const getEquipos = () => request('/equipos'); // GET /api/equipos
const getEquipoById = (id) => request(`/equipos/${id}`); // GET /api/equipos/:id
const createEquipo = (equipoData) => request('/equipos', 'POST', equipoData); // POST /api/equipos
const updateEquipo = (id, equipoData) => request(`/equipos/${id}`, 'PUT', equipoData); // PUT /api/equipos/:id
const deleteEquipo = (id) => request(`/equipos/${id}`, 'DELETE'); // DELETE /api/equipos/:id

// --- Empleados ---
const getEmpleados = () => request('/empleados'); // GET /api/empleados
const getEmpleadoById = (id) => request(`/empleados/${id}`); // GET /api/empleados/:id
const createEmpleado = (empleadoData) => request('/empleados', 'POST', empleadoData); // POST /api/empleados
const updateEmpleado = (id, empleadoData) => request(`/empleados/${id}`, 'PUT', empleadoData); // PUT /api/empleados/:id
const deleteEmpleado = (id) => request(`/empleados/${id}`, 'DELETE'); // DELETE /api/empleados/:id

// --- Direcciones IP ---
const getDireccionesIp = () => request('/direcciones-ip'); // GET /api/direcciones-ip
const getDireccionIpById = (id) => request(`/direcciones-ip/${id}`); // GET /api/direcciones-ip/:id
const createDireccionIp = (ipData) => request('/direcciones-ip', 'POST', ipData); // POST /api/direcciones-ip
const updateDireccionIp = (id, ipData) => request(`/direcciones-ip/${id}`, 'PUT', ipData); // PUT /api/direcciones-ip/:id
const deleteDireccionIp = (id) => request(`/direcciones-ip/${id}`, 'DELETE'); // DELETE /api/direcciones-ip/:id

// --- Status ---
const getStatuses = () => request('/status'); // GET /api/status

// --- Empresas ---
const getEmpresas = () => request('/empresas'); // GET /api/empresas

// --- Tipos Equipo ---
const getTiposEquipo = () => request('/tipos-equipo'); // GET /api/tipos-equipo

// --- Tipos Sucursal ---
const getTiposSucursal = () => request('/tipos-sucursal'); // GET /api/tipos-sucursal

// --- Roles ---
const getRoles = () => request('/roles'); // GET /api/roles

// --- Usuarios Sistema ---
const getUsuariosSistema = () => request('/usuarios-sistema'); // GET /api/usuarios-sistema
const getUsuarioSistemaById = (id) => request(`/usuarios-sistema/${id}`); // GET /api/usuarios-sistema/:id
const createUsuarioSistema = (userData) => request('/usuarios-sistema', 'POST', userData); // POST /api/usuarios-sistema
const updateUsuarioSistema = (id, userData) => request(`/usuarios-sistema/${id}`, 'PUT', userData); // PUT /api/usuarios-sistema/:id
const deleteUsuarioSistema = (id) => request(`/usuarios-sistema/${id}`, 'DELETE'); // DELETE /api/usuarios-sistema/:id

// --- Cuentas Email ---
const getCuentasEmail = () => request('/cuentas-email'); // GET /api/cuentas-email
const getCuentaEmailById = (id) => request(`/cuentas-email/${id}`); // GET /api/cuentas-email/:id
const createCuentaEmail = (emailData) => request('/cuentas-email', 'POST', emailData); // POST /api/cuentas-email
const updateCuentaEmail = (id, emailData) => request(`/cuentas-email/${id}`, 'PUT', emailData); // PUT /api/cuentas-email/:id
const deleteCuentaEmail = (id) => request(`/cuentas-email/${id}`, 'DELETE'); // DELETE /api/cuentas-email/:id

// --- Mantenimientos ---
const getMantenimientos = () => request('/mantenimientos'); // GET /api/mantenimientos
const getMantenimientoById = (id) => request(`/mantenimientos/${id}`); // GET /api/mantenimientos/:id
const createMantenimiento = (mantenimientoData) => request('/mantenimientos', 'POST', mantenimientoData); // POST /api/mantenimientos
const updateMantenimiento = (id, mantenimientoData) => request(`/mantenimientos/${id}`, 'PUT', mantenimientoData); // PUT /api/mantenimientos/:id
const deleteMantenimiento = (id) => request(`/mantenimientos/${id}`, 'DELETE'); // DELETE /api/mantenimientos/:id

// --- Notas ---
const getNotas = () => request('/notas'); // GET /api/notas
const getNotaById = (id) => request(`/notas/${id}`); // GET /api/notas/:id
const createNota = (notaData) => request('/notas', 'POST', notaData); // POST /api/notas
const updateNota = (id, notaData) => request(`/notas/${id}`, 'PUT', notaData); // PUT /api/notas/:id
const deleteNota = (id) => request(`/notas/${id}`, 'DELETE'); // DELETE /api/notas/:id

// --- Asignaciones ---
// Añadimos funciones para obtener asignaciones filtradas (ej: por equipoId, activa)
const getAsignaciones = (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = queryParams ? `/asignaciones?${queryParams}` : '/asignaciones';
  return request(url);
}; // GET /api/asignaciones, con o sin query params
const getAsignacionById = (id) => request(`/asignaciones/${id}`); // GET /api/asignaciones/:id
const createAsignacion = (asignacionData) => request('/asignaciones', 'POST', asignacionData); // POST /api/asignaciones
const updateAsignacion = (id, asignacionData) => request(`/asignaciones/${id}`, 'PUT', asignacionData); // PUT /api/asignaciones/:id
const deleteAsignacion = (id) => request(`/asignaciones/${id}`, 'DELETE'); // DELETE /api/asignaciones/:id


// Exportamos todas las funciones de la API para que puedan ser importadas
// por otros módulos JS.
export {
  // Equipos
  getEquipos, getEquipoById, createEquipo, updateEquipo, deleteEquipo,
  // Empleados
  getEmpleados, getEmpleadoById, createEmpleado, updateEmpleado, deleteEmpleado,
  // Direcciones IP
  getDireccionesIp, getDireccionIpById, createDireccionIp, updateDireccionIp, deleteDireccionIp,
  // Status
  getStatuses,
  // Empresas
  getEmpresas,
  // Tipos Equipo
  getTiposEquipo,
  // Tipos Sucursal
  getTiposSucursal,
  // Roles
  getRoles,
  // Usuarios Sistema
  getUsuariosSistema, getUsuarioSistemaById, createUsuarioSistema, updateUsuarioSistema, deleteUsuarioSistema,
  // Cuentas Email
  getCuentasEmail, getCuentaEmailById, createCuentaEmail, updateCuentaEmail, deleteCuentaEmail,
  // Mantenimientos
  getMantenimientos, getMantenimientoById, createMantenimiento, updateMantenimiento, deleteMantenimiento,
  // Notas
  getNotas, getNotaById, createNota, updateNota, deleteNota,
  // Asignaciones
  getAsignaciones, getAsignacionById, createAsignacion, updateAsignacion, deleteAsignacion,
};