//public/js/views/empleadoFormView.js
// * Este módulo se encarga de la lógica para el formulario de creación y edición de Empleados.

//* Funciones de API necesarias:
//* Para CRUD: 'createEmpleado', 'updateEmpleado', 'getEmpleadoById'.
//* Para poblar selects: 'getEmpresas', 'getSucursales', 'getAreas', 'getRoles', 'getStatuses'.
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

import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

// * Referencia al contenedor principal donde se renderizará este formulario.
const contentArea = document.getElementById('content-area');

// * Cache para los datos de los selects para no pedirlos repetidamente.
let sucursalesCache = null;
let areasCache = null;
let statusesCache = null;

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
        currentEmpleadoData = empleadoToEdit; //* Ya tenemos el objeto completo.
    }


    showEmpleadoFormLoading(isEditing ? 'Editar' : 'Crear');

    try {
        // * Obtengo los datos para los selects si aún no los tengo cacheados.
        if (!sucursalesCache) {
            sucursalesCache = await getSucursales();
        }
        //TODO: Filtrar las áreas según la sucursal seleccionada dinámicamente por ahora, muestro todas.
        //TODO: Implementar carga dinámica de áreas si decido filtrar por sucursal.
        if (!areasCache) {
            areasCache = await getAreas(); //* Esto trae todas las áreas.
        }
        if (!statusesCache) {
            statusesCache = await getStatuses(); //* Esto trae todos los estados.
        
        }

        // * Limpio el área de contenido y construyo el HTML del formulario.
        contentArea.innerHTML = `
            <div class="col-xl-8 col-lg-10 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">${formTitle}</h4>
                    </div>
                    <div class="card-body">
                        <form id="empleado-form" class="basic-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="nombres" class="form-label">Nombres <span class="text-danger">*</span></label>
                                    <input type="text" id="nombres" name="nombres" required class="form-control input-default uppercase-field" placeholder="Ej: JUAN CARLOS" value="${isEditing && currentEmpleadoData.nombres ? currentEmpleadoData.nombres : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="apellidos" class="form-label">Apellidos <span class="text-danger">*</span></label>
                                    <input type="text" id="apellidos" name="apellidos" required class="form-control input-default uppercase-field" placeholder="Ej: GARCÍA LÓPEZ" value="${isEditing && currentEmpleadoData.apellidos ? currentEmpleadoData.apellidos : ''}">
                    </div>
                </div>
                            <div class="mb-3">
                                <label for="numero_empleado" class="form-label">Número de Empleado (Interno)</label>
                                <input type="text" id="numero_empleado" name="numero_empleado" class="form-control input-default uppercase-field" placeholder="Ej: EMP001" value="${isEditing && currentEmpleadoData.numero_empleado ? currentEmpleadoData.numero_empleado : ''}">
                </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="email_personal" class="form-label">Email Personal</label>
                                    <input type="email" id="email_personal" name="email_personal" class="form-control input-default" placeholder="usuario@ejemplo.com" value="${isEditing && currentEmpleadoData.email_personal ? currentEmpleadoData.email_personal : ''}">
                    </div>
                                <div class="col-md-6 mb-3">
                                    <label for="telefono" class="form-label">Teléfono</label>
                                    <input type="tel" id="telefono" name="telefono" class="form-control input-default" placeholder="Ej: 555-123-4567" value="${isEditing && currentEmpleadoData.telefono ? currentEmpleadoData.telefono : ''}">
                    </div>
                </div>
                            <div class="mb-3">
                                <label for="puesto" class="form-label">Puesto</label>
                                <input type="text" id="puesto" name="puesto" class="form-control input-default uppercase-field" placeholder="Ej: DESARROLLADOR SENIOR" value="${isEditing && currentEmpleadoData.puesto ? currentEmpleadoData.puesto : ''}">
                </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="fecha_nacimiento" class="form-label">Fecha de Nacimiento</label>
                                    <input type="text" id="fecha_nacimiento" name="fecha_nacimiento" class="datepicker-default form-control input-default" value="${isEditing && currentEmpleadoData.fecha_nacimiento ? currentEmpleadoData.fecha_nacimiento.split('T')[0] : ''}" placeholder="YYYY-MM-DD" autocomplete="off">
                    </div>
                                <div class="col-md-6 mb-3">
                                    <label for="fecha_ingreso" class="form-label">Fecha de Ingreso</label>
                                    <input type="text" id="fecha_ingreso" name="fecha_ingreso" class="datepicker-default form-control input-default" value="${isEditing && currentEmpleadoData.fecha_ingreso ? currentEmpleadoData.fecha_ingreso.split('T')[0] : ''}" placeholder="YYYY-MM-DD" autocomplete="off">
                    </div>
                </div>
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label for="id_sucursal" class="form-label">Sucursal Asignada</label>
                                    <select id="id_sucursal" name="id_sucursal" class="form-control select2">
                            <option value="">Seleccione sucursal (Opcional)</option>
                            ${sucursalesCache.map(sucursal => `<option value="${sucursal.id}" ${isEditing && currentEmpleadoData.id_sucursal === sucursal.id ? 'selected' : ''}>${sucursal.nombre}</option>`).join('')}
                        </select>
                    </div>
                                <div class="col-md-4 mb-3">
                                    <label for="id_area" class="form-label">Área Asignada</label>
                                    <select id="id_area" name="id_area" class="form-control select2">
                            <option value="">Seleccione área (Opcional)</option>
                            ${areasCache.map(area => `<option value="${area.id}" ${isEditing && currentEmpleadoData.id_area === area.id ? 'selected' : ''}>${area.nombre} (Suc: ${area.nombre_empresa})</option>`).join('')}
                        </select>
                    </div>
                                <div class="col-md-4 mb-3">
                                    <label for="id_status" class="form-label">Estado <span class="text-danger">*</span></label>
                                    <select id="id_status" name="id_status" required class="form-control select2">
                            <option value="">Seleccione un estado...</option>
                            ${statusesCache
                              .filter(status => isEditing || ![2, 6, 7, 9, 12].includes(status.id))
                              .map(status => `<option value="${status.id}" ${isEditing && currentEmpleadoData.id_status === status.id ? 'selected' : (!isEditing && status.id === 1 ? 'selected' : '')}>${status.nombre_status}</option>`)
                              .join('')}
                        </select>
                    </div>
                </div>
                            <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" id="cancelEmpleadoForm" class="btn btn-danger light btn-sl-sm"><span class="me-2"><i class="fa fa-times"></i></span>Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-sl-sm"><span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Registrar Empleado'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Inicializar select2 en los selects buscables
        if (window.$ && $.fn.select2) {
            $('#id_sucursal').select2({ width: '100%' });
            $('#id_area').select2({ width: '100%' });
            $('#id_status').select2({ width: '100%' });
        }
        // Inicializar Pickadate en español en los campos de fecha SIEMPRE después de renderizar
        if (window.$ && $.fn.pickadate) {
            // Destruir pickers anteriores si existen
            if ($('#fecha_nacimiento').data('pickadate')) $('#fecha_nacimiento').pickadate('destroy');
            if ($('#fecha_ingreso').data('pickadate')) $('#fecha_ingreso').pickadate('destroy');
            setTimeout(function() {
                var currentYear = new Date().getFullYear();
                var minYearNacimiento = 1940;
                var minYearIngreso = 2000;
                var yearsNacimiento = currentYear - minYearNacimiento + 1;
                var yearsIngreso = currentYear - minYearIngreso + 1;
                $('#fecha_nacimiento').pickadate({
                    format: 'yyyy-mm-dd',
                    selectMonths: true,
                    selectYears: yearsNacimiento,
                    autoclose: true,
                    min: [minYearNacimiento, 0, 1],
                    max: [currentYear, 11, 31],
                    monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                    monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                    weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                    today: 'Hoy',
                    clear: 'Limpiar',
                    close: 'Cerrar',
                    labelMonthNext: 'Mes siguiente',
                    labelMonthPrev: 'Mes anterior',
                    labelMonthSelect: 'Selecciona un mes',
                    labelYearSelect: 'Selecciona un año',
                    firstDay: 1
                });
                $('#fecha_ingreso').pickadate({
                    format: 'yyyy-mm-dd',
                    selectMonths: true,
                    selectYears: yearsIngreso,
                    autoclose: true,
                    min: [minYearIngreso, 0, 1],
                    max: [currentYear, 11, 31],
                    monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                    monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                    weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                    today: 'Hoy',
                    clear: 'Limpiar',
                    close: 'Cerrar',
                    labelMonthNext: 'Mes siguiente',
                    labelMonthPrev: 'Mes anterior',
                    labelMonthSelect: 'Selecciona un mes',
                    labelYearSelect: 'Selecciona un año',
                    firstDay: 1
                });
            }, 0);
        }

        // Inicializar transformación a mayúsculas en campos de texto
        applyUppercaseToFields(['nombres', 'apellidos', 'numero_empleado', 'puesto']);

        document.getElementById('empleado-form').addEventListener('submit', (event) => handleEmpleadoFormSubmit(event, empleadoId));
        document.getElementById('cancelEmpleadoForm').addEventListener('click', async () => {
            await Swal.fire({
                title: 'Cancelado',
                text: 'El formulario de empleado ha sido cancelado.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('empleados-list');
            } else {
                contentArea.innerHTML = `<p>Por favor, navega manualmente a la lista.</p>`;
            }
        });

    } catch (error) {
        console.error('Error al renderizar el formulario de empleado:', error);
        showEmpleadoFormError(error.message, 'cargar');
    }
}

//* MANEJO DEL ENVÍO DEL FORMULARIO

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
            empleadoData[key] = value ? parseInt(value, 10) : null; //! Convertir a número o dejar null si está vacío.
        } else if (value.trim() === '' && ['numero_empleado', 'email_personal', 'telefono', 'puesto', 'fecha_nacimiento', 'fecha_ingreso'].includes(key)) {
            // * Campos opcionales que si vienen vacíos, quiero que sean null en la API.
            empleadoData[key] = null;
        } else {
            empleadoData[key] = value; //! Para nombres, apellidos el backend validará si son obligatorios.
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
            await updateEmpleado(editingId, empleadoData); //* Llamo a la función de API para actualizar.
            responseMessage = `Empleado "${empleadoData.nombres} ${empleadoData.apellidos}" actualizado exitosamente en el sistema.`;
            console.log(responseMessage);
            await Swal.fire({
                title: 'Empleado Actualizado Exitosamente',
                text: responseMessage,
                icon: 'success',
                confirmButtonText: 'Entendido',
            });
        } else {
            // * Estamos creando un nuevo equipo.
            const nuevoEmpleado = await createEmpleado(empleadoData); //* Llamo a la función de API para crear.
            responseMessage = `Empleado "${nuevoEmpleado.nombres} ${nuevoEmpleado.apellidos}" registrado exitosamente en el sistema.`;
            console.log(responseMessage);
            await Swal.fire({
                title: 'Empleado Registrado Exitosamente',
                text: responseMessage,
                icon: 'success',
                confirmButtonText: 'Entendido',
            });
        }
        // * Después de éxito, navego de vuelta a la lista de empleados.
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('empleados-list');
        } else {
            contentArea.innerHTML = `<p class="text-green-500">${responseMessage} Por favor, navega manualmente a la lista.</p>`;
        }   
    


    } catch (error) {
        console.error('Error al enviar el formulario de empleado:', error);
        document.getElementById('form-error-message').textContent = error.message || 'Ocurrió un error desconocido.';
    }
}

//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
//* Esta función será llamada desde main.js.
//* `params` puede ser el ID del empleado si se está editando.

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
            //* Si la API envuelve la respuesta (ej. { data: empleado }), la extraigo.
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
    await renderEmpleadoForm(empleadoToEdit); //* Paso el objeto completo o null
}

export { showEmpleadoForm };