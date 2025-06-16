// public/js/views/equipoFormView.js
// * Este módulo maneja la lógica para el formulario de creación y edición de Equipos.

//? ¿Qué funciones de API necesito? Para crear, necesito 'createEquipo'.
//? Para poblar los selects, necesito 'getTiposEquipo', 'getSucursales', 'getStatuses'.
import { createEquipo, getTiposEquipo, getSucursales, getStatuses, getEquipoById, updateEquipo } from '../api.js';

import { showInfoModal } from '../ui/modal.js'; // Importo la función del modal.
// * Referencia al contenedor principal donde se renderizará esta vista/formulario.
const contentArea = document.getElementById('content-area');

// * Almacenaremos los datos de los catálogos para no pedirlos cada vez si ya los tenemos.
let tiposEquipoCache = null;
let sucursalesCache = null;
let statusesCache = null;

// ===============================================================
// FUNCIONES DE RENDERIZADO DEL FORMULARIO
// ===============================================================

// * Muestra un mensaje de carga mientras se prepara el formulario (ej. cargando selects).
function showEquipoFormLoading(action = 'Crear') {
    contentArea.innerHTML = `<p>Cargando formulario para ${action.toLowerCase()} equipo...</p>`;
}

// * Muestra un mensaje de error si falla la carga del formulario o el envío.
function showEquipoFormError(message, action = 'procesar') {
    // Si ya hay un formulario, podríamos querer mostrar el error cerca del formulario,
    // pero por ahora, lo ponemos en el contentArea.
    // TODO: Mejorar el feedback de errores en el formulario mismo.
    contentArea.innerHTML = `<p class="text-red-500 font-bold">Error al ${action} equipo:</p><p class="text-red-500">${message}</p>`;
    // Podríamos añadir un botón para reintentar o volver.
}

// * Renderiza el formulario HTML para crear o editar un equipo.
// * `equipoToEdit` es opcional. Si se proporciona, el formulario se llena para edición.
async function renderEquipoForm(equipoToEdit = null) {
    // Extraer el ID del parámetro. Si equipoToEdit es un string, usarlo directamente; si es un objeto, extraer equipoToEdit.id.
    const equipoId = typeof equipoToEdit === 'string' ? equipoToEdit : (equipoToEdit && equipoToEdit.id);
    console.log('Herwing está renderizando el formulario de equipo. Editando:', equipoId ? equipoId : 'No (Nuevo)');
    const isEditing = equipoId !== null;
    const formTitle = isEditing ? `Editar Equipo (ID: ${equipoId})` : 'Registrar Nuevo Equipo';

    showEquipoFormLoading(isEditing ? 'Editar' : 'Crear'); // Muestro carga mientras se obtienen los datos de los selects.

    try {
        // * Obtengo los datos para los selects (dropdowns) si aún no los tengo cacheados.
        if (!tiposEquipoCache) {
            tiposEquipoCache = await getTiposEquipo();
        }
        if (!sucursalesCache) {
            sucursalesCache = await getSucursales();
        }
        if (!statusesCache) {
            statusesCache = await getStatuses();
        }

        // * Limpio el área de contenido y construyo el HTML del formulario.
        contentArea.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-6">${formTitle}</h2>
            <form id="equipoForm" class="space-y-6 bg-white p-8 rounded-lg shadow-md">
                <!-- Campos Obligatorios -->
                <div>
                    <label for="numero_serie" class="block text-sm font-medium text-gray-700">Número de Serie <span class="text-red-500">*</span></label>
                    <input type="text" id="numero_serie" name="numero_serie" required
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           value="${isEditing && equipoToEdit.numero_serie ? equipoToEdit.numero_serie : ''}">
                </div>

                <div>
                    <label for="id_tipo_equipo" class="block text-sm font-medium text-gray-700">Tipo de Equipo <span class="text-red-500">*</span></label>
                    <select id="id_tipo_equipo" name="id_tipo_equipo" required
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Seleccione un tipo...</option>
                        ${tiposEquipoCache.map(tipo => `<option value="${tipo.id}" ${isEditing && equipoToEdit.id_tipo_equipo === tipo.id ? 'selected' : ''}>${tipo.nombre_tipo}</option>`).join('')}
                    </select>
                </div>

                <div>
                    <label for="id_sucursal_actual" class="block text-sm font-medium text-gray-700">Sucursal Actual <span class="text-red-500">*</span></label>
                    <select id="id_sucursal_actual" name="id_sucursal_actual" required
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Seleccione una sucursal...</option>
                        ${sucursalesCache.map(sucursal => `<option value="${sucursal.id}" ${isEditing && equipoToEdit.id_sucursal_actual === sucursal.id ? 'selected' : ''}>${sucursal.nombre}</option>`).join('')}
                    </select>
                </div>

                <!-- Campos Opcionales -->
                <div>
                    <label for="nombre_equipo" class="block text-sm font-medium text-gray-700">Nombre del Equipo (Alias)</label>
                    <input type="text" id="nombre_equipo" name="nombre_equipo"
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           value="${isEditing && equipoToEdit.nombre_equipo ? equipoToEdit.nombre_equipo : ''}">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="marca" class="block text-sm font-medium text-gray-700">Marca</label>
                        <input type="text" id="marca" name="marca"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && equipoToEdit.marca ? equipoToEdit.marca : ''}">
                    </div>
                    <div>
                        <label for="modelo" class="block text-sm font-medium text-gray-700">Modelo</label>
                        <input type="text" id="modelo" name="modelo"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && equipoToEdit.modelo ? equipoToEdit.modelo : ''}">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label for="procesador" class="block text-sm font-medium text-gray-700">Procesador</label>
                        <input type="text" id="procesador" name="procesador"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && equipoToEdit.procesador ? equipoToEdit.procesador : ''}">
                    </div>
                    <div>
                        <label for="ram" class="block text-sm font-medium text-gray-700">RAM</label>
                        <input type="text" id="ram" name="ram"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && equipoToEdit.ram ? equipoToEdit.ram : ''}">
                    </div>
                    <div>
                        <label for="disco_duro" class="block text-sm font-medium text-gray-700">Disco Duro</label>
                        <input type="text" id="disco_duro" name="disco_duro"
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               value="${isEditing && equipoToEdit.disco_duro ? equipoToEdit.disco_duro : ''}">
                    </div>
                </div>

                 <div>
                    <label for="sistema_operativo" class="block text-sm font-medium text-gray-700">Sistema Operativo</label>
                    <input type="text" id="sistema_operativo" name="sistema_operativo"
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           value="${isEditing && equipoToEdit.sistema_operativo ? equipoToEdit.sistema_operativo : ''}">
                </div>
                <div>
                    <label for="mac_address" class="block text-sm font-medium text-gray-700">MAC Address</label>
                    <input type="text" id="mac_address" name="mac_address"
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           placeholder="Ej: AA:BB:CC:DD:EE:FF"
                           value="${isEditing && equipoToEdit.mac_address ? equipoToEdit.mac_address : ''}">
                </div>
                <div>
                    <label for="fecha_compra" class="block text-sm font-medium text-gray-700">Fecha de Compra</label>
                    <input type="date" id="fecha_compra" name="fecha_compra"
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           value="${isEditing && equipoToEdit.fecha_compra ? equipoToEdit.fecha_compra.split('T')[0] : ''}">
                           <!-- .split('T')[0] es para asegurar formato YYYY-MM-DD si viene como timestamp -->
                </div>

                <div>
                    <label for="id_status" class="block text-sm font-medium text-gray-700">Estado del Equipo <span class="text-red-500">*</span></label>
                    <select id="id_status" name="id_status" required
                            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Seleccione un estado...</option>
                        ${statusesCache.map(status => `<option value="${status.id}" ${isEditing && equipoToEdit.id_status === status.id ? 'selected' : ( !isEditing && status.id === 1 ? 'selected' :'') }>${status.nombre_status}</option>`).join('')}
                        <!-- Para nuevo, selecciono "Activo" (ID 1) por defecto si existe -->
                    </select>
                </div>

                <div>
                    <label for="otras_caracteristicas" class="block text-sm font-medium text-gray-700">Otras Características / Notas</label>
                    <textarea id="otras_caracteristicas" name="otras_caracteristicas" rows="3"
                              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">${isEditing && equipoToEdit.otras_caracteristicas ? equipoToEdit.otras_caracteristicas : ''}</textarea>
                </div>

                <!-- Div para mostrar mensajes de error del formulario -->
                <div id="form-error-message" class="text-red-500 text-sm mt-2"></div>

                <!-- Botones de acción -->
                <div class="flex justify-end space-x-4">
                    <button type="button" id="cancelEquipoForm" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Cancelar
                    </button>
                    <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        ${isEditing ? 'Guardar Cambios' : 'Registrar Equipo'}
                    </button>
                </div>
            </form>
        `;

        // * Añado el event listener al formulario después de que se haya insertado en el DOM.
        // * Pasamos equipoToEdit para saber si estamos editando o creando.
        document.getElementById('equipoForm').addEventListener('submit', (event) => handleEquipoFormSubmit(event, equipoId));
        // * Listener para el botón Cancelar
        document.getElementById('cancelEquipoForm').addEventListener('click', () => {
             //TODO: Decidir a dónde navegar al cancelar (ej. a la lista de equipos)
             // navigateTo('equiposList');
             console.log('Herwing canceló el formulario de equipo.');
             // Por ahora, solo limpiamos el área como si fuera a la vista home.
             // Esto es un placeholder, la navegación real se hará con main.js
             if (typeof window.navigateTo === 'function') {
                window.navigateTo('equiposList');
            } else {
                contentArea.innerHTML = `<p class="text-green-500">Por favor, navega manualmente a la lista.</p>`;
            }   
        
         });


    } catch (error) {
        console.error('Error al cargar datos del formulario:', error);
        showEquipoFormError(error.message);
    }
}


// ===============================================================
// MANEJO DEL ENVÍO DEL FORMULARIO
// ===============================================================

// * Maneja el evento 'submit' del formulario de equipo.
// * `editingId` es el ID del equipo si se está editando, o null si se está creando uno nuevo.
async function handleEquipoFormSubmit(event, editingId = null) {
    event.preventDefault(); // * Prevengo el envío tradicional del formulario.

    const form = event.target;
    const formData = new FormData(form); // * Obtengo los datos del formulario.
    const equipoData = {}; // * Objeto para almacenar los datos a enviar a la API.

    // * Itero sobre los datos del FormData y los convierto a un objeto.
    // * También convierto los valores numéricos (IDs) a números.
    for (let [key, value] of formData.entries()) {
        // Campos que deben ser numéricos y no vacíos (si se envían vacíos, se omiten o validan antes).
        if (key === 'id_tipo_equipo' || key === 'id_sucursal_actual' || key === 'id_status') {
            equipoData[key] = value ? parseInt(value, 10) : null;
        } else if (value.trim() === '' && (key === 'mac_address' || key === 'fecha_compra' || key.startsWith('id_') )) {
            // Si es un campo que puede ser NULL en DB y viene vacío, lo asignamos como null.
            // Excluimos los IDs obligatorios y numero_serie que no deben ser null.
            equipoData[key] = null;
        }
         else {
            equipoData[key] = value.trim() === '' ? null : value; // Si es cadena vacía, enviamos null, sino el valor.
            // Excepción para campos que NO son NULLables y SÍ deben tener valor
            if ((key === 'numero_serie') && equipoData[key] === null) {
                document.getElementById('form-error-message').textContent = `El campo ${key} no puede estar vacío.`;
                return; // Detener el envío
            }
        }
    }
    // Si algun ID obligatorio es null después de esto, el backend lo rechazará.
    // O podemos añadir validación aquí.
    if (!equipoData.id_tipo_equipo || !equipoData.id_sucursal_actual || !equipoData.id_status) {
         document.getElementById('form-error-message').textContent = 'Tipo de Equipo, Sucursal Actual y Estado son obligatorios.';
         return;
    }


    // * Limpio mensajes de error previos.
    document.getElementById('form-error-message').textContent = '';
    console.log('Herwing está enviando datos del formulario de equipo:', equipoData, 'Editando ID:', editingId);

    try {
        let responseMessage = '';
        if (editingId) {
            // * Estamos editando un equipo existente.
            await updateEquipo(editingId, equipoData); // Llamo a la función de API para actualizar.
            responseMessage = `Equipo con ID ${editingId} actualizado exitosamente.`;
            console.log(responseMessage);
            await showInfoModal({
                title: 'Éxito',
                message: responseMessage
            });
        } else {
            // * Estamos creando un nuevo equipo.
            const nuevoEquipo = await createEquipo(equipoData); // Llamo a la función de API para crear.
            responseMessage = `Equipo "${nuevoEquipo.numero_serie}" (ID: ${nuevoEquipo.id}) creado exitosamente.`;
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
            window.navigateTo('equiposList');
        } else {
            contentArea.innerHTML = `<p class="text-green-500">${responseMessage} Por favor, navega manualmente a la lista.</p>`;
        }   
    


    } catch (error) {
        console.error('Error al enviar el formulario de equipo:', error);
        // Muestro el mensaje de error de la API en el div 'form-error-message'.
        // El error.message ya debería venir formateado desde api.js.
        document.getElementById('form-error-message').textContent = error.message || 'Ocurrió un error desconocido.';
    }
}


// ===============================================================
// FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
// Esta función será llamada desde main.js para mostrar el formulario.
// `params` puede contener `{ id: equipoId }` si se está editando.
// ===============================================================
async function showEquipoForm(params = null) {
    console.log('Herwing va a mostrar el formulario de equipo. Parámetros:', params);
    let equipoToEdit = null;
    let equipoId = null;
    if (typeof params === 'string') {
        equipoId = params;
    } else if (params && params.id) {
        equipoId = params.id;
    }

    if (equipoId) {
        // * Si se proporciona un ID, estamos editando. Primero, obtengo los datos del equipo.
        showEquipoFormLoading('Editar');
        try {
            equipoToEdit = await getEquipoById(equipoId);
            // Ajuste: soportar respuestas anidadas
            if (equipoToEdit && (equipoToEdit.data || equipoToEdit.equipo)) {
                equipoToEdit = equipoToEdit.data || equipoToEdit.equipo;
            }
            if (!equipoToEdit) {
                showEquipoFormError(`No se encontró el equipo con ID ${equipoId}.`, 'cargar');
                return;
            }
        } catch (error) {
            showEquipoFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else {
        // * Si no hay ID, estamos creando un nuevo equipo.
        showEquipoFormLoading('Crear');
    }

    // * Renderizo el formulario (vacío o con datos para editar).
    await renderEquipoForm(equipoToEdit);
}


// ===============================================================
// EXPORTAR FUNCIONES DE LA VISTA
// Exporto la función principal para que main.js pueda usarla.
// ===============================================================
export { showEquipoForm };