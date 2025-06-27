//public/js/views/notaFormView.js
// * Formulario de creación y edición de Notas
import { createNota, updateNota, getNotaById, getEmpleados, getStatuses } from '../api.js';
import { showFormLoading } from '../utils/loading.js';
import { showFormError } from '../utils/error.js';
import { applyUppercaseToFields } from '../utils/textTransform.js';

const contentArea = document.getElementById('content-area');
let empleadosCache = null;
let statusesCache = null;

function showNotaFormLoading(action = 'Crear') {
    showFormLoading(action, 'nota');
}

function showNotaFormError(message, action = 'procesar') {
    showFormError(action, 'nota', message, () => showNotaForm());
}

async function renderNotaForm(notaToEdit = null) {
    const notaId = typeof notaToEdit === 'string' ? notaToEdit : (notaToEdit && notaToEdit.id);
    const isEditing = notaId !== null;
    const formTitle = isEditing ? `Editar Nota (ID: ${notaId})` : 'Registrar Nueva Nota';
    let currentNotaData = null;
    if (isEditing && typeof notaToEdit === 'string') {
        try {
            currentNotaData = await getNotaById(notaId);
            if (!currentNotaData) {
                showNotaFormError(`No se encontró la nota con ID ${notaId}.`, 'cargar');
                return;
            }
        } catch (error) {
            showNotaFormError(error.message, 'cargar datos para edición');
            return;
        }
    } else if (isEditing) {
        currentNotaData = notaToEdit;
    }
    showNotaFormLoading(isEditing ? 'Editar' : 'Crear');
    try {
        if (!empleadosCache) empleadosCache = await getEmpleados();
        if (!statusesCache) statusesCache = await getStatuses();
        contentArea.innerHTML = `
            <div class="col-xl-8 col-lg-10 mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">${formTitle}</h4>
                    </div>
                    <div class="card-body">
                        <form id="nota-form" class="basic-form">
                            <div class="mb-3">
                                <label for="titulo" class="form-label">Título <span class="text-danger">*</span></label>
                                <input type="text" id="titulo" name="titulo" required class="form-control input-default uppercase-field" placeholder="Ej: MANTENIMIENTO PROGRAMADO" value="${isEditing && currentNotaData.titulo ? currentNotaData.titulo : ''}">
                            </div>
                            <div class="mb-3">
                                <label for="id_empleado" class="form-label">Empleado Relacionado</label>
                                <select id="id_empleado" name="id_empleado" class="form-control select2">
                                    <option value="">Sin asignar</option>
                                    ${empleadosCache.map(emp => `<option value="${emp.id}" ${isEditing && currentNotaData.id_empleado === emp.id ? 'selected' : ''}>${emp.nombres} ${emp.apellidos} (ID: ${emp.id})</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="fecha" class="form-label">Fecha <span class="text-danger">*</span></label>
                                <input type="text" id="fecha" name="fecha" required class="datepicker-default form-control input-default" value="${isEditing && currentNotaData.fecha ? currentNotaData.fecha.split('T')[0] : ''}" placeholder="YYYY-MM-DD" autocomplete="off">
                            </div>
                            <div class="mb-3">
                                <label for="id_status" class="form-label">Estado <span class="text-danger">*</span></label>
                                <select id="id_status" name="id_status" required class="form-control select2">
                                    <option value="">Seleccione un estado...</option>
                                    ${statusesCache
                                      .filter(status => isEditing || ![2, 6, 7, 9, 12].includes(status.id))
                                      .map(status => `<option value="${status.id}" ${isEditing && currentNotaData.id_status === status.id ? 'selected' : (!isEditing && status.id === 1 ? 'selected' : '')}>${status.nombre_status}</option>`)
                                      .join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="contenido" class="form-label">Contenido de la Nota</label>
                                <textarea id="contenido" name="contenido" rows="3" class="form-control uppercase-field" placeholder="DESCRIBA EL CONTENIDO DE LA NOTA, DETALLES IMPORTANTES, OBSERVACIONES, ETC.">${isEditing && currentNotaData.contenido ? currentNotaData.contenido : ''}</textarea>
                            </div>
                            <div id="form-error-message" class="text-danger text-sm mb-3"></div>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" id="cancelNotaForm" class="btn btn-danger light btn-sl-sm"><span class="me-2"><i class="fa fa-times"></i></span>Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-sl-sm"><span class="me-2"><i class="fa fa-paper-plane"></i></span>${isEditing ? 'Guardar Cambios' : 'Registrar Nota'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        if (window.$ && $.fn.select2) {
            $('#id_empleado').select2({ width: '100%' });
            $('#id_status').select2({ width: '100%' });
        }
        if (window.$ && $.fn.pickadate) {
            if ($('#fecha').data('pickadate')) $('#fecha').pickadate('destroy');
            setTimeout(function() {
                var currentYear = new Date().getFullYear();
                var minYear = 2000;
                var years = currentYear - minYear + 1;
                $('#fecha').pickadate({
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
        applyUppercaseToFields(['titulo', 'contenido']);

        document.getElementById('nota-form').addEventListener('submit', (event) => handleNotaFormSubmit(event, notaId));
        document.getElementById('cancelNotaForm').addEventListener('click', async () => {
            await Swal.fire({
                title: 'Cancelado',
                text: 'El formulario de nota ha sido cancelado.',
                icon: 'warning',
                confirmButtonText: 'Aceptar'
            });
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('notas-list');
            } else {
                contentArea.innerHTML = `<p>Por favor, navega manualmente a la lista.</p>`;
            }
        });
    } catch (error) {
        showNotaFormError(error.message, 'cargar');
    }
}

async function handleNotaFormSubmit(event, editingId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const notaData = {};
    for (let [key, value] of formData.entries()) {
        if (['id_empleado', 'id_status'].includes(key)) {
            notaData[key] = value ? parseInt(value, 10) : null;
        } else {
            notaData[key] = value.trim() === '' ? null : value;
        }
    }
    if (!notaData.titulo || !notaData.fecha || !notaData.id_status) {
        document.getElementById('form-error-message').textContent = 'Título, Fecha y Estado son obligatorios.';
        return;
    }
    document.getElementById('form-error-message').textContent = '';
    try {
        let responseMessage = '';
        if (editingId) {
            await updateNota(editingId, notaData);
            responseMessage = `Nota ID ${editingId} actualizada exitosamente.`;
        } else {
            const nuevaNota = await createNota(notaData);
            responseMessage = `Nota "${nuevaNota.titulo}" (ID: ${nuevaNota.id}) creada exitosamente.`;
        }
        await Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: responseMessage
        });
        if (typeof window.navigateTo === 'function') window.navigateTo('notas-list');
    } catch (error) {
        document.getElementById('form-error-message').textContent = error.message || 'Ocurrió un error desconocido.';
    }
}

async function showNotaForm(params = null) {
    const notaId = typeof params === 'string' ? params : (params && params.id);
    await renderNotaForm(notaId);
}

export { showNotaForm }; 