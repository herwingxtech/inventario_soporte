// public/js/views/empleadoFormView.js
// * Este módulo se encarga de la lógica para el formulario de creación y edición de Empleados.

//? Funciones de API necesarias:
//? Para CRUD: 'createEmpleado', 'updateEmpleado', 'getEmpleadoById'.
//? Para poblar selects: 'getEmpresas', 'getSucursales', 'getAreas', 'getRoles', 'getStatuses'.
import {
    createEmpleado,
    updateEmpleado,
    getEmpleadoById,
    getEmpresas,
    getSucursales,
    getAreas,
    getRoles,
    getStatuses
} from '../api.js';

import { showInfoModal } from '../ui/modal.js';
import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';

// * Referencia al contenedor principal donde se renderizará este formulario.
const contentArea = document.getElementById('content-area');

// * Cache para los datos de los selects para no pedirlos repetidamente.
let sucursalesCache = null;
let areasCache = null;
let statusesCache = null;

// ===============================================================
// FUNCIONES DE RENDERIZADO DEL FORMULARIO
// ===============================================================

// * Muestra un mensaje de carga mientras se prepara el formulario.
function showEmpleadoFormLoading(action = 'Crear') {
    showFormLoading(action, 'empleado');
}

// * Muestra un mensaje de error si algo falla al cargar el formulario o al procesar el envío.
function showEmpleadoFormError(message, action = 'procesar') {
    showFormError(action, 'empleado', message, () => showEmpleadoForm());
}

// * Renderiza el formulario HTML para crear o editar un empleado.
// * `empleadoToEdit` es opcional. Si se proporciona, el formulario se llena para edición.
async function renderEmpleadoForm(empleadoToEdit = null) {
    const empleadoId = typeof empleadoToEdit === 'string' ? empleadoToEdit : (empleadoToEdit && empleadoToEdit.id);
    console.log('Herwing está renderizando el formulario de empleado. Editando ID:', empleadoId || 'Nuevo');
    const isEditing = empleadoId !== null;
    const formTitle = isEditing ? `Editar Empleado (ID: ${empleadoId})` : 'Registrar Nuevo Empleado';

    // * Si estamos editando, y no tenemos los datos completos del empleado (solo el ID), los obtenemos.
    // * Si 'empleadoToEdit' ya es un objeto con todos los datos, no necesitamos volver a fetchear.
    let currentEmpleadoData = null;
    if (isEditing && typeof empleadoToEdit === 'string') { // Solo tenemos el ID, necesitamos fetchear
        try {
            currentEmpleadoData = await getEmpleadoById(empleadoId);
            if (!currentEmpleadoData) {
                showEmpleadoFormError(`No se encontró el empleado con ID ${empleadoId} para editar.`, 'cargar');
                return;
            }
        } catch (error) {
            showEmpleadoFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else if (isEditing) {
        currentEmpleadoData = empleadoToEdit; // Ya tenemos el objeto completo.
    }


    showEmpleadoFormLoading(isEditing ? 'Editar' : 'Crear');

    try {
        // * Obtengo los datos para los selects si aún no los tengo cacheados.
        if (!sucursalesCache) {
            sucursalesCache = await getSucursales();
        }
        //? ¿Debería filtrar las áreas según la sucursal seleccionada dinámicamente? Por ahora, muestro todas.
        //TODO: Implementar carga dinámica de áreas si decido filtrar por sucursal.
        if (!areasCache) {
            areasCache = await getAreas(); // Esto trae todas las áreas.
        }
        if (!statusesCache) {
            statusesCache = await getStatuses();
        }

        // * Limpio el área de contenido y construyo el HTML del formulario.
        contentArea.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-6">${formTitle}</h2>
            <form id="empleadoForm" class="space-y-6 bg-white p-8 rounded-lg shadow-md">
                <!-- Campos Obligatorios -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="nombres" class="block text-sm font-medium text-gray-700">Nombres <span class="text-red-500">*</span></label>
                        <input type="text" id="nombres" name="nombres" required
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && currentEmpleadoData.nombres ? currentEmpleadoData.nombres : ''}">
                    </div>
                    <div>
                        <label for="apellidos" class="block text-sm font-medium text-gray-700">Apellidos <span class="text-red-500">*</span></label>
                        <input type="text" id="apellidos" name="apellidos" required
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && currentEmpleadoData.apellidos ? currentEmpleadoData.apellidos : ''}">
                    </div>
                </div>

                <!-- Campos Opcionales -->
                <div>
                    <label for="numero_empleado" class="block text-sm font-medium text-gray-700">Número de Empleado (Interno)</label>
                    <input type="text" id="numero_empleado" name="numero_empleado"
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           value="${isEditing && currentEmpleadoData.numero_empleado ? currentEmpleadoData.numero_empleado : ''}">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="email_personal" class="block text-sm font-medium text-gray-700">Email Personal</label>
                        <input type="email" id="email_personal" name="email_personal"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && currentEmpleadoData.email_personal ? currentEmpleadoData.email_personal : ''}">
                    </div>
                    <div>
                        <label for="telefono" class="block text-sm font-medium text-gray-700">Teléfono</label>
                        <input type="tel" id="telefono" name="telefono"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && currentEmpleadoData.telefono ? currentEmpleadoData.telefono : ''}">
                    </div>
                </div>

                <div>
                    <label for="puesto" class="block text-sm font-medium text-gray-700">Puesto</label>
                    <input type="text" id="puesto" name="puesto"
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           value="${isEditing && currentEmpleadoData.puesto ? currentEmpleadoData.puesto : ''}">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="fecha_nacimiento" class="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                        <input type="date" id="fecha_nacimiento" name="fecha_nacimiento"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && currentEmpleadoData.fecha_nacimiento ? currentEmpleadoData.fecha_nacimiento.split('T')[0] : ''}">
                    </div>
                    <div>
                        <label for="fecha_ingreso" class="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                        <input type="date" id="fecha_ingreso" name="fecha_ingreso"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && currentEmpleadoData.fecha_ingreso ? currentEmpleadoData.fecha_ingreso.split('T')[0] : ''}">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label for="id_sucursal" class="block text-sm font-medium text-gray-700">Sucursal Asignada</label>
                        <select id="id_sucursal" name="id_sucursal"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Seleccione sucursal (Opcional)</option>
                            ${sucursalesCache.map(sucursal => `<option value="${sucursal.id}" ${isEditing && currentEmpleadoData.id_sucursal === sucursal.id ? 'selected' : ''}>${sucursal.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="id_area" class="block text-sm font-medium text-gray-700">Área Asignada</label>
                        <select id="id_area" name="id_area"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Seleccione área (Opcional)</option>
                            ${areasCache.map(area => `<option value="${area.id}" ${isEditing && currentEmpleadoData.id_area === area.id ? 'selected' : ''}>${area.nombre} (Suc: ${area.nombre_empresa})</option>`).join('')}
                            <!--//? Debería filtrar las áreas según la sucursal seleccionada? -->
                        </select>
                    </div>
                     <div>
                        <label for="id_status" class="block text-sm font-medium text-gray-700">Estado <span class="text-red-500">*</span></label>
                        <select id="id_status" name="id_status" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Seleccione un estado...</option>
                            ${statusesCache.map(status => `<option value="${status.id}" ${isEditing && currentEmpleadoData.id_status === status.id ? 'selected' : (!isEditing && status.id === 1 ? 'selected' : '')}>${status.nombre_status}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Div para mostrar mensajes de error del formulario -->
                <div id="form-error-message" class="text-red-500 text-sm mt-2"></div>

                <!-- Botones de acción -->
                <div class="flex justify-end space-x-4 pt-4">
                    <button type="button" id="cancelEmpleadoForm" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Cancelar
                    </button>
                    <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        ${isEditing ? 'Guardar Cambios' : 'Registrar Empleado'}
                    </button>
                </div>
            </form>
        `;

        // * Añado el event listener al formulario.
        // * Paso el ID del empleado si estamos editando.
        document.getElementById('empleadoForm').addEventListener('submit', (event) => handleEmpleadoFormSubmit(event, empleadoId));
        // * Listener para el botón Cancelar.
        document.getElementById('cancelEmpleadoForm').addEventListener('click', async () => {

            await showInfoModal({
                title: 'Cancelado',
                message: 'El formulario de empleado ha sido cancelado.'
            });

             // * Navego a la lista de equipos.
             if (typeof window.navigateTo === 'function') {
                window.navigateTo('empleadosList');
            } else {
                contentArea.innerHTML = `<p class="text-green-500">Por favor, navega manualmente a la lista.</p>`;
            }   
         });

    } catch (error) {
        console.error('Error al renderizar el formulario de empleado:', error);
        showEmpleadoFormError(error.message, 'cargar');
    }
}


// ===============================================================
// MANEJO DEL ENVÍO DEL FORMULARIO
// ===============================================================

// * Maneja el evento 'submit' del formulario de empleado.
// * `editingId` es el ID del empleado si se está editando, o null si es nuevo.
async function handleEmpleadoFormSubmit(event, editingId = null) {
    event.preventDefault(); // * Prevengo el envío tradicional.

    const form = event.target;
    const formData = new FormData(form);
    const empleadoData = {};

    // * Convierto FormData a un objeto, manejando valores vacíos y numéricos.
    for (let [key, value] of formData.entries()) {
        // * IDs y campos que deben ser numéricos (si no están vacíos).
        if (['id_sucursal', 'id_area', 'id_status'].includes(key)) {
            empleadoData[key] = value ? parseInt(value, 10) : null; // Convertir a número o dejar null si está vacío.
        } else if (value.trim() === '' && ['numero_empleado', 'email_personal', 'telefono', 'puesto', 'fecha_nacimiento', 'fecha_ingreso'].includes(key)) {
            // * Campos opcionales que si vienen vacíos, quiero que sean null en la API.
            empleadoData[key] = null;
        } else {
            empleadoData[key] = value; // Para nombres, apellidos, etc. (el backend validará si son obligatorios).
        }
    }

    // * Validaciones básicas en frontend (el backend también validará).
    if (!empleadoData.nombres || !empleadoData.apellidos || !empleadoData.id_status) {
         document.getElementById('form-error-message').textContent = 'Nombres, Apellidos y Estado son obligatorios.';
         return;
    }

    // * Limpio mensajes de error previos.
    document.getElementById('form-error-message').textContent = '';
    console.log('Herwing está enviando datos del formulario de empleado:', empleadoData, 'Editando ID:', editingId);

    try {
        let responseMessage = '';
        if (editingId) {
            // * Estamos editando un equipo existente.
            await updateEmpleado(editingId, empleadoData); // Llamo a la función de API para actualizar.
            responseMessage = `Empleado con ID ${editingId} actualizado exitosamente.`;
            console.log(responseMessage);
            await showInfoModal({
                title: 'Éxito',
                message: responseMessage
            });
        } else {
            // * Estamos creando un nuevo equipo.
            const nuevoEmpleado = await createEmpleado(empleadoData); // Llamo a la función de API para crear.
            responseMessage = `Empleado "${nuevoEmpleado.nombres} ${nuevoEmpleado.apellidos} " (ID: ${nuevoEmpleado.id}) creado exitosamente.`;
            console.log(responseMessage);
            await showInfoModal({
                title: 'Éxito',
                message: responseMessage
            });
        }

        //TODO: Mostrar un mensaje de éxito más elegante (ej. un toast/modal).

        //TODO: Decidir a dónde navegar después de un éxito (ej. a la lista de equipos).
        // navigateTo('equiposList');
             // Aquí llamaríamos a la función para cargar la lista de equipos.
             // Esto es un placeholder hasta que implementemos la navegación completa con main.js.
              // * Después de éxito, navego de vuelta a la lista de empleados.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleadosList');
        } else {
            contentArea.innerHTML = `<p class="text-green-500">${responseMessage} Por favor, navega manualmente a la lista.</p>`;
        }   
    


    } catch (error) {
        console.error('Error al enviar el formulario de empleado:', error);
        document.getElementById('form-error-message').textContent = error.message || 'Ocurrió un error desconocido.';
    }
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
// Esta función será llamada desde main.js.
// `params` puede ser el ID del empleado si se está editando.
// ===============================================================
async function showEmpleadoForm(params = null) {
    // * El ID del empleado puede venir como un string (directamente de la URL) o como parte de un objeto.
    const empleadoId = typeof params === 'string' ? params : (params && params.id);
    console.log('Herwing va a mostrar el formulario de empleado. ID para editar:', empleadoId);

    let empleadoToEdit = null;
    if (empleadoId) {
        // * Si hay ID, estamos editando. Obtengo los datos del empleado.
        showEmpleadoFormLoading('Editar');
        try {
            empleadoToEdit = await getEmpleadoById(empleadoId);
            // Si la API envuelve la respuesta (ej. { data: empleado }), la extraigo.
            if (empleadoToEdit && (empleadoToEdit.data || empleadoToEdit.empleado)) {
                empleadoToEdit = empleadoToEdit.data || empleadoToEdit.empleado;
            }

            if (!empleadoToEdit) {
                showEmpleadoFormError(`No se encontró el empleado con ID ${empleadoId}.`, 'cargar');
                return;
            }
        } catch (error) {
            showEmpleadoFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else {
        // * Si no hay ID, estamos creando un nuevo empleado.
        showEmpleadoFormLoading('Crear');
    }

    // * Renderizo el formulario (vacío o con datos para editar).
    await renderEmpleadoForm(empleadoToEdit); // Paso el objeto completo o null
}


// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// ===============================================================
export { showEmpleadoForm };