//public/js/views/mantenimientoFormView.js
// * Formulario de creación y edición de Mantenimientos
import { createMantenimiento, updateMantenimiento, getMantenimientoById, getEquipos, getEmpleados, getStatuses } from '../api.js';
import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

const contentArea = document.getElementById('content-area');
let equiposCache = null;
let empleadosCache = null;
let statusesCache = null;

function showMantenimientoFormLoading(action = 'Crear') {
    showFormLoading(action, 'mantenimiento');
}

function showMantenimientoFormError(message, action = 'procesar') {
    showFormError(action, 'mantenimiento', message, () => showMantenimientoForm());
}

async function renderMantenimientoForm(mantToEdit = null) {
    const mantId = typeof mantToEdit === 'string' ? mantToEdit : (mantToEdit && mantToEdit.id);
    const isEditing = mantId !== null;
    const formTitle = isEditing ? `Editar Mantenimiento (ID: ${mantId})` : 'Registrar Nuevo Mantenimiento';
    let currentMantData = null;
    if (isEditing && typeof mantToEdit === 'string') {
        try {
            currentMantData = await getMantenimientoById(mantId);
            if (!currentMantData) {
                showMantenimientoFormError(`No se encontró el mantenimiento con ID ${mantId}.`, 'cargar');
                return;
            }
        } catch (error) {
            showMantenimientoFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else if (isEditing) {
        currentMantData = mantToEdit;
    }
    showMantenimientoFormLoading(isEditing ? 'Editar' : 'Crear');
    try {
        if (!equiposCache) equiposCache = await getEquipos();
        if (!empleadosCache) empleadosCache = await getEmpleados();
        if (!statusesCache) statusesCache = await getStatuses();
        contentArea.innerHTML = `
            <div class="col-xl-8 col-lg-10 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">${formTitle}</h4>
                    </div>
                    <div class="card-body">
                        <form id="mantenimiento-form" class="basic-form">
                            <div class="mb-3">
                                <label for="id_equipo" class="form-label">Equipo <span class="text-danger">*</span></label>
                                <select id="id_equipo" name="id_equipo" required class="form-control select2">
                                    <option value="">Seleccione un equipo...</option>
                                    ${equiposCache.map(eq => `<option value="${eq.id}" ${isEditing && currentMantData.id_equipo === eq.id ? 'selected' : ''}>${eq.numero_serie} - ${eq.nombre_equipo || 'Sin Nombre'}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="id_empleado" class="form-label">Responsable</label>
                                <select id="id_empleado" name="id_empleado" class="form-control select2">
                                    <option value="">Sin asignar</option>
                                    ${empleadosCache.map(emp => `<option value="${emp.id}" ${isEditing && currentMantData.id_empleado === emp.id ? 'selected' : ''}>${emp.nombres} ${emp.apellidos} (ID: ${emp.id})</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="fecha_inicio" class="form-label">Fecha de Inicio <span class="text-danger">*</span></label>
                                <input type="text" id="fecha_inicio" name="fecha_inicio" required class="datepicker-default form-control input-default" value="${isEditing && currentMantData.fecha_inicio ? currentMantData.fecha_inicio.split('T')[0] : ''}" placeholder="YYYY-MM-DD" autocomplete="off">
                            </div>
                            <div class="mb-3">
                                <label for="fecha_fin" class="form-label">Fecha de Fin</label>
                                <input type="text" id="fecha_fin" name="fecha_fin" class="datepicker-default form-control input-default" value="${isEditing && currentMantData.fecha_fin ? currentMantData.fecha_fin.split('T')[0] : ''}" placeholder="YYYY-MM-DD" autocomplete="off">
                            </div>
                            <div class="mb-3">
                                <label for="id_status" class="form-label">Estado <span class="text-danger">*</span></label>
                                <select id="id_status" name="id_status" required class="form-control select2">
                                    <option value="">Seleccione un estado...</option>
                                    ${statusesCache
                                      .filter(status => isEditing || ![2, 6, 7, 9, 12].includes(status.id))
                                      .map(status => `<option value="${status.id}" ${isEditing && currentMantData.id_status === status.id ? 'selected' : (!isEditing && status.id === 1 ? 'selected' : '')}>${status.nombre_status}</option>`)
                                      .join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="descripcion" class="form-label">Descripción del Mantenimiento</label>
                                <textarea id="descripcion" name="descripcion" rows="3" class="form-control uppercase-field" placeholder="DESCRIBA EL TIPO DE MANTENIMIENTO, TAREAS REALIZADAS, REPUESTOS UTILIZADOS, OBSERVACIONES, ETC.">${isEditing && currentMantData.descripcion ? currentMantData.descripcion : ''}</textarea>
                            </div>
                            <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" id="cancelMantenimiento-form" class="btn btn-danger light btn-sl-sm"><span class="me-2"><i class="fa fa-times"></i></span>Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-sl-sm"><span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Registrar Mantenimiento'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        if (window.$ && $.fn.select2) {
            $('#id_equipo').select2({ width: '100%' });
            $('#id_empleado').select2({ width: '100%' });
            $('#id_status').select2({ width: '100%' });
        }
        if (window.$ && $.fn.pickadate) {
            if ($('#fecha_inicio').data('pickadate')) $('#fecha_inicio').pickadate('destroy');
            if ($('#fecha_fin').data('pickadate')) $('#fecha_fin').pickadate('destroy');
            setTimeout(function() {
                var currentYear = new Date().getFullYear();
                var minYear = 2000;
                var years = currentYear - minYear + 1;
                $('#fecha_inicio, #fecha_fin').pickadate({
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
        applyUppercaseToFields(['descripcion']);

        document.getElementById('mantenimiento-form').addEventListener('submit', (event) => handleMantenimientoFormSubmit(event, mantId));
        document.getElementById('cancelMantenimiento-form').addEventListener('click', async () => {
            await Swal.fire({
                title: 'Cancelado',
                text: 'El formulario de mantenimiento ha sido cancelado.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('mantenimientos-list');
            } else {
                contentArea.innerHTML = `<p>Por favor, navega manualmente a la lista.</p>`;
            }
        });
    } catch (error) {
        showMantenimientoFormError(error.message, 'cargar');
    }
}

async function handleMantenimientoFormSubmit(event, editingId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const mantData = {};
    for (let [key, value] of formData.entries()) {
        if (['id_equipo', 'id_empleado', 'id_status'].includes(key)) {
            mantData[key] = value ? parseInt(value, 10) : null;
        } else {
            mantData[key] = value.trim() === '' ? null : value;
        }
    }
    if (!mantData.id_equipo || !mantData.fecha_inicio || !mantData.id_status) {
        document.getElementById('form-error-message').textContent = 'Equipo, Fecha de Inicio y Estado son obligatorios.';
        return;
    }
    document.getElementById('form-error-message').textContent = '';
    try {
        let responseMessage = '';
        if (editingId) {
            await updateMantenimiento(editingId, mantData);
            responseMessage = `Mantenimiento actualizado exitosamente en el sistema.`;
        } else {
            const nuevoMant = await createMantenimiento(mantData);
            responseMessage = `Mantenimiento registrado exitosamente en el sistema.`;
        }
        await Swal.fire({
            title: editingId ? 'Mantenimiento Actualizado Exitosamente' : 'Mantenimiento Registrado Exitosamente',
            text: responseMessage,
            icon: 'success',
            confirmButtonText: 'Entendido',
        });
        if (typeof window.navigateTo === 'function') window.navigateTo('mantenimientos-list');
    } catch (error) {
        document.getElementById('form-error-message').textContent = error.message || 'Ocurrió un error desconocido.';
    }
}

async function showMantenimientoForm(params = null) {
    const mantId = typeof params === 'string' ? params : (params && params.id);
    await renderMantenimientoForm(mantId);
}

export { showMantenimientoForm }; 