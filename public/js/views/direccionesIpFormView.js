//public/js/views/direccionesIpFormView.js
//* Este módulo se encarga de la lógica para el formulario de creación y edición de Direcciones IP.

//? Funciones de API necesarias: 'createDireccionIp', 'updateDireccionIp', 'getDireccionIpById'.
//? Para poblar selects: 'getSucursales', 'getStatuses'.
import {
  createDireccionIp,
  updateDireccionIp,
  getDireccionIpById,
  getSucursales,
  getStatuses
} from '../api.js';

import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

//* Referencia al contenedor principal donde se renderizará este formulario.
const contentArea = document.getElementById('content-area');

//* Cache para los datos de los selects.
let sucursalesCache = null;
let statusesCache = null;

//* FUNCIONES DE RENDERIZADO DEL FORMULARIO

//* Muestra un mensaje de carga mientras se prepara el formulario.
function showDireccionIpFormLoading(action = 'Crear') {
  showFormLoading(action, 'dirección IP');
}

//* Muestra un mensaje de error si algo falla al cargar el formulario o al procesar el envío.
function showDireccionIpFormError(message, action = 'procesar') {
  showFormError(action, 'dirección IP', message, () => showDireccionIpForm());
}

//* Renderiza el formulario HTML para crear o editar una Dirección IP.
//* `ipToEdit` es opcional. Si se proporciona, el formulario se llena para edición.
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
      //* Obtengo los datos para los selects si aún no los tengo cacheados.
      if (!sucursalesCache) {
          sucursalesCache = await getSucursales();
      }
      if (!statusesCache) {
          statusesCache = await getStatuses();
      }

      // * Lógica para deshabilitar el campo de estado si la IP tiene asignación activa.
      let isStatusDisabled = false;
      let statusHelpText = '';
      if (isEditing && currentIpData && currentIpData.asignacion_activa) {
          isStatusDisabled = true;
          statusHelpText = 'Estado gestionado por Asignaciones. Finalice la asignación activa para liberar.';
      }

      //* Limpio el área de contenido y construyo el HTML del formulario.
      contentArea.innerHTML = `
          <div class="col-xl-8 col-lg-10 mx-auto">
              <div class="card">
                  <div class="card-header">
                      <h4 class="card-title">${formTitle}</h4>
                  </div>
                  <div class="card-body">
                      <form id="direccion-ip-form" class="basic-form">
                          <div class="mb-3">
                              <label for="direccion_ip" class="form-label">Dirección IP <span class="text-danger">*</span></label>
                              <input type="text" id="direccion_ip" name="direccion_ip" required placeholder="Ej: 192.168.1.100 o 2001:db8::1" class="form-control input-default uppercase-field" value="${isEditing && currentIpData.direccion_ip ? currentIpData.direccion_ip : ''}">
                          </div>
                          <div class="mb-3">
                              <label for="id_sucursal" class="form-label">Sucursal Asociada</label>
                              <select id="id_sucursal" name="id_sucursal" class="form-control select2">
                                  <option value="">Ninguna (IP General/Corporativa)</option>
                                  ${sucursalesCache.map(sucursal => `<option value="${sucursal.id}" ${isEditing && currentIpData.id_sucursal === sucursal.id ? 'selected' : ''}>${sucursal.nombre}</option>`).join('')}
                              </select>
                          </div>
                          <div class="mb-3">
                              <label for="id_status" class="form-label">Estado de la IP <span class="text-danger">*</span></label>
                              <select id="id_status" name="id_status" required class="form-control select2 ${isStatusDisabled ? 'bg-gray-200 cursor-not-allowed' : ''}" ${isStatusDisabled ? 'disabled' : ''}>
                                  <option value="">Seleccione un estado...</option>
                                  ${statusesCache
                                    .filter(status => isEditing || ![2, 6, 7, 9, 12].includes(status.id))
                                    .map(status => `<option value="${status.id}" ${isEditing && currentIpData.id_status === status.id ? 'selected' : (!isEditing && status.id === 5 ? 'selected' : '')}>${status.nombre_status}</option>`)
                                    .join('')}
                              </select>
                              ${isStatusDisabled ? `<p class="mt-2 text-xs text-gray-500">${statusHelpText}</p>` : ''}
                          </div>
                          <div class="mb-3">
                              <label for="comentario" class="form-label">Comentario</label>
                              <textarea id="comentario" name="comentario" rows="3" class="form-control uppercase-field" placeholder="DESCRIBA EL PROPÓSITO DE ESTA IP, DISPOSITIVO ASOCIADO, UBICACIÓN, ETC.">${isEditing && currentIpData.comentario ? currentIpData.comentario : ''}</textarea>
                          </div>
                          <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                          <div class="d-flex justify-content-end gap-2">
                              <button type="button" id="cancelDireccionIpForm" class="btn btn-danger light btn-sl-sm"><span class="me-2"><i class="fa fa-times"></i></span>Cancelar</button>
                              <button type="submit" class="btn btn-primary btn-sl-sm"><span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Registrar IP'}</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      `;

      // Inicializar select2 en los selects buscables
      if (window.$ && $.fn.select2) {
          $('#id_sucursal').select2({ width: '100%' });
          $('#id_status').select2({ width: '100%' });
      }

      // Inicializar transformación a mayúsculas en campos de texto
      applyUppercaseToFields(['direccion_ip', 'comentario']);

      document.getElementById('direccion-ip-form').addEventListener('submit', (event) => handleDireccionIpFormSubmit(event, ipId));
      document.getElementById('cancelDireccionIpForm').addEventListener('click', async () => {
        await Swal.fire({
            title: 'Cancelado',
            text: 'El formulario de dirección IP ha sido cancelado.',
            icon: 'warning',
            confirmButtonText: 'Aceptar'
        });
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direcciones-ip-list');
        } else {
            contentArea.innerHTML = `<p>Por favor, navega manualmente a la lista.</p>`;
        }
      });

  } catch (error) {
      console.error('Error al renderizar el formulario de Dirección IP:', error);
      showDireccionIpFormError(error.message, 'cargar');
  }
}


//* MANEJO DEL ENVÍO DEL FORMULARIO

//* Maneja el evento 'submit' del formulario de Dirección IP.
//* `editingId` es el ID de la IP si se está editando, o null si es nueva.
//* Maneja el evento 'submit' del formulario de Dirección IP.
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
            responseMessage = `Dirección IP "${ipData.direccion_ip}" actualizada exitosamente en el sistema.`;
            console.log(responseMessage);
        } else {
            const nuevaIp = await createDireccionIp(ipData);
            responseMessage = `Dirección IP "${nuevaIp.direccion_ip}" registrada exitosamente en el sistema.`;
            console.log(responseMessage);
        }

        //* Uso mi modal de información para el mensaje de éxito.
        await Swal.fire({
            title: editingId ? 'IP Actualizada Exitosamente' : 'IP Registrada Exitosamente',
            text: responseMessage,
            icon: 'success',
            confirmButtonText: 'Entendido'
        });

        //* Después de éxito, navego de vuelta a la lista de IPs.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('direcciones-ip-list');
        } else {
             //* Esto es un fallback si navigateTo no está disponible.
            contentArea.innerHTML = `<p class="text-green-500">${responseMessage} Por favor, navega manualmente a la lista.</p>`;
        }

    } catch (error) {
        console.error('Error al enviar el formulario de Dirección IP:', error);
        //* Muestro el error en el div del formulario, pero también podría usar showInfoModal.
        const errorMessageDiv = document.getElementById('form-error-message');
        if (errorMessageDiv) {
            errorMessageDiv.textContent = error.message || 'Ocurrió un error desconocido.';
        } else {
            //* Fallback si el div no existe, uso mi modal de info para el error.
            await Swal.fire({
                title: 'Error al Procesar Formulario',
                text: error.message || 'Ocurrió un error inesperado al procesar el formulario. Por favor, inténtelo nuevamente.',
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        }
    }
}


//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
async function showDireccionIpForm(params = null) {
  const ipId = typeof params === 'string' ? params : (params && params.id);
  console.log('Herwing va a mostrar el formulario de Dirección IP. ID para editar:', ipId);

  let ipToEdit = null;
  if (ipId) {
      showDireccionIpFormLoading('Editar');
      try {
          ipToEdit = await getDireccionIpById(ipId);
          if (ipToEdit && (ipToEdit.data || ipToEdit.direccion_ip)) { //* Ajuste por si la API envuelve la respuesta
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

  // * Lógica para deshabilitar el campo de estado si la IP tiene asignación activa.
  let isStatusDisabled = false;
  let statusHelpText = '';
  if (ipToEdit && ipToEdit.asignacion_activa) {
      isStatusDisabled = true;
      statusHelpText = 'Estado gestionado por Asignaciones. Finalice la asignación activa para liberar.';
  }

  await renderDireccionIpForm(ipToEdit);
}

export { showDireccionIpForm };