// public/js/views/asignacionFormView.js
// * Este módulo se encarga de la lógica para el formulario de creación y edición de Asignaciones.
// * Es uno de los formularios más complejos debido a las múltiples relaciones que maneja.

//? Funciones de API necesarias:
//? Para CRUD: 'createAsignacion', 'updateAsignacion', 'getAsignacionById'.
//? Para poblar selects: 'getEquipos', 'getEmpleados', 'getSucursales', 'getAreas', 'getDireccionesIp', 'getStatuses'.
import {
  createAsignacion, updateAsignacion, getAsignacionById,
  getEquipos, getEmpleados, getSucursales, getAreas, getDireccionesIp, getStatuses
} from '../api.js';
// * Importo mis funciones de modales para una mejor UX.
import { showInfoModal } from '../ui/modal.js';

// * Referencia al contenedor principal donde voy a renderizar este formulario.
const contentArea = document.getElementById('content-area');

// * Cache para los datos de los selects. Esto es para evitar pedir los mismos datos a la API repetidamente.
let equiposCache = null;
let empleadosCache = null;
let sucursalesCache = null;
let areasCache = null;
let ipsCache = null;
let statusesCache = null;  // Para el estado de la asignación.

// ===============================================================
// FUNCIONES DE RENDERIZADO DEL FORMULARIO
// ===============================================================

// * Muestra un mensaje de carga mientras preparo el formulario o cargo datos para los selects.
function showAsignacionFormLoading(action = 'Crear') {
  contentArea.innerHTML = `<p>Cargando formulario para ${action.toLowerCase()} asignación...</p>`;
}

// * Muestra un mensaje de error si algo falla al cargar el formulario o al procesar el envío.
function showAsignacionFormError(message, action = 'procesar') {
  //TODO: Mejorar cómo muestro los errores, quizás directamente en el formulario o con un modal de error más específico.
  contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al ${action} asignación:</p><p class="text-red-500">${message}</p>
                           <button class="mt-2 px-4 py-2 border border-gray-300 rounded-md" onclick="window.navigateTo('asignacionesList')">Volver a la lista</button>`;
}

// * Renderiza el formulario HTML para crear o editar una Asignación.
// * `asignacionToEdit` es opcional; si se proporciona (y no es solo un ID), el formulario se llena para edición.
async function renderAsignacionForm(asignacionToEdit = null) {
  // * Determino si estoy editando y cuál es el ID.
  // * `asignacionToEdit` puede ser el objeto completo o solo el ID (string/number) si se cargó previamente.
  const asignacionId = typeof asignacionToEdit === 'string' ? asignacionToEdit : (asignacionToEdit && asignacionToEdit.id);
  console.log('Herwing está renderizando el formulario de Asignación. Editando ID:', asignacionId || 'Nueva');
  const isEditing = asignacionId !== null;
  const formTitle = isEditing ? `Editar Asignación (ID: ${asignacionId})` : 'Registrar Nueva Asignación';

  // * Si estoy editando y `asignacionToEdit` es solo el ID (o no se pasó el objeto completo),
  // * necesito obtener los datos completos de la asignación para rellenar el formulario.
  let currentAsignacionData = null;
  if (isEditing && (typeof asignacionToEdit === 'string' || !asignacionToEdit.numero_serie /*Chequeo heurístico si es objeto completo*/)) {
      try {
          currentAsignacionData = await getAsignacionById(asignacionId);
          // * Si la API envuelve la respuesta, la extraigo.
          if (currentAsignacionData && (currentAsignacionData.data || currentAsignacionData.asignacion)) {
              currentAsignacionData = currentAsignacionData.data || currentAsignacionData.asignacion;
          }
          if (!currentAsignacionData) {
              showAsignacionFormError(`No se encontró la asignación con ID ${asignacionId} para editar.`, 'cargar');
              return;
          }
      } catch (error) {
          showAsignacionFormError(error.message, 'cargar datos para edición');
          return;
      }
  } else if (isEditing) {
      currentAsignacionData = asignacionToEdit; // Ya tengo el objeto completo.
  }


  showAsignacionFormLoading(isEditing ? 'Editar' : 'Crear'); // Muestro carga mientras obtengo datos de los selects.

  try {
      // * Obtengo los datos para todos los selects si aún no los tengo en caché.
      //TODO: Optimizar la carga de IPs para mostrar solo las disponibles si es una nueva asignación activa.
      //TODO: Considerar si los equipos para "Equipo Padre" deben ser solo equipos de tipo "Servidor" o "Computadora".
      if (!equiposCache) equiposCache = await getEquipos();
      if (!empleadosCache) empleadosCache = await getEmpleados();
      if (!sucursalesCache) sucursalesCache = await getSucursales();
      if (!areasCache) areasCache = await getAreas(); // Podría filtrar por sucursal corporativa.
      if (!ipsCache) ipsCache = await getDireccionesIp(); // Debería filtrar por IPs con status 'Disponible'.
      if (!statusesCache) statusesCache = await getStatuses(); // Para el status de la asignación.

      // * Preparo la lista de equipos para el select de "Equipo Padre".
      let equiposParaPadre = equiposCache;
      if (isEditing && currentAsignacionData && currentAsignacionData.id_equipo) {
          // * Si estoy editando, filtro para que el equipo padre no sea el mismo que el 'id_equipo' de esta asignación.
          equiposParaPadre = equiposCache.filter(eq => eq.id !== currentAsignacionData.id_equipo);
      }
      // * Para el modo CREACIÓN, no puedo saber qué 'id_equipo' se seleccionará hasta que el usuario lo haga.
      // * Por ahora, en modo creación, el select de "Equipo Padre" mostrará todos los equipos.
      //TODO: Implementar un listener en el select 'id_equipo' para actualizar dinámicamente las opciones de 'id_equipo_padre'.

      // * Limpio el área de contenido y construyo el HTML del formulario.
      contentArea.innerHTML = `
          <h2 class="text-2xl font-bold text-gray-800 mb-6">${formTitle}</h2>
          <form id="asignacionForm" class="space-y-6 bg-white p-8 rounded-lg shadow-md">
              <!-- Equipo (Obligatorio) -->
              <div>
                  <label for="id_equipo" class="block text-sm font-medium text-gray-700">Equipo (Número de Serie) <span class="text-red-500">*</span></label>
                  <select id="id_equipo" name="id_equipo" required
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Seleccione un equipo...</option>
                      ${equiposCache.map(eq => `<option value="${eq.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_equipo === eq.id ? 'selected' : ''}>${eq.numero_serie} - ${eq.nombre_equipo || 'Sin Nombre'}</option>`).join('')}
                  </select>
              </div>

              <!-- Fecha de Asignación (Obligatorio) -->
              <div>
                  <label for="fecha_asignacion" class="block text-sm font-medium text-gray-700">Fecha de Asignación <span class="text-red-500">*</span></label>
                  <input type="datetime-local" id="fecha_asignacion" name="fecha_asignacion" required
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         value="${isEditing && currentAsignacionData && currentAsignacionData.fecha_asignacion ? new Date(currentAsignacionData.fecha_asignacion).toISOString().substring(0, 16) : ''}">
                         <!-- Formato para datetime-local: YYYY-MM-DDTHH:mm -->
              </div>

              <hr class="my-6 border-gray-300">
              <p class="text-lg font-semibold text-gray-700">Asignar A (Opcional, pero al menos uno para activas):</p>

              <!-- Empleado (Opcional) -->
              <div>
                  <label for="id_empleado" class="block text-sm font-medium text-gray-700">Empleado Asignado</label>
                  <select id="id_empleado" name="id_empleado"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Ninguno</option>
                      ${empleadosCache.map(emp => `<option value="${emp.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_empleado === emp.id ? 'selected' : ''}>${emp.nombres} ${emp.apellidos} (ID: ${emp.id})</option>`).join('')}
                  </select>
              </div>

              <!-- Sucursal Asignada (Opcional) -->
              <div>
                  <label for="id_sucursal_asignado" class="block text-sm font-medium text-gray-700">Sucursal (para stock o ubicación general)</label>
                  <select id="id_sucursal_asignado" name="id_sucursal_asignado"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Ninguna</option>
                      ${sucursalesCache.map(suc => `<option value="${suc.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_sucursal_asignado === suc.id ? 'selected' : ''}>${suc.nombre}</option>`).join('')}
                  </select>
              </div>

              <!-- Área Asignada (Opcional) -->
              <div>
                  <label for="id_area_asignado" class="block text-sm font-medium text-gray-700">Área (en sucursal corporativa)</label>
                  <select id="id_area_asignado" name="id_area_asignado"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Ninguna</option>
                      ${areasCache.map(area => `<option value="${area.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_area_asignado === area.id ? 'selected' : ''}>${area.nombre} (Suc ID: ${area.id_sucursal})</option>`).join('')}
                  </select>
              </div>

              <hr class="my-6 border-gray-300">
              <p class="text-lg font-semibold text-gray-700">Detalles Adicionales (Opcional):</p>

              <!-- Equipo Padre (Opcional) -->
              <div>
                  <label for="id_equipo_padre" class="block text-sm font-medium text-gray-700">Componente de (Equipo Padre)</label>
                  <select id="id_equipo_padre" name="id_equipo_padre"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Ninguno</option>
                      ${equiposParaPadre
                          .map(eq => `<option value="${eq.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_equipo_padre === eq.id ? 'selected' : ''}>${eq.numero_serie} - ${eq.nombre_equipo || 'Sin Nombre'}</option>`).join('')}
                  </select>
              </div>

              <!-- Dirección IP (Opcional) -->
              <div>
                  <label for="id_ip" class="block text-sm font-medium text-gray-700">Dirección IP Asignada</label>
                  <select id="id_ip" name="id_ip"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Ninguna (o DHCP)</option>
                      ${ipsCache
                          //TODO: Filtrar IPs para mostrar solo las disponibles o la actualmente asignada si se está editando.
                          //? ¿Debería filtrar por sucursal si se seleccionó una sucursal?
                          .map(ip => `<option value="${ip.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_ip === ip.id ? 'selected' : ''}>${ip.direccion_ip} (${ip.status_nombre || 'N/A'})</option>`).join('')}
                  </select>
              </div>

              <!-- Fecha de Fin de Asignación (Opcional - para finalizar) -->
              <div>
                  <label for="fecha_fin_asignacion" class="block text-sm font-medium text-gray-700">Fecha de Fin de Asignación</label>
                  <input type="datetime-local" id="fecha_fin_asignacion" name="fecha_fin_asignacion"
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         value="${isEditing && currentAsignacionData && currentAsignacionData.fecha_fin_asignacion ? new Date(currentAsignacionData.fecha_fin_asignacion).toISOString().substring(0, 16) : ''}">
              </div>

              <!-- Estado de la Asignación (Obligatorio) -->
              <div>
                  <label for="id_status_asignacion" class="block text-sm font-medium text-gray-700">Estado de la Asignación <span class="text-red-500">*</span></label>
                  <select id="id_status_asignacion" name="id_status_asignacion" required
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Seleccione un estado...</option>
                      ${statusesCache.map(status => `<option value="${status.id}" ${isEditing && currentAsignacionData && currentAsignacionData.id_status_asignacion === status.id ? 'selected' : (!isEditing && status.nombre_status === 'Activo' ? 'selected' : '')}>${status.nombre_status}</option>`).join('')}
                      <!--//? Para nueva asignación, 'Activo' (ID 1) o 'Asignado' (ID 4) por defecto? Usaré Activo por ahora. -->
                  </select>
              </div>

              <div>
                  <label for="observacion" class="block text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea id="observacion" name="observacion" rows="3"
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">${isEditing && currentAsignacionData && currentAsignacionData.observacion ? currentAsignacionData.observacion : ''}</textarea>
              </div>

              <!-- Div para mostrar mensajes de error del formulario -->
              <div id="form-error-message" class="text-red-500 text-sm mt-2"></div>

              <!-- Botones de acción -->
              <div class="flex justify-end space-x-4 pt-4">
                  <button type="button" id="cancelAsignacionForm" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                  <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
                      ${isEditing ? 'Guardar Cambios' : 'Registrar Asignación'}
                  </button>
              </div>
          </form>
      `;

      // * Añado el event listener al formulario.
      document.getElementById('asignacionForm').addEventListener('submit', (event) => handleAsignacionFormSubmit(event, asignacionId));
      // * Listener para el botón Cancelar.
      document.getElementById('cancelAsignacionForm').addEventListener('click', async() => {
        await showInfoModal({
          title: 'Cancelado',
          message: 'El formulario de Asignacion ha sido cancelado.'
      });
         if (typeof window.navigateTo === 'function') {
             window.navigateTo('asignacionesList'); // Regreso a la lista de Asignaciones.
         } else {
             contentArea.innerHTML = '<p>Operación cancelada.</p>';
         }
     });


      //TODO: Implementar listeners para actualizar dinámicamente el select de "Área Asignada"
      //      cuando cambie la "Sucursal Asignada", para mostrar solo áreas de esa sucursal.
      //TODO: Similarmente, el select de IPs podría filtrarse por sucursal si se selecciona una.

  } catch (error) {
      console.error('Error al renderizar el formulario de Asignación:', error);
      showAsignacionFormError(error.message, 'cargar');
  }
}

// ===============================================================
// MANEJO DEL ENVÍO DEL FORMULARIO
// ===============================================================
async function handleAsignacionFormSubmit(event, editingId = null) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const asignacionData = {};

  // * Convierto FormData a un objeto, manejando valores vacíos y numéricos.
  for (let [key, value] of formData.entries()) {
      if (['id_equipo', 'id_empleado', 'id_sucursal_asignado', 'id_area_asignado', 'id_equipo_padre', 'id_ip', 'id_status_asignacion'].includes(key)) {
          asignacionData[key] = value ? parseInt(value, 10) : null; // Si está vacío, envío null.
      } else if (key === 'fecha_asignacion' || key === 'fecha_fin_asignacion') {
          // * El input datetime-local devuelve "YYYY-MM-DDTHH:mm". MySQL espera "YYYY-MM-DD HH:mm:ss".
          // * Si el valor está vacío, lo mandamos como null.
          if (value) {
              let formattedDate = value.replace('T', ' ');
              // Aseguro que tenga segundos si no los tiene el input.
              if (formattedDate.length === 16) formattedDate += ':00';
              asignacionData[key] = formattedDate;
          } else {
              asignacionData[key] = null;
          }
      } else {
          // Para campos de texto como 'observacion', si está vacío, enviar null.
          asignacionData[key] = value.trim() === '' ? null : value;
      }
  }

  // * Validaciones básicas en frontend (el backend también validará).
  if (!asignacionData.id_equipo || !asignacionData.fecha_asignacion || !asignacionData.id_status_asignacion) {
       document.getElementById('form-error-message').textContent = 'Equipo, Fecha de Asignación y Estado de Asignación son obligatorios.';
       return;
  }
   // * Validación de "al menos una asociación" para activas (fecha_fin_asignacion es null).
   const isCreatingOrUpdatingToActive = !asignacionData.fecha_fin_asignacion;
   if (isCreatingOrUpdatingToActive && !asignacionData.id_empleado && !asignacionData.id_sucursal_asignado && !asignacionData.id_area_asignado) {
       document.getElementById('form-error-message').textContent = 'Para una asignación activa, debe asociarse a un empleado, sucursal o área.';
       return;
   }

  document.getElementById('form-error-message').textContent = '';
  console.log('Herwing está enviando datos del formulario de Asignación:', asignacionData, 'Editando ID:', editingId);

  try {
      let responseMessage = '';
      if (editingId) {
          await updateAsignacion(editingId, asignacionData);
          responseMessage = `Asignación con ID ${editingId} actualizada exitosamente.`;
      } else {
          const nuevaAsignacion = await createAsignacion(asignacionData); // La API devuelve el objeto creado.
          responseMessage = `Asignación (ID: ${nuevaAsignacion.id}) para el equipo ID ${nuevaAsignacion.id_equipo} registrada exitosamente.`;
      }
      console.log(responseMessage);
      // * Uso mi modal de información.
      await showInfoModal({ title: 'Operación Exitosa', message: responseMessage });

      if (typeof window.navigateTo === 'function') {
          window.navigateTo('asignacionesList'); // Navego a la lista después del éxito.
      }

  } catch (error) {
      console.error('Error al enviar el formulario de Asignación:', error);
      const errorDiv = document.getElementById('form-error-message');
      if (errorDiv) {
          errorDiv.textContent = error.message || 'Ocurrió un error desconocido.';
      } else {
          // Fallback si el div de error no está, uso mi modal.
          await showInfoModal({ title: 'Error', message: error.message || 'Ocurrió un error desconocido al procesar el formulario.'});
      }
  }
}

// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
// Esta será llamada desde main.js. `params` puede ser el ID si se edita.
// ===============================================================
async function showAsignacionForm(params = null) {
  // * El ID de la asignación puede venir como string (de la URL) o como parte de un objeto.
  const asignacionId = typeof params === 'string' ? params : (params && params.id);
  console.log('Herwing va a mostrar el formulario de Asignación. ID para editar:', asignacionId);

  let asignacionToEdit = null; // * Variable para los datos si estoy editando.
  if (asignacionId) {
      // * Si hay ID, estoy editando. Primero, obtengo los datos de la asignación.
      showAsignacionFormLoading('Editar');
      try {
          asignacionToEdit = await getAsignacionById(asignacionId);
          // * Si la API envuelve la respuesta (ej. { data: asignacion }), la extraigo.
          if (asignacionToEdit && (asignacionToEdit.data || asignacionToEdit.asignacion)) {
              asignacionToEdit = asignacionToEdit.data || asignacionToEdit.asignacion;
          }
          if (!asignacionToEdit) {
              showAsignacionFormError(`No se encontró la asignación con ID ${asignacionId}.`, 'cargar');
              return;
          }
      } catch (error) {
          showAsignacionFormError(error.message, 'cargar datos para edición');
          return;
      }
  } else {
      // * Si no hay ID, estoy creando una nueva asignación.
      showAsignacionFormLoading('Crear');
  }

  // * Renderizo el formulario (vacío o con datos para editar).
  await renderAsignacionForm(asignacionToEdit); // Paso el objeto completo o null.
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// ===============================================================
export { showAsignacionForm };