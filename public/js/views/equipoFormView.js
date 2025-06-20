// public/js/views/equipoFormView.js
// * Este módulo maneja la lógica para el formulario de creación y edición de Equipos.

import { createEquipo, getTiposEquipo, getSucursales, getStatuses, getEquipoById, updateEquipo } from '../api.js';
import { showInfoModal } from '../ui/modal.js';

const contentArea = document.getElementById('content-area');

let tiposEquipoCache = null;
let sucursalesCache = null;
let statusesCache = null;

// ===============================================================
// FUNCIONES DE RENDERIZADO DEL FORMULARIO
// ===============================================================

function showEquipoFormLoading(action = 'Crear') {
    contentArea.innerHTML = `<p>Cargando formulario para ${action.toLowerCase()} equipo...</p>`;
}

function showEquipoFormError(message, action = 'procesar') {
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al ${action} equipo:</p><p class="text-red-500">${message}</p>
                             <button class="mt-2 px-4 py-2 border border-gray-300 rounded-md" onclick="window.navigateTo('equiposList')">Volver a la lista</button>`;
}

// * Renderiza el formulario HTML para crear o editar un equipo.
// * AHORA deshabilita el select de estado si es un estado gestionado automáticamente.
async function renderEquipoForm(equipoToEdit = null) {
    const equipoId = typeof equipoToEdit === 'string' ? equipoToEdit : (equipoToEdit && equipoToEdit.id);
    const isEditing = equipoId !== null;
    const formTitle = isEditing ? `Editar Equipo (ID: ${equipoId})` : 'Registrar Nuevo Equipo';

    let currentEquipoData = null;
    if (isEditing) {
        // En modo edición, siempre necesito los datos completos.
        currentEquipoData = (typeof equipoToEdit === 'object' && equipoToEdit !== null) ? equipoToEdit : await getEquipoById(equipoId);
        if (!currentEquipoData) {
            showEquipoFormError(`No se encontró el equipo con ID ${equipoId}.`, 'cargar');
            return;
        }
    }

    showEquipoFormLoading(isEditing ? 'Editar' : 'Crear');

    try {
        if (!tiposEquipoCache) tiposEquipoCache = await getTiposEquipo();
        if (!sucursalesCache) sucursalesCache = await getSucursales();
        if (!statusesCache) statusesCache = await getStatuses();

        // * Lógica para deshabilitar el campo de estado si es necesario.
        let isStatusDisabled = false;
        let statusHelpText = '';
        const STATUS_ASIGNADO_ID = 4;
        const STATUS_EN_MANTENIMIENTO_ID = 3;

        if (isEditing && currentEquipoData) {
            if (currentEquipoData.id_status === STATUS_ASIGNADO_ID) {
                isStatusDisabled = true;
                statusHelpText = 'Estado gestionado por Asignaciones. Finalice la asignación activa para liberar.';
            } else if (currentEquipoData.id_status === STATUS_EN_MANTENIMIENTO_ID) {
                isStatusDisabled = true;
                statusHelpText = 'Estado gestionado por Mantenimientos. Finalice el mantenimiento para liberar.';
            }
        }

        contentArea.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-6">${formTitle}</h2>
            <form id="equipoForm" class="space-y-6 bg-white p-8 rounded-lg shadow-md">
                <!-- Campos Obligatorios -->
                <div>
                    <label for="numero_serie" class="block text-sm font-medium text-gray-700">Número de Serie <span class="text-red-500">*</span></label>
                    <input type="text" id="numero_serie" name="numero_serie" required
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           value="${isEditing && currentEquipoData.numero_serie ? currentEquipoData.numero_serie : ''}">
                </div>

                <div>
                    <label for="id_tipo_equipo" class="block text-sm font-medium text-gray-700">Tipo de Equipo <span class="text-red-500">*</span></label>
                    <select id="id_tipo_equipo" name="id_tipo_equipo" required
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Seleccione un tipo...</option>
                        ${tiposEquipoCache.map(tipo => `<option value="${tipo.id}" ${isEditing && currentEquipoData.id_tipo_equipo === tipo.id ? 'selected' : ''}>${tipo.nombre_tipo}</option>`).join('')}
                    </select>
                </div>

                <div>
                    <label for="id_sucursal_actual" class="block text-sm font-medium text-gray-700">Sucursal Actual <span class="text-red-500">*</span></label>
                    <select id="id_sucursal_actual" name="id_sucursal_actual" required
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Seleccione una sucursal...</option>
                        ${sucursalesCache.map(sucursal => `<option value="${sucursal.id}" ${isEditing && currentEquipoData.id_sucursal_actual === sucursal.id ? 'selected' : ''}>${sucursal.nombre}</option>`).join('')}
                    </select>
                </div>

                <!-- Campos Opcionales -->
                <!-- ... (resto de campos: nombre, marca, modelo, etc., con la misma lógica de 'value') ... -->
                 <div>
                    <label for="nombre_equipo" class="block text-sm font-medium text-gray-700">Nombre del Equipo (Alias)</label>
                    <input type="text" id="nombre_equipo" name="nombre_equipo" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" value="${isEditing && currentEquipoData.nombre_equipo ? currentEquipoData.nombre_equipo : ''}">
                </div>
                 <!-- ... (más campos) ... -->

                <!-- Estado del Equipo (con lógica de deshabilitación) -->
                <div>
                    <label for="id_status" class="block text-sm font-medium text-gray-700">Estado del Equipo <span class="text-red-500">*</span></label>
                    <select id="id_status" name="id_status" required
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isStatusDisabled ? 'bg-gray-200 cursor-not-allowed' : ''}"
                            ${isStatusDisabled ? 'disabled' : ''}>
                        <option value="">Seleccione un estado...</option>
                        ${statusesCache.map(status => {
                            const isAutomaticStatus = [STATUS_ASIGNADO_ID, STATUS_EN_MANTENIMIENTO_ID].includes(status.id);
                            const isCurrentStatus = isEditing && currentEquipoData.id_status === status.id;
                            
                            if (isStatusDisabled) { // Si está deshabilitado
                                return isCurrentStatus ? `<option value="${status.id}" selected>${status.nombre_status}</option>` : '';
                            } else { // Si está habilitado
                                // Muestro si NO es automático O si es el estado actual del equipo.
                                if (!isAutomaticStatus || isCurrentStatus) {
                                    return `<option value="${status.id}" ${isCurrentStatus ? 'selected' : (!isEditing && status.nombre_status === 'Disponible' ? 'selected' : '')}>${status.nombre_status}</option>`;
                                }
                                return '';
                            }
                        }).join('')}
                    </select>
                    ${isStatusDisabled ? `<p class="mt-2 text-xs text-gray-500">${statusHelpText}</p>` : ''}
                </div>

                <!-- ... (resto de campos: otras_caracteristicas, botones, etc.) ... -->
                 <div>
                    <label for="otras_caracteristicas" class="block text-sm font-medium text-gray-700">Otras Características / Notas</label>
                    <textarea id="otras_caracteristicas" name="otras_caracteristicas" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">${isEditing && currentEquipoData.otras_caracteristicas ? currentEquipoData.otras_caracteristicas : ''}</textarea>
                </div>
                <div id="form-error-message" class="text-red-500 text-sm mt-2"></div>
                <div class="flex justify-end space-x-4">
                    <button type="button" id="cancelEquipoForm" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button type="submit" class="px-4 py-2 border rounded-md text-white bg-blue-600 hover:bg-blue-700">${isEditing ? 'Guardar Cambios' : 'Registrar Equipo'}</button>
                </div>
            </form>
        `;

        document.getElementById('equipoForm').addEventListener('submit', (event) => handleEquipoFormSubmit(event, equipoId));
        document.getElementById('cancelEquipoForm').addEventListener('click', () => {
             if (typeof window.navigateTo === 'function') window.navigateTo('equiposList');
         });

    } catch (error) {
        console.error('Error al renderizar el formulario de equipo:', error);
        showEquipoFormError(error.message, 'cargar');
    }
}


async function handleEquipoFormSubmit(event, editingId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const equipoData = {};

    for (let [key, value] of formData.entries()) {
        if (key === 'id_tipo_equipo' || key === 'id_sucursal_actual' || key === 'id_status') {
            equipoData[key] = value ? parseInt(value, 10) : null;
        } else {
            equipoData[key] = value.trim() === '' ? null : value;
        }
    }
    // Si el campo de estado estaba deshabilitado, FormData no lo incluye.
    // Necesitamos añadirlo manualmente para que el backend no lo vea como un cambio a 'null'.
    if (editingId && form.querySelector('#id_status').disabled) {
        const statusSelect = form.querySelector('#id_status');
        if (statusSelect && statusSelect.value) {
            equipoData['id_status'] = parseInt(statusSelect.value, 10);
        }
    }

    const errorMessageDiv = document.getElementById('form-error-message');
    errorMessageDiv.textContent = '';
    if (!equipoData.numero_serie || !equipoData.id_tipo_equipo || !equipoData.id_sucursal_actual || !equipoData.id_status) {
         errorMessageDiv.textContent = 'Número de Serie, Tipo, Sucursal y Estado son obligatorios.';
         return;
    }

    try {
        let responseMessage = '';
        if (editingId) {
            await updateEquipo(editingId, equipoData);
            responseMessage = `Equipo ID ${editingId} actualizado exitosamente.`;
        } else {
            const nuevoEquipo = await createEquipo(equipoData);
            responseMessage = `Equipo "${nuevoEquipo.numero_serie}" (ID: ${nuevoEquipo.id}) creado exitosamente.`;
        }
        await showInfoModal({ title: 'Éxito', message: responseMessage });
        if (typeof window.navigateTo === 'function') window.navigateTo('equiposList');

    } catch (error) {
        errorMessageDiv.textContent = error.message || 'Ocurrió un error desconocido.';
    }
}

// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
// ===============================================================
async function showEquipoForm(params = null) {
    const equipoId = typeof params === 'string' ? params : (params && params.id);
    await renderEquipoForm(equipoId); // Pasamos solo el ID, la función se encarga del resto.
}

// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// ===============================================================
export { showEquipoForm };