//public/js/views/equipoFormView.js
// * Este módulo maneja la lógica para el formulario de creación y edición de Equipos.

import { createEquipo, getTiposEquipo, getSucursales, getStatuses, getEquipoById, updateEquipo } from '../api.js';
import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

const contentArea = document.getElementById('content-area');

let tiposEquipoCache = null;
let sucursalesCache = null;
let statusesCache = null;

//* FUNCIONES DE RENDERIZADO DEL FORMULARIO

function showEquipoFormLoading(action = 'Crear') {
    showFormLoading(action, 'equipo');
}

function showEquipoFormError(message, action = 'procesar') {
    showFormError(action, 'equipo', message, () => showEquipoForm());
}

// * Renderiza el formulario HTML para crear o editar un equipo.
// * Deshabilita el select de estado si es un estado gestionado automáticamente.
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
            <div class="col-xl-8 col-lg-10 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">${formTitle}</h4>
                    </div>
                    <div class="card-body">
                        <form id="equipoForm" class="basic-form">
                            <div class="mb-3">
                                <label for="numero_serie" class="form-label">Número de Serie <span class="text-danger">*</span></label>
                                <input type="text" id="numero_serie" name="numero_serie" required class="form-control input-default uppercase-field" placeholder="Ej: SN123456789" value="${isEditing && currentEquipoData.numero_serie ? currentEquipoData.numero_serie : ''}">
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="marca" class="form-label">Marca</label>
                                    <input type="text" id="marca" name="marca" class="form-control input-default uppercase-field" placeholder="Ej: DELL" value="${isEditing && currentEquipoData.marca ? currentEquipoData.marca : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="modelo" class="form-label">Modelo</label>
                                    <input type="text" id="modelo" name="modelo" class="form-control input-default uppercase-field" placeholder="Ej: OPTIPLEX 7090" value="${isEditing && currentEquipoData.modelo ? currentEquipoData.modelo : ''}">
                </div>
                </div>
                            <div class="mb-3">
                                <label for="id_sucursal_actual" class="form-label">Sucursal Actual <span class="text-danger">*</span></label>
                                <select id="id_sucursal_actual" name="id_sucursal_actual" required class="form-control select2">
                        <option value="">Seleccione una sucursal...</option>
                        ${sucursalesCache.map(sucursal => `<option value="${sucursal.id}" ${isEditing && currentEquipoData.id_sucursal_actual === sucursal.id ? 'selected' : ''}>${sucursal.nombre}</option>`).join('')}
                    </select>
                </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="procesador" class="form-label">Procesador</label>
                                    <input type="text" id="procesador" name="procesador" class="form-control input-default uppercase-field" placeholder="Ej: INTEL CORE I7-10700" value="${isEditing && currentEquipoData.procesador ? currentEquipoData.procesador : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="ram" class="form-label">RAM</label>
                                    <input type="text" id="ram" name="ram" class="form-control input-default uppercase-field" placeholder="Ej: 16GB DDR4" value="${isEditing && currentEquipoData.ram ? currentEquipoData.ram : ''}">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="disco_duro" class="form-label">Disco Duro</label>
                                    <input type="text" id="disco_duro" name="disco_duro" class="form-control input-default uppercase-field" placeholder="Ej: 512GB SSD" value="${isEditing && currentEquipoData.disco_duro ? currentEquipoData.disco_duro : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="sistema_operativo" class="form-label">Sistema Operativo</label>
                                    <input type="text" id="sistema_operativo" name="sistema_operativo" class="form-control input-default uppercase-field" placeholder="Ej: WINDOWS 10 PRO" value="${isEditing && currentEquipoData.sistema_operativo ? currentEquipoData.sistema_operativo : ''}">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="mac_address" class="form-label">MAC Address</label>
                                    <input type="text" id="mac_address" name="mac_address" class="form-control input-default uppercase-field" placeholder="Ej: 00:1B:44:11:3A:B7" value="${isEditing && currentEquipoData.mac_address ? currentEquipoData.mac_address : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="fecha_compra" class="form-label">Fecha de Compra</label>
                                    <input type="text" id="fecha_compra" name="fecha_compra" class="datepicker-default form-control input-default" placeholder="YYYY-MM-DD" autocomplete="off" value="${isEditing && currentEquipoData.fecha_compra ? currentEquipoData.fecha_compra.split('T')[0] : ''}">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="id_tipo_equipo" class="form-label">Tipo de Equipo <span class="text-danger">*</span></label>
                                <select id="id_tipo_equipo" name="id_tipo_equipo" required class="form-control select2">
                                    <option value="">Seleccione un tipo...</option>
                                    ${tiposEquipoCache.map(tipo => `<option value="${tipo.id}" ${isEditing && currentEquipoData.id_tipo_equipo === tipo.id ? 'selected' : ''}>${tipo.nombre_tipo}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="nombre_equipo" class="form-label">Nombre del Equipo (Alias)</label>
                                <input type="text" id="nombre_equipo" name="nombre_equipo" class="form-control input-default uppercase-field" placeholder="Ej: PC-OFICINA-01" value="${isEditing && currentEquipoData.nombre_equipo ? currentEquipoData.nombre_equipo : ''}">
                </div>
                            <div class="mb-3">
                                <label for="id_status" class="form-label">Estado del Equipo <span class="text-danger">*</span></label>
                                <select id="id_status" name="id_status" required class="form-control select2 ${isStatusDisabled ? 'bg-gray-200 cursor-not-allowed' : ''}" ${isStatusDisabled ? 'disabled' : ''}>
                        <option value="">Seleccione un estado...</option>
                        ${statusesCache
                          .filter(status => isEditing || ![2, 6, 7, 9, 12].includes(status.id))
                          .map(status => {
                            const isAutomaticStatus = [STATUS_ASIGNADO_ID, STATUS_EN_MANTENIMIENTO_ID].includes(status.id);
                            const isCurrentStatus = isEditing && currentEquipoData.id_status === status.id;
                            if (isStatusDisabled) {
                              return isCurrentStatus ? `<option value="${status.id}" selected>${status.nombre_status}</option>` : '';
                            } else {
                              if (!isAutomaticStatus || isCurrentStatus) {
                                return `<option value="${status.id}" ${isCurrentStatus ? 'selected' : (!isEditing && status.nombre_status === 'Disponible' ? 'selected' : '')}>${status.nombre_status}</option>`;
                              }
                              return '';
                            }
                          })
                          .join('')}
                    </select>
                    ${isStatusDisabled ? `<p class="mt-2 text-xs text-gray-500">${statusHelpText}</p>` : ''}
                </div>
                            <div class="mb-3">
                                <label for="otras_caracteristicas" class="form-label">Otras Características / Notas</label>
                                <textarea id="otras_caracteristicas" name="otras_caracteristicas" rows="3" class="form-control uppercase-field" placeholder="DESCRIBA CARACTERÍSTICAS ADICIONALES, ESPECIFICACIONES TÉCNICAS, UBICACIÓN ESPECÍFICA, ETC.">${isEditing && currentEquipoData.otras_caracteristicas ? currentEquipoData.otras_caracteristicas : ''}</textarea>
                            </div>
                            <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" id="cancelEquipoForm" class="btn btn-danger light btn-sl-sm"><span class="me-2"><i class="fa fa-times"></i></span>Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-sl-sm"><span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Registrar Equipo'}</button>
                            </div>
                        </form>
                    </div>
                </div>
                </div>
        `;

        // Inicializar select2 en los selects buscables
        if (window.$ && $.fn.select2) {
            $('#id_tipo_equipo').select2({ width: '100%' });
            $('#id_sucursal_actual').select2({ width: '100%' });
            $('#id_status').select2({ width: '100%' });
        }

        // Inicializar Pickadate para el campo de fecha de compra
        if (window.$ && $.fn.pickadate) {
            if ($('#fecha_compra').data('pickadate')) $('#fecha_compra').pickadate('destroy');
            setTimeout(function() {
                var currentYear = new Date().getFullYear();
                var minYear = 1990;
                var years = currentYear - minYear + 1;
                $('#fecha_compra').pickadate({
                    format: 'yyyy-mm-dd',
                    selectMonths: true,
                    selectYears: years,
                    autoclose: true,
                    min: [minYear, 0, 1],
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
        applyUppercaseToFields(['numero_serie', 'marca', 'modelo', 'procesador', 'ram', 'disco_duro', 'sistema_operativo', 'mac_address', 'nombre_equipo', 'otras_caracteristicas']);

        document.getElementById('equipoForm').addEventListener('submit', (event) => handleEquipoFormSubmit(event, equipoId));
        document.getElementById('cancelEquipoForm').addEventListener('click', async () => {
            await Swal.fire({
                title: 'Cancelado',
                text: 'El formulario de equipo ha sido cancelado.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('equipos-list');
            } else {
                contentArea.innerHTML = `<p>Por favor, navega manualmente a la lista.</p>`;
            }
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
        Swal.fire({
            title: 'Éxito',
            text: responseMessage,
            icon: 'success'
        });
        if (typeof window.navigateTo === 'function') window.navigateTo('equipos-list');

    } catch (error) {
        errorMessageDiv.textContent = error.message || 'Ocurrió un error desconocido.';
    }
}

//* FUNCIÓN PRINCIPAL DE CARGA DE LA VISTA DEL FORMULARIO
async function showEquipoForm(params = null) {
    const equipoId = typeof params === 'string' ? params : (params && params.id);
    await renderEquipoForm(equipoId); // Pasamos solo el ID, la función se encarga del resto.
}

export { showEquipoForm };