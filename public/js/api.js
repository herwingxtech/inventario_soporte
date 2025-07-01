//public/js/api.js
// ! Módulo central de llamadas HTTP al backend
//* Si se cambias la URL base o agregamos autenticación, hacerlo aquí. Si la API cambia, revisar los endpoints y métodos aquí primero.
//!Si el backend cambia de puerto o de ruta base, este archivo dejará de funcionar correctamente.
//* Aquí centralizo todas las funciones para consumir la API REST del backend.
//* Uso una función genérica para peticiones y manejo de errores, y funciones específicas para cada entidad.
//* URL base de la API backend.

const API_URL = window.location.origin + '/soporte/api';
//* Función genérica para manejar peticiones HTTP y errores.
async function request(endpoint, method = 'GET', body = null) {
  const url = `${API_URL}${endpoint}`; //* Construye la URL completa.
  
  //* Obtengo el token de localStorage.
  const token = localStorage.getItem('authToken');

  const headers = {
    //* Indica que enviamos/esperamos JSON.
    'Content-Type': 'application/json', 
  };

  //* Si tengo un token, lo añado al encabezado 'Authorization'.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method: method, //* Método HTTP.
    headers: headers,
  };

  //* Añade el cuerpo a la petición si el método lo requiere (POST, PUT, PATCH).
  if (body !== null) {
    options.body = JSON.stringify(body); //* Convierte el objeto body a string JSON.
  }

  console.log(`API - Enviando petición ${method} a ${url}`, body ? { body } : '');

  try {
    const response = await fetch(url, options);

    //* Intenta siempre parsear el cuerpo de la respuesta (puede contener datos o mensajes de error).
    //* Algunos errores (ej. 404, 400, 409) aún pueden devolver un body JSON con detalles.
    //* Si la respuesta es 204 No Content (como a veces en DELETE exitoso), response.json() fallará. Manejamos eso.
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.warn('API - No se pudo parsear respuesta como JSON, pero Content-Type era application/json:', jsonError);
      }
    }


    //* Verifica si la respuesta HTTP fue exitosa (status 2xx).
    if (!response.ok) {
      //* Si la respuesta no es OK, lanza un error.
      //* Incluimos el mensaje del backend si está disponible en responseData.
      const errorMessage = responseData && responseData.message ?
        responseData.message :
        `Error de API: ${response.status} ${response.statusText}`;

      console.error(`API - Petición fallida ${method} a ${url}:`, response.status, response.statusText, responseData);
      const error = new Error(errorMessage);
      error.status = response.status; //* Adjunta el status HTTP al objeto Error.
      error.responseData = responseData; //* Adjunta los datos de respuesta por si contienen más info.
      throw error; //* Lanza el error para que lo capture quien llamó a `request`.
    }

    console.log(`API - Petición exitosa ${method} a ${url}.`, responseData);
    //* Retorna los datos parseados (si existen).
    return responseData;

  } catch (error) {
    //* Captura errores de red o errores lanzados por `throw error` arriba.
    console.error(`API - Error de red o inesperado durante petición ${method} a ${url}:`, error);
    //* Propaga el error para que la función que llamó a `request` pueda manejarlo (ej. mostrar mensaje al usuario).
    throw error;
  }
}

// ===============================================================
//* FUNCIONES ESPECÍFICAS POR ENTIDAD
//* Nota: Cada función CRUD de cada recurso usa la función genérica `request`. Si agregamos una nueva entidad, solo copia el patrón.
//* Usan la función genérica `request` para cada operación CRUD.
// ===============================================================

//* --- Equipos ---
const getEquipos = () => request('/equipos'); 
const getEquipoById = (id) => request(`/equipos/${id}`); 
const createEquipo = (equipoData) => request('/equipos', 'POST', equipoData); 
const updateEquipo = (id, equipoData) => request(`/equipos/${id}`, 'PUT', equipoData); 
const deleteEquipo = (id) => request(`/equipos/${id}`, 'DELETE'); 

//* --- Empleados ---
const getEmpleados = () => request('/empleados'); 
const getEmpleadoById = (id) => request(`/empleados/${id}`); 
const createEmpleado = (empleadoData) => request('/empleados', 'POST', empleadoData); 
const updateEmpleado = (id, empleadoData) => request(`/empleados/${id}`, 'PUT', empleadoData); 
const deleteEmpleado = (id) => request(`/empleados/${id}`, 'DELETE'); 

//* --- Direcciones IP ---
const getDireccionesIp = () => request('/direcciones-ip'); 
const getDireccionIpById = (id) => request(`/direcciones-ip/${id}`); 
const createDireccionIp = (ipData) => request('/direcciones-ip', 'POST', ipData); 
const updateDireccionIp = (id, ipData) => request(`/direcciones-ip/${id}`, 'PUT', ipData); 
const deleteDireccionIp = (id) => request(`/direcciones-ip/${id}`, 'DELETE'); 

//* --- Status ---
const getStatuses = () => request('/status'); 

//* --- Empresas ---
const getEmpresas = () => request('/empresas'); 

//* --- Tipos Equipo ---
const getTiposEquipo = () => request('/tipos-equipo'); 

//* --- Tipos Sucursal ---
const getTiposSucursal = () => request('/tipos-sucursal'); 

//* --- Roles ---
const getRoles = () => request('/roles'); 

//* --- Usuarios Sistema ---
const getUsuariosSistema = () => request('/usuarios-sistema'); 
const getUsuarioSistemaById = (id) => request(`/usuarios-sistema/${id}`); 
const createUsuarioSistema = (userData) => request('/usuarios-sistema', 'POST', userData); 
const updateUsuarioSistema = (id, userData) => request(`/usuarios-sistema/${id}`, 'PUT', userData); 
const deleteUsuarioSistema = (id) => request(`/usuarios-sistema/${id}`, 'DELETE'); 

//* --- Cuentas Email ---
const getCuentasEmail = () => request('/cuentas-email'); 
const getCuentaEmailById = (id) => request(`/cuentas-email/${id}`); 
const createCuentaEmail = (emailData) => request('/cuentas-email', 'POST', emailData); 
const updateCuentaEmail = (id, emailData) => request(`/cuentas-email/${id}`, 'PUT', emailData); 
const deleteCuentaEmail = (id) => request(`/cuentas-email/${id}`, 'DELETE'); 

//* --- Mantenimientos ---
const getMantenimientos = () => request('/mantenimientos'); 
const getMantenimientoById = (id) => request(`/mantenimientos/${id}`); 
const createMantenimiento = (mantenimientoData) => request('/mantenimientos', 'POST', mantenimientoData); 
const updateMantenimiento = (id, mantenimientoData) => request(`/mantenimientos/${id}`, 'PUT', mantenimientoData); 
const deleteMantenimiento = (id) => request(`/mantenimientos/${id}`, 'DELETE'); 

//* --- Notas ---
const getNotas = () => request('/notas'); 
const getNotaById = (id) => request(`/notas/${id}`); 
const createNota = (notaData) => request('/notas', 'POST', notaData); 
const updateNota = (id, notaData) => request(`/notas/${id}`, 'PUT', notaData); 
const deleteNota = (id) => request(`/notas/${id}`, 'DELETE'); 

//* --- Asignaciones ---
//!Añadimos funciones para obtener asignaciones filtradas (ej: por equipoId, activa)
const getAsignaciones = (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = queryParams ? `/asignaciones?${queryParams}` : '/asignaciones';
  return request(url);
};
const getAsignacionById = (id) => request(`/asignaciones/${id}`); 
const createAsignacion = (asignacionData) => request('/asignaciones', 'POST', asignacionData); 
const updateAsignacion = (id, asignacionData) => request(`/asignaciones/${id}`, 'PUT', asignacionData); 
const deleteAsignacion = (id) => request(`/asignaciones/${id}`, 'DELETE'); 

//* --- Sucursales ---
const getSucursales = () => request('/sucursales'); 

//* --- Areas ---
const getAreas = () => request('/areas'); 
const getAreaById = (id) => request(`/areas/${id}`); 
const createArea = (areaData) => request('/areas', 'POST', areaData); 
const updateArea = (id, areaData) => request(`/areas/${id}`, 'PUT', areaData); 
const deleteArea = (id) => request(`/areas/${id}`, 'DELETE'); 

//* Función para la API de autenticación.
const login = (credentials) => request('/auth/login', 'POST', credentials);

//* Exporto solo lo necesario.
//* Exportamos todas las funciones de la API para que puedan ser importadas
//* por otros módulos JS.
export {
  //* Auth
  login, 
  //* Equipos
  getEquipos, getEquipoById, createEquipo, updateEquipo, deleteEquipo,
  //* Empleados
  getEmpleados, getEmpleadoById, createEmpleado, updateEmpleado, deleteEmpleado,
  //* Direcciones IP
  getDireccionesIp, getDireccionIpById, createDireccionIp, updateDireccionIp, deleteDireccionIp,
  //* Status
  getStatuses,
  //* Empresas
  getEmpresas,
  //* Tipos Equipo
  getTiposEquipo,
  //* Tipos Sucursal
  getTiposSucursal,
  //* Roles
  getRoles,
  //* Usuarios Sistema
  getUsuariosSistema, getUsuarioSistemaById, createUsuarioSistema, updateUsuarioSistema, deleteUsuarioSistema,
  //* Cuentas Email
  getCuentasEmail, getCuentaEmailById, createCuentaEmail, updateCuentaEmail, deleteCuentaEmail,
  //* Mantenimientos
  getMantenimientos, getMantenimientoById, createMantenimiento, updateMantenimiento, deleteMantenimiento,
  //* Notas
  getNotas, getNotaById, createNota, updateNota, deleteNota,
  //* Asignaciones
  getAsignaciones, getAsignacionById, createAsignacion, updateAsignacion, deleteAsignacion,
  //* Sucursales
  getSucursales,
  //* Areas
  getAreas, getAreaById, createArea, updateArea, deleteArea,
};