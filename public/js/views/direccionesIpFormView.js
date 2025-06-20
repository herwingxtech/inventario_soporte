// public/js/views/direccionIpFormView.js
// * Este módulo se encarga de la lógica para el formulario de creación y edición de Direcciones IP.

//? Funciones de API necesarias: 'createDireccionIp', 'updateDireccionIp', 'getDireccionIpById'.
//? Para poblar selects: 'getSucursales', 'getStatuses'.
import {
  createDireccionIp,
  updateDireccionIp,
  getDireccionIpById,
  getSucursales,
  getStatuses
} from '../api.js';

import { showInfoModal } from '../ui/modal.js'; // Asumo que showInfoModal existe aquí.
import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
// * Referencia al contenedor principal donde se renderizará este formulario.
const contentArea = document.getElementById('content-area');

// * Cache para los datos de los selects.
let sucursalesCache = null;
let statusesCache = null;

// ===============================================================
// FUNCIONES DE RENDERIZADO DEL FORMULARIO
// ===============================================================

// * Muestra un mensaje de carga mientras se prepara el formulario.
function showDireccionIpFormLoading(action = 'Crear') {
  showFormLoading(action, 'dirección IP');
}

// * Muestra un mensaje de error si algo falla al cargar el formulario o al procesar el envío.
function showDireccionIpFormError(message, action = 'procesar') {
  showFormError(action, 'dirección IP', message, () => showDireccionIpForm());
}

// * Renderiza el formulario HTML para crear o editar una Dirección IP.
// * `ipToEdit` es opcional. Si se proporciona, el formulario se llena para edición.
async function renderDireccionIpForm(ipToEdit = null) {
  const ipId = typeof ipToEdit === 'string' ? ipToEdit : (ipToEdit && ipToEdit.id);
  console.log('Herwing está renderizando el formulario de Dirección IP. Editando ID:', ipId || 'Nueva');
  const isEditing = ipId !== null;
  const formTitle = isEditing ? `Editar Dirección IP (ID: ${ipId})` : 'Registrar Nueva Dirección IP';

  let currentIpData = null;
  if (isEditing && typeof ipToEdit === 'string') {
      try {
          currentIpData = await getDireccionIpById(ipId);
          if (!currentIpData) {
              showDireccionIpFormError(`No se encontró la Dirección IP con ID ${ipId} para editar.`, 'cargar');
              return;
          }
      } catch (error) {
          showDireccionIpFormError(error.message, 'cargar datos para edición');
          return;
      }
  } else if (isEditing) {
      currentIpData = ipToEdit;
  }

  showDireccionIpFormLoading(isEditing ? 'Editar' : 'Crear');

  try {
      // * Obtengo los datos para los selects si aún no los tengo cacheados.
      if (!sucursalesCache) {
          sucursalesCache = await getSucursales();
      }
      if (!statusesCache) {
          statusesCache = await getStatuses();
      }

      // * Limpio el área de contenido y construyo el HTML del formulario.
      contentArea.innerHTML = `
          <h2 class="text-2xl font-bold text-gray-800 mb-6">${formTitle}</h2>
          <form id="direccionIpForm" class="space-y-6 bg-white p-8 rounded-lg shadow-md">
              <!-- Campo Obligatorio -->
              <div>
                  <label for="direccion_ip" class="block text-sm font-medium text-gray-700">Dirección IP <span class="text-red-500">*</span></label>
                  <input type="text" id="direccion_ip" name="direccion_ip" required
                         placeholder="Ej: 192.168.1.100 o 2001:db8::1"
                         class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         value="${isEditing && currentIpData.direccion_ip ? currentIpData.direccion_ip : ''}">
              </div>

              <!-- Campos Opcionales -->
              <div>
                  <label for="id_sucursal" class="block text-sm font-medium text-gray-700">Sucursal Asociada</label>
                  <select id="id_sucursal" name="id_sucursal"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Ninguna (IP General/Corporativa)</option>
                      ${sucursalesCache.map(sucursal => `<option value="${sucursal.id}" ${isEditing && currentIpData.id_sucursal === sucursal.id ? 'selected' : ''}>${sucursal.nombre}</option>`).join('')}
                  </select>
              </div>

               <div>
                  <label for="id_status" class="block text-sm font-medium text-gray-700">Estado de la IP <span class="text-red-500">*</span></label>
                  <select id="id_status" name="id_status" required
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <option value="">Seleccione un estado...</option>
                      ${statusesCache.map(status => `<option value="${status.id}" ${isEditing && currentIpData.id_status === status.id ? 'selected' : (!isEditing && status.id === 5 ? 'selected' : '')}>${status.nombre_status}</option>`).join('')}
                      <!--//? Por defecto para nueva IP, ¿'Disponible' (ID 5) o 'Activo' (ID 1)? Usaré Disponible (5). -->
                  </select>
              </div>

              <div>
                  <label for="comentario" class="block text-sm font-medium text-gray-700">Comentario / Notas</label>
                  <textarea id="comentario" name="comentario" rows="3"
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">${isEditing && currentIpData.comentario ? currentIpData.comentario : ''}</textarea>
              </div>

              <!-- Div para mostrar mensajes de error del formulario -->
              <div id="form-error-message" class="text-red-500 text-sm mt-2"></div>

              <!-- Botones de acción -->
              <div class="flex justify-end space-x-4 pt-4">
                  <button type="button" id="cancelDireccionIpForm" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Cancelar
                  </button>
                  <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                      ${isEditing ? 'Guardar Cambios' : 'Registrar IP'}
                  </button>
              </div>
          </form>
      `;

      // * Añado el event listener al formulario.
      document.getElementById('direccionIpForm').addEventListener('submit', (event) => handleDireccionIpFormSubmit(event, ipId));
      // * Listener para el botón Cancelar.
      document.getElementById('cancelDireccionIpForm').addEventListener('click', async () => {
        await showInfoModal({
            title: 'Cancelado',
            message: 'El formulario de Dirección IP ha sido cancelado.'
        });
           if (typeof window.navigateTo === 'function') {
               window.navigateTo('direccionesIpList'); // Regreso a la lista de IPs.
           } else {
               contentArea.innerHTML = '<p>Operación cancelada.</p>';
           }
       });

  } catch (error) {
      console.error('Error al renderizar el formulario de Dirección IP:', error);
      showDireccionIpFormError(error.message, 'cargar');
  }
}


// ===============================================================
// MANEJO DEL ENVÍO DEL FORMULARIO
// ===============================================================

// * Maneja el evento 'submit' del formulario de Dirección IP.
// * `editingId` es el ID de la IP si se está editando, o null si es nueva.
// * Maneja el evento 'submit' del formulario de Dirección IP.
async function handleDireccionIpFormSubmit(event, editingId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const ipData = {};

    for (let [key, value] of formData.entries()) {
        if (['id_sucursal', 'id_status'].includes(key)) {
            ipData[key] = value ? parseInt(value, 10) : null;
        } else if (value.trim() === '' && ['comentario'].includes(key)) {
            ipData[key] = null;
        } else {
            ipData[key] = value;
        }
    }

    if (!ipData.direccion_ip || ipData.direccion_ip.trim() === '' || !ipData.id_status) {
         document.getElementById('form-error-message').textContent = 'Dirección IP y Estado son obligatorios.';
         return;
    }
    //? Aquí debería añadir la validación de formato de IP como en el backend.

    document.getElementById('form-error-message').textContent = '';
    console.log('Herwing está enviando datos del formulario de Dirección IP:', ipData, 'Editando ID:', editingId);

    try {
        let responseMessage = '';
        if (editingId) {
            await updateDireccionIp(editingId, ipData);
            responseMessage = `Dirección IP con ID ${editingId} actualizada exitosamente.`;
            console.log(responseMessage);
        } else {
            const nuevaIp = await createDireccionIp(ipData);
            responseMessage = `Dirección IP "${nuevaIp.direccion_ip}" (ID: ${nuevaIp.id}) registrada exitosamente.`;
            console.log(responseMessage);
        }

        // * Uso mi modal de información para el mensaje de éxito.
        await showInfoModal({
            title: 'Operación Exitosa',
            message: responseMessage
        });

        // * Después de éxito, navego de vuelta a la lista de IPs.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direccionesIpList');
        } else {
             // Esto es un fallback si navigateTo no está disponible.
            contentArea.innerHTML = `<p class="text-green-500">${responseMessage} Por favor, navega manualmente a la lista.</p>`;
        }

    } catch (error) {
        console.error('Error al enviar el formulario de Dirección IP:', error);
        // * Muestro el error en el div del formulario, pero también podría usar showInfoModal.
        const errorMessageDiv = document.getElementById('form-error-message');
        if (errorMessageDiv) {
            errorMessageDiv.textContent = error.message || 'Ocurrió un error desconocido.';
        } else {
            // Fallback si el div no existe, uso mi modal de info para el error.
            await showInfoModal({
                title: 'Error',
                message: error.message || 'Ocurrió un error desconocido al procesar el formulario.'
            });
        }
    }
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
// ===============================================================
async function showDireccionIpForm(params = null) {
  const ipId = typeof params === 'string' ? params : (params && params.id);
  console.log('Herwing va a mostrar el formulario de Dirección IP. ID para editar:', ipId);

  let ipToEdit = null;
  if (ipId) {
      showDireccionIpFormLoading('Editar');
      try {
          ipToEdit = await getDireccionIpById(ipId);
          if (ipToEdit && (ipToEdit.data || ipToEdit.direccion_ip)) { // Ajuste por si la API envuelve la respuesta
              ipToEdit = ipToEdit.data || ipToEdit;
          }
          if (!ipToEdit) {
              showDireccionIpFormError(`No se encontró la Dirección IP con ID ${ipId}.`, 'cargar');
              return;
          }
      } catch (error) {
          showDireccionIpFormError(error.message, 'cargar datos para edición');
          return;
      }
  } else {
      showDireccionIpFormLoading('Crear');
  }

  await renderDireccionIpForm(ipToEdit);
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// ===============================================================
export { showDireccionIpForm };